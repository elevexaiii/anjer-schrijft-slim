import { useState, useEffect, useRef } from "react";
import { ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const vragen = [
  { nr: 1, titel: "Kwaliteitsplan", punten: 20, score: 85 },
  { nr: 2, titel: "Duurzaamheid", punten: 15, score: 82 },
  { nr: 3, titel: "Communicatie & Rapportage", punten: 15, score: 74 },
  { nr: 4, titel: "Sociaal beleid", punten: 10, score: 52 },
  { nr: 5, titel: "Innovatie", punten: 10, score: 65 },
];

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-primary";
  if (score >= 60) return "bg-anjer-amber";
  return "bg-anjer-red";
};

const antwoorden: Record<number, string> = {
  1: `Anjer Schoonmaak & Bedrijfsdiensten hanteert een uitgebreid kwaliteitsmanagementsysteem conform ISO 9001:2015. Ons kwaliteitsplan voor deze opdracht omvat dagelijkse kwaliteitscontroles door de objectleider, wekelijkse inspecties met een gestandaardiseerde checklist en maandelijkse audits door onze kwaliteitsmanager.\n\nWij werken met het DKS-systeem (Digitaal Kwaliteit Systeem) waarin alle controles, afwijkingen en verbeteracties worden geregistreerd. De opdrachtgever krijgt realtime toegang tot dit dashboard.\n\nBij de Gemeente Utrecht behaalden wij een gemiddelde kwaliteitsscore van 8,4 over de gehele contractperiode.`,
  2: `Duurzaamheid is een kernwaarde van Anjer. Wij werken uitsluitend met ecologisch verantwoorde schoonmaakmiddelen die voldoen aan het EU Ecolabel. Ons wagenpark wordt momenteel omgebouwd naar volledig elektrisch, met als doel 100% emissievrij transport in 2025.\n\nOnze medewerkers worden opgeleid in duurzaam schoonmaken, waarbij het gebruik van water en chemicaliën tot een minimum wordt beperkt. Wij hanteren het cradle-to-cradle principe bij de inkoop van materialen.`,
  3: `Anjer Schoonmaak & Bedrijfsdiensten hecht grote waarde aan transparante en proactieve communicatie. Voor deze opdracht stellen wij een vaste contactpersoon aan die als aanspreekpunt fungeert voor de Gemeente Amsterdam.\n\nWekelijkse voortgangsrapportages worden elke maandag vóór 09:00 uur per e-mail aangeleverd. Deze rapportages bevatten een overzicht van uitgevoerde werkzaamheden, eventuele bijzonderheden en actiepunten voor de komende week. Bij calamiteiten of afwijkingen garanderen wij een reactietijd van maximaal 2 uur.\n\nIn onze samenwerking met Gemeente Utrecht (2022–2024) hanteerden wij een vergelijkbare rapportagestructuur. Dit werd door de opdrachtgever beoordeeld met een 8,2 voor communicatie in de jaarlijkse evaluatie.\n\nOnze communicatieprocessen zijn geborgd conform ISO 9001:2015. Dit houdt in dat alle afspraken worden vastgelegd, gemonitord en periodiek geëvalueerd. Verbeterpunten worden direct verwerkt in ons kwaliteitsmanagementsysteem.\n\nKwartaalgesprekken met de contractbeheerder van de Gemeente Amsterdam zijn standaard onderdeel van onze werkwijze, zodat de samenwerking continu wordt geoptimaliseerd.`,
  4: `Anjer investeert actief in de ontwikkeling van haar medewerkers. Wij bieden vaste contracten, marktconforme salarissen en doorgroeimogelijkheden. Ons personeelsverloop ligt met 12% ruim onder het branchegemiddelde van 25%.\n\nWij participeren in het programma 'Schoon Werk' voor mensen met een afstand tot de arbeidsmarkt.`,
  5: `Anjer zet in op innovatie door middel van slimme technologieën. Wij implementeren IoT-sensoren voor het monitoren van bezettingsgraden en vervuiling, waardoor schoonmaak op basis van daadwerkelijk gebruik wordt gepland.\n\nDaarnaast experimenteren wij met robotisering voor routinematige vloerreinigingen in grote oppervlaktes.`,
};

const scoreDetails = [
  { label: "Aansluiting op criterium", score: 82 },
  { label: "Concreetheid & bewijs", score: 68 },
  { label: "Volledigheid", score: 71 },
  { label: "Taal & structuur", score: 79 },
];

const verbeterpunten = [
  "Voeg een specifiek resultaat toe: noem de behaalde score of besparing bij Gemeente Utrecht",
  "Concretiseer de rapportagefrequentie met dag en tijdstip, niet alleen 'wekelijks'",
];

