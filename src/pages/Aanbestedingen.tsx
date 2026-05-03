import { FileText, Plus, AlertTriangle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { tenders, historischeTenders, getDeadlineStatus, type Tender } from "@/lib/tenderData";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "lopend" | "ingediend" | "gewonnen" | "verloren";
type SortKey = "deadline" | "nieuwste" | "alfabetisch" | "voortgang";

const SORT_LABELS: Record<SortKey, string> = {
  deadline: "deadline",
  nieuwste: "nieuwste eerst",
  alfabetisch: "alfabetisch",
  voortgang: "voortgang",
};

const formatKortDatum = (d: Date) =>
  d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

const Aanbestedingen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("lopend");
  const [sort, setSort] = useState<SortKey>("deadline");

  const lopend = useMemo(
    () => tenders.filter((t) => (t.fase ?? "lopend") === "lopend"),
    [],
  );
  const ingediend = useMemo(
    () => tenders.filter((t) => t.fase === "ingediend"),
    [],
  );
  const gewonnen = historischeTenders.filter((t) => t.resultaat === "gewonnen");
  const verloren = historischeTenders.filter((t) => t.resultaat === "verloren");

  const counts: Record<Tab, number> = {
    lopend: lopend.length,
    ingediend: ingediend.length,
    gewonnen: gewonnen.length,
    verloren: verloren.length,
  };

  const winRatio =
    gewonnen.length + verloren.length > 0
      ? Math.round((gewonnen.length / (gewonnen.length + verloren.length)) * 100)
      : 0;

  const urgent = lopend
    .map((t) => ({ ...t, ds: getDeadlineStatus(t.deadlineDate) }))
    .filter((t) => t.ds.daysLeft >= 0 && t.ds.daysLeft <= 10)
    .sort((a, b) => a.ds.daysLeft - b.ds.daysLeft);

  const sortTenders = (lijst: Tender[]) => {
    const arr = [...lijst];
    switch (sort) {
      case "deadline":
        return arr.sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());
      case "nieuwste":
        return arr.sort((a, b) => b.id - a.id);
      case "alfabetisch":
        return arr.sort((a, b) => a.naam.localeCompare(b.naam));
      case "voortgang":
        return arr.sort((a, b) => b.voortgang - a.voortgang);
    }
  };

  const metrics = [
    { label: "Actief", value: lopend.length, color: "text-foreground" },
    { label: "Ingediend", value: ingediend.length, color: "text-foreground" },
    { label: "Gewonnen", value: gewonnen.length, color: "text-anjer-green" },
    { label: "Win-ratio", value: `${winRatio}%`, color: "text-foreground" },
  ];

  const huidigeLijst = sortTenders(tab === "lopend" ? lopend : tab === "ingediend" ? ingediend : []);

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aanbestedingen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lopend.length} actieve tender{lopend.length !== 1 ? "s" : ""}, {urgent.length} met urgente deadline
            {urgent.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="bg-anjer-green hover:bg-anjer-green/90 text-white">
          <Plus className="h-4 w-4" />
          Nieuwe tender
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-2xl font-medium mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Urgent banners */}
      {urgent.length > 0 && (
        <div className="space-y-2 mb-[18px]">
          {urgent.map((t) => {
            const rood = t.ds.daysLeft <= 3;
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  rood
                    ? "bg-anjer-red/5 border-anjer-red/20"
                    : "bg-anjer-amber/5 border-anjer-amber/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${rood ? "bg-anjer-red" : "bg-anjer-amber"}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        rood ? "text-anjer-red" : "text-anjer-amber"
                      }`}
                    >
                      {t.naam}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deadline over {t.ds.daysLeft} dag{t.ds.daysLeft !== 1 ? "en" : ""} · Voortgang{" "}
                      {t.voortgang}%
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/editor/${t.id}`)}
                >
                  Open editor
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs + sort */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          {(["lopend", "ingediend", "gewonnen", "verloren"] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = {
              lopend: "Actief",
              ingediend: "Ingediend",
              gewonnen: "Gewonnen",
              verloren: "Verloren",
            };
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-anjer-green text-white"
                    : "bg-muted/40 text-foreground hover:bg-muted/60"
                }`}
              >
                {labels[t]} ({counts[t]})
              </button>
            );
          })}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              Sortering: <span className="font-medium text-foreground">{SORT_LABELS[sort]}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <DropdownMenuItem key={k} onClick={() => setSort(k)}>
                {SORT_LABELS[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lijst */}
      {tab === "lopend" || tab === "ingediend" ? (
        huidigeLijst.length > 0 ? (
          <div>
            {huidigeLijst.map((t) => {
              const ds = getDeadlineStatus(t.deadlineDate);
              const kleur =
                ds.daysLeft <= 3
                  ? "text-anjer-red font-medium"
                  : ds.daysLeft <= 10
                  ? "text-anjer-amber font-medium"
                  : "text-foreground";
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/editor/${t.id}`)}
                  className="grid grid-cols-[1fr_100px_140px_80px] gap-[14px] items-center border border-border/50 rounded-md p-[14px] mb-2 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.naam}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.opdrachtgever}
                      {t.contractwaarde ? ` · ${t.contractwaarde}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Voortgang</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-anjer-green rounded-full transition-all"
                        style={{ width: `${t.voortgang}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.voortgang}%</p>
                  </div>
                  <div>
                    <p className={`text-sm ${kleur}`}>
                      {ds.daysLeft >= 0
                        ? `Over ${ds.daysLeft} dag${ds.daysLeft !== 1 ? "en" : ""}`
                        : "Verlopen"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatKortDatum(t.deadlineDate)}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/editor/${t.id}`);
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Geen tenders met status {tab === "lopend" ? "actief" : "ingediend"}
            </p>
            {tab === "lopend" && (
              <Button className="bg-anjer-green hover:bg-anjer-green/90 text-white">
                <Plus className="h-4 w-4" />
                Nieuwe tender
              </Button>
            )}
          </div>
        )
      ) : (
        // Gewonnen / verloren historie
        <div>
          {(tab === "gewonnen" ? gewonnen : verloren).map((h, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_120px_140px_120px] gap-[14px] items-center border border-border/50 rounded-md p-[14px] mb-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{h.naam}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {h.opdrachtgever} · {h.waarde}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-sm text-foreground">{h.score > 0 ? `${h.score}/100` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Datum</p>
                <p className="text-sm text-foreground">{h.datum}</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full justify-self-end ${
                  tab === "gewonnen"
                    ? "bg-anjer-green/10 text-anjer-green"
                    : "bg-anjer-red/10 text-anjer-red"
                }`}
              >
                {tab === "gewonnen" ? "Gewonnen" : "Verloren"}
              </span>
            </div>
          ))}
          {(tab === "gewonnen" ? gewonnen : verloren).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Geen tenders met status {tab}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Aanbestedingen;
