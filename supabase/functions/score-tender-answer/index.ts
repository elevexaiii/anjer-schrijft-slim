// Edge function: score-tender-answer
// Beoordeelt een tenderantwoord met Claude en geeft een score (0-100) +
// deelscores en verbeterpunten terug.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Je bent een strenge maar eerlijke beoordelaar van Nederlandse aanbestedingsantwoorden voor Anjer Schoonmaak & Bedrijfsdiensten B.V.

JE TAAK:
Beoordeel het antwoord op de tendervraag op vier dimensies, elk 0-100:
1. "aansluiting" — sluit het antwoord aan op het gevraagde criterium?
2. "concreetheid" — bevat het concrete cijfers, namen, certificeringen, referenties (geen vage claims)?
3. "volledigheid" — beantwoordt het alle aspecten van de vraag binnen de woordlimiet?
4. "taal" — taal, structuur, leesbaarheid en professionaliteit.

Bereken de eindscore als gewogen gemiddelde:
score = round(0.35*aansluiting + 0.30*concreetheid + 0.20*volledigheid + 0.15*taal)

Geef ook 2-4 concrete verbeterpunten (Nederlands, actiegericht, kort).

ANTWOORD ALLEEN ALS GELDIG JSON in dit exacte formaat — geen markdown, geen extra tekst:
{
  "score": <0-100>,
  "aansluiting": <0-100>,
  "concreetheid": <0-100>,
  "volledigheid": <0-100>,
  "taal": <0-100>,
  "verbeterpunten": ["...", "..."]
}`;

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
      vraagTekst,
      vraagTitel,
      antwoord,
      maxWoorden,
      opdrachtgever,
      tenderNaam,
      model,
    } = body ?? {};

    if (!vraagTekst || !antwoord || typeof antwoord !== "string") {
      return new Response(
        JSON.stringify({ error: "vraagTekst en antwoord zijn verplicht." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (antwoord.trim().length < 10) {
      return new Response(
        JSON.stringify({
          score: 0,
          aansluiting: 0,
          concreetheid: 0,
          volledigheid: 0,
          taal: 0,
          verbeterpunten: ["Begin met het schrijven van een antwoord om een score te ontvangen."],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    const userMessage = `Aanbesteding: ${tenderNaam ?? "onbekend"}
Opdrachtgever: ${opdrachtgever ?? "onbekend"}
Vraag${vraagTitel ? ` (${vraagTitel})` : ""}: ${vraagTekst}
Maximale woorden: ${maxWoorden ?? "onbekend"}

ANTWOORD VAN ANJER:
"""
${antwoord}
"""

Beoordeel dit antwoord volgens de instructies en geef alleen JSON terug.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model || "claude-haiku-4-5",
        max_tokens: 1000,
        temperature: 0.1,
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

    let parsed: {
      score: number;
      aansluiting: number;
      concreetheid: number;
      volledigheid: number;
      taal: number;
      verbeterpunten: string[];
    };
    try {
      parsed = JSON.parse(stripCodeBlocks(rawText));
    } catch (e) {
      console.error("JSON parse fout:", e, rawText);
      return new Response(
        JSON.stringify({
          error: "Beoordelaar gaf geen geldig JSON-antwoord terug.",
          ruw: rawText.slice(0, 500),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const clamp = (n: unknown) =>
      Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

    const result = {
      score: clamp(parsed.score),
      aansluiting: clamp(parsed.aansluiting),
      concreetheid: clamp(parsed.concreetheid),
      volledigheid: clamp(parsed.volledigheid),
      taal: clamp(parsed.taal),
      verbeterpunten: Array.isArray(parsed.verbeterpunten)
        ? parsed.verbeterpunten.slice(0, 5).map((p) => String(p))
        : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-tender-answer fout:", e);
    return new Response(
      JSON.stringify({
        error: "Onverwachte fout.",
        detail: (e as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
