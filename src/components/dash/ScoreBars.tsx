import { shortDate, type SavedAnalysis } from "./types";

/**
 * Score history as bars, with the 80/100 "bonne parcelle" target drawn as a
 * dashed line. Bars keep working with a single analysis, unlike a line chart.
 */
export default function ScoreBars({ analyses }: { analyses: SavedAnalysis[] }) {
  const points = [...analyses]
    .slice(0, 8)
    .reverse()
    .map((a) => ({ date: a.created_at, score: a.fit_score ?? 0, crop: a.recommendation?.crop ?? "—", id: a.id }));

  if (points.length === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/12 text-center">
        <p className="text-sm text-ink/50">Le graphique se remplit dès votre première analyse.</p>
        <p className="mono mt-2 text-[9px] uppercase tracking-[0.2em] text-ink/30">Aucune donnée pour l'instant</p>
      </div>
    );
  }

  const W = 560;
  const H = 220;
  const padL = 34;
  const padB = 40;
  const padT = 18;
  const innerW = W - padL - 10;
  const innerH = H - padB - padT;
  const step = innerW / points.length;
  const barW = Math.min(46, step * 0.5);
  const y = (score: number) => padT + innerH - (Math.max(0, Math.min(100, score)) / 100) * innerH;
  const targetY = y(80);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[220px] w-full" role="img" aria-label="Score de compatibilité par analyse">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1={padL} x2={W - 6} y1={y(tick)} y2={y(tick)} stroke="rgba(27,24,19,0.07)" strokeWidth={1} />
          <text x={2} y={y(tick) + 3.5} fontSize={11.5} fill="rgba(27,24,19,0.5)" fontFamily="'JetBrains Mono', monospace">
            {tick}
          </text>
        </g>
      ))}

      <line
        x1={padL}
        x2={W - 92}
        y1={targetY}
        y2={targetY}
        stroke="#7A5A08"
        strokeWidth={1}
        strokeDasharray="5 5"
        strokeOpacity={0.5}
      />
      <text x={W - 4} y={targetY - 6} textAnchor="end" fontSize={10.5} fontWeight={700} fill="#8A6A0A" fontFamily="'JetBrains Mono', monospace">
        CIBLE 80
      </text>

      {points.map((p, i) => {
        const cx = padL + step * i + step / 2;
        const top = y(p.score);
        const height = padT + innerH - top;
        return (
          <g key={p.id}>
            <rect x={cx - barW / 2} y={top} width={barW} height={Math.max(6, height)} rx={barW / 2} fill="url(#bar-gold)">
              <title>{`${p.crop} · ${Math.round(p.score)}/100`}</title>
            </rect>
            <text
              x={cx}
              y={top - 6}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill="#1B1813"
              fontFamily="'JetBrains Mono', monospace"
            >
              {Math.round(p.score)}
            </text>
            <text
              x={cx}
              y={H - 12}
              textAnchor="middle"
              fontSize={11.5}
              fill="rgba(27,24,19,0.55)"
              fontFamily="'JetBrains Mono', monospace"
            >
              {shortDate(p.date)}
            </text>
          </g>
        );
      })}

      <defs>
        <linearGradient id="bar-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD466" />
          <stop offset="60%" stopColor="#E5A834" />
          <stop offset="100%" stopColor="#B5891F" />
        </linearGradient>
      </defs>
    </svg>
  );
}
