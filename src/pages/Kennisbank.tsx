import { useState } from "react";
import { Search } from "lucide-react";

const tabs = ["Referenties", "Certificaten", "Methodieken", "Standaardteksten"];

const tagColors: Record<string, string> = {
  Overheid: "bg-primary/10 text-primary",
  Retail: "bg-blue-100 text-blue-700",
  Cultureel: "bg-teal-100 text-teal-700",
  Transport: "bg-amber-100 text-amber-700",
};

const referenties = [
  {
    naam: "Gemeente Utrecht – Gemeentehuis",
    tag: "Overheid",
    beschrijving: "Schoonmaak 12.000m² kantoor- en publieksruimte, 2 jaar contract",
    jaar: "2022–2024",
  },
  {
    naam: "Rijkswaterstaat – Kantoorlocaties",
    tag: "Overheid",
    beschrijving: "Facilitaire diensten 8 locaties, glazenwassen en dagschoonmaak",
    jaar: "2022",
  },
  {
    naam: "Primark Amsterdam",
    tag: "Retail",
    beschrijving: "Dagelijkse schoonmaak 4.200m² winkelruimte, 7 dagen per week",
    jaar: "2023",
  },
  {
    naam: "Eye Filmmuseum Amsterdam",
    tag: "Cultureel",
    beschrijving: "Specialistische reiniging museumzalen en tentoonstellingsruimtes",
    jaar: "2024",
  },
  {
    naam: "NS Stations Utrecht",
    tag: "Transport",
    beschrijving: "Schoonmaak 3 stationslocaties inclusief nachtdiensten",
    jaar: "2022",
  },
  {
    naam: "Ministerie van Financiën",
    tag: "Overheid",
    beschrijving: "Schoonmaak en facilitaire diensten hoofdkantoor Den Haag",
    jaar: "2024",
  },
];

const Kennisbank = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-foreground">Kennisbank</h1>
      <p className="text-muted-foreground mt-1 mb-6">
        Anjer's referenties, certificaten en methodieken
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Zoek in de kennisbank..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === i
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === i && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {activeTab === 0 && (
        <div className="grid grid-cols-2 gap-5">
          {referenties.map((ref) => (
            <div
              key={ref.naam}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-1 bg-primary" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm">{ref.naam}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">{ref.jaar}</span>
                </div>
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${
                    tagColors[ref.tag] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {ref.tag}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{ref.beschrijving}</p>
                <button className="mt-3 text-xs font-medium text-primary hover:underline">
                  Bekijken
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab !== 0 && (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Nog geen items in deze categorie.
        </div>
      )}
    </div>
  );
};

export default Kennisbank;
