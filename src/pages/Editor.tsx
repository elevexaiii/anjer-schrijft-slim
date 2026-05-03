import { useState, useCallback, useMemo } from "react";
import { ChevronRight, Sparkles, CheckCircle2, Download, Clock, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CircularGauge from "@/components/editor/CircularGauge";
import WordCounter from "@/components/editor/WordCounter";
import VersieHistorie from "@/components/editor/VersieHistorie";
import {
  tenders,
  defaultAntwoorden,
  loadSavedData,
  saveTenderData,
  getScoreDetails,
  verbeterpuntenMap,
  kennisitemsMap,
  type VersieItem,
} from "@/lib/tenderData";
import {
  loadSettings,
  loadWoordlimietOverrides,
  setWoordlimietOverride,
  clearWoordlimietOverride,
} from "@/lib/settings";

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-primary";
  if (score >= 60) return "bg-anjer-amber";
  return "bg-anjer-red";
};

const Editor = () => {
  const { id } = useParams();
  const tenderId = Number(id) || 1;
  const tender = tenders.find((t) => t.id === tenderId) || tenders[0];

  const [selectedVraag, setSelectedVraag] = useState(1);
  const [savedData, setSavedData] = useState(loadSavedData);
  const [generating, setGenerating] = useState(false);
  const [versieOpen, setVersieOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>(() => loadWoordlimietOverrides());
  const [editingLimiet, setEditingLimiet] = useState(false);
  const [limietDraft, setLimietDraft] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<string>(
    new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
  );

  const vraag = tender.vragen.find((v) => v.nr === selectedVraag) || tender.vragen[0];
  const antwoordKey = `${tenderId}-${selectedVraag}`;
  const effectieveMaxWoorden = overrides[antwoordKey] ?? vraag.maxWoorden;
  const heeftOverride = overrides[antwoordKey] !== undefined;
  const tekst = savedData.antwoorden[antwoordKey] || "";
  const versies = savedData.versies[antwoordKey] || [];
  const scoreDetails = getScoreDetails(vraag.score);
  const verbeterpunten = verbeterpuntenMap[antwoordKey] || [
    "Begin met het beantwoorden van de vraag om verbeterpunten te ontvangen.",
  ];
  const kennisitems = kennisitemsMap[antwoordKey] || [];

  const commitLimiet = () => {
    const n = Number(limietDraft);
    if (!Number.isNaN(n) && n >= 50 && n <= 3000) {
      setWoordlimietOverride(antwoordKey, n);
      setOverrides((prev) => ({ ...prev, [antwoordKey]: n }));
      toast.success(`Woordlimiet aangepast naar ${n}`);
    }
    setEditingLimiet(false);
  };

  const resetLimiet = () => {
    clearWoordlimietOverride(antwoordKey);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[antwoordKey];
      return next;
    });
    toast.success("Woordlimiet hersteld naar standaard");
  };


  const setTekst = useCallback(
    (newTekst: string) => {
      setSavedData((prev) => {
        const updated = {
          ...prev,
          antwoorden: { ...prev.antwoorden, [antwoordKey]: newTekst },
        };
        saveTenderData(updated);
        return updated;
      });
      setLastSaved(
        new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
      );
    },
    [antwoordKey]
  );

  const handleSelectVraag = (nr: number) => {
    setSelectedVraag(nr);
    setVersieOpen(false);
  };

  const saveVersion = useCallback(() => {
    if (!tekst.trim()) return;
    const newVersion: VersieItem = {
      id: versies.length + 1,
      tekst,
      datum: new Date().toLocaleString("nl-NL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: vraag.score,
    };
    setSavedData((prev) => {
      const updated = {
        ...prev,
        versies: {
          ...prev.versies,
          [antwoordKey]: [...(prev.versies[antwoordKey] || []), newVersion],
        },
      };
      saveTenderData(updated);
      return updated;
    });
    toast.success("Versie opgeslagen");
  }, [tekst, versies, vraag.score, antwoordKey]);

  const handleRestore = (versie: VersieItem) => {
    saveVersion(); // save current first
    setTekst(versie.tekst);
    toast.success(`Versie ${versie.id} hersteld`);
    setVersieOpen(false);
  };

  const handleGenereren = async () => {
    if (tekst.trim().length > 0) {
      saveVersion();
    }
    setGenerating(true);
    try {
      const settings = loadSettings();
      const { data, error } = await supabase.functions.invoke("generate-tender-answer", {
        body: {
          vraagTekst: vraag.vraagTekst,
          vraagTitel: vraag.titel,
          maxWoorden: effectieveMaxWoorden,
          opdrachtgever: tender.opdrachtgever,
          tenderNaam: tender.naam,
          huidigeTekst: tekst || undefined,
          model: settings.modelSchrijven,
          temperature: settings.temperature,
          toon: settings.toon,
          lengtePreference: settings.lengtePreference,
          kennisbankContext: settings.kennisbankContext,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      if (!data?.answer) throw new Error("Geen antwoord ontvangen");

      setTekst(data.answer);
      toast.success("AI concept gegenereerd");
    } catch (err: any) {
      const msg =
        err?.context?.error ||
        err?.message ||
        "Er ging iets mis bij het genereren. Probeer het opnieuw.";
      toast.error(typeof msg === "string" ? msg : "Genereren mislukt");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    // Build plain text export of all answers
    let content = `AANBESTEDING: ${tender.naam}\n`;
    content += `Opdrachtgever: ${tender.opdrachtgever}\n`;
    content += `Deadline: ${tender.deadline}\n`;
    content += `${"=".repeat(60)}\n\n`;

    tender.vragen.forEach((v) => {
      const key = `${tenderId}-${v.nr}`;
      const antwoord = savedData.antwoorden[key] || "(Nog niet ingevuld)";
      content += `VRAAG ${v.nr}: ${v.titel} (${v.punten} punten)\n`;
      content += `${"-".repeat(40)}\n`;
      content += `${v.vraagTekst}\n\n`;
      content += `ANTWOORD:\n${antwoord}\n\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tender.naam.replace(/\s+/g, "_")}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tender geëxporteerd");
  };

  // Calculate completion for this tender
  const beantwoord = tender.vragen.filter(
    (v) => (savedData.antwoorden[`${tenderId}-${v.nr}`] || "").trim().length > 0
  ).length;

  return (
    <div className="h-screen flex flex-col bg-secondary/30">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Aanbestedingen
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {tender.opdrachtgever} — {tender.naam}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {beantwoord}/{tender.vragen.length} vragen beantwoord
          </span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exporteren
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT - Questions */}
        <div className="w-[22%] border-r border-border bg-card overflow-y-auto p-4">
          <h2 className="font-semibold text-foreground mb-1">Vragen</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {tender.opdrachtgever} · {tender.deadline} · {tender.totaalPunten} punten totaal
          </p>
          <div className="space-y-2">
            {tender.vragen.map((v) => {
              const hasAnswer = (savedData.antwoorden[`${tenderId}-${v.nr}`] || "").trim().length > 0;
              return (
                <button
                  key={v.nr}
                  onClick={() => handleSelectVraag(v.nr)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedVraag === v.nr
                      ? "border-l-4 border-l-primary border-primary/30 bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {v.nr}. {v.titel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasAnswer && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getScoreColor(v.score)}`} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{v.punten} punten · max {v.maxWoorden} woorden</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER - Editor */}
        <div className="w-[52%] overflow-y-auto">
          <div className="p-6">
            {/* Question header */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 mb-5">
              <p className="text-xs text-muted-foreground mb-2">
                Vraag {vraag.nr} van {tender.vragen.length}
              </p>
              <p className="text-foreground font-medium leading-relaxed">{vraag.vraagTekst}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {vraag.punten} punten
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${heeftOverride ? "bg-anjer-amber/15 text-anjer-amber" : "bg-secondary text-muted-foreground"}`}>
                  max {effectieveMaxWoorden} woorden{heeftOverride ? " (aangepast)" : ""}
                </span>
              </div>
            </div>

            {/* Text editor */}
            <div className="border border-border rounded-xl bg-card">
              <textarea
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                placeholder="Begin hier met het schrijven van uw antwoord..."
                className="w-full min-h-[400px] p-5 text-sm text-foreground leading-relaxed resize-none focus:outline-none rounded-t-xl bg-transparent placeholder:text-muted-foreground/50"
              />
              <div className="border-t border-border px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    Laatst opgeslagen om {lastSaved}
                  </span>
                  <WordCounter tekst={tekst} maxWoorden={effectieveMaxWoorden} />
                  {editingLimiet ? (
                    <input
                      type="number"
                      min={50}
                      max={3000}
                      autoFocus
                      value={limietDraft}
                      onChange={(e) => setLimietDraft(e.target.value)}
                      onBlur={commitLimiet}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitLimiet();
                        if (e.key === "Escape") setEditingLimiet(false);
                      }}
                      className="w-20 text-xs px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setLimietDraft(String(effectieveMaxWoorden));
                        setEditingLimiet(true);
                      }}
                      className={`text-xs hover:text-foreground transition-colors ${heeftOverride ? "text-anjer-amber font-medium" : "text-muted-foreground"}`}
                      title="Klik om woordlimiet voor deze vraag aan te passen"
                    >
                      max {effectieveMaxWoorden} woorden
                    </button>
                  )}
                  {heeftOverride && !editingLimiet && (
                    <button
                      onClick={resetLimiet}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Herstel naar standaard"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <VersieHistorie
                  versies={versies}
                  onRestore={handleRestore}
                  open={false}
                  onToggle={() => setVersieOpen(!versieOpen)}
                />
              </div>
            </div>

            {/* Version history panel */}
            {versieOpen && (
              <VersieHistorie
                versies={versies}
                onRestore={handleRestore}
                open={true}
                onToggle={() => setVersieOpen(false)}
              />
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleGenereren}
                      disabled={generating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {generating ? (
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {tekst.trim().length > 0 ? "AI concept herschrijven" : "AI Concept genereren"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Genereert een nieuw concept op basis van Anjer's kennisbank en de tendervraag
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button
                onClick={saveVersion}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                <Clock className="h-4 w-4" />
                Versie opslaan
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary/50 transition-colors">
                <CheckCircle2 className="h-4 w-4" />
                Verifiëren
              </button>
            </div>
            {generating && (
              <p className="mt-3 text-xs text-muted-foreground italic">
                Anjer's kennisbank wordt geraadpleegd...
              </p>
            )}
          </div>
        </div>

        {/* RIGHT - Score Panel */}
        <div className="w-[26%] border-l border-border bg-card overflow-y-auto p-5">
          <h3 className="font-semibold text-foreground mb-4">Kwaliteitsscore</h3>
          <CircularGauge score={vraag.score} />

          {/* Score dimensions */}
          <div className="mt-6 space-y-3">
            {scoreDetails.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium text-foreground">{d.score}/100</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      d.score >= 75 ? "bg-primary" : "bg-anjer-amber"
                    }`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Verbeterpunten */}
          <h4 className="font-semibold text-foreground mt-6 mb-3 text-sm">Verbeterpunten</h4>
          <div className="space-y-2">
            {verbeterpunten.map((tip, i) => (
              <div
                key={i}
                className="border-l-[3px] border-l-anjer-amber bg-anjer-amber/5 p-3 rounded-r-lg text-xs text-foreground leading-relaxed"
              >
                {tip}
              </div>
            ))}
          </div>

          {/* Kennisitems */}
          {kennisitems.length > 0 && (
            <>
              <h4 className="font-semibold text-foreground mt-6 mb-3 text-sm">Gebruikte kennisitems</h4>
              <div className="flex flex-wrap gap-2">
                {kennisitems.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
