// Type definities en helpers voor aanbestedingen (Kansen-pagina)

export type AanbestedingStatus =
  | "nieuw"
  | "interessant"
  | "afgewezen"
  | "omgezet_naar_tender"
  | "gearchiveerd";

export interface Aanbesteding {
  id: string;
  publicatie_id: string;
  titel: string;
  opdrachtgever: string | null;
  beschrijving: string | null;
  cpv_codes: string[] | null;
  contractwaarde_min: number | null;
  contractwaarde_max: number | null;
  publicatie_datum: string | null;
  deadline: string | null;
  regio: string | null;
  procedure_type: string | null;
  bron_url: string | null;
  raw_data: unknown;

  match_score: number | null;
  match_uitleg: string | null;
  match_sterke_punten: string[] | null;
  match_zwakke_punten: string[] | null;
  match_geanalyseerd_op: string | null;

  status: AanbestedingStatus;
  notities: string | null;
  toegevoegd_op: string;
}

export const STATUS_LABEL: Record<AanbestedingStatus, string> = {
  nieuw: "Nieuw",
  interessant: "Interessant",
  afgewezen: "Afgewezen",
  omgezet_naar_tender: "Omgezet naar tender",
  gearchiveerd: "Gearchiveerd",
};

export const RELEVANTE_CPV_CODES = [
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

export function formatDatumNL(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatBedrag(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatContractwaarde(
  min: number | null,
  max: number | null,
): string {
  if (min === null && max === null) return "Onbekend";
  if (min !== null && max !== null && min !== max) {
    return `${formatBedrag(min)} – ${formatBedrag(max)}`;
  }
  return formatBedrag(min ?? max);
}

export function dagenTotDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function matchScoreKleur(score: number | null): string {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-primary text-primary-foreground";
  if (score >= 60) return "bg-anjer-amber text-white";
  if (score >= 40) return "bg-muted text-muted-foreground";
  return "bg-destructive/30 text-destructive-foreground";
}
