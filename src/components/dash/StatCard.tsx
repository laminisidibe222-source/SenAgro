import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  delta,
  accent = "gold",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  delta?: number | null;
  accent?: "gold" | "leaf" | "ink";
}) {
  const chip =
    accent === "leaf"
      ? "bg-leaf/10 text-leaf"
      : accent === "ink"
        ? "bg-ink/[0.06] text-ink"
        : "bg-gold-400/15 text-accent";

  return (
    <div className="group rounded-3xl border border-ink/8 bg-card p-5 shadow-[0_1px_2px_rgba(27,24,19,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(27,24,19,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${chip}`}>
          <Icon size={18} />
        </span>
        {delta != null && Number.isFinite(delta) && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold ${
              delta >= 0 ? "bg-leaf/10 text-leaf" : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {delta >= 0 ? "+" : ""}
            {Math.round(delta)}
          </span>
        )}
      </div>
      <p className="mono mt-4 text-[9px] uppercase tracking-[0.18em] text-ink/40">{label}</p>
      <p className="font-display mt-1.5 flex items-baseline gap-1 text-3xl font-bold leading-none text-ink">
        {value}
        {suffix && <span className="text-sm font-semibold text-ink/40">{suffix}</span>}
      </p>
      {sub && <p className="mt-1.5 text-xs text-ink/45">{sub}</p>}
    </div>
  );
}
