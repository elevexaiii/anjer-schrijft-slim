import { useState, useMemo } from "react";
import { Search, Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type KennisItem,
  type Categorie,
  type Referentie,
  type Certificaat,
  loadKennisbank,
  buildInsertText,
} from "@/lib/kennisbank";

const CAT_LABELS: Record<Categorie | "alle", string> = {
  alle: "Alle",
  referentie: "Referenties",
  certificaat: "Certificaten",
  methodiek: "Methodieken",
  standaardtekst: "Standaardteksten",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (item: KennisItem) => void;
  ingevoegdeIds: string[];
}

export default function KennisbankSheet({ open, onOpenChange, onInsert, ingevoegdeIds }: Props) {
  const [zoek, setZoek] = useState("");
  const [cat, setCat] = useState<Categorie | "alle">("alle");
  const items = useMemo(() => loadKennisbank().filter((i) => i.status === "actief"), [open]);

  const gefilterd = useMemo(() => {
    let list = items.slice();
    if (cat !== "alle") list = list.filter((i) => i.categorie === cat);
    if (zoek.trim()) {
      const q = zoek.toLowerCase();
      list = list.filter((i) => {
        const haystack = [
          i.titel,
          i.beschrijving,
          i.tags.join(" "),
          (i as Referentie).opdrachtgever ?? "",
          (i as Certificaat).uitgever ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [items, cat, zoek]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-anjer-green" />
            Kennisbank doorzoeken
          </SheetTitle>
          <SheetDescription>
            Zoek items en voeg ze direct in je antwoord in.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CAT_LABELS) as (Categorie | "alle")[]).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  cat === c
                    ? "bg-anjer-green text-white border-anjer-green"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {gefilterd.length} {gefilterd.length === 1 ? "item" : "items"}
          </p>

          <div className="space-y-2">
            {gefilterd.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Geen resultaten</p>
            )}
            {gefilterd.map((item) => {
              const isIngevoegd = ingevoegdeIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {item.titel}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {CAT_LABELS[item.categorie]}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {item.beschrijving}
                  </p>
                  <Button
                    size="sm"
                    variant={isIngevoegd ? "outline" : "default"}
                    className={
                      isIngevoegd
                        ? "w-full text-xs"
                        : "w-full text-xs bg-anjer-green hover:bg-anjer-green/90 text-white"
                    }
                    onClick={() => {
                      onInsert(item);
                      toast.success(`"${item.titel}" toegevoegd aan antwoord`);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {isIngevoegd ? "Opnieuw invoegen" : "Invoegen in antwoord"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
