// Edge function: generate-tender-answer
// Roept Anthropic Claude aan om een tenderantwoord te genereren voor Anjer.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Je bent een ervaren tenderschrijver voor Anjer Schoonmaak & Bedrijfsdiensten B.V., een Nederlands schoonmaak- en facilitair bedrijf gevestigd in Amsterdam.

ANJER BEDRIJFSINFORMATIE:
- ISO 9001:2015 gecertificeerd
- Werkt met DKS-systeem (Digitaal Kwaliteit Systeem) voor real-time kwaliteitsmonitoring
- Gebruikt EU Ecolabel schoonmaakmiddelen
- Wagenpark wordt elektrisch (doel: 100% emissievrij)
- Personeelsverloop 12% (branchegemiddelde 25%)
- Participeert in 'Schoon Werk' programma voor mensen met afstand tot arbeidsmarkt
- IoT-sensoren voor bezettings- en vervuilingsmonitoring
- Klanten o.a.: Gemeente Utrecht, Rijkswaterstaat, Primark Amsterdam, Eye Filmmuseum, NS Stations Utrecht, Ministerie van Financiën

REFERENTIE-RESULTATEN:
- Gemeente Utrecht (2022-2024): kwaliteitsscore 8.4, communicatiescore 8.2
- Reactietijd bij calamiteiten: max 2 uur

SCHRIJFRICHTLIJNEN:
- Schrijf in formeel Nederlands, professioneel maar toegankelijk
- Gebruik concrete cijfers, certificeringen en referenties — geen vage claims
- Verwijs naar bewijsbare feiten uit bovenstaande informatie
- Geen marketingtaal, wel feitelijke onderbouwing
- Houd je strikt aan de gevraagde maximale woorden
- Beantwoord exact wat gevraagd wordt, niet meer
- Gebruik geen informatie die niet hierboven staat — verzin niets

Genereer een tenderantwoord dat:
1. Direct ingaat op de gestelde vraag
2. Concrete bewijsvoering bevat (KPI's, certificeringen, referenties)
3. Past binnen de woordlimiet
4. Aansluit bij de specifieke opdrachtgever`;

interface RequestBody {
  vraagTekst: string;
  vraagTitel: string;
  maxWoorden: number;
  opdrachtgever: string;
  tenderNaam: string;
  huidigeTekst?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY ontbreekt in de configuratie." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as RequestBody;
    const { vraagTekst, vraagTitel, maxWoorden, opdrachtgever, tenderNaam, huidigeTekst } = body;

    if (!vraagTekst || !vraagTitel || !maxWoorden || !opdrachtgever || !tenderNaam) {
      return new Response(
        JSON.stringify({ error: "Onvolledige aanvraag — verplichte velden ontbreken." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let userMessage = `Tender: ${tenderNaam}
Opdrachtgever: ${opdrachtgever}

Vraag ${vraagTitel}:
${vraagTekst}

Maximale woorden: ${maxWoorden}`;

    if (huidigeTekst && huidigeTekst.trim().length > 0) {
      userMessage += `\n\nHuidige concepttekst (optioneel verbeteren of uitbreiden):\n${huidigeTekst}`;
    }

    userMessage += `\n\nGenereer een professioneel antwoord op deze vraag.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API fout:", response.status, errText);

      let userError = "Er ging iets mis bij het genereren van het antwoord.";
      if (response.status === 429) {
        userError = "Te veel verzoeken — probeer het over een moment opnieuw.";
      } else if (response.status === 401) {
        userError = "Authenticatie bij de AI-provider mislukt.";
      } else if (response.status >= 500) {
        userError = "De AI-provider is tijdelijk niet bereikbaar.";
      }

      return new Response(
        JSON.stringify({ error: userError }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const answer = data?.content?.[0]?.text ?? "";

    if (!answer) {
      return new Response(
        JSON.stringify({ error: "Leeg antwoord ontvangen van de AI." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const isAbort = (err as Error)?.name === "AbortError";
    console.error("generate-tender-answer fout:", err);
    return new Response(
      JSON.stringify({
        error: isAbort
          ? "De aanvraag duurde te lang. Probeer het opnieuw."
          : "Onverwachte fout bij het genereren van het antwoord.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