const kennisitems = ["ISO 9001:2015", "Ref: Gemeente Utrecht 2022"];

const CircularGauge = ({ score }: { score: number }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      start = Math.round(progress * score);
      setAnimatedScore(start);
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

const Editor = () => {
  const [selectedVraag, setSelectedVraag] = useState(3);
  const [tekst, setTekst] = useState(antwoorden[3]);
  const [generating, setGenerating] = useState(false);

  const vraag = vragen.find((v) => v.nr === selectedVraag)!;

  const handleSelectVraag = (nr: number) => {
    setSelectedVraag(nr);
    setTekst(antwoorden[nr] || "");
  };

  const handleGenereren = () => {
    setGenerating(true);
    setTimeout(() => {
      setTekst(
        (prev) =>
          prev +
          "\n\nAanvullend: Naast bovengenoemde rapportages bieden wij een 24/7 digitaal meldportaal waar medewerkers van de Gemeente Amsterdam direct werkverzoeken kunnen indienen. Gemiddelde afhandeltijd: 4 uur."
      );
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-secondary/30">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-border bg-card flex items-center gap-2 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          Aanbestedingen
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground font-medium">Gemeente Amsterdam — Gemeentehuis</span>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT - Questions */}
        <div className="w-[22%] border-r border-border bg-card overflow-y-auto p-4">
          <h2 className="font-semibold text-foreground mb-1">Vragen</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Gemeente Amsterdam · 14 apr 2025 · 70 punten totaal
          </p>
          <div className="space-y-2">
            {vragen.map((v) => (
              <button
                key={v.nr}
                onClick={() => handleSelectVraag(v.nr)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedVraag === v.nr
                    ? "border-l-4 border-l-primary border-primary/30 bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {v.nr}. {v.titel}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${getScoreColor(v.score)}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{v.punten} punten</span>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER - Editor */}
        <div className="w-[52%] overflow-y-auto">
          <div className="p-6">
            {/* Question header */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 mb-5">
              <p className="text-xs text-muted-foreground mb-2">Vraag {vraag.nr} van {vragen.length}</p>
              <p className="text-foreground font-medium leading-relaxed">
                {vraag.nr === 3
                  ? "Beschrijf uw communicatie- en rapportagestructuur voor deze opdracht. Hoe waarborgt u tijdige en heldere communicatie met de opdrachtgever?"
                  : vraag.nr === 1
                  ? "Beschrijf uw kwaliteitsmanagementsysteem en hoe u de kwaliteit van de schoonmaakdiensten waarborgt."
                  : vraag.nr === 2
                  ? "Beschrijf hoe uw organisatie bijdraagt aan duurzaamheid en maatschappelijk verantwoord ondernemen."
                  : vraag.nr === 4
                  ? "Beschrijf uw sociaal beleid, waaronder personeelsontwikkeling en inclusiviteit."
                  : "Beschrijf welke innovaties u inzet om de dienstverlening te verbeteren."}
              </p>
              <span className="inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {vraag.punten} punten
              </span>
            </div>

            {/* Text editor */}
            <div className="border border-border rounded-xl bg-card">
              <textarea
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                className="w-full min-h-[400px] p-5 text-sm text-foreground leading-relaxed resize-none focus:outline-none rounded-xl bg-transparent"
              />
              <div className="border-t border-border px-5 py-2.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Versie 3 · Laatst opgeslagen om 14:23
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleGenereren}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {generating ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Concept genereren
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
                <CheckCircle2 className="h-4 w-4" />
                Verifiëren
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT - Score Panel */}
        <div className="w-[26%] border-l border-border bg-card overflow-y-auto p-5">
          <h3 className="font-semibold text-foreground mb-4">Kwaliteitsscore</h3>
          <CircularGauge score={vraag.score} />

          {/* Score dimensions */}
          <div className="mt-6 space-y-3">
            {scoreDetails.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium text-foreground">{d.score}/100</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      d.score >= 75 ? "bg-primary" : "bg-anjer-amber"
                    }`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Verbeterpunten */}
          <h4 className="font-semibold text-foreground mt-6 mb-3 text-sm">Verbeterpunten</h4>
          <div className="space-y-2">
            {verbeterpunten.map((tip, i) => (
              <div
                key={i}
                className="border-l-3 border-l-anjer-amber bg-anjer-amber/5 p-3 rounded-r-lg text-xs text-foreground leading-relaxed"
                style={{ borderLeftWidth: "3px" }}
              >
                {tip}
              </div>
            ))}
          </div>

          {/* Kennisitems */}
          <h4 className="font-semibold text-foreground mt-6 mb-3 text-sm">Gebruikte kennisitems</h4>
          <div className="flex flex-wrap gap-2">
            {kennisitems.map((item) => (
              <span
                key={item}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
