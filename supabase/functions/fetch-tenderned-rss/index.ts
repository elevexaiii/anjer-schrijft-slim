// Edge Function: fetch-tenderned-rss
// Haalt de TenderNed RSS-feed op, filtert op schoonmaak/facilitair CPV-codes
// en upsert nieuwe aanbestedingen in de `aanbestedingen` tabel.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const RSS_URL =
  "https://www.tenderned.nl/papi/tenderned-rs-tns/rss/laatste-publicatie.rss";

const RELEVANTE_CPV_CODES = [
  "90910000",
  "90911000",
  "90911200",
  "90911300",
  "90919000",
  "90919200",
  "90920000",
  "90921000",
  "98341000",
  "79993000",
  "79993100",
];

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  let v = m[1].trim();
  // Strip CDATA
  v = v.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
  return v.trim();
}

function extractAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    let v = m[1].trim();
    v = v.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
    out.push(v.trim());
  }
  return out;
}

function parseRssItems(xml: string): Array<{
  publicatie_id: string;
  titel: string;
  beschrijving: string | null;
  publicatie_datum: string | null;
  bron_url: string;
}> {
  const items = extractAllTags(xml, "item");
  const result: Array<{
    publicatie_id: string;
    titel: string;
    beschrijving: string | null;
    publicatie_datum: string | null;
    bron_url: string;
  }> = [];
  for (const item of items) {
    const link = extractTag(item, "link") ?? "";
    const titel = extractTag(item, "title") ?? "";
    const beschrijving = extractTag(item, "description");
    const pubDate = extractTag(item, "pubDate");
    if (!link) continue;
    // publicatie_id is laatste segment van link
    const cleaned = link.split("?")[0].replace(/\/$/, "");
    const parts = cleaned.split("/");
    const publicatie_id = parts[parts.length - 1];
    if (!publicatie_id) continue;
    let publicatie_datum: string | null = null;
    if (pubDate) {
      try {
        publicatie_datum = new Date(pubDate).toISOString();
      } catch {
        publicatie_datum = null;
      }
    }
    result.push({
      publicatie_id,
      titel,
      beschrijving,
      publicatie_datum,
      bron_url: link,
    });
  }
  return result;
}

