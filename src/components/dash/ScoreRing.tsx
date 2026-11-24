/**
 * Radial score gauge — the "quality ring" that anchors the dashboard.
 * Pure SVG so it stays crisp at any size and needs no chart library.
 */
export default function ScoreRing({
  value,
  size = 168,
  thickness = 12,
  caption = "Qualité moyenne",
}: {
  value: number | null;
  size?: number;
  thickness?: number;
  caption?: string;
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const tone =
    value == null ? "Aucune donnée" : pct >= 80 ? "Excellent" : pct >= 60 ? "Bon potentiel" : "À retravailler";
  const toneColor = value == null ? "text-ink/45" : pct >= 80 ? "text-leaf" : pct >= 60 ? "text-accent" : "text-rose-600";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE08A" />
              <stop offset="55%" stopColor="#E5A834" />
              <stop offset="100%" stopColor="#7A5A08" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(27,24,19,0.07)" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ring-gold)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold leading-none text-ink">{value == null ? "—" : Math.round(pct)}</span>
          <span className="mono mt-1 text-[9px] uppercase tracking-[0.18em] text-ink/40">sur 100</span>
        </div>
      </div>
      <p className={`mt-4 text-sm font-semibold ${toneColor}`}>{tone}</p>
      <p className="mono mt-1 text-[9px] uppercase tracking-[0.18em] text-ink/35">{caption}</p>
    </div>
  );
}
