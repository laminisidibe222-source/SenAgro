import { useState, useEffect } from "react";
import { Sprout, Leaf, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Parcel {
  id: string;
  name: string;
  ha: number;
  ph: number;
  health: number;         // 0–100
  crop: [string, string];
  yieldSeries: number[];
  sustainability: number;  // 0–100
  soil: string;
}

const PARCELS: Parcel[] = [
  { id: "A1", name: "Parcelle A1 · Crête Nord", ha: 42, ph: 6.2, health: 87, crop: ["Soja", "Arachide"], yieldSeries: [58, 62, 66, 71, 78, 84], sustainability: 82, soil: "Limon argileux" },
  { id: "B2", name: "Parcelle B2 · Méandre de la rivière", ha: 28, ph: 5.8, health: 74, crop: ["Maïs", "Sorgho"], yieldSeries: [52, 55, 59, 63, 70, 76], sustainability: 68, soil: "Limon alluvial" },
  { id: "C3", name: "Parcelle C3 · Ancienne terrasse", ha: 61, ph: 6.9, health: 91, crop: ["Blé", "Sorgho"], yieldSeries: [64, 68, 75, 79, 85, 92], sustainability: 90, soil: "Limon profond" },
  { id: "D4", name: "Parcelle D4 · Collines de sable", ha: 35, ph: 5.6, health: 58, crop: ["Millet perlé", "Arachide"], yieldSeries: [40, 43, 47, 51, 56, 62], sustainability: 74, soil: "Dune sableuse" },
  { id: "E5", name: "Parcelle E5 · Zones humides Est", ha: 24, ph: 6.4, health: 66, crop: ["Riz", "Maïs"], yieldSeries: [49, 54, 58, 64, 69, 73], sustainability: 61, soil: "Bas-fond argileux" },
  { id: "F6", name: "Parcelle F6 · Plateau sud", ha: 53, ph: 6.6, health: 83, crop: ["Arachide", "Blé"], yieldSeries: [60, 65, 70, 76, 82, 88], sustainability: 85, soil: "Latérite rouge" },
];

const CHART_W = 260, CHART_H = 90;
const chartPath = (series: number[]) => {
  const max = Math.max(...series), min = Math.min(...series);
  const span = Math.max(1, max - min);
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * (CHART_W - 12) + 6;
    const y = CHART_H - ((v - min) / span) * (CHART_H - 18) - 4;
    return [x, y] as const;
  });
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
};
const chartArea = (series: number[]) => `${chartPath(series)} L${CHART_W - 6},${CHART_H} L6,${CHART_H} Z`;

