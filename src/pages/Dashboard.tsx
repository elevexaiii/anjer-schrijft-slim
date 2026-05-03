import {
  TrendingUp,
  TrendingDown,
  Plus,
  AlertCircle,
  FileText,
  BookOpen,
  Settings as SettingsIcon,
  HelpCircle,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { tenders, historischeTenders, getDeadlineStatus } from "@/lib/tenderData";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Sectoren afgeleid uit opdrachtgever
const sectorVoor = (opdrachtgever: string): string => {
  const o = opdrachtgever.toLowerCase();
  if (o.includes("gemeente") || o.includes("provincie") || o.includes("rijks")) return "Overheid";
  if (o.includes("museum") || o.includes("rijksmuseum")) return "Cultureel";
  if (o.includes("hogeschool") || o.includes("hva") || o.includes("school") || o.includes("universiteit"))
    return "Onderwijs";
  if (o.includes("ing") || o.includes("bank") || o.includes("retail") || o.includes("unibail")) return "Retail";
  if (o.includes("schiphol") || o.includes("transport") || o.includes("ns")) return "Transport";
  if (o.includes("ziekenhuis") || o.includes("olvg") || o.includes("zorg")) return "Zorg";
  return "Overheid";
};

// Datum NL lang
const formatLangDatum = (d: Date) =>
  d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Maand parsen uit "dec 2024" → Date
const MAAND_NL: Record<string, number> = {
  jan: 0, feb: 1, mrt: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
};
const parseHistDatum = (s: string): Date | null => {
  const [m, j] = s.toLowerCase().split(" ");
  if (!(m in MAAND_NL) || !j) return null;
  return new Date(parseInt(j, 10), MAAND_NL[m], 1);
};

const Kpi = ({
  label,
  value,
  sub,
  trend,
  onClick,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="bg-muted/40 rounded-lg p-[14px] text-left hover:bg-muted/60 transition-colors"
  >
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-medium text-foreground mt-1">{value}</p>
    {sub && (
      <div
        className={`text-xs mt-1 flex items-center gap-1 ${
          trend === "up"
            ? "text-anjer-green"
            : trend === "down"
            ? "text-anjer-red"
            : "text-muted-foreground"
        }`}
      >
        {sub}
      </div>
    )}
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();

  const lopend = tenders.filter((t) => (t.fase ?? "lopend") === "lopend");
  const gewonnen = historischeTenders.filter((t) => t.resultaat === "gewonnen");
  const verloren = historischeTenders.filter((t) => t.resultaat === "verloren");
  const winRatio =
    gewonnen.length + verloren.length > 0
      ? Math.round((gewonnen.length / (gewonnen.length + verloren.length)) * 100)
      : 0;

  // Kansen wachtend (placeholder: gebruik 0; live data niet in scope hier)
  const kansenWachtend = 0;

  // Gemiddelde score laatste 10
  const laatste10 = [...historischeTenders]
    .filter((t) => t.score > 0)
    .slice(0, 10);
  const gemScore = laatste10.length
    ? +(laatste10.reduce((s, t) => s + t.score, 0) / laatste10.length / 10).toFixed(1)
    : 0;

  // Pipeline waarde — uit historischeTenders waardes (proxy) en aantal lopend
  const pipelineWaarde = "€ 2,4M";

  // Aandacht nodig
  const aandacht = useMemo(() => {
    const items: { id: string; titel: string; subtitel: string; kleur: "red" | "amber"; actie: () => void }[] = [];
    lopend.forEach((t) => {
      const ds = getDeadlineStatus(t.deadlineDate);
      if (ds.daysLeft >= 0 && ds.daysLeft <= 7) {
        items.push({
          id: `dl-${t.id}`,
          titel: t.naam,
          subtitel: `Deadline over ${ds.daysLeft} dag${ds.daysLeft !== 1 ? "en" : ""}`,
          kleur: "red",
          actie: () => navigate(`/editor/${t.id}`),
        });
      }
      const totScore =
        t.vragen.reduce((s, v) => s + v.score, 0) / Math.max(1, t.vragen.length);
      if (totScore > 0 && totScore < 60) {
        items.push({
          id: `sc-${t.id}`,
          titel: t.naam,
          subtitel: `Lage score (${Math.round(totScore)}/100)`,
          kleur: "amber",
          actie: () => navigate(`/editor/${t.id}`),
        });
      }
    });
    return items.slice(0, 5);
  }, [lopend, navigate]);

  // Win-ratio per sector (laatste 24 mnd → we gebruiken alle historische)
  const sectorRatio = useMemo(() => {
    const map = new Map<string, { gewonnen: number; totaal: number }>();
    historischeTenders.forEach((t) => {
      if (t.resultaat === "ingetrokken") return;
      const s = sectorVoor(t.opdrachtgever);
      const cur = map.get(s) ?? { gewonnen: 0, totaal: 0 };
      cur.totaal += 1;
      if (t.resultaat === "gewonnen") cur.gewonnen += 1;
      map.set(s, cur);
    });
    return Array.from(map.entries())
      .map(([sector, v]) => ({ sector, ratio: Math.round((v.gewonnen / v.totaal) * 100), totaal: v.totaal }))
      .sort((a, b) => b.ratio - a.ratio);
  }, []);

  const totaalSectorTenders = sectorRatio.reduce((s, x) => s + x.totaal, 0);

  // Score-trend per maand (12 mnd)
  const scoreTrend = useMemo(() => {
    const buckets = new Map<string, { totaal: number; aantal: number; date: Date }>();
    historischeTenders.forEach((t) => {
      if (t.score <= 0) return;
      const d = parseHistDatum(t.datum);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const cur = buckets.get(key) ?? { totaal: 0, aantal: 0, date: d };
      cur.totaal += t.score;
      cur.aantal += 1;
      buckets.set(key, cur);
    });
    return Array.from(buckets.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((b) => ({
        maand: b.date.toLocaleDateString("nl-NL", { month: "short" }),
        score: +(b.totaal / b.aantal / 10).toFixed(1),
      }));
  }, []);

  const trendVergelijking = useMemo(() => {
    if (scoreTrend.length < 6) return null;
    const last3 = scoreTrend.slice(-3).reduce((s, x) => s + x.score, 0) / 3;
    const prev3 = scoreTrend.slice(-6, -3).reduce((s, x) => s + x.score, 0) / 3;
    const diff = +(last3 - prev3).toFixed(1);
    return { last3: last3.toFixed(1), diff };
  }, [scoreTrend]);

  const aandachtAantal = aandacht.length;
  const trendVorigJaar = 5; // mock

  return (
    <TooltipProvider>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatLangDatum(new Date())} · U heeft {lopend.length} actieve tender
                {kansenWachtend} kans
              {kansenWachtend !== 1 ? "en" : ""} wachtend op review
            </p>
          </div>
          <Button className="bg-anjer-green hover:bg-anjer-green/90 text-white">
            <Plus className="h-4 w-4" />
            Nieuwe tender
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Kpi
            label="Win-ratio (12 mnd)"
            value={`${winRatio}%`}
            trend={trendVorigJaar >= 0 ? "up" : "down"}
            sub={
              <>
                {trendVorigJaar >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendVorigJaar >= 0 ? "+" : ""}
                {trendVorigJaar}% t.o.v. vorig jaar
              </>
            }
            onClick={() => navigate("/aanbestedingen")}
          />
          <Kpi
            label="Gemiddelde score"
            value={gemScore.toFixed(1)}
            sub={<>van laatste {laatste10.length} ingediende tenders</>}
            trend="neutral"
          />
          <Kpi
            label="Pipeline waarde"
            value={pipelineWaarde}
            sub={<>{lopend.length} actieve tenders</>}
            trend="neutral"
            onClick={() => navigate("/aanbestedingen")}
          />
          <Kpi
            label="Aandacht nodig"
            value={`${aandachtAantal}`}
            sub={
              aandachtAantal > 0 ? (
                <span className="text-anjer-red">actie vereist</span>
              ) : (
                <span className="text-muted-foreground">alles op koers</span>
              )
            }
            trend={aandachtAantal > 0 ? "down" : "neutral"}
          />
        </div>

        {/* Aandacht nodig */}
        {aandacht.length > 0 && (
          <div className="border border-border rounded-lg p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-anjer-amber" />
              <h2 className="text-sm font-semibold text-foreground">Aandacht nodig</h2>
            </div>
            <div className="space-y-2">
              {aandacht.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        it.kleur === "red" ? "bg-anjer-red" : "bg-anjer-amber"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{it.titel}</p>
                      <p className="text-xs text-muted-foreground">{it.subtitel}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={it.actie}>
                    Bekijken
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends 2-koloms */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Sector */}
          <div className="border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Win-ratio per sector</h3>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Aandeel gewonnen tenders per sector.</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-3">
              {sectorRatio.map((s) => (
                <div key={s.sector}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground">{s.sector}</span>
                    <span className="text-xs font-medium text-foreground">{s.ratio}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-anjer-green rounded-full transition-all duration-700"
                      style={{ width: `${s.ratio}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Op basis van {totaalSectorTenders} tenders afgelopen 24 maanden
            </p>
          </div>

          {/* Score-trend */}
          <div className="border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Score-trend</h3>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Gemiddelde score per maand (laatste 12 mnd).</TooltipContent>
              </Tooltip>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="maand" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <ReferenceLine
                    y={7.5}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--anjer-green))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {trendVergelijking && (
              <p className="text-xs text-muted-foreground mt-2">
                Laatste 3 mnd gem. {trendVergelijking.last3}
                {" · "}
                {trendVergelijking.diff >= 0 ? "+" : ""}
                {trendVergelijking.diff} t.o.v. periode ervoor
              </p>
            )}
          </div>
        </div>

        {/* Snel naar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Alle aanbestedingen", icon: FileText, path: "/aanbestedingen" },
            { label: "Kennisbank beheren", icon: BookOpen, path: "/kennisbank" },
            { label: "Instellingen", icon: SettingsIcon, path: "/instellingen" },
            { label: "Help & support", icon: HelpCircle, path: "#help" },
          ].map((c) => (
            <button
              key={c.label}
              onClick={() => c.path.startsWith("#") ? null : navigate(c.path)}
              className="flex items-center gap-3 p-4 border border-border/50 rounded-lg hover:bg-muted/40 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-md bg-anjer-green/10 flex items-center justify-center">
                <c.icon className="h-4 w-4 text-anjer-green" />
              </div>
              <span className="text-sm font-medium text-foreground">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;
