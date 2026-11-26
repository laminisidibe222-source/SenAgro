/**
 * SenAgro brand mark — a Sahel sun over two field furrows.
 * Ink tile, gold sun over a cream horizon: readable at 24 px, no illustration.
 */
export function LogoMark({ size = 36, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  const cream = tone === "light";
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[10px] ${
        cream ? "bg-page ring-1 ring-ink/10" : "bg-ink ring-1 ring-white/10"
      }`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 56 56" width={size} height={size} fill="none">
        <circle cx="32" cy="18" r="7.6" fill="#F5C544" />
        <path
          d="M9 41q23-13 46 0"
          stroke={cream ? "#1B1813" : "#FAF8F2"}
          strokeWidth="4.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Wordmark — "Sen" in ink, "Agro" in gold. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display font-bold tracking-tight" style={{ fontSize: Math.round(size * 0.62) }}>
        Sen<span className="text-accent">Agro</span>
      </span>
    </span>
  );
}
