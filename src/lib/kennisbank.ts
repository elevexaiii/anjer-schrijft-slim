// Kennisbank data layer - localStorage based

export type Categorie = "referentie" | "certificaat" | "methodiek" | "standaardtekst";

export type SectorTag =
  | "overheid"
  | "retail"
  | "cultureel"
  | "transport"
  | "onderwijs"
  | "zorg"
  | "kantoor"
  | "industrie";

export type DienstTag =
  | "dagschoonmaak"
  | "glazenwassen"
  | "specialistisch"
  | "facilitair"
  | "calamiteiten"
  | "duurzaam";

export const SECTOR_OPTIES: SectorTag[] = [
  "overheid",
  "retail",
  "cultureel",
  "transport",
  "onderwijs",
  "zorg",
  "kantoor",
  "industrie",
];

export const DIENST_OPTIES: DienstTag[] = [
  "dagschoonmaak",
  "glazenwassen",
  "specialistisch",
  "facilitair",
  "calamiteiten",
  "duurzaam",
];

export interface BaseItem {
  id: string;
  categorie: Categorie;
  titel: string;
  beschrijving: string;
  tags: string[];
  aangemaakt: string;
  gewijzigd: string;
  status: "actief" | "concept" | "gearchiveerd";
  notities?: string;
}

export interface Referentie extends BaseItem {
  categorie: "referentie";
  opdrachtgever: string;
  organisatieType: SectorTag;
  locatie?: string;
  contractVan: string;
  contractTot: string;
  oppervlakte?: string;
  diensten: DienstTag[];
  frequentie?: string;
  kwaliteitsscore?: number;
  contractwaarde?: string;
  referent?: { naam: string; functie: string; email?: string };
  resultaten: string;
}

export interface Certificaat extends BaseItem {
  categorie: "certificaat";
  uitgever: string;
  geldigVan: string;
  geldigTot: string;
  registratienummer?: string;
  scope?: string;
}

export interface Methodiek extends BaseItem {
  categorie: "methodiek";
  toepassingsgebied: string;
  uitgebreideBeschrijving: string;
  gerelateerdeKpis?: string;
}

export interface Standaardtekst extends BaseItem {
  categorie: "standaardtekst";
  lengte: "kort" | "middel" | "uitgebreid";
  woordenAantal: number;
  inhoud: string;
}

export type KennisItem = Referentie | Certificaat | Methodiek | Standaardtekst;

const STORAGE_KEY = "anjer_kennisbank";

const nowIso = () => new Date().toISOString();

