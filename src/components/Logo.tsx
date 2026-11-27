/**
 * SenAgro brand mark — a flat sun disc above three sharp field rows.
 * Everything is square-cornered and aligned to a grid: no tilt, no blur,
 * no gradients, so it stays crisp from 16 px (favicon) to 96 px.
 */
export function LogoMark({ size = 36, tone = "light" }: { size?: number; tone?: "dark" | "light" }) {
  const tile = tone === "dark" ? "#1B1813" : "#F5EEE0";
  const rows = tone === "dark" ? "#F5EEE0" : "#1B1813";
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(6, Math.round(size * 0.24)),
        background: tile,
        boxShadow: "inset 0 0 0 1px rgba(27,24,19,0.14)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 56 56" width={size} height={size} fill="none">
        <circle cx="28" cy="15" r="7.6" fill="#E5A834" />
        <g fill={rows}>
          <rect x="17" y="28" width="22" height="4.2" />
          <rect x="13" y="37" width="30" height="4.2" />
          <rect x="9" y="46" width="38" height="4.2" />
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
