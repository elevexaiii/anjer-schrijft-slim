// Edge Function: match-batch
// Verwerkt alle aanbestedingen zonder match_geanalyseerd_op (max 50 per call).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const { data: rows, error } = await supabase
      .from("aanbestedingen")
      .select("id")
      .is("match_geanalyseerd_op", null)
      .order("toegevoegd_op", { ascending: false })
      .limit(50);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let aantal_verwerkt = 0;
    let aantal_fouten = 0;
    const matchUrl = `${SUPABASE_URL}/functions/v1/match-aanbesteding`;
    const authHeader = req.headers.get("Authorization") ?? `Bearer ${SERVICE_ROLE}`;

    for (const row of rows ?? []) {
      try {
        const res = await fetch(matchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ id: row.id }),
        });
        if (res.ok) {
          aantal_verwerkt++;
        } else {
          aantal_fouten++;
          console.error(
            "match-aanbesteding faalde voor",
            row.id,
            res.status,
            (await res.text()).slice(0, 200),
          );
        }
      } catch (e) {
        aantal_fouten++;
        console.error("match-aanbesteding throw voor", row.id, e);
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    return new Response(
      JSON.stringify({
        aantal_verwerkt,
        aantal_fouten,
        totaal_in_batch: rows?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "Onverwachte fout in match-batch.",
        detail: (e as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