export function generateId(): string {
  return `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ----- Seed data -----
const SEED_DATA: KennisItem[] = [
  // Referenties (de bestaande 6)
  {
    id: "kb_seed_ref_1",
    categorie: "referentie",
    titel: "Gemeente Utrecht – Gemeentehuis",
    opdrachtgever: "Gemeente Utrecht",
    organisatieType: "overheid",
    locatie: "Utrecht",
    contractVan: "2022-01-01",
    contractTot: "2024-12-31",
    oppervlakte: "12.000 m²",
    diensten: ["dagschoonmaak", "glazenwassen"],
    frequentie: "Dagelijks",
    kwaliteitsscore: 8.7,
    contractwaarde: "€ 480.000",
    beschrijving: "Schoonmaak 12.000m² kantoor- en publieksruimte, 2 jaar contract",
    resultaten:
      "Klanttevredenheid 8.7/10. Geen klachten in laatste contractjaar. VSR-meting 95%.",
    tags: ["overheid", "kantoor"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_ref_2",
    categorie: "referentie",
    titel: "Rijkswaterstaat – Kantoorlocaties",
    opdrachtgever: "Rijkswaterstaat",
    organisatieType: "overheid",
    locatie: "Diverse",
    contractVan: "2022-03-01",
    contractTot: "2024-02-28",
    oppervlakte: "8 locaties",
    diensten: ["dagschoonmaak", "glazenwassen", "facilitair"],
    kwaliteitsscore: 8.4,
    beschrijving: "Facilitaire diensten 8 locaties, glazenwassen en dagschoonmaak",
    resultaten: "Score 8.4/10. Positieve evaluatie eindrapport.",
    tags: ["overheid", "facilitair"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_ref_3",
    categorie: "referentie",
    titel: "Primark Amsterdam",
    opdrachtgever: "Primark",
    organisatieType: "retail",
    locatie: "Amsterdam",
    contractVan: "2023-01-01",
    contractTot: "2025-12-31",
    oppervlakte: "4.200 m²",
    diensten: ["dagschoonmaak"],
    frequentie: "7 dagen per week",
    kwaliteitsscore: 8.1,
    beschrijving: "Dagelijkse schoonmaak 4.200m² winkelruimte, 7 dagen per week",
    resultaten: "Geen klachten. Verlenging contract.",
    tags: ["retail"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_ref_4",
    categorie: "referentie",
    titel: "Eye Filmmuseum Amsterdam",
    opdrachtgever: "Eye Filmmuseum",
    organisatieType: "cultureel",
    locatie: "Amsterdam",
    contractVan: "2024-01-01",
    contractTot: "2026-12-31",
    diensten: ["specialistisch", "dagschoonmaak"],
    kwaliteitsscore: 9.0,
    beschrijving: "Specialistische reiniging museumzalen en tentoonstellingsruimtes",
    resultaten: "9.0/10 klantbeoordeling. Bijzondere zorg voor kunstobjecten.",
    tags: ["cultureel", "specialistisch"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_ref_5",
    categorie: "referentie",
    titel: "NS Stations Utrecht",
    opdrachtgever: "NS",
    organisatieType: "transport",
    locatie: "Utrecht",
    contractVan: "2022-06-01",
    contractTot: "2024-05-31",
    oppervlakte: "3 stations",
    diensten: ["dagschoonmaak", "calamiteiten"],
    frequentie: "24/7 inclusief nachtdiensten",
    kwaliteitsscore: 8.0,
    beschrijving: "Schoonmaak 3 stationslocaties inclusief nachtdiensten",
    resultaten: "8.0/10. Snelle calamiteitenrespons binnen 30 minuten.",
    tags: ["transport"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_ref_6",
    categorie: "referentie",
    titel: "Ministerie van Financiën",
    opdrachtgever: "Ministerie van Financiën",
    organisatieType: "overheid",
    locatie: "Den Haag",
    contractVan: "2024-01-01",
    contractTot: "2027-12-31",
    diensten: ["dagschoonmaak", "facilitair", "duurzaam"],
    kwaliteitsscore: 8.6,
    beschrijving: "Schoonmaak en facilitaire diensten hoofdkantoor Den Haag",
    resultaten: "8.6/10. CO2-reductie 32% door inzet duurzame middelen.",
    tags: ["overheid", "duurzaam"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  // Certificaten
  {
    id: "kb_seed_cert_1",
    categorie: "certificaat",
    titel: "ISO 9001:2015",
    uitgever: "DNV",
    geldigVan: "2023-01-01",
    geldigTot: "2026-12-31",
    registratienummer: "NL-ISO-90012015-2023-114",
    scope: "Schoonmaakdienstverlening en facilitaire ondersteuning",
    beschrijving: "Kwaliteitsmanagementsysteem volgens internationale norm.",
    tags: ["kwaliteit"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_cert_2",
    categorie: "certificaat",
    titel: "VCA*",
    uitgever: "SSVV",
    geldigVan: "2023-06-01",
    geldigTot: "2026-06-01",
    registratienummer: "VCA-2023-08842",
    scope: "Veiligheid voor uitvoerend personeel",
    beschrijving: "Veiligheid Checklist Aannemers — operationeel niveau.",
    tags: ["veiligheid"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_cert_3",
    categorie: "certificaat",
    titel: "OSB-keurmerk",
    uitgever: "OSB",
    geldigVan: "2024-03-01",
    geldigTot: "2026-03-01",
    registratienummer: "OSB-2024-1029",
    scope: "Ondernemersorganisatie Schoonmaak- en Bedrijfsdiensten",
    beschrijving: "Branchekeurmerk voor betrouwbaar ondernemerschap.",
    tags: ["branche"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_cert_4",
    categorie: "certificaat",
    titel: "Code Verantwoordelijk Marktgedrag",
    uitgever: "Code Verantwoordelijk Marktgedrag",
    geldigVan: "2024-01-01",
    geldigTot: "2027-12-31",
    registratienummer: "CVM-2024-553",
    scope: "Schoonmaak- en glazenwassersbranche",
    beschrijving: "Naleving van fair-play afspraken met opdrachtgevers en personeel.",
    tags: ["maatschappelijk"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  // Methodieken
  {
    id: "kb_seed_meth_1",
    categorie: "methodiek",
    titel: "DKS-systeem (Dagelijks Kwaliteitscontrole-Systeem)",
    toepassingsgebied: "Kwaliteitsborging dagschoonmaak",
    uitgebreideBeschrijving:
      "Anjer hanteert een eigen DKS-systeem waarin objectleiders dagelijks steekproeven uitvoeren op vooraf vastgestelde kwaliteitspunten. Resultaten worden vastgelegd in onze digitale kwaliteitsapp en maandelijks gerapporteerd aan de opdrachtgever via een dashboard.",
    gerelateerdeKpis: "VSR-score, klanttevredenheid, klachtenresponstijd.",
    beschrijving: "Dagelijks gestructureerd kwaliteitscontrole-systeem met digitale rapportage.",
    tags: ["kwaliteit", "rapportage"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_meth_2",
    categorie: "methodiek",
    titel: "Calamiteitenprocedure",
    toepassingsgebied: "Reactie op incidenten en spoedreiniging",
    uitgebreideBeschrijving:
      "Onze 24/7 calamiteitenlijn garandeert dat we binnen 30 minuten ter plaatse zijn voor spoedinterventies (lekkages, bevuilingen, breuken). Een vast calamiteitenteam met getraind personeel staat paraat. Na afhandeling volgt altijd een evaluatie-rapport.",
    gerelateerdeKpis: "Responstijd <30 min, oplossingstijd <2 uur, evaluatie-score >8.",
    beschrijving: "24/7 spoedrespons met getraind calamiteitenteam.",
    tags: ["calamiteiten", "operationeel"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_meth_3",
    categorie: "methodiek",
    titel: "Duurzaamheidsbeleid",
    toepassingsgebied: "Milieuvriendelijke schoonmaak en CO2-reductie",
    uitgebreideBeschrijving:
      "Anjer werkt uitsluitend met EU Ecolabel-gecertificeerde middelen, microvezel-doeken (minder waterverbruik) en elektrisch wagenpark. We rapporteren jaarlijks onze CO2-footprint conform CO2-Prestatieladder niveau 3.",
    gerelateerdeKpis: "% Ecolabel-middelen, CO2/m², elektrisch wagenpark %.",
    beschrijving: "Geïntegreerd duurzaamheidsbeleid met meetbare milieuprestaties.",
    tags: ["duurzaam", "milieu"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  // Standaardteksten
  {
    id: "kb_seed_std_1",
    categorie: "standaardtekst",
    titel: "Bedrijfsprofiel — kort",
    lengte: "kort",
    woordenAantal: 38,
    inhoud:
      "Anjer Schoonmaak & Bedrijfsdiensten B.V. is een familiebedrijf met ruim 35 jaar ervaring in professionele schoonmaak voor overheden, retail en cultureel erfgoed. Met 240 medewerkers leveren wij dagelijks kwaliteit op meer dan 80 locaties in Nederland.",
    beschrijving: "Korte introductie van Anjer voor in tenderantwoorden.",
    tags: ["profiel"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_std_2",
    categorie: "standaardtekst",
    titel: "Bedrijfsprofiel — middel",
    lengte: "middel",
    woordenAantal: 92,
    inhoud:
      "Anjer Schoonmaak & Bedrijfsdiensten B.V. is sinds 1989 actief als familiebedrijf in de professionele schoonmaakbranche. Wij bedienen ruim 80 locaties in Nederland met 240 vaste medewerkers, waaronder gemeentelijke gebouwen, ministeries, musea en winkelketens. Onze kracht ligt in persoonlijk contact, flexibele dienstverlening en aantoonbare kwaliteit. Wij zijn ISO 9001 en VCA* gecertificeerd, dragen het OSB-keurmerk en onderschrijven de Code Verantwoordelijk Marktgedrag. Duurzaamheid en goede arbeidsvoorwaarden voor ons personeel staan centraal in onze bedrijfsvoering.",
    beschrijving: "Middellang bedrijfsprofiel inclusief certificering.",
    tags: ["profiel", "certificering"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
  {
    id: "kb_seed_std_3",
    categorie: "standaardtekst",
    titel: "Missie & visie",
    lengte: "kort",
    woordenAantal: 54,
    inhoud:
      "Onze missie is het ontzorgen van opdrachtgevers door betrouwbare, duurzame en menselijke schoonmaak. Wij geloven dat kwaliteit ontstaat door betrokken medewerkers die met trots hun werk doen. Daarom investeren we in opleiding, fatsoenlijke arbeidsvoorwaarden en een werkomgeving waarin iedereen meetelt. Dat is de Anjer-werkwijze: schoon werk, eerlijk gedaan.",
    beschrijving: "Missie en visie statement van Anjer.",
    tags: ["profiel", "visie"],
    aangemaakt: nowIso(),
    gewijzigd: nowIso(),
    status: "actief",
  },
];

export function loadKennisbank(): KennisItem[] {
  if (typeof window === "undefined") return SEED_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return parsed;
  } catch {
    return SEED_DATA;
  }
}

export function saveKennisbank(items: KennisItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addItem(item: KennisItem): void {
  const items = loadKennisbank();
  items.push(item);
  saveKennisbank(items);
}

export function updateItem(id: string, updates: Partial<KennisItem>): void {
  const items = loadKennisbank();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...updates, gewijzigd: nowIso() } as KennisItem;
  saveKennisbank(items);
}

export function archiveItem(id: string): void {
  updateItem(id, { status: "gearchiveerd" } as Partial<KennisItem>);
}

export function deleteItem(id: string): void {
  const items = loadKennisbank().filter((i) => i.id !== id);
  saveKennisbank(items);
}

// ----- Datum helpers -----
export function getDaysUntilExpiry(geldigTot: string): number {
  const end = new Date(geldigTot);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(geldigTot: string): "geldig" | "binnenkort" | "verlopen" {
  const days = getDaysUntilExpiry(geldigTot);
  if (days < 0) return "verlopen";
  if (days < 30) return "binnenkort";
  return "geldig";
}

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export function formatDateNL(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ----- Gebruikte kennisitems per vraag -----
const USED_KEY = (tenderId: number | string, vraagNr: number | string) =>
  `anjer_gebruikte_kennisitems_${tenderId}_${vraagNr}`;

export function getUsedItems(tenderId: number | string, vraagNr: number | string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USED_KEY(tenderId, vraagNr));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addUsedItem(tenderId: number | string, vraagNr: number | string, itemId: string): void {
  const current = getUsedItems(tenderId, vraagNr);
  if (current.includes(itemId)) return;
  const next = [...current, itemId];
  localStorage.setItem(USED_KEY(tenderId, vraagNr), JSON.stringify(next));
}

export function buildInsertText(item: KennisItem): string {
  switch (item.categorie) {
    case "referentie": {
      const periode = `${formatDateNL(item.contractVan)} – ${formatDateNL(item.contractTot)}`;
      return `Bij ${item.opdrachtgever} (${periode}) realiseerden wij: ${item.resultaten}`;
    }
    case "methodiek":
      return item.uitgebreideBeschrijving;
    case "standaardtekst":
      return item.inhoud;
    case "certificaat":
      return `Anjer is gecertificeerd voor ${item.titel}${item.registratienummer ? ` (${item.registratienummer}` : ""}${item.geldigTot ? `, geldig tot ${formatDateNL(item.geldigTot)}` : ""}${item.registratienummer ? ")" : ""}.`;
  }
}
