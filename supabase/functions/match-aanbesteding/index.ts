// Edge Function: match-aanbesteding
// Roept Claude (Haiku) aan om één aanbesteding te scoren tegen Anjer's profiel.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Je bent een aanbestedings-analist voor Anjer Schoonmaak & Bedrijfsdiensten B.V., een Nederlands schoonmaak- en facilitair bedrijf gevestigd in Amsterdam.

ANJER PROFIEL:
- Specialisaties: dagschoonmaak, glazenwassen, specialistische reiniging, facilitair beheer
- Sectoren met ervaring: overheid (Gemeente Utrecht, Rijkswaterstaat, Ministerie van Financiën), retail (Primark), cultureel (Eye Filmmuseum), transport (NS Stations)
- Geografische focus: primair Noord-Holland en omgeving Amsterdam, beperkte capaciteit elders
- Contractwaarde sweet spot: € 100.000 - € 1.500.000 per jaar
- Te klein: onder € 50.000 (niet rendabel)
- Te groot: boven € 5.000.000 per jaar (capaciteit-issue)
- Certificeringen: ISO 9001:2015, EU Ecolabel, werkt met DKS-systeem
- Sterke punten: kwaliteitsmanagement, duurzaamheid, sociaal beleid, IoT-innovatie
- Zwakke punten: minder ervaring in zorg, defensie, en industriële reiniging
- Personeelsbestand: midden-groot, vooral Amsterdam regio

JE TAAK:
Beoordeel hoe goed deze aanbesteding past bij Anjer en geef:
1. Een match-score van 0-100 (waar 100 = perfecte match)
2. Een korte uitleg in 2-3 zinnen
3. 2-4 sterke punten (wat past goed)
4. 1-3 zwakke punten of risico's

GEEF JE ANTWOORD ALLEEN ALS GELDIG JSON in dit exacte formaat:
{
  "match_score": <getal 0-100>,
  "uitleg": "<2-3 zinnen>",
  "sterke_punten": ["<punt 1>", "<punt 2>"],
  "zwakke_punten": ["<punt 1>", "<punt 2>"]
}

Geen tekst voor of na de JSON. Geen markdown code blocks.`;

function buildUserMessage(a: {
  titel: string;
  opdrachtgever: string | null;
  regio: string | null;
  contractwaarde_min: number | null;
  contractwaarde_max: number | null;
  cpv_codes: string[] | null;
  deadline: string | null;
  procedure_type: string | null;
  beschrijving: string | null;
}): string {
  return `Aanbesteding:
Titel: ${a.titel}
Opdrachtgever: ${a.opdrachtgever ?? "onbekend"}
Regio: ${a.regio ?? "onbekend"}
Contractwaarde: ${a.contractwaarde_min ?? "?"} - ${a.contractwaarde_max ?? "?"}
CPV-codes: ${(a.cpv_codes ?? []).join(", ") || "onbekend"}
Deadline: ${a.deadline ?? "onbekend"}
Procedure: ${a.procedure_type ?? "onbekend"}

Beschrijving:
${a.beschrijving ?? "(geen beschrijving)"}`;
}

function stripCodeBlocks(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "Veld 'id' is verplicht." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const { data: aanbesteding, error: fetchError } = await supabase
      .from("aanbestedingen")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !aanbesteding) {
      return new Response(
        JSON.stringify({ error: "Aanbesteding niet gevonden." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userMessage = buildUserMessage(aanbesteding);

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1500,
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
    const rawText: string =
      claudeData?.content?.[0]?.text ?? claudeData?.content?.[0]?.input ?? "";

    let parsed: {
      match_score: number;
      uitleg: string;
      sterke_punten: string[];
      zwakke_punten: string[];
    };
    try {
      const cleaned = stripCodeBlocks(rawText);
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse fout:", e, rawText);
      return new Response(
        JSON.stringify({
          error: "Claude gaf geen geldig JSON-antwoord terug.",
          ruw: rawText.slice(0, 500),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const score = Number(parsed.match_score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return new Response(
        JSON.stringify({
          error: "match_score moet een getal tussen 0 en 100 zijn.",
          ontvangen: parsed.match_score,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: updateError } = await supabase
      .from("aanbestedingen")
      .update({
        match_score: Math.round(score),
        match_uitleg: parsed.uitleg,
        match_sterke_punten: parsed.sterke_punten ?? [],
        match_zwakke_punten: parsed.zwakke_punten ?? [],
        match_geanalyseerd_op: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update fout:", updateError);
      return new Response(
        JSON.stringify({
          error: "Kon analyse niet opslaan.",
          detail: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, match_score: Math.round(score) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("match-aanbesteding fout:", e);
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
