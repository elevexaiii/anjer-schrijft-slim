import { AlertTriangle } from "lucide-react";

interface WordCounterProps {
  tekst: string;
  maxWoorden: number;
}

const WordCounter = ({ tekst, maxWoorden }: WordCounterProps) => {
  const woorden = tekst.trim() ? tekst.trim().split(/\s+/).length : 0;
  const percentage = Math.min((woorden / maxWoorden) * 100, 100);
  const isOver = woorden > maxWoorden;
  const isWarning = woorden > maxWoorden * 0.85 && !isOver;

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOver ? "bg-anjer-red" : isWarning ? "bg-anjer-amber" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium flex items-center gap-1 ${
        isOver ? "text-anjer-red" : isWarning ? "text-anjer-amber" : "text-muted-foreground"
      }`}>
        {isOver && <AlertTriangle className="h-3 w-3" />}
        {woorden} / {maxWoorden} woorden
      </span>
    </div>
  );
};

export default WordCounter;
