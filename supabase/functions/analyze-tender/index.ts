// Edge function: analyze-tender
// Genereert met Claude een complete analyse van een aanbesteding voor Anjer:
// samenvatting, vereisten, aandachtspunten, actiepunten, risico's en kansen.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Je bent een ervaren tender-analist voor Anjer Schoonmaak & Bedrijfsdiensten B.V. (Amsterdam, schoonmaak en facilitair).

ANJER PROFIEL:
- Specialisaties: dagschoonmaak, glazenwassen, specialistische reiniging, facilitair beheer
- Sterke sectoren: overheid, retail, cultureel, transport
- Sweet spot: € 100.000 – € 1.500.000 per jaar
- Sterke punten: ISO 9001, EU Ecolabel, DKS-systeem, sociaal beleid, IoT-innovatie
- Zwakkere punten: zorg, defensie, industriële reiniging

JE TAAK:
Analyseer de aanbesteding en lever een COMPLETE managementbriefing voor het tenderteam. Wees concreet, specifiek en actiegericht in het Nederlands.

ANTWOORD ALLEEN als geldig JSON in dit exacte formaat — geen markdown, geen extra tekst:
{
  "samenvatting": "<3-5 zinnen: waar gaat de aanbesteding over, wat wordt gevraagd, wat is de scope>",
  "kernvereisten": ["<concrete eis 1>", "<eis 2>", "..."],
  "succesfactoren": ["<wat moet écht goed zijn om te winnen>", "..."],
  "actiepunten": [
    { "titel": "<korte actie>", "omschrijving": "<wat moet er gedaan worden, door wie, wanneer>", "prioriteit": "hoog" }
  ],
  "risicos": ["<risico of valkuil 1>", "..."],
  "kansen": ["<kans of differentiator voor Anjer>", "..."],
  "strategie_advies": "<2-4 zinnen strategisch advies: hoe pakken we deze tender aan, waar leggen we accent?>",
  "geschatte_winkans": <getal 0-100>
}

Regels:
- 4-8 kernvereisten, 3-5 succesfactoren, 4-7 actiepunten, 2-5 risico's, 2-5 kansen
- "prioriteit" altijd "hoog", "midden" of "laag"
- Baseer je strikt op de gegeven aanbesteding en vragen — verzin geen feiten`;

function stripCodeBlocks(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      tenderNaam,
      opdrachtgever,
      deadline,
      contractwaarde,
      sector,
      omschrijving,
      vragen,
      model,
    } = body ?? {};

    if (!tenderNaam || !opdrachtgever) {
      return new Response(
        JSON.stringify({ error: "tenderNaam en opdrachtgever zijn verplicht." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY niet geconfigureerd." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const vragenLijst =
      Array.isArray(vragen) && vragen.length > 0
        ? vragen
            .map(
              (v: any, i: number) =>
                `${i + 1}. ${v.titel ?? "vraag"} (${v.punten ?? "?"} punten, max ${v.maxWoorden ?? "?"} woorden)\n   ${v.vraagTekst ?? ""}`,
            )
            .join("\n")
        : "(geen vragen aangeleverd)";

    const userMessage = `AANBESTEDING:
Naam: ${tenderNaam}
Opdrachtgever: ${opdrachtgever}
Deadline: ${deadline ?? "onbekend"}
Contractwaarde: ${contractwaarde ?? "onbekend"}
Sector: ${sector ?? "onbekend"}

Omschrijving:
${omschrijving ?? "(geen omschrijving aangeleverd)"}

GUNNINGSVRAGEN:
${vragenLijst}

Geef de complete analyse als JSON volgens de instructies.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model || "claude-haiku-4-5",
        max_tokens: 2500,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude fout:", claudeRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "Claude API gaf een fout terug.",
          status: claudeRes.status,
          detail: errText.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const claudeData = await claudeRes.json();
    const rawText: string = claudeData?.content?.[0]?.text ?? "";

    let parsed: any;
    try {
      parsed = JSON.parse(stripCodeBlocks(rawText));
    } catch (e) {
      console.error("JSON parse fout:", e, rawText);
      return new Response(
        JSON.stringify({
          error: "Analyse gaf geen geldig JSON-antwoord terug.",
          ruw: rawText.slice(0, 500),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        samenvatting: String(parsed.samenvatting ?? ""),
        kernvereisten: Array.isArray(parsed.kernvereisten) ? parsed.kernvereisten.map(String) : [],
        succesfactoren: Array.isArray(parsed.succesfactoren) ? parsed.succesfactoren.map(String) : [],
        actiepunten: Array.isArray(parsed.actiepunten)
          ? parsed.actiepunten.map((a: any) => ({
              titel: String(a.titel ?? ""),
              omschrijving: String(a.omschrijving ?? ""),
              prioriteit: ["hoog", "midden", "laag"].includes(a.prioriteit) ? a.prioriteit : "midden",
            }))
          : [],
        risicos: Array.isArray(parsed.risicos) ? parsed.risicos.map(String) : [],
        kansen: Array.isArray(parsed.kansen) ? parsed.kansen.map(String) : [],
        strategie_advies: String(parsed.strategie_advies ?? ""),
        geschatte_winkans: Math.max(0, Math.min(100, Math.round(Number(parsed.geschatte_winkans) || 0))),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-tender fout:", e);
    return new Response(
      JSON.stringify({ error: "Onverwachte fout.", detail: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
