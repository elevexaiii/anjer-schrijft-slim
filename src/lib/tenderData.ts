// Shared tender data store (localStorage-based for now)

export interface Vraag {
  nr: number;
  titel: string;
  punten: number;
  score: number;
  maxWoorden: number;
  vraagTekst: string;
}

export interface VersieItem {
  id: number;
  tekst: string;
  datum: string;
  score: number;
}

export interface Tender {
  id: number;
  naam: string;
  opdrachtgever: string;
  deadline: string;
  deadlineDate: Date;
  voortgang: number;
  status: string;
  statusColor: string;
  totaalPunten: number;
  vragen: Vraag[];
}

export const tenders: Tender[] = [
  {
    id: 1,
    naam: "Schoonmaakdiensten Gemeentehuis",
    opdrachtgever: "Gemeente Amsterdam",
    deadline: "14 apr 2025",
    deadlineDate: new Date(2025, 3, 14),
    voortgang: 60,
    status: "Actief",
    statusColor: "bg-primary/10 text-primary",
    totaalPunten: 70,
    vragen: [
      { nr: 1, titel: "Kwaliteitsplan", punten: 20, score: 85, maxWoorden: 500, vraagTekst: "Beschrijf uw kwaliteitsmanagementsysteem en hoe u de kwaliteit van de schoonmaakdiensten waarborgt." },
      { nr: 2, titel: "Duurzaamheid", punten: 15, score: 82, maxWoorden: 400, vraagTekst: "Beschrijf hoe uw organisatie bijdraagt aan duurzaamheid en maatschappelijk verantwoord ondernemen." },
      { nr: 3, titel: "Communicatie & Rapportage", punten: 15, score: 74, maxWoorden: 450, vraagTekst: "Beschrijf uw communicatie- en rapportagestructuur voor deze opdracht. Hoe waarborgt u tijdige en heldere communicatie met de opdrachtgever?" },
      { nr: 4, titel: "Sociaal beleid", punten: 10, score: 52, maxWoorden: 350, vraagTekst: "Beschrijf uw sociaal beleid, waaronder personeelsontwikkeling en inclusiviteit." },
      { nr: 5, titel: "Innovatie", punten: 10, score: 65, maxWoorden: 350, vraagTekst: "Beschrijf welke innovaties u inzet om de dienstverlening te verbeteren." },
    ],
  },
  {
    id: 2,
    naam: "Facilitaire diensten Kantoorpand",
    opdrachtgever: "Rijksvastgoedbedrijf",
    deadline: "28 apr 2025",
    deadlineDate: new Date(2025, 3, 28),
    voortgang: 30,
    status: "Actief",
    statusColor: "bg-primary/10 text-primary",
    totaalPunten: 100,
    vragen: [
      { nr: 1, titel: "Plan van Aanpak", punten: 30, score: 45, maxWoorden: 600, vraagTekst: "Beschrijf uw plan van aanpak voor de facilitaire dienstverlening." },
      { nr: 2, titel: "Personeelsinzet", punten: 25, score: 38, maxWoorden: 400, vraagTekst: "Hoe waarborgt u voldoende en kwalitatief personeel voor deze opdracht?" },
      { nr: 3, titel: "Duurzaamheid", punten: 20, score: 0, maxWoorden: 400, vraagTekst: "Welke duurzame maatregelen neemt u bij de uitvoering?" },
      { nr: 4, titel: "Risicomanagement", punten: 25, score: 0, maxWoorden: 450, vraagTekst: "Beschrijf uw risicomanagement voor deze opdracht." },
    ],
  },
  {
    id: 3,
    naam: "Glazenwassen Winkelcentrum",
    opdrachtgever: "Unibail-Rodamco",
    deadline: "05 mei 2025",
    deadlineDate: new Date(2025, 4, 5),
    voortgang: 80,
    status: "Bijna klaar",
    statusColor: "bg-anjer-amber/10 text-anjer-amber",
    totaalPunten: 60,
    vragen: [
      { nr: 1, titel: "Werkwijze", punten: 20, score: 88, maxWoorden: 500, vraagTekst: "Beschrijf uw werkwijze voor het glazenwassen van het winkelcentrum." },
      { nr: 2, titel: "Veiligheid", punten: 20, score: 91, maxWoorden: 400, vraagTekst: "Hoe waarborgt u de veiligheid tijdens werkzaamheden op hoogte?" },
      { nr: 3, titel: "Planning", punten: 20, score: 76, maxWoorden: 350, vraagTekst: "Beschrijf uw planning en hoe u overlast voor winkelend publiek minimaliseert." },
    ],
  },
  {
    id: 4,
    naam: "Schoonmaak Cultureel Centrum",
    opdrachtgever: "Gemeente Rotterdam",
    deadline: "19 mei 2025",
    deadlineDate: new Date(2025, 4, 19),
    voortgang: 10,
    status: "Concept",
    statusColor: "bg-muted text-muted-foreground",
    totaalPunten: 80,
    vragen: [
      { nr: 1, titel: "Schoonmaakplan", punten: 25, score: 0, maxWoorden: 500, vraagTekst: "Beschrijf uw schoonmaakplan voor het cultureel centrum." },
      { nr: 2, titel: "Specialistische reiniging", punten: 20, score: 0, maxWoorden: 400, vraagTekst: "Hoe gaat u om met specialistische reiniging van kunstwerken en tentoonstellingsruimtes?" },
      { nr: 3, titel: "Flexibiliteit", punten: 15, score: 0, maxWoorden: 350, vraagTekst: "Beschrijf hoe u flexibel inspeelt op wisselende evenementen en tentoonstellingen." },
      { nr: 4, titel: "Milieu", punten: 20, score: 0, maxWoorden: 400, vraagTekst: "Welke milieuvriendelijke middelen en methoden zet u in?" },
    ],
  },
];

