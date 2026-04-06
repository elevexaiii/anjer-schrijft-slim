import { Clock, RotateCcw } from "lucide-react";
import type { VersieItem } from "@/lib/tenderData";

interface VersieHistorieProps {
  versies: VersieItem[];
  onRestore: (versie: VersieItem) => void;
  open: boolean;
  onToggle: () => void;
}

const VersieHistorie = ({ versies, onRestore, open, onToggle }: VersieHistorieProps) => {
  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="h-3.5 w-3.5" />
        {versies.length} versie{versies.length !== 1 ? "s" : ""}
      </button>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-card mt-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Versiegeschiedenis</span>
        </div>
        <button onClick={onToggle} className="text-xs text-muted-foreground hover:text-foreground">
          Sluiten
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-border">
        {versies.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">Nog geen eerdere versies.</p>
        ) : (
          versies.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">Versie {v.id}</p>
                <p className="text-xs text-muted-foreground">{v.datum} · Score: {v.score}/100</p>
              </div>
              <button
                onClick={() => onRestore(v)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Herstellen
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersieHistorie;
