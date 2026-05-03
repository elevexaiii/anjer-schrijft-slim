// Lokale opslag van AI-scores per vraag (per tender + vraagnummer).
// Wordt gebruikt door de Editor om scores te bewaren tussen sessies.

export interface AIScore {
  score: number;
  aansluiting: number;
  concreetheid: number;
  volledigheid: number;
  taal: number;
  verbeterpunten: string[];
  beoordeeldOp: string; // ISO datum
  tekstHash: string; // hash van de beoordeelde tekst, om "verouderd" te detecteren
}

const STORAGE_KEY = "anjer_ai_scores";

type ScoreMap = Record<string, AIScore>;

export function loadScores(): ScoreMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveScore(key: string, score: AIScore) {
  const all = loadScores();
  all[key] = score;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getScore(key: string): AIScore | null {
  return loadScores()[key] ?? null;
}

// Eenvoudige stabiele hash (FNV-1a) — genoeg om wijzigingen te detecteren.
export function hashTekst(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}
