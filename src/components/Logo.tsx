/**
 * SenAgro brand mark — a gold sun above three tapered field rows.
 * Cream tile, ink arcs, one flat circle: legible at 24 px.
 */
export function LogoMark({ size = 36, tone = "light" }: { size?: number; tone?: "dark" | "light" }) {
  const tile = tone === "dark" ? "bg-[#EFE5CE]" : "bg-[#EFE5CE]";
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[10px] ring-1 ring-ink/15 ${tile}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 56 56" width={size} height={size} fill="none">
        <circle cx="32" cy="18" r="8" fill="#E5A834" />
        <g stroke="#1B1813" strokeLinecap="round" fill="none">
          <path d="M8.5 35.5q23.5-12 47 0" strokeWidth="5" />
          <path d="M16 43.5q16-7.5 32 0" strokeWidth="4.2" opacity="0.85" />
        </g>
      </svg>
    </span>
  );
}

/** Wordmark — "Sen" in ink, "Agro" in gold, tight display tracking. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        className="font-display font-bold leading-none tracking-[-0.02em]"
        style={{ fontSize: Math.round(size * 0.62) }}
      >
        Sen<span className="text-accent">Agro</span>
      </span>
    </span>
  );
}
