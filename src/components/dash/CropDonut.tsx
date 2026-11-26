const COLORS = ["#F5C544", "#1B1813", "#9FBE97", "#C88F1C", "#D8CFBB", "#6B6353"];

/**
 * Anneau des cultures + légende chiffrée. Chaque part est proportionnelle au
 * nombre de parcelles ; la pastille reprend la compatibilité moyenne.
 */
export default function CropDonut({
  rows,
  size = 150,
}: {
  rows: { crop: string; count: number; score: number | null }[];
  size?: number;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const thickness = 22;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(27,24,19,0.07)" strokeWidth={thickness} />
          {rows.map((row, i) => {
            const len = total ? (row.count / total) * c : 0;
            const dash = Math.max(len - 3, 0);
            const el = (
              <circle
                key={row.crop}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                className="transition-[stroke-dasharray] duration-700"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold leading-none">{total}</span>
          <span className="mono mt-1 text-[8px] uppercase tracking-[0.16em] text-ink/40">parcelle{total > 1 ? "s" : ""}</span>
        </div>
      </div>

      <ul className="w-full space-y-2">
        {rows.slice(0, 5).map((row, i) => (
          <li key={row.crop} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate font-medium text-ink/75">{row.crop}</span>
            <span className="mono text-[10px] text-ink/40">{row.count}×</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                (row.score ?? 0) >= 80
                  ? "bg-leaf/10 text-leaf"
                  : (row.score ?? 0) >= 60
                    ? "bg-gold-400/20 text-accent"
                    : "bg-ink/[0.06] text-ink/55"
              }`}
            >
              {row.score == null ? "—" : Math.round(row.score)}
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-xs text-ink/40">Aucune culture suivie.</li>}
      </ul>
    </div>
  );
}