export const defaultAntwoorden: Record<string, string> = {
  "1-1": `Anjer Schoonmaak & Bedrijfsdiensten hanteert een uitgebreid kwaliteitsmanagementsysteem conform ISO 9001:2015. Ons kwaliteitsplan voor deze opdracht omvat dagelijkse kwaliteitscontroles door de objectleider, wekelijkse inspecties met een gestandaardiseerde checklist en maandelijkse audits door onze kwaliteitsmanager.\n\nWij werken met het DKS-systeem (Digitaal Kwaliteit Systeem) waarin alle controles, afwijkingen en verbeteracties worden geregistreerd. De opdrachtgever krijgt realtime toegang tot dit dashboard.\n\nBij de Gemeente Utrecht behaalden wij een gemiddelde kwaliteitsscore van 8,4 over de gehele contractperiode.`,
  "1-2": `Duurzaamheid is een kernwaarde van Anjer. Wij werken uitsluitend met ecologisch verantwoorde schoonmaakmiddelen die voldoen aan het EU Ecolabel. Ons wagenpark wordt momenteel omgebouwd naar volledig elektrisch, met als doel 100% emissievrij transport in 2025.\n\nOnze medewerkers worden opgeleid in duurzaam schoonmaken, waarbij het gebruik van water en chemicaliën tot een minimum wordt beperkt. Wij hanteren het cradle-to-cradle principe bij de inkoop van materialen.`,
  "1-3": `Anjer Schoonmaak & Bedrijfsdiensten hecht grote waarde aan transparante en proactieve communicatie. Voor deze opdracht stellen wij een vaste contactpersoon aan die als aanspreekpunt fungeert voor de Gemeente Amsterdam.\n\nWekelijkse voortgangsrapportages worden elke maandag vóór 09:00 uur per e-mail aangeleverd. Deze rapportages bevatten een overzicht van uitgevoerde werkzaamheden, eventuele bijzonderheden en actiepunten voor de komende week. Bij calamiteiten of afwijkingen garanderen wij een reactietijd van maximaal 2 uur.\n\nIn onze samenwerking met Gemeente Utrecht (2022–2024) hanteerden wij een vergelijkbare rapportagestructuur. Dit werd door de opdrachtgever beoordeeld met een 8,2 voor communicatie in de jaarlijkse evaluatie.\n\nOnze communicatieprocessen zijn geborgd conform ISO 9001:2015. Dit houdt in dat alle afspraken worden vastgelegd, gemonitord en periodiek geëvalueerd. Verbeterpunten worden direct verwerkt in ons kwaliteitsmanagementsysteem.\n\nKwartaalgesprekken met de contractbeheerder van de Gemeente Amsterdam zijn standaard onderdeel van onze werkwijze, zodat de samenwerking continu wordt geoptimaliseerd.`,
  "1-4": `Anjer investeert actief in de ontwikkeling van haar medewerkers. Wij bieden vaste contracten, marktconforme salarissen en doorgroeimogelijkheden. Ons personeelsverloop ligt met 12% ruim onder het branchegemiddelde van 25%.\n\nWij participeren in het programma 'Schoon Werk' voor mensen met een afstand tot de arbeidsmarkt.`,
  "1-5": `Anjer zet in op innovatie door middel van slimme technologieën. Wij implementeren IoT-sensoren voor het monitoren van bezettingsgraden en vervuiling, waardoor schoonmaak op basis van daadwerkelijk gebruik wordt gepland.\n\nDaarnaast experimenteren wij met robotisering voor routinematige vloerreinigingen in grote oppervlaktes.`,
};