export default function LandIntel() {
  const [selected, setSelected] = useState<Parcel>(PARCELS[0]);
  const [animatedHealth, setAnimatedHealth] = useState(0);

  useEffect(() => {
    setAnimatedHealth(0);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedHealth(Math.round(selected.health * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [selected]);

  // Géométrie de la jauge radiale
  const R = 44, C = 2 * Math.PI * R;
  const gaugeOffset = C - (animatedHealth / 100) * C;

  return (
    <section id="land" className="relative overflow-hidden bg-page py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-gold-400/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-leaf/[0.04] blur-3xl" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mono mb-4 text-[10px] uppercase tracking-[0.3em] text-accent">Intelligence foncière · Delta Verde</p>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-5xl">
            Cliquez sur une parcelle. <span className="text-gradient-gold">Lisez son avenir.</span>
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* ── Carte topographique SVG ── */}
          <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-[#171b13]">
            <svg viewBox="0 0 560 480" className="h-full w-full" role="application" aria-label="Carte des parcelles du Delta Verde">
              <defs>
                <linearGradient id="terr" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1f2b18" />
                  <stop offset="55%" stopColor="#262a1a" />
                  <stop offset="100%" stopColor="#241f14" />
                </linearGradient>
                <radialGradient id="river" cx="38%" cy="55%" r="45%">
                  <stop offset="0%" stopColor="#1d3a4a" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#1d3a4a" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="560" height="480" fill="url(#terr)" />
              <rect width="560" height="480" fill="url(#river)" />
              {/* Courbes de niveau */}
              {[100, 160, 220, 280, 340, 400].map((y) => (
                <path key={y} d={`M0 ${y} Q 140 ${y - 34} 280 ${y} T 560 ${y - 16}`} stroke="#f5f0e6" strokeOpacity="0.07" strokeWidth="1.4" fill="none" strokeDasharray="6 9" />
              ))}
              {/* Rivière */}
              <path d="M40 -20 C 120 90, 80 210, 170 300 S 300 430, 380 500" stroke="#2e596e" strokeWidth="34" strokeLinecap="round" fill="none" strokeOpacity="0.75" />
              <path d="M40 -20 C 120 90, 80 210, 170 300 S 300 430, 380 500" stroke="#7ba9bd" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.5" strokeDasharray="4 14" />

              {/* Parcelles — polygones */}
              {[
                { id: "A1", pts: "120,60 260,45 300,150 160,175" },
                { id: "B2", pts: "290,55 430,70 415,180 315,165" },
                { id: "C3", pts: "80,190 235,180 255,330 95,330" },
                { id: "D4", pts: "255,190 400,200 380,340 265,330" },
                { id: "E5", pts: "110,345 265,345 285,455 95,455" },
                { id: "F6", pts: "285,350 420,355 445,450 305,455" },
              ].map((p) => {
                const active = selected.id === p.id;
                return (
                  <g key={p.id} onClick={() => setSelected(PARCELS.find((q) => q.id === p.id)!)} style={{ cursor: "pointer" }}>
                    <polygon
                      points={p.pts}
                      fill={active ? "rgba(245,197,68,0.32)" : "rgba(123,224,139,0.07)"}
                      stroke={active ? "#f5c544" : "#7be08b"}
                      strokeWidth={active ? 2.5 : 1.2}
                      strokeOpacity={active ? 1 : 0.55}
                      strokeDasharray={active ? "none" : "5 6"}
                      style={{ transition: "fill .35s ease, stroke .35s ease" }}
                    />
                    <text x={p.pts.split(" ")[0].split(",")[0] as unknown as number} y={0} style={{ display: "none" }} />
                  </g>
                );
              })}
              {/* Étiquettes de parcelles */}
              {[
                { id: "A1", x: 195, y: 115 }, { id: "B2", x: 360, y: 118 }, { id: "C3", x: 165, y: 258 },
                { id: "D4", x: 330, y: 265 }, { id: "E5", x: 190, y: 405 }, { id: "F6", x: 365, y: 405 },
              ].map((l) => (
                <text key={l.id} x={l.x} y={l.y} textAnchor="middle" fontSize="15" fontWeight="700"
                  fill={selected.id === l.id ? "#f5c544" : "#a8b8a0"} className="pointer-events-none"
                  fontFamily="'JetBrains Mono', monospace">
                  {l.id}
                </text>
              ))}
              {/* Nord + échelle */}
              <text x="520" y="46" textAnchor="middle" fill="#f5f0e6" opacity="0.6" fontSize="14" fontWeight="700">N ↑</text>
              <line x1="470" y1="62" x2="540" y2="62" stroke="#f5f0e6" strokeOpacity="0.6" strokeWidth="2" />
              <text x="505" y="78" textAnchor="middle" fill="#f5f0e6" opacity="0.5" fontSize="9" fontFamily="'JetBrains Mono'">1 KM</text>
            </svg>
            <div className="absolute bottom-3 left-4 mono text-[10px] uppercase tracking-widest text-ink/40">
              Delta Verde · 12 zones agro · En direct
            </div>
          </div>

          {/* ── Panneau de données flottant ── */}
          <div className="flex flex-col gap-4 rounded-3xl border border-ink/10 bg-card/95 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{selected.name}</h3>
                <p className="mono mt-1 text-[10px] uppercase tracking-widest text-ink/45">{selected.ha} ha · {selected.soil} · pH {selected.ph}</p>
              </div>
              <Link to="/analyze" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold-400/30 text-accent transition-all hover:scale-110" aria-label="Analyser cette parcelle">
                <ChevronRight size={20} />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* Jauge radiale — santé du sol */}
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={R} stroke="#2a2e21" strokeWidth="11" fill="none" />
                  <circle
                    cx="60" cy="60" r={R} stroke="#f5c544" strokeWidth="11" fill="none" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={gaugeOffset}
                    transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset .12s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-ink">{animatedHealth}</span>
                  <span className="mono text-[8px] uppercase tracking-widest text-accent">Santé</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mono text-[9px] uppercase tracking-widest text-ink/45">Recommandé</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.crop.map((c, i) => (
                    <span key={c} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${i === 0 ? "bg-gold-400 text-[#241a05]" : "border border-leaf/35 text-leaf"}`}>
                      <Sprout size={12} /> {c}
                    </span>
                  ))}
                </div>
                {/* Remplissage de la feuille — durabilité */}
                <div className="mt-3 flex items-center gap-2">
                  <Leaf size={15} className="text-leaf" fill="#7be08b" fillOpacity={selected.sustainability / 100} />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-leaf transition-all duration-700" style={{ width: `${selected.sustainability}%` }} />
                  </div>
                  <span className="mono text-[10px] text-ink/55">{selected.sustainability}%</span>
                </div>
              </div>
            </div>

            {/* Courbe de prévision de rendement */}
            <div className="mt-1 border-t border-ink/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="mono text-[9px] uppercase tracking-widest text-ink/45">Prévision de rendement · 6 saisons</p>
                <p className="mono text-[10px] font-semibold text-leaf">▲ en hausse</p>
              </div>
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="mt-2 w-full">
                <line x1="6" y1={CHART_H - 1} x2={CHART_W - 6} y2={CHART_H - 1} stroke="#3a3a30" strokeWidth="1" />
                <path d={chartArea(selected.yieldSeries)} fill="url(#goldFill)" opacity="0.5" />
                <path d={chartPath(selected.yieldSeries)} fill="none" stroke="#f5c544" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="600" strokeDashoffset="600" style={{ animation: "draw 1.1s ease forwards" }} />
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5c544" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#f5c544" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <style>{"@keyframes draw { to { stroke-dashoffset: 0; } }"}</style>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
