import { useState, useMemo } from "react";
import { toast } from "sonner";
import { RotateCcw, Save, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  resetSettings,
  MODEL_INFO,
  ModelChoice,
  ToonChoice,
  LengtePreference,
} from "@/lib/settings";

const TOON_OPTIONS: { value: ToonChoice; label: string; beschrijving: string }[] = [
  { value: "formeel", label: "Formeel", beschrijving: "Strikt zakelijk, geschikt voor overheid en grote instellingen" },
  { value: "neutraal", label: "Neutraal-professioneel", beschrijving: "Iets toegankelijker, geschikt voor bedrijven" },
  { value: "toegankelijk", label: "Toegankelijk", beschrijving: "Persoonlijker, voor culturele/maatschappelijke organisaties" },
];

const LENGTE_OPTIONS: { value: LengtePreference; label: string; beschrijving: string }[] = [
  { value: "compact", label: "Compact", beschrijving: "Bondig binnen de woordlimiet" },
  { value: "gebalanceerd", label: "Gebalanceerd", beschrijving: "Volledig benutten van de ruimte" },
  { value: "uitgebreid", label: "Uitgebreid", beschrijving: "Streven naar maximale onderbouwing binnen de limiet" },
];

const ModelSelect = ({ value, onChange }: { value: ModelChoice; onChange: (v: ModelChoice) => void }) => (
  <Select value={value} onValueChange={(v) => onChange(v as ModelChoice)}>
    <SelectTrigger className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {(Object.keys(MODEL_INFO) as ModelChoice[]).map((key) => {
        const info = MODEL_INFO[key];
        return (
          <SelectItem key={key} value={key}>
            <div className="flex flex-col py-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{info.label}</span>
                <span className="text-xs text-primary font-mono">{info.kosten}</span>
              </div>
              <span className="text-xs text-muted-foreground">{info.beschrijving}</span>
            </div>
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
);

const Instellingen = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Instellingen opgeslagen");
  };

  const handleReset = () => {
    resetSettings();
    setSettings(DEFAULT_SETTINGS);
    toast.success("Standaardinstellingen hersteld");
  };

  const kennisbankWoorden = useMemo(
    () => settings.kennisbankContext.trim().split(/\s+/).filter(Boolean).length,
    [settings.kennisbankContext]
  );

  const activeToon = TOON_OPTIONS.find((t) => t.value === settings.toon)?.label;
  const activeLengte = LENGTE_OPTIONS.find((l) => l.value === settings.lengtePreference)?.label;

  return (
    <div className="min-h-screen bg-secondary/30 pb-32">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configureer hoe Anjer's AI-assistent tenderantwoorden genereert
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-3 w-3" />
            {MODEL_INFO[settings.modelSchrijven].label} · {activeToon} · {activeLengte}
          </Badge>
        </div>

        {/* SECTIE A — AI MODEL */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Model</CardTitle>
            <CardDescription>Kies welk model wordt gebruikt voor genereren en analyse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Model voor schrijven</Label>
              <p className="text-xs text-muted-foreground mb-2">Gebruikt bij "AI Concept genereren"</p>
              <ModelSelect value={settings.modelSchrijven} onChange={(v) => update("modelSchrijven", v)} />
            </div>

            <div>
              <Label className="text-sm font-medium">Model voor analyse / scoren</Label>
              <p className="text-xs text-muted-foreground mb-2">Sneller en goedkoper voor scoringtaken</p>
              <ModelSelect value={settings.modelAnalyse} onChange={(v) => update("modelAnalyse", v)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">Creativiteit (temperature)</Label>
                <span className="text-sm font-mono text-primary font-medium">
                  {settings.temperature.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Lager = consistenter en feitelijker. Hoger = creatiever maar minder voorspelbaar.
              </p>
              <Slider
                value={[settings.temperature]}
                onValueChange={([v]) => update("temperature", Math.round(v * 10) / 10)}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTIE B — SCHRIJFSTIJL */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Schrijfstijl</CardTitle>
            <CardDescription>Toon, lengte en standaardlimieten voor antwoorden</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Toon</Label>
              <RadioGroup
                value={settings.toon}
                onValueChange={(v) => update("toon", v as ToonChoice)}
                className="space-y-2"
              >
                {TOON_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.toon === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.beschrijving}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="default-woorden" className="text-sm font-medium">
                Standaard maximum woorden per antwoord
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Wordt gebruikt als startpunt voor nieuwe vragen. Per vraag aanpasbaar in de editor.
              </p>
              <Input
                id="default-woorden"
                type="number"
                min={100}
                max={2000}
                value={settings.defaultMaxWoorden}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) update("defaultMaxWoorden", Math.max(100, Math.min(2000, n)));
                }}
                className="w-32"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Lengte-voorkeur</Label>
              <RadioGroup
                value={settings.lengtePreference}
                onValueChange={(v) => update("lengtePreference", v as LengtePreference)}
                className="space-y-2"
              >
                {LENGTE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.lengtePreference === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.beschrijving}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* SECTIE C — KENNISBANK CONTEXT */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bedrijfsinformatie</CardTitle>
            <CardDescription>
              Anjer bedrijfsinformatie die Claude gebruikt bij het genereren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              Dit wordt meegegeven als context bij elke generatie. Houd de informatie feitelijk en up-to-date.
            </p>
            <Textarea
              value={settings.kennisbankContext}
              onChange={(e) => update("kennisbankContext", e.target.value)}
              className="min-h-[300px] font-mono text-xs leading-relaxed"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{kennisbankWoorden} woorden</span>
              <button
                type="button"
                onClick={() => update("kennisbankContext", DEFAULT_SETTINGS.kennisbankContext)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Standaard herstellen
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 ml-64 bg-card border-t border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Opslaan
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Terug naar standaard
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Wijzigingen worden lokaal opgeslagen</span>
        </div>
      </div>
    </div>
  );
};

export default Instellingen;
