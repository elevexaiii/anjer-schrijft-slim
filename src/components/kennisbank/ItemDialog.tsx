import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type KennisItem,
  type Categorie,
  type Referentie,
  type Certificaat,
  type Methodiek,
  type Standaardtekst,
  type SectorTag,
  type DienstTag,
  SECTOR_OPTIES,
  DIENST_OPTIES,
  formatDateNL,
  getDaysUntilExpiry,
  getExpiryStatus,
  countWords,
  generateId,
} from "@/lib/kennisbank";

type Mode = "detail" | "edit" | "create";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  item?: KennisItem;
  initialCategorie?: Categorie;
  onSave: (item: KennisItem) => void;
  onArchive?: (id: string) => void;
  onSwitchToEdit?: () => void;
}

const CATEGORIE_LABELS: Record<Categorie, string> = {
  referentie: "Referentie",
  certificaat: "Certificaat",
  methodiek: "Methodiek",
  standaardtekst: "Standaardtekst",
};

const STATUS_KLEUREN: Record<KennisItem["status"], string> = {
  actief: "bg-anjer-green/10 text-anjer-green",
  concept: "bg-muted text-muted-foreground",
  gearchiveerd: "bg-anjer-red/10 text-anjer-red",
};

function emptyForCategorie(cat: Categorie): KennisItem {
  const now = new Date().toISOString();
  const base = {
    id: generateId(),
    titel: "",
    beschrijving: "",
    tags: [],
    aangemaakt: now,
    gewijzigd: now,
    status: "actief" as const,
    notities: "",
  };
  switch (cat) {
    case "referentie":
      return {
        ...base,
        categorie: "referentie",
        opdrachtgever: "",
        organisatieType: "overheid",
        locatie: "",
        contractVan: "",
        contractTot: "",
        oppervlakte: "",
        diensten: [],
        frequentie: "",
        kwaliteitsscore: undefined,
        contractwaarde: "",
        referent: { naam: "", functie: "", email: "" },
        resultaten: "",
      };
    case "certificaat":
      return {
        ...base,
        categorie: "certificaat",
        uitgever: "",
        geldigVan: "",
        geldigTot: "",
        registratienummer: "",
        scope: "",
      };
    case "methodiek":
      return {
        ...base,
        categorie: "methodiek",
        toepassingsgebied: "",
        uitgebreideBeschrijving: "",
        gerelateerdeKpis: "",
      };
    case "standaardtekst":
      return {
        ...base,
        categorie: "standaardtekst",
        lengte: "middel",
        woordenAantal: 0,
        inhoud: "",
      };
  }
}

