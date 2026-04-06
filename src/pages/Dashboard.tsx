import { TrendingUp, FileText, Send, Trophy, AlertTriangle, Clock, BarChart3, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { tenders, getDeadlineStatus, historischeTenders } from "@/lib/tenderData";

const metrics = [
  { label: "Actieve tenders", value: 4, icon: FileText },
  { label: "Ingediend", value: 7, icon: Send },
  { label: "Gewonnen", value: 3, icon: Trophy, trend: true },
];

const AnimatedProgress = ({ value }: { value: number }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Deadline notifications
  const deadlineAlerts = tenders
    .map((t) => ({ ...t, ...getDeadlineStatus(t.deadlineDate) }))
    .filter((t) => t.urgent)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Analytics calculations
  const gewonnen = historischeTenders.filter((t) => t.resultaat === "gewonnen").length;
  const verloren = historischeTenders.filter((t) => t.resultaat === "verloren").length;
  const ingetrokken = historischeTenders.filter((t) => t.resultaat === "ingetrokken").length;
  const gemiddeldeScore =
    Math.round(
      historischeTenders.filter((t) => t.score > 0).reduce((sum, t) => sum + t.score, 0) /
        historischeTenders.filter((t) => t.score > 0).length
    );
  const winRatio = Math.round((gewonnen / (gewonnen + verloren)) * 100);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Aanbestedingen</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Nieuwe tender
        </button>
      </div>
      <p className="text-muted-foreground mt-1 mb-6">
        Welkom terug. U heeft {deadlineAlerts.length} deadline{deadlineAlerts.length !== 1 ? "s" : ""} deze week.
      </p>

      {/* Deadline Alerts */}
      {deadlineAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {deadlineAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                alert.daysLeft <= 3
                  ? "bg-anjer-red/5 border-anjer-red/20"
                  : "bg-anjer-amber/5 border-anjer-amber/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`h-4 w-4 ${alert.daysLeft <= 3 ? "text-anjer-red" : "text-anjer-amber"}`}
                />
                <div>
                  <span className="text-sm font-medium text-foreground">{alert.naam}</span>
                  <span className="text-xs text-muted-foreground ml-2">· {alert.opdrachtgever}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={`text-xs font-medium ${
                    alert.daysLeft <= 3 ? "text-anjer-red" : "text-anjer-amber"
                  }`}>
                    {alert.label}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/editor/${alert.id}`)}
                  className="text-xs font-medium px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Openen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <m.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            {m.trend && (
              <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+2 deze maand</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analytics Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAnalytics
              ? "bg-primary text-primary-foreground"
              : "border border-border text-foreground hover:bg-secondary/50"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Win/verlies-analyse
        </button>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border bg-secondary/30">
            <h3 className="font-semibold text-foreground">Tenderresultaten</h3>
            <p className="text-xs text-muted-foreground mt-1">Overzicht van afgelopen 12 maanden</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-px bg-border">
            {[
              { label: "Gewonnen", value: gewonnen, color: "text-primary" },
              { label: "Verloren", value: verloren, color: "text-anjer-red" },
              { label: "Winratio", value: `${winRatio}%`, color: "text-foreground" },
              { label: "Gem. score", value: gemiddeldeScore, color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Win ratio bar */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary rounded-l-full transition-all duration-700"
                  style={{ width: `${winRatio}%` }}
                />
                <div
                  className="h-full bg-anjer-red rounded-r-full transition-all duration-700"
                  style={{ width: `${100 - winRatio - (ingetrokken / (gewonnen + verloren + ingetrokken)) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Gewonnen</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-anjer-red" /> Verloren</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Ingetrokken ({ingetrokken})</span>
            </div>
          </div>

          {/* History table */}
          <div className="border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-5 font-medium text-muted-foreground">Tender</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Opdrachtgever</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Datum</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Waarde</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Resultaat</th>
                </tr>
              </thead>
              <tbody>
                {historischeTenders.map((t, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-5 font-medium text-foreground">{t.naam}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{t.opdrachtgever}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{t.datum}</td>
                    <td className="py-2.5 px-4 text-foreground">{t.score > 0 ? `${t.score}/100` : "—"}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{t.waarde}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          t.resultaat === "gewonnen"
                            ? "bg-primary/10 text-primary"
                            : t.resultaat === "verloren"
                            ? "bg-anjer-red/10 text-anjer-red"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.resultaat.charAt(0).toUpperCase() + t.resultaat.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Lopende aanbestedingen</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left py-3 px-5 font-medium text-muted-foreground">Naam</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Opdrachtgever</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deadline</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Voortgang</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actie</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) => {
              const deadlineInfo = getDeadlineStatus(t.deadlineDate);
              return (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-foreground">{t.naam}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{t.opdrachtgever}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t.deadline}</span>
                      {deadlineInfo.urgent && (
                        <AlertTriangle className="h-3.5 w-3.5 text-anjer-amber" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <AnimatedProgress value={t.voortgang} />
                      <span className="text-xs text-muted-foreground">{t.voortgang}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${t.statusColor}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => navigate(`/editor/${t.id}`)}
                      className="text-xs font-medium px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Openen
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
