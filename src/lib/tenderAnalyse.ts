// Lokale opslag van tender-analyses (per tender id).

export interface Actiepunt {
  titel: string;
  omschrijving: string;
  prioriteit: "hoog" | "midden" | "laag";
}

export interface TenderAnalyse {
  samenvatting: string;
  kernvereisten: string[];
  succesfactoren: string[];
  actiepunten: Actiepunt[];
  risicos: string[];
  kansen: string[];
  strategie_advies: string;
  geschatte_winkans: number;
  gegenereerdOp: string; // ISO
}

const STORAGE_KEY = "anjer_tender_analyses";

type Map = Record<string, TenderAnalyse>;

export function loadAnalyses(): Map {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function getAnalyse(tenderId: number | string): TenderAnalyse | null {
  return loadAnalyses()[String(tenderId)] ?? null;
}

export function saveAnalyse(tenderId: number | string, a: TenderAnalyse) {
  const all = loadAnalyses();
  all[String(tenderId)] = a;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
