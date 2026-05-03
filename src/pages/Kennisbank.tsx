import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  AlertTriangle,
  Settings,
  Copy,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ItemDialog from "@/components/kennisbank/ItemDialog";
import {
  type KennisItem,
  type Categorie,
  type Referentie,
  type Certificaat,
  type Methodiek,
  type Standaardtekst,
  loadKennisbank,
  saveKennisbank,
  addItem,
  updateItem,
  archiveItem,
  formatDateNL,
  getDaysUntilExpiry,
  getExpiryStatus,
} from "@/lib/kennisbank";

const tagColors: Record<string, string> = {
  overheid: "bg-primary/10 text-primary",
  retail: "bg-blue-100 text-blue-700",
  cultureel: "bg-teal-100 text-teal-700",
  transport: "bg-amber-100 text-amber-700",
  onderwijs: "bg-purple-100 text-purple-700",
  zorg: "bg-pink-100 text-pink-700",
  kantoor: "bg-slate-100 text-slate-700",
  industrie: "bg-orange-100 text-orange-700",
};

type SortKey = "recent" | "az" | "za" | "verloop";

const Kennisbank = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<KennisItem[]>(() => loadKennisbank());
  const [zoek, setZoek] = useState("");
  const [zoekDebounced, setZoekDebounced] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [toonGearchiveerd, setToonGearchiveerd] = useState(false);
  const [alleenBinnenkort, setAlleenBinnenkort] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"detail" | "edit" | "create">("detail");
  const [activeItem, setActiveItem] = useState<KennisItem | undefined>(undefined);

  const categorie = (searchParams.get("categorie") as Categorie | "alle" | null) ?? "alle";

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setZoekDebounced(zoek), 200);
    return () => clearTimeout(t);
  }, [zoek]);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("kb-zoek")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function setCategorie(c: Categorie | "alle") {
    const sp = new URLSearchParams(searchParams);
    if (c === "alle") sp.delete("categorie");
    else sp.set("categorie", c);
    setSearchParams(sp, { replace: true });
    setTagFilter([]);
  }

  function refresh() {
    setItems(loadKennisbank());
  }

  // Verloop-statistieken
  const certificaten = items.filter((i) => i.categorie === "certificaat") as Certificaat[];
  const binnenkortAantal = certificaten.filter(
    (c) => getExpiryStatus(c.geldigTot) === "binnenkort" && c.status !== "gearchiveerd"
  ).length;
  const verlopenAantal = certificaten.filter(
    (c) => getExpiryStatus(c.geldigTot) === "verlopen" && c.status !== "gearchiveerd"
  ).length;
  const actieveCertificaten = certificaten.filter(
    (c) => c.status === "actief" && getExpiryStatus(c.geldigTot) !== "verlopen"
  ).length;
  const geldigPct =
    certificaten.length > 0
      ? Math.round((actieveCertificaten / certificaten.length) * 100)
      : 0;

  // Beschikbare tags voor filter (op basis van categorie)
  const beschikbareTags = useMemo(() => {
    const set = new Set<string>();
    items
      .filter((i) => categorie === "alle" || i.categorie === categorie)
      .forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items, categorie]);

  // Filter items
  const gefilterd = useMemo(() => {
    let list = items.slice();
    if (!toonGearchiveerd) list = list.filter((i) => i.status !== "gearchiveerd");
    if (categorie !== "alle") list = list.filter((i) => i.categorie === categorie);
    if (alleenBinnenkort && categorie === "certificaat") {
      list = (list as Certificaat[]).filter((c) => {
        const s = getExpiryStatus(c.geldigTot);
        return s === "binnenkort" || s === "verlopen";
      });
    }
    if (tagFilter.length > 0) {
      list = list.filter((i) => tagFilter.every((t) => i.tags.includes(t)));
    }
    if (zoekDebounced.trim()) {
      const q = zoekDebounced.toLowerCase();
      list = list.filter((i) => {
        const haystack = [
          i.titel,
          i.beschrijving,
          i.notities ?? "",
          i.tags.join(" "),
          (i as Referentie).opdrachtgever ?? "",
          (i as Certificaat).uitgever ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "az":
          return a.titel.localeCompare(b.titel);
        case "za":
          return b.titel.localeCompare(a.titel);
        case "verloop": {
          const aDate = (a as Certificaat).geldigTot ?? "9999";
          const bDate = (b as Certificaat).geldigTot ?? "9999";
          return aDate.localeCompare(bDate);
        }
        default:
          return b.gewijzigd.localeCompare(a.gewijzigd);
      }
    });
    return list;
  }, [items, categorie, tagFilter, sortBy, toonGearchiveerd, alleenBinnenkort, zoekDebounced]);

  function handleOpenDetail(item: KennisItem) {
    setActiveItem(item);
    setDialogMode("detail");
    setDialogOpen(true);
  }

  function handleNew() {
    setActiveItem(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  }

  function handleSave(item: KennisItem) {
    if (dialogMode === "create") {
      addItem(item);
    } else {
      updateItem(item.id, item);
    }
    refresh();
  }

  function handleArchive(id: string) {
    archiveItem(id);
    refresh();
  }

  const tabs: { key: Categorie | "alle"; label: string }[] = [
    { key: "alle", label: "Alle" },
    { key: "referentie", label: "Referenties" },
    { key: "certificaat", label: "Certificaten" },
    { key: "methodiek", label: "Methodieken" },
    { key: "standaardtekst", label: "Standaardteksten" },
  ];

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kennisbank</h1>
          <p className="text-muted-foreground mt-1">
            Anjer's referenties, certificaten en methodieken
          </p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-anjer-green hover:bg-anjer-green/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nieuw item
        </Button>
      </div>

      {/* Verloop-banner */}
      {(binnenkortAantal > 0 || verlopenAantal > 0) && (
        <button
          onClick={() => {
            setCategorie("certificaat");
            setAlleenBinnenkort(true);
          }}
          className={`mt-4 w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
            verlopenAantal > 0
              ? "bg-anjer-red/10 border border-anjer-red/30 hover:bg-anjer-red/15"
              : "bg-anjer-amber/10 border border-anjer-amber/30 hover:bg-anjer-amber/15"
          }`}
        >
          <AlertTriangle
            className={`h-4 w-4 shrink-0 ${
              verlopenAantal > 0 ? "text-anjer-red" : "text-anjer-amber"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              verlopenAantal > 0 ? "text-anjer-red" : "text-anjer-amber"
            }`}
          >
            {verlopenAantal > 0
              ? `${verlopenAantal} certifica${verlopenAantal === 1 ? "at" : "ten"} verlopen${binnenkortAantal > 0 ? ` / ${binnenkortAantal} verloopt binnen 30 dagen` : ""}`
              : `${binnenkortAantal} certifica${binnenkortAantal === 1 ? "at" : "ten"} verloopt binnen 30 dagen`}
          </span>
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-5 mb-6">
        <StatCard label="Totaal items" value={items.filter((i) => i.status !== "gearchiveerd").length.toString()} />
        <StatCard label="Actieve certificaten" value={actieveCertificaten.toString()} />
        <StatCard label="Geldigheid" value={`${geldigPct}%`} />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="kb-zoek"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek in de kennisbank... (Ctrl+K)"
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategorie(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
              categorie === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {categorie === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Filterbalk */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {beschikbareTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground">Tags:</span>
            {beschikbareTags.slice(0, 8).map((t) => {
              const actief = tagFilter.includes(t);
              return (
                <button
                  key={t}
                  onClick={() =>
                    setTagFilter(actief ? tagFilter.filter((x) => x !== t) : [...tagFilter, t])
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    actief
                      ? "bg-anjer-green text-white border-anjer-green"
                      : "border-border text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {categorie === "certificaat" && (
            <div className="flex items-center gap-2">
              <Switch
                checked={alleenBinnenkort}
                onCheckedChange={setAlleenBinnenkort}
                id="binnenkort"
              />
              <Label htmlFor="binnenkort" className="text-xs">
                Verloopt binnenkort
              </Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={toonGearchiveerd}
              onCheckedChange={setToonGearchiveerd}
              id="archief"
            />
            <Label htmlFor="archief" className="text-xs">
              Toon gearchiveerd
            </Label>
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent gewijzigd</SelectItem>
              <SelectItem value="az">Naam A–Z</SelectItem>
              <SelectItem value="za">Naam Z–A</SelectItem>
              <SelectItem value="verloop">Verloopdatum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {gefilterd.length} {gefilterd.length === 1 ? "item" : "items"} gevonden
      </p>

      {/* Cards */}
      {gefilterd.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-foreground font-medium">Geen items gevonden</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Pas je zoekopdracht aan of voeg een nieuw item toe
          </p>
          <Button
            onClick={handleNew}
            className="bg-anjer-green hover:bg-anjer-green/90 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nieuw item toevoegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {gefilterd.map((item) => (
            <KennisCard key={item.id} item={item} onClick={() => handleOpenDetail(item)} />
          ))}
        </div>
      )}

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        item={activeItem}
        initialCategorie={categorie === "alle" ? "referentie" : categorie}
        onSave={handleSave}
        onArchive={handleArchive}
        onSwitchToEdit={() => setDialogMode("edit")}
      />
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function KennisCard({ item, onClick }: { item: KennisItem; onClick: () => void }) {
  if (item.categorie === "referentie") return <ReferentieCard item={item} onClick={onClick} />;
  if (item.categorie === "certificaat") return <CertificaatCard item={item} onClick={onClick} />;
  if (item.categorie === "methodiek") return <MethodiekCard item={item} onClick={onClick} />;
  return <StandaardtekstCard item={item} onClick={onClick} />;
}

function ReferentieCard({ item, onClick }: { item: Referentie; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-1 bg-anjer-green" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-2 gap-3">
          <h3 className="font-semibold text-foreground text-sm">{item.titel}</h3>
          {item.kwaliteitsscore !== undefined && (
            <span className="shrink-0 text-xs font-bold text-anjer-green bg-anjer-green/10 px-2 py-0.5 rounded">
              {item.kwaliteitsscore.toFixed(1)}/10
            </span>
          )}
        </div>
        <span
          className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${
            tagColors[item.organisatieType] || "bg-muted text-muted-foreground"
          }`}
        >
          {item.organisatieType}
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {item.beschrijving}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          {formatDateNL(item.contractVan)} – {formatDateNL(item.contractTot)}
        </p>
      </div>
    </button>
  );
}

function CertificaatCard({ item, onClick }: { item: Certificaat; onClick: () => void }) {
  const status = getExpiryStatus(item.geldigTot);
  const days = getDaysUntilExpiry(item.geldigTot);
  const dotKleur =
    status === "verlopen"
      ? "bg-anjer-red"
      : status === "binnenkort"
        ? "bg-anjer-amber"
        : "bg-anjer-green";
  const tekstKleur =
    status === "verlopen"
      ? "text-anjer-red"
      : status === "binnenkort"
        ? "text-anjer-amber"
        : "text-muted-foreground";
  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${dotKleur}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-anjer-green shrink-0" />
            <h3 className="font-semibold text-foreground text-sm truncate">{item.titel}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{item.uitgever}</p>
          <p className={`text-xs mt-2 font-medium ${tekstKleur}`}>
            Geldig tot {formatDateNL(item.geldigTot)}
          </p>
          <p className={`text-xs ${tekstKleur}`}>
            {days < 0 ? `${Math.abs(days)} dagen verlopen` : `nog ${days} dagen`}
          </p>
          {item.registratienummer && (
            <p className="text-xs text-muted-foreground mt-1">{item.registratienummer}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function MethodiekCard({ item, onClick }: { item: Methodiek; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2 mb-2">
        <Settings className="h-4 w-4 text-anjer-green shrink-0 mt-0.5" />
        <h3 className="font-semibold text-foreground text-sm flex-1">{item.titel}</h3>
      </div>
      {item.toepassingsgebied && (
        <Badge variant="outline" className="mb-2 text-xs">
          {item.toepassingsgebied}
        </Badge>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {item.beschrijving}
      </p>
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function StandaardtekstCard({ item, onClick }: { item: Standaardtekst; onClick: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <button onClick={onClick} className="text-left w-full">
        <div className="flex items-start gap-2 mb-2">
          <FileText className="h-4 w-4 text-anjer-green shrink-0 mt-0.5" />
          <h3 className="font-semibold text-foreground text-sm flex-1">{item.titel}</h3>
          <Badge variant="outline" className="text-xs">
            {item.lengte}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{item.woordenAantal} woorden</p>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {item.inhoud}
        </p>
      </button>
      <div className="flex justify-end mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(item.inhoud);
            toast.success("Tekst gekopieerd");
          }}
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Kopiëren
        </Button>
      </div>
    </div>
  );
}

export default Kennisbank;
