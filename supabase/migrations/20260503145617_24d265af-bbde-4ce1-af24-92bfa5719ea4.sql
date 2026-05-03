CREATE TABLE public.aanbestedingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicatie_id text UNIQUE NOT NULL,
  titel text NOT NULL,
  opdrachtgever text,
  beschrijving text,
  cpv_codes text[],
  contractwaarde_min numeric,
  contractwaarde_max numeric,
  publicatie_datum timestamptz,
  deadline timestamptz,
  regio text,
  procedure_type text,
  bron_url text,
  raw_data jsonb,

  match_score integer,
  match_uitleg text,
  match_sterke_punten text[],
  match_zwakke_punten text[],
  match_geanalyseerd_op timestamptz,

  status text DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'interessant', 'afgewezen', 'omgezet_naar_tender', 'gearchiveerd')),
  notities text,
  toegevoegd_op timestamptz DEFAULT now()
);

CREATE INDEX idx_aanbestedingen_match_score ON public.aanbestedingen(match_score DESC);
CREATE INDEX idx_aanbestedingen_status ON public.aanbestedingen(status);
CREATE INDEX idx_aanbestedingen_deadline ON public.aanbestedingen(deadline);

ALTER TABLE public.aanbestedingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen kan aanbestedingen bekijken"
ON public.aanbestedingen
FOR SELECT
USING (true);

CREATE POLICY "Ingelogde gebruikers kunnen aanbestedingen toevoegen"
ON public.aanbestedingen
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Ingelogde gebruikers kunnen aanbestedingen bijwerken"
ON public.aanbestedingen
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Ingelogde gebruikers kunnen aanbestedingen verwijderen"
ON public.aanbestedingen
FOR DELETE
TO authenticated
USING (true);