export default function ItemDialog({
  open,
  onOpenChange,
  mode,
  item,
  initialCategorie = "referentie",
  onSave,
  onArchive,
  onSwitchToEdit,
}: Props) {
  const [draft, setDraft] = useState<KennisItem>(() =>
    item ?? emptyForCategorie(initialCategorie)
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDraft(item ?? emptyForCategorie(initialCategorie));
      setErrors({});
    }
  }, [open, item, initialCategorie]);

  const isDetail = mode === "detail";

  function updateDraft<K extends keyof KennisItem>(key: K, value: any) {
    setDraft((prev) => ({ ...prev, [key]: value } as KennisItem));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft.titel.trim()) e.titel = "Titel is verplicht";
    if (countWords(draft.beschrijving) > 300) e.beschrijving = "Maximaal 300 woorden";
    if (draft.categorie === "referentie") {
      const r = draft as Referentie;
      if (!r.opdrachtgever.trim()) e.opdrachtgever = "Opdrachtgever is verplicht";
      if (r.contractVan && r.contractTot && r.contractTot < r.contractVan)
        e.contractTot = "Eind moet na start liggen";
      if (r.kwaliteitsscore !== undefined && (r.kwaliteitsscore < 0 || r.kwaliteitsscore > 10))
        e.kwaliteitsscore = "0–10";
    }
    if (draft.categorie === "certificaat") {
      const c = draft as Certificaat;
      if (!c.uitgever.trim()) e.uitgever = "Uitgever is verplicht";
      if (!c.geldigVan) e.geldigVan = "Verplicht";
      if (!c.geldigTot) e.geldigTot = "Verplicht";
      if (c.geldigVan && c.geldigTot && c.geldigTot < c.geldigVan)
        e.geldigTot = "Eind moet na start liggen";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) {
      toast.error("Controleer de verplichte velden");
      return;
    }
    const nu = new Date().toISOString();
    let final: KennisItem = { ...draft, gewijzigd: nu };
    if (final.categorie === "standaardtekst") {
      final = { ...final, woordenAantal: countWords((final as Standaardtekst).inhoud) };
    }
    onSave(final);
    onOpenChange(false);
    toast.success("Kennisitem opgeslagen");
  }

  // ============ DETAIL VIEW ============
  if (isDetail && item) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{CATEGORIE_LABELS[item.categorie]}</Badge>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_KLEUREN[item.status]}`}>
                {item.status}
              </span>
            </div>
            <DialogTitle className="mt-2">{item.titel}</DialogTitle>
            <DialogDescription>{item.beschrijving}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <DetailContent item={item} />
            {item.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {item.notities && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notities</p>
                <p className="whitespace-pre-wrap text-foreground">{item.notities}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {onArchive && item.status !== "gearchiveerd" && (
              <Button variant="outline" onClick={() => setArchiveOpen(true)}>
                Archiveren
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Sluiten
            </Button>
            {onSwitchToEdit && (
              <Button onClick={onSwitchToEdit} className="bg-anjer-green hover:bg-anjer-green/90 text-white">
                Bewerken
              </Button>
            )}
          </DialogFooter>

          <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Item archiveren?</AlertDialogTitle>
                <AlertDialogDescription>
                  Het item wordt verborgen, maar niet definitief verwijderd.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onArchive?.(item.id);
                    setArchiveOpen(false);
                    onOpenChange(false);
                    toast.success("Item gearchiveerd");
                  }}
                >
                  Archiveren
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    );
  }

  // ============ EDIT / CREATE VIEW ============
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nieuw kennisitem" : "Item bewerken"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Vul de gegevens in om een nieuw item toe te voegen aan de kennisbank."
              : "Wijzig de gegevens en sla op."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {mode === "create" && (
            <div>
              <Label className="mb-2 block">Categorie</Label>
              <RadioGroup
                value={draft.categorie}
                onValueChange={(v) => setDraft(emptyForCategorie(v as Categorie))}
                className="grid grid-cols-2 gap-2"
              >
                {(Object.keys(CATEGORIE_LABELS) as Categorie[]).map((c) => (
                  <Label
                    key={c}
                    className="flex items-center gap-2 border border-border rounded-lg p-2.5 cursor-pointer hover:bg-secondary/50"
                  >
                    <RadioGroupItem value={c} />
                    <span className="text-sm">{CATEGORIE_LABELS[c]}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          <FieldText
            label="Titel"
            required
            value={draft.titel}
            onChange={(v) => updateDraft("titel", v)}
            error={errors.titel}
          />

          <FieldTextarea
            label={`Beschrijving (${countWords(draft.beschrijving)}/300 woorden)`}
            value={draft.beschrijving}
            onChange={(v) => updateDraft("beschrijving", v)}
            error={errors.beschrijving}
            rows={3}
          />

          {/* Categorie-specifiek */}
          {draft.categorie === "referentie" && (
            <ReferentieFelden draft={draft as Referentie} setDraft={setDraft} errors={errors} />
          )}
          {draft.categorie === "certificaat" && (
            <CertificaatFelden draft={draft as Certificaat} setDraft={setDraft} errors={errors} />
          )}
          {draft.categorie === "methodiek" && (
            <MethodiekFelden draft={draft as Methodiek} setDraft={setDraft} errors={errors} />
          )}
          {draft.categorie === "standaardtekst" && (
            <StandaardtekstFelden draft={draft as Standaardtekst} setDraft={setDraft} errors={errors} />
          )}

          <div>
            <Label className="mb-2 block">Tags (komma-gescheiden)</Label>
            <Input
              value={draft.tags.join(", ")}
              onChange={(e) =>
                updateDraft(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="bv. overheid, kantoor"
            />
          </div>

          <div>
            <Label className="mb-2 block">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => updateDraft("status", v as KennisItem["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actief">Actief</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FieldTextarea
            label="Notities (optioneel)"
            value={draft.notities ?? ""}
            onChange={(v) => updateDraft("notities", v)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            onClick={handleSave}
            className="bg-anjer-green hover:bg-anjer-green/90 text-white"
          >
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Helpers ============

function FieldText({
  label,
  value,
  onChange,
  required,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-anjer-red">*</span>}
      </Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? "border-anjer-red" : ""}
      />
      {error && <p className="text-xs text-anjer-red mt-1">{error}</p>}
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  error,
  rows = 3,
  minHeight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
  minHeight?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={minHeight ? { minHeight } : undefined}
        className={error ? "border-anjer-red" : ""}
      />
      {error && <p className="text-xs text-anjer-red mt-1">{error}</p>}
    </div>
  );
}

function ReferentieFelden({
  draft,
  setDraft,
  errors,
}: {
  draft: Referentie;
  setDraft: React.Dispatch<React.SetStateAction<KennisItem>>;
  errors: Record<string, string>;
}) {
  const u = (k: keyof Referentie, v: any) =>
    setDraft((p) => ({ ...(p as Referentie), [k]: v }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="Opdrachtgever"
          required
          value={draft.opdrachtgever}
          onChange={(v) => u("opdrachtgever", v)}
          error={errors.opdrachtgever}
        />
        <div>
          <Label className="mb-1.5 block">Sector</Label>
          <Select
            value={draft.organisatieType}
            onValueChange={(v) => u("organisatieType", v as SectorTag)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTOR_OPTIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <FieldText
        label="Locatie"
        value={draft.locatie ?? ""}
        onChange={(v) => u("locatie", v)}
      />
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="Contract van"
          type="date"
          value={draft.contractVan}
          onChange={(v) => u("contractVan", v)}
        />
        <FieldText
          label="Contract tot"
          type="date"
          value={draft.contractTot}
          onChange={(v) => u("contractTot", v)}
          error={errors.contractTot}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="Oppervlakte"
          value={draft.oppervlakte ?? ""}
          onChange={(v) => u("oppervlakte", v)}
          placeholder="bv. 12.000 m²"
        />
        <FieldText
          label="Frequentie"
          value={draft.frequentie ?? ""}
          onChange={(v) => u("frequentie", v)}
        />
      </div>
      <div>
        <Label className="mb-2 block">Diensten</Label>
        <div className="grid grid-cols-2 gap-2">
          {DIENST_OPTIES.map((d) => (
            <Label key={d} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={draft.diensten.includes(d)}
                onCheckedChange={(checked) =>
                  u(
                    "diensten",
                    checked
                      ? [...draft.diensten, d]
                      : draft.diensten.filter((x) => x !== d)
                  )
                }
              />
              <span className="text-sm">{d}</span>
            </Label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="Kwaliteitsscore (0–10)"
          type="number"
          value={draft.kwaliteitsscore ?? ""}
          onChange={(v) => u("kwaliteitsscore", v === "" ? undefined : Number(v))}
          error={errors.kwaliteitsscore}
        />
        <FieldText
          label="Contractwaarde"
          value={draft.contractwaarde ?? ""}
          onChange={(v) => u("contractwaarde", v)}
          placeholder="bv. € 240.000"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FieldText
          label="Referent — naam"
          value={draft.referent?.naam ?? ""}
          onChange={(v) => u("referent", { ...(draft.referent ?? {}), naam: v })}
        />
        <FieldText
          label="Functie"
          value={draft.referent?.functie ?? ""}
          onChange={(v) => u("referent", { ...(draft.referent ?? {}), functie: v })}
        />
        <FieldText
          label="Email"
          type="email"
          value={draft.referent?.email ?? ""}
          onChange={(v) => u("referent", { ...(draft.referent ?? {}), email: v })}
        />
      </div>
      <FieldTextarea
        label="Resultaten"
        value={draft.resultaten}
        onChange={(v) => u("resultaten", v)}
        rows={4}
      />
    </>
  );
}

function CertificaatFelden({
  draft,
  setDraft,
  errors,
}: {
  draft: Certificaat;
  setDraft: React.Dispatch<React.SetStateAction<KennisItem>>;
  errors: Record<string, string>;
}) {
  const u = (k: keyof Certificaat, v: any) =>
    setDraft((p) => ({ ...(p as Certificaat), [k]: v }));
  return (
    <>
      <FieldText
        label="Uitgever"
        required
        value={draft.uitgever}
        onChange={(v) => u("uitgever", v)}
        error={errors.uitgever}
      />
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="Geldig van"
          required
          type="date"
          value={draft.geldigVan}
          onChange={(v) => u("geldigVan", v)}
          error={errors.geldigVan}
        />
        <FieldText
          label="Geldig tot"
          required
          type="date"
          value={draft.geldigTot}
          onChange={(v) => u("geldigTot", v)}
          error={errors.geldigTot}
        />
      </div>
      <FieldText
        label="Registratienummer"
        value={draft.registratienummer ?? ""}
        onChange={(v) => u("registratienummer", v)}
      />
      <FieldText label="Scope" value={draft.scope ?? ""} onChange={(v) => u("scope", v)} />
    </>
  );
}

function MethodiekFelden({
  draft,
  setDraft,
}: {
  draft: Methodiek;
  setDraft: React.Dispatch<React.SetStateAction<KennisItem>>;
  errors: Record<string, string>;
}) {
  const u = (k: keyof Methodiek, v: any) =>
    setDraft((p) => ({ ...(p as Methodiek), [k]: v }));
  return (
    <>
      <FieldText
        label="Toepassingsgebied"
        value={draft.toepassingsgebied}
        onChange={(v) => u("toepassingsgebied", v)}
      />
      <FieldTextarea
        label="Uitgebreide beschrijving"
        value={draft.uitgebreideBeschrijving}
        onChange={(v) => u("uitgebreideBeschrijving", v)}
        rows={6}
      />
      <FieldTextarea
        label="Gerelateerde KPI's"
        value={draft.gerelateerdeKpis ?? ""}
        onChange={(v) => u("gerelateerdeKpis", v)}
        rows={2}
      />
    </>
  );
}

function StandaardtekstFelden({
  draft,
  setDraft,
}: {
  draft: Standaardtekst;
  setDraft: React.Dispatch<React.SetStateAction<KennisItem>>;
  errors: Record<string, string>;
}) {
  const u = (k: keyof Standaardtekst, v: any) =>
    setDraft((p) => ({ ...(p as Standaardtekst), [k]: v }));
  const woorden = countWords(draft.inhoud);
  return (
    <>
      <div>
        <Label className="mb-2 block">Lengte</Label>
        <RadioGroup
          value={draft.lengte}
          onValueChange={(v) => u("lengte", v as "kort" | "middel" | "uitgebreid")}
          className="flex gap-4"
        >
          {(["kort", "middel", "uitgebreid"] as const).map((l) => (
            <Label key={l} className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value={l} />
              <span className="text-sm capitalize">{l}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
      <FieldTextarea
        label="Inhoud"
        value={draft.inhoud}
        onChange={(v) => u("inhoud", v)}
        minHeight="300px"
        rows={10}
      />
      <p className="text-xs text-muted-foreground">{woorden} woorden</p>
    </>
  );
}

function DetailContent({ item }: { item: KennisItem }) {
  if (item.categorie === "referentie") {
    return (
      <div className="space-y-3">
        <Row label="Opdrachtgever" value={item.opdrachtgever} />
        <Row label="Sector" value={item.organisatieType} />
        {item.locatie && <Row label="Locatie" value={item.locatie} />}
        <Row
          label="Contractperiode"
          value={`${formatDateNL(item.contractVan)} – ${formatDateNL(item.contractTot)}`}
        />
        {item.oppervlakte && <Row label="Oppervlakte" value={item.oppervlakte} />}
        {item.diensten.length > 0 && <Row label="Diensten" value={item.diensten.join(", ")} />}
        {item.frequentie && <Row label="Frequentie" value={item.frequentie} />}
        {item.contractwaarde && <Row label="Contractwaarde" value={item.contractwaarde} />}
        {item.referent?.naam && (
          <Row
            label="Referent"
            value={`${item.referent.naam}${item.referent.functie ? ` (${item.referent.functie})` : ""}${item.referent.email ? ` · ${item.referent.email}` : ""}`}
          />
        )}
        <div className="bg-anjer-green/5 border border-anjer-green/20 rounded-lg p-4">
          <p className="text-xs uppercase text-muted-foreground mb-2">Resultaten</p>
          {item.kwaliteitsscore !== undefined && (
            <p className="text-3xl font-bold text-anjer-green mb-2">
              {item.kwaliteitsscore.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ 10</span>
            </p>
          )}
          <p className="text-foreground whitespace-pre-wrap">{item.resultaten}</p>
        </div>
      </div>
    );
  }
  if (item.categorie === "certificaat") {
    const days = getDaysUntilExpiry(item.geldigTot);
    const status = getExpiryStatus(item.geldigTot);
    const totaal = Math.max(
      1,
      Math.round(
        (new Date(item.geldigTot).getTime() - new Date(item.geldigVan).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const verstreken = Math.min(
      totaal,
      Math.max(
        0,
        Math.round((Date.now() - new Date(item.geldigVan).getTime()) / (1000 * 60 * 60 * 24))
      )
    );
    const pct = Math.round((verstreken / totaal) * 100);
    const balkKleur =
      status === "verlopen"
        ? "bg-anjer-red"
        : status === "binnenkort"
          ? "bg-anjer-amber"
          : "bg-anjer-green";
    return (
      <div className="space-y-3">
        <Row label="Uitgever" value={item.uitgever} />
        <Row
          label="Geldigheid"
          value={`${formatDateNL(item.geldigVan)} – ${formatDateNL(item.geldigTot)}`}
        />
        {item.registratienummer && (
          <Row label="Registratienummer" value={item.registratienummer} />
        )}
        {item.scope && <Row label="Scope" value={item.scope} />}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Tijdlijn</span>
            <span
              className={
                status === "verlopen"
                  ? "text-anjer-red font-medium"
                  : status === "binnenkort"
                    ? "text-anjer-amber font-medium"
                    : "text-muted-foreground"
              }
            >
              {days < 0 ? `${Math.abs(days)} dagen verlopen` : `nog ${days} dagen`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${balkKleur} transition-all`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }
  if (item.categorie === "methodiek") {
    return (
      <div className="space-y-3">
        {item.toepassingsgebied && (
          <Row label="Toepassingsgebied" value={item.toepassingsgebied} />
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Uitgebreide beschrijving</p>
          <p className="whitespace-pre-wrap text-foreground">{item.uitgebreideBeschrijving}</p>
        </div>
        {item.gerelateerdeKpis && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Gerelateerde KPI's</p>
            <p className="whitespace-pre-wrap text-foreground">{item.gerelateerdeKpis}</p>
          </div>
        )}
      </div>
    );
  }
  // standaardtekst
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Badge variant="outline">{item.lengte}</Badge>
        <span className="text-xs text-muted-foreground">{item.woordenAantal} woorden</span>
      </div>
      <div className="bg-secondary/50 rounded-lg p-4">
        <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">{item.inhoud}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <p className="text-xs text-muted-foreground col-span-1">{label}</p>
      <p className="col-span-2 text-foreground">{value}</p>
    </div>
  );
}
