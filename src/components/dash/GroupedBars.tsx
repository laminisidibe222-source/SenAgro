import { shortDate, type SavedAnalysis } from "./types";

/**
 * Deux barres par analyse : compatibilité (or) et humidité déclarée (sauge).
 * Barres à sommet arrondi, grille pointillée — lisible même avec un seul point.
 */
export default function GroupedBars({ analyses }: { analyses: SavedAnalysis[] }) {
  const points = [...analyses]
    .slice(0, 7)
    .reverse()
    .map((a) => ({
      id: a.id,
      label: shortDate(a.created_at),
      score: typeof a.fit_score === "number" ? a.fit_score : 0,
      moisture: typeof a.moisture_pct === "number" ? a.moisture_pct : 0,
    }));

  const W = 640;
  const H = 240;
  const padT = 16;
  const padB = 34;
  const padL = 30;
  const innerW = W - padL - 8;
  const innerH = H - padB - padT;
  const step = innerW / Math.max(points.length, 1);
  const barW = Math.min(15, step * 0.22);
  const gap = Math.min(7, barW * 0.35);
  const y = (v: number) => padT + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full" role="img" aria-label="Compatibilité et humidité par analyse">
      <defs>
        <linearGradient id="g-score" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5C544" />
          <stop offset="100%" stopColor="#C88F1C" />
        </linearGradient>
        <linearGradient id="g-moist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFE0C6" />
          <stop offset="100%" stopColor="#9FBE97" />
        </linearGradient>
      </defs>

      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={W - 4}
            y1={y(t)}
            y2={y(t)}
            stroke="rgba(27,24,19,0.13)"
            strokeWidth={1}
            strokeDasharray="2 5"
          />
          <text x={0} y={y(t) + 3.5} fontSize={10} fill="rgba(27,24,19,0.42)" fontFamily="'JetBrains Mono', monospace">
            {t}
          </text>
        </g>
      ))}

      {points.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={12} fill="rgba(27,24,19,0.4)">
          Aucune analyse pour l'instant
        </text>
      )}

      {points.map((p, i) => {
        const cx = padL + step * i + step / 2;
        const xScore = cx - barW - gap / 2;
        const xMoist = cx + gap / 2;
        return (
          <g key={p.id}>
            <rect
              x={xScore}
              y={y(p.score)}
              width={barW}
              height={Math.max(6, y(0) - y(p.score))}
              rx={barW / 2}
              fill="url(#g-score)"
            />
            <rect
              x={xMoist}
              y={y(p.moisture)}
              width={barW}
              height={Math.max(6, y(0) - y(p.moisture))}
              rx={barW / 2}
              fill="url(#g-moist)"
            />
            <text
              x={cx}
              y={H - 12}
              textAnchor="middle"
              fontSize={10}
              fill="rgba(27,24,19,0.5)"
              fontFamily="'JetBrains Mono', monospace"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