// Score details per vraag (defaults for demo)
export const getScoreDetails = (score: number) => [
  { label: "Aansluiting op criterium", score: Math.min(100, score + Math.round(Math.random() * 10 - 2)) },
  { label: "Concreetheid & bewijs", score: Math.max(0, score - Math.round(Math.random() * 15)) },
  { label: "Volledigheid", score: Math.max(0, score - Math.round(Math.random() * 10)) },
  { label: "Taal & structuur", score: Math.min(100, score + Math.round(Math.random() * 8)) },
];

export const verbeterpuntenMap: Record<string, string[]> = {
  "1-1": [
    "Voeg specifieke KPI's toe die u hanteert voor kwaliteitsmeting",
    "Beschrijf wat er gebeurt als de kwaliteitsnorm niet wordt behaald",
  ],
  "1-2": [
    "Noem concrete CO2-reductiedoelstellingen met jaartallen",
    "Voeg certificeringen toe zoals ISO 14001 of MVO-prestatieladder",
  ],
  "1-3": [
    "Voeg een specifiek resultaat toe: noem de behaalde score of besparing bij Gemeente Utrecht",
    "Concretiseer de rapportagefrequentie met dag en tijdstip, niet alleen 'wekelijks'",
  ],
  "1-4": [
    "Voeg concrete cijfers toe over het aantal mensen met afstand tot de arbeidsmarkt",
    "Beschrijf opleidingsprogramma's met specifieke cursussen en certificaten",
  ],
  "1-5": [
    "Onderbouw de ROI van IoT-sensoren met concrete besparingen",
    "Noem een pilotproject met meetbare resultaten",
  ],
};

export const kennisitemsMap: Record<string, string[]> = {
  "1-1": ["ISO 9001:2015", "Ref: Gemeente Utrecht 2022"],
  "1-2": ["EU Ecolabel", "Cradle-to-Cradle"],
  "1-3": ["ISO 9001:2015", "Ref: Gemeente Utrecht 2022"],
  "1-4": ["Programma Schoon Werk", "CAO Schoonmaak"],
  "1-5": ["IoT-sensoren", "Robotisering"],
};

// Completed/historical tenders for analytics
export interface HistorischeTender {
  naam: string;
  opdrachtgever: string;
  datum: string;
  resultaat: "gewonnen" | "verloren" | "ingetrokken";
  score: number;
  waarde: string;
}

export const historischeTenders: HistorischeTender[] = [
  { naam: "Schoonmaak Provinciehuis", opdrachtgever: "Provincie Noord-Holland", datum: "dec 2024", resultaat: "gewonnen", score: 87, waarde: "€ 240.000" },
  { naam: "Facilitair beheer Ziekenhuis", opdrachtgever: "OLVG Amsterdam", datum: "nov 2024", resultaat: "verloren", score: 62, waarde: "€ 520.000" },
  { naam: "Dagschoonmaak Hogeschool", opdrachtgever: "HvA", datum: "okt 2024", resultaat: "gewonnen", score: 91, waarde: "€ 180.000" },
  { naam: "Glazenwassen Kantoorpand", opdrachtgever: "ING Bank", datum: "sep 2024", resultaat: "verloren", score: 71, waarde: "€ 95.000" },
  { naam: "Schoonmaak Sportcomplex", opdrachtgever: "Gemeente Den Haag", datum: "aug 2024", resultaat: "gewonnen", score: 84, waarde: "€ 310.000" },
  { naam: "Facilitaire diensten Museum", opdrachtgever: "Rijksmuseum", datum: "jul 2024", resultaat: "ingetrokken", score: 0, waarde: "€ 420.000" },
  { naam: "Specialistische reiniging", opdrachtgever: "Schiphol Group", datum: "jun 2024", resultaat: "verloren", score: 58, waarde: "€ 680.000" },
  { naam: "Dagschoonmaak Gemeentehuis", opdrachtgever: "Gemeente Haarlem", datum: "mei 2024", resultaat: "gewonnen", score: 79, waarde: "€ 150.000" },
];

// localStorage helpers
const STORAGE_KEY = "anjer_tender_data";

export interface SavedTenderData {
  antwoorden: Record<string, string>;
  versies: Record<string, VersieItem[]>;
}

export function loadSavedData(): SavedTenderData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { antwoorden: { ...defaultAntwoorden }, versies: {} };
}

export function saveTenderData(data: SavedTenderData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getDeadlineStatus(deadline: Date): { label: string; urgent: boolean; daysLeft: number } {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Verlopen", urgent: true, daysLeft: days };
  if (days <= 3) return { label: `${days} dag${days !== 1 ? "en" : ""} resterend`, urgent: true, daysLeft: days };
  if (days <= 7) return { label: `${days} dagen resterend`, urgent: true, daysLeft: days };
  return { label: `${days} dagen resterend`, urgent: false, daysLeft: days };
}
