import type { LucideIcon } from "lucide-react";

/**
 * Carte d'indicateur — soit la carte sombre mise en avant, soit une carte
 * blanche. Toutes portent la pastille de contexte et le motif pointillé.
 */
export default function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  badge,
  tone = "light",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  badge?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ring-1 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5 ${
        dark
          ? "bg-[linear-gradient(135deg,#1B1813_0%,#2A2418_55%,#3B3113_100%)] text-white ring-white/10 shadow-[0_22px_44px_-30px_rgba(27,24,19,0.9)]"
          : "bg-card text-ink ring-ink/[0.07] shadow-[0_14px_30px_-28px_rgba(27,24,19,0.5)]"
      }`}
    >
      <svg
        className={`pointer-events-none absolute -right-4 -top-6 h-28 w-28 ${dark ? "opacity-[0.14]" : "opacity-[0.07]"}`}
        aria-hidden
      >
        <defs>
          <pattern id={`dots-${tone}-${label.replace(/\W/g, "")}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1.1" fill={dark ? "#F5C544" : "#1B1813"} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${tone}-${label.replace(/\W/g, "")})`} />
      </svg>

      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            dark ? "bg-white/10 text-gold-300" : "bg-gold-400/15 text-accent"
          }`}
        >
          <Icon size={16} />
        </span>
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              dark ? "bg-gold-400 text-[#241a05]" : "bg-leaf/10 text-leaf"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <p className={`mono relative mt-3.5 text-[9px] uppercase tracking-[0.18em] ${dark ? "text-white/50" : "text-ink/50"}`}>
        {label}
      </p>
      <p className="font-display relative mt-1 flex items-baseline gap-1 text-[26px] font-bold leading-none">
        {value}
        {suffix && <span className={`text-xs font-semibold ${dark ? "text-white/45" : "text-ink/40"}`}>{suffix}</span>}
      </p>
      {sub && <p className={`relative mt-1.5 text-[11px] ${dark ? "text-white/50" : "text-ink/45"}`}>{sub}</p>}
    </div>
  );
}
