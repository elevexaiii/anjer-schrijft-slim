import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ListChecks,
  Target,
  Lightbulb,
  ShieldAlert,
  Calendar,
  Building2,
  FileText,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  tenders,
  getDeadlineStatus,
  loadSavedData,
} from "@/lib/tenderData";
import {
  getAnalyse,
  saveAnalyse,
  type TenderAnalyse,
} from "@/lib/tenderAnalyse";
import { loadSettings } from "@/lib/settings";
import { loadScores } from "@/lib/scores";

const PRIORITEIT_KLEUR: Record<string, string> = {
  hoog: "bg-anjer-red/10 text-anjer-red border-anjer-red/20",
  midden: "bg-anjer-amber/10 text-anjer-amber border-anjer-amber/20",
  laag: "bg-muted text-muted-foreground border-border",
};

const AanbestedingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenderId = Number(id) || 1;
  const tender = tenders.find((t) => t.id === tenderId);

  const [analyse, setAnalyse] = useState<TenderAnalyse | null>(() =>
    getAnalyse(tenderId),
  );
  const [bezig, setBezig] = useState(false);

  const savedData = useMemo(() => loadSavedData(), []);
  const aiScores = useMemo(() => loadScores(), [analyse]);

  // Vul automatisch bij eerste bezoek als er nog geen analyse is
  useEffect(() => {
    if (tender && !analyse && !bezig) {
      void genereerAnalyse(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!tender) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Aanbesteding niet gevonden.</p>
        <Link to="/aanbestedingen" className="text-sm text-primary underline mt-2 inline-block">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  const ds = getDeadlineStatus(tender.deadlineDate);
  const beantwoord = tender.vragen.filter(
    (v) => (savedData.antwoorden[`${tenderId}-${v.nr}`] || "").trim().length > 0,
  ).length;

  const gemiddeldeScore = (() => {
    const scores = tender.vragen
      .map((v) => aiScores[`${tenderId}-${v.nr}`]?.score)
      .filter((s): s is number => typeof s === "number");
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  async function genereerAnalyse(stil = false) {
    if (!tender) return;
    setBezig(true);
    try {
      const settings = loadSettings();
      const { data, error } = await supabase.functions.invoke("analyze-tender", {
        body: {
          tenderNaam: tender.naam,
          opdrachtgever: tender.opdrachtgever,
          deadline: tender.deadline,
          contractwaarde: tender.contractwaarde,
          sector: tender.sector,
          omschrijving:
            tender.omschrijving ??
            `Aanbesteding voor ${tender.naam} bij ${tender.opdrachtgever}.`,
          vragen: tender.vragen,
          model: settings.modelSchrijven,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));

      const nieuw: TenderAnalyse = {
        samenvatting: data.samenvatting,
        kernvereisten: data.kernvereisten,
        succesfactoren: data.succesfactoren,
        actiepunten: data.actiepunten,
        risicos: data.risicos,
        kansen: data.kansen,
        strategie_advies: data.strategie_advies,
        geschatte_winkans: data.geschatte_winkans,
        gegenereerdOp: new Date().toISOString(),
      };
      saveAnalyse(tenderId, nieuw);
      setAnalyse(nieuw);
      if (!stil) toast.success("Analyse bijgewerkt");
    } catch (err: any) {
      const msg =
        err?.context?.error ||
        err?.message ||
        "Er ging iets mis bij het genereren van de analyse.";
      toast.error(typeof msg === "string" ? msg : "Analyse mislukt");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Terug + acties */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate("/aanbestedingen")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar aanbestedingen
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => genereerAnalyse()}
            disabled={bezig}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-60"
          >
            {bezig ? (
              <div className="h-3.5 w-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {analyse ? "Analyse herberekenen" : "Analyse genereren"}
          </button>
          <button
            onClick={() => navigate(`/editor/${tenderId}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-anjer-green text-white text-sm font-medium hover:bg-anjer-green/90 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Open editor
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{tender.naam}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {tender.opdrachtgever}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Deadline {tender.deadline}
          </span>
          {tender.contractwaarde && <span>· {tender.contractwaarde}</span>}
          {tender.sector && <span>· {tender.sector}</span>}
        </div>
      </div>

      {/* KPI-cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-muted/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Deadline</p>
          <p
            className={`text-xl font-medium mt-1 ${
              ds.daysLeft <= 3
                ? "text-anjer-red"
                : ds.daysLeft <= 10
                  ? "text-anjer-amber"
                  : "text-foreground"
            }`}
          >
            {ds.daysLeft >= 0 ? `${ds.daysLeft} dagen` : "Verlopen"}
          </p>
        </div>
        <div className="bg-muted/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Vragen beantwoord</p>
          <p className="text-xl font-medium mt-1 text-foreground">
            {beantwoord}/{tender.vragen.length}
          </p>
        </div>
        <div className="bg-muted/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Gem. AI-score</p>
          <p className="text-xl font-medium mt-1 text-foreground">
            {gemiddeldeScore !== null ? `${gemiddeldeScore}/100` : "—"}
          </p>
        </div>
        <div className="bg-muted/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Geschatte winkans</p>
          <p className="text-xl font-medium mt-1 text-anjer-green">
            {analyse ? `${analyse.geschatte_winkans}%` : "—"}
          </p>
        </div>
      </div>

      {/* Geen analyse / laden */}
      {!analyse && (
        <div className="border border-dashed border-border rounded-xl p-10 flex flex-col items-center text-center">
          <Sparkles className="h-8 w-8 text-primary mb-3" />
          <p className="text-sm text-foreground font-medium">
            {bezig ? "Analyse wordt gegenereerd…" : "Nog geen analyse beschikbaar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            {bezig
              ? "Claude bekijkt de aanbesteding, gunningsvragen en het Anjer-profiel om een complete briefing op te stellen."
              : "Klik op 'Analyse genereren' om een AI-briefing te krijgen met vereisten, actiepunten, risico's en kansen."}
          </p>
        </div>
      )}

      {/* Analyse-inhoud */}
      {analyse && (
        <div className="grid grid-cols-3 gap-5">
          {/* LEFT — hoofdinhoud */}
          <div className="col-span-2 space-y-5">
            {/* Samenvatting */}
            <Section icon={<FileText className="h-4 w-4" />} titel="Samenvatting">
              <p className="text-sm text-foreground leading-relaxed">
                {analyse.samenvatting}
              </p>
            </Section>

            {/* Strategie-advies */}
            <Section
              icon={<TrendingUp className="h-4 w-4" />}
              titel="Strategisch advies"
              accent="primary"
            >
              <p className="text-sm text-foreground leading-relaxed">
                {analyse.strategie_advies}
              </p>
            </Section>

            {/* Actiepunten */}
            <Section
              icon={<ListChecks className="h-4 w-4" />}
              titel={`Actiepunten (${analyse.actiepunten.length})`}
            >
              <div className="space-y-2">
                {analyse.actiepunten.map((a, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg border border-border/60 bg-card"
                  >
                    <span
                      className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border h-fit mt-0.5 ${PRIORITEIT_KLEUR[a.prioriteit]}`}
                    >
                      {a.prioriteit}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.titel}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {a.omschrijving}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Vragen */}
            <Section
              icon={<FileText className="h-4 w-4" />}
              titel={`Gunningsvragen (${tender.vragen.length})`}
            >
              <div className="space-y-2">
                {tender.vragen.map((v) => {
                  const key = `${tenderId}-${v.nr}`;
                  const heeftAntwoord =
                    (savedData.antwoorden[key] || "").trim().length > 0;
                  const aiScore = aiScores[key]?.score;
                  return (
                    <button
                      key={v.nr}
                      onClick={() => navigate(`/editor/${tenderId}`)}
                      className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {heeftAntwoord ? (
                          <CheckCircle2 className="h-4 w-4 text-anjer-green" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-border" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {v.nr}. {v.titel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.punten} punten · max {v.maxWoorden} woorden
                          </p>
                        </div>
                      </div>
                      {aiScore !== undefined && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            aiScore >= 80
                              ? "bg-anjer-green/10 text-anjer-green"
                              : aiScore >= 60
                                ? "bg-anjer-amber/10 text-anjer-amber"
                                : "bg-anjer-red/10 text-anjer-red"
                          }`}
                        >
                          {aiScore}/100
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-5">
            <Section icon={<Target className="h-4 w-4" />} titel="Kernvereisten">
              <ul className="space-y-2">
                {analyse.kernvereisten.map((v, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="leading-relaxed">{v}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={<CheckCircle2 className="h-4 w-4" />} titel="Succesfactoren">
              <ul className="space-y-2">
                {analyse.succesfactoren.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-anjer-green mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              icon={<Lightbulb className="h-4 w-4" />}
              titel="Kansen"
              accent="green"
            >
              <ul className="space-y-2">
                {analyse.kansen.map((k, i) => (
                  <li key={i} className="text-sm text-foreground leading-relaxed">
                    {k}
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              icon={<ShieldAlert className="h-4 w-4" />}
              titel="Risico's"
              accent="amber"
            >
              <ul className="space-y-2">
                {analyse.risicos.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-anjer-amber mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <p className="text-xs text-muted-foreground">
              Laatst bijgewerkt:{" "}
              {new Date(analyse.gegenereerdOp).toLocaleString("nl-NL")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function Section({
  icon,
  titel,
  children,
  accent,
}: {
  icon: React.ReactNode;
  titel: string;
  children: React.ReactNode;
  accent?: "primary" | "green" | "amber";
}) {
  const accentClass =
    accent === "primary"
      ? "border-primary/20 bg-primary/5"
      : accent === "green"
        ? "border-anjer-green/20 bg-anjer-green/5"
        : accent === "amber"
          ? "border-anjer-amber/20 bg-anjer-amber/5"
          : "border-border/60 bg-card";
  return (
    <div className={`rounded-xl border p-4 ${accentClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-foreground">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{titel}</h3>
      </div>
      {children}
    </div>
  );
}

export default AanbestedingDetail;
