import { useState, useEffect, useRef } from "react";

interface CircularGaugeProps {
  score: number;
}

const CircularGauge = ({ score }: CircularGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(Math.round(progress * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [score]);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = score >= 80 ? "hsl(120, 44%, 30%)" : score >= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="hsl(0,0%,92%)" strokeWidth="8" fill="none" />
        <circle
          cx="60" cy="60" r="54"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
        <text x="60" y="55" textAnchor="middle" className="text-3xl font-bold" fill="hsl(0,0%,17%)" fontSize="28" fontWeight="700">
          {animatedScore}
        </text>
        <text x="60" y="75" textAnchor="middle" fill="hsl(0,0%,55%)" fontSize="12">/ 100</text>
      </svg>
      <p className="text-xs text-muted-foreground mt-1">Doel: 80+</p>
    </div>
  );
};

export default CircularGauge;
