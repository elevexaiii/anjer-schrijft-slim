import { TrendingUp, FileText, Send, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const metrics = [
  { label: "Actieve tenders", value: 4, icon: FileText },
  { label: "Ingediend", value: 7, icon: Send },
  { label: "Gewonnen", value: 3, icon: Trophy, trend: true },
];

const tenders = [
  {
    id: 1,
    naam: "Schoonmaakdiensten Gemeentehuis",
    opdrachtgever: "Gemeente Amsterdam",
    deadline: "14 apr 2025",
    voortgang: 60,
    status: "Actief",
    statusColor: "bg-primary/10 text-primary",
  },
  {
    id: 2,
    naam: "Facilitaire diensten Kantoorpand",
    opdrachtgever: "Rijksvastgoedbedrijf",
    deadline: "28 apr 2025",
    voortgang: 30,
    status: "Actief",
    statusColor: "bg-primary/10 text-primary",
  },
  {
    id: 3,
    naam: "Glazenwassen Winkelcentrum",
    opdrachtgever: "Unibail-Rodamco",
    deadline: "05 mei 2025",
    voortgang: 80,
    status: "Bijna klaar",
    statusColor: "bg-anjer-amber/10 text-anjer-amber",
  },
  {
    id: 4,
    naam: "Schoonmaak Cultureel Centrum",
    opdrachtgever: "Gemeente Rotterdam",
    deadline: "19 mei 2025",
    voortgang: 10,
    status: "Concept",
    statusColor: "bg-muted text-muted-foreground",
  },
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

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-foreground">Aanbestedingen</h1>
      <p className="text-muted-foreground mt-1 mb-8">
        Welkom terug. U heeft 2 deadlines deze week.
      </p>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-card border border-border rounded-xl p-5 relative overflow-hidden"
          >
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
            {tenders.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="py-3.5 px-5 font-medium text-foreground">{t.naam}</td>
                <td className="py-3.5 px-4 text-muted-foreground">{t.opdrachtgever}</td>
                <td className="py-3.5 px-4 text-muted-foreground">{t.deadline}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
