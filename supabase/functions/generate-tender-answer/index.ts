// Edge function: generate-tender-answer
// Roept Anthropic Claude aan om een tenderantwoord te genereren voor Anjer.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_KENNISBANK = `ANJER BEDRIJFSINFORMATIE:
- ISO 9001:2015 gecertificeerd
- Werkt met DKS-systeem (Digitaal Kwaliteit Systeem) voor real-time kwaliteitsmonitoring
- Gebruikt EU Ecolabel schoonmaakmiddelen
- Wagenpark wordt elektrisch (doel: 100% emissievrij)
- Personeelsverloop 12% (branchegemiddelde 25%)
- Participeert in 'Schoon Werk' programma voor mensen met afstand tot arbeidsmarkt
- IoT-sensoren voor bezettings- en vervuilingsmonitoring
- Klanten o.a.: Gemeente Utrecht, Rijkswaterstaat, Primark Amsterdam, Eye Filmmuseum, NS Stations Utrecht, Ministerie van Financiën`;

type Toon = "formeel" | "neutraal" | "toegankelijk";
type Lengte = "compact" | "gebalanceerd" | "uitgebreid";

const TOON_INSTRUCTIES: Record<Toon, string> = {
  formeel: "Schrijf in strikt formeel, zakelijk Nederlands.",
  neutraal: "Schrijf in professioneel maar toegankelijk Nederlands.",
  toegankelijk: "Schrijf in toegankelijk, persoonlijk maar professioneel Nederlands.",
};

const LENGTE_INSTRUCTIES: Record<Lengte, string> = {
  compact: "Wees bondig. Schrijf korter dan de limiet als de inhoud dat toelaat.",
  gebalanceerd: "Benut de woordlimiet effectief, zonder onnodige opvulling.",
  uitgebreid: "Streef ernaar de woordlimiet maximaal te benutten met inhoudelijke onderbouwing.",
};

function buildSystemPrompt(kennisbank: string, toon: Toon, lengte: Lengte) {
  return `Je bent een ervaren tenderschrijver voor Anjer Schoonmaak & Bedrijfsdiensten B.V., een Nederlands schoonmaak- en facilitair bedrijf gevestigd in Amsterdam.

${kennisbank}

SCHRIJFRICHTLIJNEN:
- ${TOON_INSTRUCTIES[toon]}
- ${LENGTE_INSTRUCTIES[lengte]}
- Gebruik concrete cijfers, certificeringen en referenties — geen vage claims
- Verwijs naar bewijsbare feiten uit bovenstaande bedrijfsinformatie
- Geen marketingtaal, wel feitelijke onderbouwing
- Houd je strikt aan de gevraagde maximale woorden
- Beantwoord exact wat gevraagd wordt, niet meer
- Gebruik geen informatie die niet hierboven staat — verzin niets

Genereer een tenderantwoord dat:
1. Direct ingaat op de gestelde vraag
2. Concrete bewijsvoering bevat (KPI's, certificeringen, referenties)
3. Past binnen de woordlimiet
4. Aansluit bij de specifieke opdrachtgever`;
}

interface RequestBody {
  vraagTekst: string;
  vraagTitel: string;
  maxWoorden: number;
  opdrachtgever: string;
  tenderNaam: string;
  huidigeTekst?: string;
  model?: string;
  temperature?: number;
  toon?: Toon;
  lengtePreference?: Lengte;
  kennisbankContext?: string;
}

const ALLOWED_MODELS = new Set([
  "claude-opus-4-5",
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY ontbreekt in de configuratie." });
    }

    const body = (await req.json()) as RequestBody;
    const {
      vraagTekst,
      vraagTitel,
      maxWoorden,
      opdrachtgever,
      tenderNaam,
      huidigeTekst,
      model,
      temperature,
      toon,
      lengtePreference,
      kennisbankContext,
    } = body;

    if (!vraagTekst || !vraagTitel || !maxWoorden || !opdrachtgever || !tenderNaam) {
      return jsonResponse({ error: "Onvolledige aanvraag — verplichte velden ontbreken." });
    }

    const safeModel = model && ALLOWED_MODELS.has(model) ? model : "claude-opus-4-5";
    const safeTemp =
      typeof temperature === "number" && temperature >= 0 && temperature <= 1
        ? temperature
        : 0.3;
    const safeToon: Toon = (toon === "neutraal" || toon === "toegankelijk") ? toon : "formeel";
    const safeLengte: Lengte =
      lengtePreference === "compact" || lengtePreference === "uitgebreid"
        ? lengtePreference
        : "gebalanceerd";
    const safeKennisbank =
      kennisbankContext && kennisbankContext.trim().length > 0
        ? kennisbankContext
        : DEFAULT_KENNISBANK;

    const systemPrompt = buildSystemPrompt(safeKennisbank, safeToon, safeLengte);

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
        model: safeModel,
        max_tokens: 2000,
        temperature: safeTemp,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API fout:", response.status, errText);

      let userError = "Er ging iets mis bij het genereren van het antwoord.";
      if (errText.toLowerCase().includes("credit balance is too low")) {
        userError = "Het Anthropic-tegoed is op. Vul het account aan en probeer opnieuw.";
      } else if (response.status === 429) {
        userError = "Te veel verzoeken — probeer het over een moment opnieuw.";
      } else if (response.status === 401) {
        userError = "Authenticatie bij de AI-provider mislukt.";
      } else if (response.status === 404) {
        userError = "Het gekozen model is niet beschikbaar. Kies een ander model in Instellingen.";
      } else if (response.status >= 500) {
        userError = "De AI-provider is tijdelijk niet bereikbaar.";
      }

      return jsonResponse({ error: userError });
    }

    const data = await response.json();
    const answer = data?.content?.[0]?.text ?? "";

    if (!answer) {
      return jsonResponse({ error: "Leeg antwoord ontvangen van de AI." });
    }

    return jsonResponse({ answer });
  } catch (err) {
    const isAbort = (err as Error)?.name === "AbortError";
    console.error("generate-tender-answer fout:", err);
    return jsonResponse({
      error: isAbort
        ? "De aanvraag duurde te lang. Probeer het opnieuw."
        : "Onverwachte fout bij het genereren van het antwoord.",
    });
  }
});
