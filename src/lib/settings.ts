// Anjer app instellingen — opgeslagen in localStorage

export type ModelChoice = "claude-opus-4-5" | "claude-sonnet-4-5" | "claude-haiku-4-5";
export type ToonChoice = "formeel" | "neutraal" | "toegankelijk";
export type LengtePreference = "compact" | "gebalanceerd" | "uitgebreid";

export interface AppSettings {
  modelSchrijven: ModelChoice;
  modelAnalyse: ModelChoice;
  temperature: number;
  toon: ToonChoice;
  defaultMaxWoorden: number;
  lengtePreference: LengtePreference;
  kennisbankContext: string;
}

export const DEFAULT_KENNISBANK = `ANJER BEDRIJFSINFORMATIE:
- ISO 9001:2015 gecertificeerd
- Werkt met DKS-systeem (Digitaal Kwaliteit Systeem) voor real-time kwaliteitsmonitoring
- Gebruikt EU Ecolabel schoonmaakmiddelen
- Wagenpark wordt elektrisch (doel: 100% emissievrij)
- Personeelsverloop 12% (branchegemiddelde 25%)
- Participeert in 'Schoon Werk' programma voor mensen met afstand tot arbeidsmarkt
- IoT-sensoren voor bezettings- en vervuilingsmonitoring
- Klanten o.a.: Gemeente Utrecht, Rijkswaterstaat, Primark Amsterdam, Eye Filmmuseum, NS Stations Utrecht, Ministerie van Financiën

REFERENTIE-RESULTATEN:
- Gemeente Utrecht (2022-2024): kwaliteitsscore 8.4, communicatiescore 8.2
- Reactietijd bij calamiteiten: max 2 uur`;

export const DEFAULT_SETTINGS: AppSettings = {
  modelSchrijven: "claude-opus-4-5",
  modelAnalyse: "claude-haiku-4-5",
  temperature: 0.3,
  toon: "formeel",
  defaultMaxWoorden: 400,
  lengtePreference: "gebalanceerd",
  kennisbankContext: DEFAULT_KENNISBANK,
};

const SETTINGS_KEY = "anjer_settings";
const OVERRIDES_KEY = "anjer_woordlimiet_overrides";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

// Per-vraag woordlimiet overrides
export function loadWoordlimietOverrides(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setWoordlimietOverride(key: string, waarde: number): void {
  const all = loadWoordlimietOverrides();
  all[key] = waarde;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
}

export function clearWoordlimietOverride(key: string): void {
  const all = loadWoordlimietOverrides();
  delete all[key];
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
}

export const MODEL_INFO: Record<ModelChoice, { label: string; beschrijving: string; kosten: string }> = {
  "claude-opus-4-5": {
    label: "Claude Opus 4.5",
    beschrijving: "Hoogste kwaliteit, langzaamst, duurst (aanbevolen voor schrijven)",
    kosten: "€€€",
  },
  "claude-sonnet-4-5": {
    label: "Claude Sonnet 4.5",
    beschrijving: "Balans tussen kwaliteit en snelheid",
    kosten: "€€",
  },
  "claude-haiku-4-5": {
    label: "Claude Haiku 4.5",
    beschrijving: "Snel en goedkoop, geschikt voor concepten",
    kosten: "€",
  },
};
