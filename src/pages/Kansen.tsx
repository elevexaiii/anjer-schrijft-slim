import { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Check,
  Archive,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  type Aanbesteding,
  type AanbestedingStatus,
  STATUS_LABEL,
  RELEVANTE_CPV_CODES,
  formatDatumNL,
  formatContractwaarde,
  dagenTotDeadline,
  matchScoreKleur,
} from "@/lib/aanbesteding";

type SorteringChoice = "score" | "deadline" | "nieuwste";

const STATUS_OPTIES: AanbestedingStatus[] = [
  "nieuw",
  "interessant",
  "afgewezen",
  "gearchiveerd",
];

const Kansen = () => {
  const [aanbestedingen, setAanbestedingen] = useState<Aanbesteding[]>([]);
  const [loading, setLoading] = useState(true);
  const [vernieuwt, setVernieuwt] = useState(false);
  const [vernieuwfase, setVernieuwfase] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Aanbesteding | null>(null);

  // Filters
  const [scoreRange, setScoreRange] = useState<[number, number]>([60, 100]);
  const [statusFilter, setStatusFilter] = useState<AanbestedingStatus[]>([
    "nieuw",
    "interessant",
  ]);
  const [waardeMin, setWaardeMin] = useState<string>("");
  const [waardeMax, setWaardeMax] = useState<string>("");
  const [regioZoek, setRegioZoek] = useState<string>("");
  const [sortering, setSortering] = useState<SorteringChoice>("score");
  const [alleenRelevanteCpv, setAlleenRelevanteCpv] = useState(true);

  const laden = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("aanbestedingen")
      .select("*")
      .order("match_score", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) {
      toast.error("Kon aanbestedingen niet laden", { description: error.message });
      setAanbestedingen([]);
    } else {
      setAanbestedingen((data ?? []) as Aanbesteding[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const vernieuwen = async () => {
    if (vernieuwt) return;
    setVernieuwt(true);
    setVernieuwfase("Aanbestedingen ophalen...");
    try {
      const { data: fetchData, error: fetchError } = await supabase.functions.invoke(
        "fetch-tenderned-rss",
        { body: {} },
      );
      if (fetchError) throw new Error(fetchError.message);
      const nieuw = fetchData?.nieuw_toegevoegd ?? 0;

      setVernieuwfase("Claude analyseert...");
      const { data: matchData, error: matchError } = await supabase.functions.invoke(
        "match-batch",
        { body: {} },
      );
      if (matchError) throw new Error(matchError.message);
      const verwerkt = matchData?.aantal_verwerkt ?? 0;

      toast.success(`${nieuw} nieuwe aanbestedingen, ${verwerkt} geanalyseerd`);
      await laden();
    } catch (e) {
      toast.error("Vernieuwen mislukt", {
        description: e instanceof Error ? e.message : "Onbekende fout",
      });
    } finally {
      setVernieuwt(false);
      setVernieuwfase("");
    }
  };

  const wijzigStatus = async (id: string, status: AanbestedingStatus) => {
    const { error } = await supabase
      .from("aanbestedingen")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Kon status niet bijwerken", { description: error.message });
      return;
    }
    setAanbestedingen((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
    if (detailItem?.id === id) {
      setDetailItem({ ...detailItem, status });
    }
    toast.success(`Status: ${STATUS_LABEL[status]}`);
  };

  const updateNotities = async (id: string, notities: string) => {
    const { error } = await supabase
      .from("aanbestedingen")
      .update({ notities })
      .eq("id", id);
    if (error) {
      toast.error("Notities niet opgeslagen", { description: error.message });
      return;
    }
    setAanbestedingen((prev) =>
      prev.map((a) => (a.id === id ? { ...a, notities } : a)),
    );
  };

  // Statistieken
  const stats = useMemo(() => {
    const nu = Date.now();
    const zevenDagen = nu - 7 * 24 * 60 * 60 * 1000;
    const dertigDagen = nu - 30 * 24 * 60 * 60 * 1000;
    const recent = aanbestedingen.filter(
      (a) => new Date(a.toegevoegd_op).getTime() >= zevenDagen,
    );
    const nieuwAantal = recent.filter((a) => a.status === "nieuw").length;
    const hogeMatch = aanbestedingen.filter(
      (a) => (a.match_score ?? 0) >= 75,
    ).length;
    const recentMatched = aanbestedingen.filter(
      (a) =>
        a.match_geanalyseerd_op &&
        new Date(a.match_geanalyseerd_op).getTime() >= dertigDagen &&
        a.match_score !== null,
    );
    const gemiddeld =
      recentMatched.length > 0
        ? Math.round(
            recentMatched.reduce((s, a) => s + (a.match_score ?? 0), 0) /
              recentMatched.length,
          )
        : 0;
    const omgezet = aanbestedingen.filter(
      (a) =>
        a.status === "omgezet_naar_tender" &&
        new Date(a.toegevoegd_op).getTime() >= dertigDagen,
    ).length;
    return { nieuwAantal, hogeMatch, gemiddeld, omgezet };
  }, [aanbestedingen]);

  // Filteren + sorteren
  const zichtbaar = useMemo(() => {
    let lijst = aanbestedingen.filter((a) => {
      const score = a.match_score ?? -1;
      if (a.match_score !== null) {
        if (score < scoreRange[0] || score > scoreRange[1]) return false;
      }
      if (!statusFilter.includes(a.status)) return false;
      const min = waardeMin ? Number(waardeMin) : null;
      const max = waardeMax ? Number(waardeMax) : null;
      if (min !== null && (a.contractwaarde_max ?? 0) < min) return false;
      if (max !== null && (a.contractwaarde_min ?? Infinity) > max) return false;
      if (
        regioZoek &&
        !(a.regio ?? "").toLowerCase().includes(regioZoek.toLowerCase())
      ) {
        return false;
      }
      if (alleenRelevanteCpv) {
        const heeft = (a.cpv_codes ?? []).some((c) =>
          RELEVANTE_CPV_CODES.includes(c),
        );
        if (!heeft) return false;
      }
      return true;
    });

    if (sortering === "score") {
      lijst.sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1));
    } else if (sortering === "deadline") {
      lijst.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      });
    } else {
      lijst.sort(
        (a, b) =>
          new Date(b.toegevoegd_op).getTime() -
          new Date(a.toegevoegd_op).getTime(),
      );
    }
    return lijst;
  }, [
    aanbestedingen,
    scoreRange,
    statusFilter,
    waardeMin,
    waardeMax,
    regioZoek,
    alleenRelevanteCpv,
    sortering,
  ]);

  const toggleStatusFilter = (s: AanbestedingStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-anjer-dark-green flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Kansen
          </h1>
          <p className="text-anjer-text-muted mt-1">
            Dagelijks bijgewerkte aanbestedingen die passen bij Anjer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={vernieuwen} disabled={vernieuwt}>
            <RefreshCw
              className={`h-4 w-4 ${vernieuwt ? "animate-spin" : ""}`}
            />
            {vernieuwt ? vernieuwfase || "Bezig..." : "Vernieuwen"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Nieuwe (7d)" value={stats.nieuwAantal} />
        <StatCard label="Hoge match (≥75)" value={stats.hogeMatch} />
        <StatCard label="Gem. match (30d)" value={stats.gemiddeld} suffix="" />
        <StatCard label="Omgezet (30d)" value={stats.omgezet} />
      </div>

      {/* Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-5">
              <div>
                <Label className="mb-2 block">
                  Match-score: {scoreRange[0]} – {scoreRange[1]}
                </Label>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={scoreRange}
                  onValueChange={(v) => setScoreRange([v[0], v[1]] as [number, number])}
                />
              </div>
              <div>
                <Label className="mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        statusFilter.includes(s)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input text-anjer-text-muted hover:bg-muted"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block">Contractwaarde min (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={waardeMin}
                    onChange={(e) => setWaardeMin(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Contractwaarde max (€)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={waardeMax}
                    onChange={(e) => setWaardeMax(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Regio</Label>
                  <Input
                    placeholder="bv. NL32 of Amsterdam"
                    value={regioZoek}
                    onChange={(e) => setRegioZoek(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="cpv"
                    checked={alleenRelevanteCpv}
                    onCheckedChange={setAlleenRelevanteCpv}
                  />
                  <Label htmlFor="cpv">Alleen relevante CPV-codes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Sortering</Label>
                  <Select
                    value={sortering}
                    onValueChange={(v) => setSortering(v as SorteringChoice)}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Match-score hoog-laag</SelectItem>
                      <SelectItem value="deadline">Deadline dichtstbij</SelectItem>
                      <SelectItem value="nieuwste">Nieuwste eerst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Lijst */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : aanbestedingen.length === 0 ? (
        <LegeStaat
          titel="Nog geen aanbestedingen opgehaald"
          subtitel="Klik op 'Vernieuwen' om de laatste publicaties uit TenderNed op te halen."
          actie={
            <Button onClick={vernieuwen} disabled={vernieuwt}>
              <RefreshCw className="h-4 w-4" />
              Nu vernieuwen
            </Button>
          }
        />
      ) : zichtbaar.length === 0 ? (
        <LegeStaat
          titel="Geen aanbestedingen met deze filters"
          subtitel="Verruim de filters of zet 'Alleen relevante CPV-codes' uit."
        />
      ) : (
        <div className="space-y-4">
          {zichtbaar.map((a) => (
            <KansKaart
              key={a.id}
              aanbesteding={a}
              onOpen={() => setDetailItem(a)}
              onStatus={(s) => wijzigStatus(a.id, s)}
            />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <DetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onStatus={(s) => detailItem && wijzigStatus(detailItem.id, s)}
        onNotities={(n) => detailItem && updateNotities(detailItem.id, n)}
      />
    </div>
  );
};

function StatCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-anjer-text-muted">{label}</p>
        <p className="text-3xl font-bold text-anjer-dark-green mt-1">
          {value}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}

function LegeStaat({
  titel,
  subtitel,
  actie,
}: {
  titel: string;
  subtitel: string;
  actie?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-4">
        <Sparkles className="h-12 w-12 mx-auto text-anjer-text-muted/50" />
        <div>
          <h3 className="text-lg font-semibold text-anjer-dark-green">{titel}</h3>
          <p className="text-anjer-text-muted mt-1">{subtitel}</p>
        </div>
        {actie}
      </CardContent>
    </Card>
  );
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const dagen = dagenTotDeadline(deadline);
  if (dagen === null) return null;
  if (dagen < 0) {
    return (
      <Badge variant="outline" className="text-anjer-text-muted">
        Deadline verstreken
      </Badge>
    );
  }
  if (dagen <= 7) {
    return (
      <Badge className="bg-anjer-red text-white hover:bg-anjer-red/90">
        Deadline over {dagen} {dagen === 1 ? "dag" : "dagen"}
      </Badge>
    );
  }
  if (dagen <= 30) {
    return (
      <Badge className="bg-anjer-amber text-white hover:bg-anjer-amber/90">
        Deadline over {dagen} dagen
      </Badge>
    );
  }
  return null;
}

function KansKaart({
  aanbesteding,
  onOpen,
  onStatus,
}: {
  aanbesteding: Aanbesteding;
  onOpen: () => void;
  onStatus: (s: AanbestedingStatus) => void;
}) {
  const a = aanbesteding;
  const beschrijving = a.beschrijving ?? "";
  const truncatedBeschrijving =
    beschrijving.length > 280
      ? beschrijving.slice(0, 280).trim() + "..."
      : beschrijving;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Linker deel */}
          <div className="min-w-0">
            <div className="flex items-start gap-3 mb-2 flex-wrap">
              <Badge
                className={`${matchScoreKleur(a.match_score)} text-base px-3 py-1 font-bold`}
              >
                {a.match_score ?? "—"}
              </Badge>
              <DeadlineBadge deadline={a.deadline} />
              <Badge variant="outline">{STATUS_LABEL[a.status]}</Badge>
            </div>
            <h3 className="text-lg font-semibold text-anjer-dark-green leading-snug mb-1">
              {a.titel}
            </h3>
            <p className="text-sm text-anjer-text-muted mb-3">
              {a.opdrachtgever ?? "Onbekende opdrachtgever"}
              {a.regio ? ` · ${a.regio}` : ""}
            </p>
            {truncatedBeschrijving && (
              <p className="text-sm text-anjer-text leading-relaxed mb-3 whitespace-pre-line">
                {truncatedBeschrijving}
              </p>
            )}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              {(a.cpv_codes ?? []).slice(0, 4).map((c) => (
                <Badge key={c} variant="secondary" className="font-mono">
                  {c}
                </Badge>
              ))}
              <span className="text-anjer-text-muted">
                {formatContractwaarde(a.contractwaarde_min, a.contractwaarde_max)}
              </span>
              {a.deadline && (
                <span className="text-anjer-text-muted">
                  · Deadline {formatDatumNL(a.deadline)}
                </span>
              )}
            </div>
          </div>

          {/* Rechter deel */}
          <div className="border-l lg:pl-6 lg:border-l-anjer-border pt-4 lg:pt-0 border-t lg:border-t-0">
            {a.match_uitleg ? (
              <p className="text-sm text-anjer-text-muted italic mb-3">
                {a.match_uitleg}
              </p>
            ) : (
              <p className="text-sm text-anjer-text-muted italic mb-3">
                Nog niet geanalyseerd door Claude.
              </p>
            )}
            {(a.match_sterke_punten ?? []).length > 0 && (
              <ul className="space-y-1 mb-2">
                {(a.match_sterke_punten ?? []).slice(0, 3).map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            {(a.match_zwakke_punten ?? []).length > 0 && (
              <ul className="space-y-1 mb-3">
                {(a.match_zwakke_punten ?? []).slice(0, 2).map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-anjer-amber mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            <div
              className="flex flex-wrap gap-1.5 mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              {a.bron_url && (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={a.bron_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    TenderNed
                  </a>
                </Button>
              )}
              {a.status !== "interessant" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatus("interessant")}
                >
                  <Check className="h-3.5 w-3.5" />
                  Interessant
                </Button>
              )}
              {a.status !== "afgewezen" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStatus("afgewezen")}
                >
                  <X className="h-3.5 w-3.5" />
                  Afwijzen
                </Button>
              )}
              {(a.status === "nieuw" || a.status === "interessant") && (
                <Button size="sm" onClick={() => onStatus("omgezet_naar_tender")}>
                  Omzetten
                </Button>
              )}
              {a.status !== "gearchiveerd" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStatus("gearchiveerd")}
                  title="Archiveren"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailDialog({
  item,
  onClose,
  onStatus,
  onNotities,
}: {
  item: Aanbesteding | null;
  onClose: () => void;
  onStatus: (s: AanbestedingStatus) => void;
  onNotities: (n: string) => void;
}) {
  const [notities, setNotities] = useState("");
  useEffect(() => {
    setNotities(item?.notities ?? "");
  }, [item]);

  if (!item) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-anjer-dark-green">
            {item.titel}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-2">
          <Badge
            className={`${matchScoreKleur(item.match_score)} px-3 py-1 font-bold`}
          >
            Match {item.match_score ?? "—"}
          </Badge>
          <DeadlineBadge deadline={item.deadline} />
          <Badge variant="outline">{STATUS_LABEL[item.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <DetailRij label="Opdrachtgever" waarde={item.opdrachtgever ?? "—"} />
          <DetailRij label="Regio" waarde={item.regio ?? "—"} />
          <DetailRij
            label="Contractwaarde"
            waarde={formatContractwaarde(item.contractwaarde_min, item.contractwaarde_max)}
          />
          <DetailRij label="Procedure" waarde={item.procedure_type ?? "—"} />
          <DetailRij
            label="Publicatie"
            waarde={formatDatumNL(item.publicatie_datum)}
          />
          <DetailRij label="Deadline" waarde={formatDatumNL(item.deadline)} />
        </div>

        {(item.cpv_codes ?? []).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">CPV-codes</p>
            <div className="flex flex-wrap gap-1.5">
              {(item.cpv_codes ?? []).map((c) => (
                <Badge key={c} variant="secondary" className="font-mono">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {item.beschrijving && (
          <div>
            <p className="text-sm font-medium mb-1">Beschrijving</p>
            <p className="text-sm text-anjer-text whitespace-pre-line leading-relaxed">
              {item.beschrijving}
            </p>
          </div>
        )}

        {item.match_uitleg && (
          <div className="bg-muted/40 rounded-md p-4 space-y-3">
            <p className="text-sm italic text-anjer-text-muted">
              {item.match_uitleg}
            </p>
            {(item.match_sterke_punten ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Sterke punten</p>
                <ul className="space-y-1">
                  {(item.match_sterke_punten ?? []).map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(item.match_zwakke_punten ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Zwakke punten</p>
                <ul className="space-y-1">
                  {(item.match_zwakke_punten ?? []).map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-anjer-amber mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="notities" className="mb-2 block">
            Notities
          </Label>
          <Textarea
            id="notities"
            value={notities}
            onChange={(e) => setNotities(e.target.value)}
            onBlur={() => {
              if ((item.notities ?? "") !== notities) onNotities(notities);
            }}
            placeholder="Eigen aantekeningen bij deze aanbesteding..."
            rows={3}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between pt-2">
          <div className="flex items-center gap-2">
            <Label>Status</Label>
            <Select
              value={item.status}
              onValueChange={(v) => onStatus(v as AanbestedingStatus)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as AanbestedingStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.bron_url && (
              <Button asChild variant="outline">
                <a
                  href={item.bron_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Bekijken op TenderNed
                </a>
              </Button>
            )}
            {item.status !== "omgezet_naar_tender" && (
              <Button onClick={() => onStatus("omgezet_naar_tender")}>
                Omzetten naar tender
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div>
      <p className="text-xs text-anjer-text-muted">{label}</p>
      <p className="text-sm text-anjer-text">{waarde}</p>
    </div>
  );
}

export default Kansen;