async function fetchDetail(publicatie_id: string): Promise<{
  opdrachtgever: string | null;
  cpv_codes: string[];
  contractwaarde_min: number | null;
  contractwaarde_max: number | null;
  deadline: string | null;
  regio: string | null;
  procedure_type: string | null;
  raw_xml: string;
} | null> {
  const url = `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/${publicatie_id}/public-xml`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; AnjerTenderBot/1.0; +https://anjer.nl)",
      },
    });
    if (!res.ok) return null;
    const xml = await res.text();

    // CPV-codes: zoek alle code-attributes onder cpv-elementen
    const cpvCodes = new Set<string>();
    // <cbc:ItemClassificationCode listID="CPV" listVersionID="..." >90910000-9</cbc:ItemClassificationCode>
    const cpvRe =
      /<[^>]*ItemClassificationCode[^>]*>\s*([0-9]{6,8})(?:-\d)?\s*<\/[^>]*ItemClassificationCode>/gi;
    let m: RegExpExecArray | null;
    while ((m = cpvRe.exec(xml)) !== null) {
      cpvCodes.add(m[1]);
    }
    // Fallback: <cpv code="90910000"/>
    const cpvAttrRe = /<cpv[^>]*code="([0-9]{6,8})"/gi;
    while ((m = cpvAttrRe.exec(xml)) !== null) {
      cpvCodes.add(m[1]);
    }

    // Opdrachtgever
    const opdrachtgever =
      extractTag(xml, "cbc:RegistrationName") ??
      extractTag(xml, "RegistrationName") ??
      extractTag(xml, "cac:PartyName") ??
      null;

    // Contractwaarde
    let contractwaarde_min: number | null = null;
    let contractwaarde_max: number | null = null;
    const lowAmt = extractTag(xml, "cbc:LowerRangeAmount");
    const highAmt = extractTag(xml, "cbc:HigherRangeAmount");
    const estAmt = extractTag(xml, "cbc:EstimatedOverallContractAmount");
    const totAmt = extractTag(xml, "cbc:TotalAmount");
    const taxExcl = extractTag(xml, "cbc:TaxExclusiveAmount");
    const parseNum = (s: string | null) =>
      s ? Number.parseFloat(s.replace(/[^0-9.,-]/g, "").replace(",", ".")) : NaN;
    if (lowAmt) contractwaarde_min = isNaN(parseNum(lowAmt)) ? null : parseNum(lowAmt);
    if (highAmt) contractwaarde_max = isNaN(parseNum(highAmt)) ? null : parseNum(highAmt);
    if (contractwaarde_min === null && contractwaarde_max === null) {
      const single = parseNum(estAmt) || parseNum(totAmt) || parseNum(taxExcl);
      if (!isNaN(single) && single > 0) {
        contractwaarde_min = single;
        contractwaarde_max = single;
      }
    }

    // Deadline
    let deadline: string | null = null;
    const dateStr =
      extractTag(xml, "cbc:EndDate") ??
      extractTag(xml, "cbc:ReceiptEndDate") ??
      null;
    const timeStr =
      extractTag(xml, "cbc:EndTime") ??
      extractTag(xml, "cbc:ReceiptEndTime") ??
      null;
    if (dateStr) {
      try {
        const iso = `${dateStr}T${timeStr ?? "23:59:59"}`;
        deadline = new Date(iso).toISOString();
      } catch {
        deadline = null;
      }
    }

    // Regio (NUTS-code)
    const regio =
      extractTag(xml, "cbc:CountrySubentityCode") ??
      extractTag(xml, "cbc:CountrySubentity") ??
      null;

    // Procedure type
    const procedure_type =
      extractTag(xml, "cbc:ProcedureCode") ??
      extractTag(xml, "cbc:ProcedureTypeCode") ??
      null;

    return {
      opdrachtgever,
      cpv_codes: Array.from(cpvCodes),
      contractwaarde_min,
      contractwaarde_max,
      deadline,
      regio,
      procedure_type,
      raw_xml: xml.length > 200000 ? xml.slice(0, 200000) : xml,
    };
  } catch (e) {
    console.error("Detail fetch fout voor", publicatie_id, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    console.log("RSS feed ophalen:", RSS_URL);
    const rssRes = await fetch(RSS_URL, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; AnjerTenderBot/1.0; +https://anjer.nl)",
      },
    });
    if (!rssRes.ok) {
      console.error("RSS-feed onbereikbaar:", rssRes.status);
      return new Response(
        JSON.stringify({
          error: "TenderNed RSS-feed is op dit moment niet bereikbaar.",
          status: rssRes.status,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rssXml = await rssRes.text();
    const items = parseRssItems(rssXml);
    console.log(`RSS ontleed: ${items.length} items`);

    let relevant = 0;
    let nieuw = 0;
    let skipped = 0;
    const fouten: string[] = [];

    // Bestaande publicatie_ids ophalen om dubbel werk te voorkomen
    const ids = items.map((i) => i.publicatie_id);
    const { data: bestaande } = await supabase
      .from("aanbestedingen")
      .select("publicatie_id")
      .in("publicatie_id", ids);
    const bestaandSet = new Set(
      (bestaande ?? []).map((r: { publicatie_id: string }) => r.publicatie_id),
    );

    for (const item of items) {
      if (bestaandSet.has(item.publicatie_id)) {
        skipped++;
        continue;
      }
      try {
        const detail = await fetchDetail(item.publicatie_id);
        if (!detail) {
          fouten.push(`Detail kon niet worden opgehaald: ${item.publicatie_id}`);
          continue;
        }
        const heeftRelevanteCpv = detail.cpv_codes.some((c) =>
          RELEVANTE_CPV_CODES.includes(c),
        );
        if (!heeftRelevanteCpv) {
          continue;
        }
        relevant++;

        const { error: insertError } = await supabase
          .from("aanbestedingen")
          .upsert(
            {
              publicatie_id: item.publicatie_id,
              titel: item.titel,
              beschrijving: item.beschrijving,
              publicatie_datum: item.publicatie_datum,
              bron_url: item.bron_url,
              opdrachtgever: detail.opdrachtgever,
              cpv_codes: detail.cpv_codes,
              contractwaarde_min: detail.contractwaarde_min,
              contractwaarde_max: detail.contractwaarde_max,
              deadline: detail.deadline,
              regio: detail.regio,
              procedure_type: detail.procedure_type,
              raw_data: { xml_excerpt: detail.raw_xml.slice(0, 50000) },
              status: "nieuw",
            },
            { onConflict: "publicatie_id" },
          );

        if (insertError) {
          console.error("Insert fout:", insertError);
          fouten.push(`${item.publicatie_id}: ${insertError.message}`);
        } else {
          nieuw++;
        }
      } catch (e) {
        console.error("Verwerking fout voor", item.publicatie_id, e);
        fouten.push(`${item.publicatie_id}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        totaal_opgehaald: items.length,
        relevante_aantal: relevant,
        nieuw_toegevoegd: nieuw,
        skipped,
        fouten,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("fetch-tenderned-rss fout:", e);
    return new Response(
      JSON.stringify({
        error: "Onverwachte fout bij ophalen van aanbestedingen.",
        detail: (e as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
