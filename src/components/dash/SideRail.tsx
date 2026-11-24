import { NavLink } from "react-router-dom";
import { ArrowUpRight, CreditCard, Home, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { LogoMark } from "../Logo";
import type { PlanInfo } from "../../lib/api";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/analyze", label: "Nouvelle analyse", icon: Sparkles },
  { to: "/pricing", label: "Forfaits", icon: CreditCard },
  { to: "/", label: "Site public", icon: Home },
];

export default function SideRail({
  plan,
  email,
  onSignOut,
}: {
  plan: PlanInfo | null;
  email: string;
  onSignOut: () => void;
}) {
  const used = plan?.analysesLast30d ?? 0;
  const limit = plan?.limits.analysesPer30d ?? null;
  const over = limit !== null && used > limit;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 100;
  const quotaLabel =
    limit === null
      ? "Analyses illimitées"
      : over
        ? `${used} analyses · quota ${limit}`
        : `${used} / ${limit} analyse${limit === 1 ? "" : "s"} ce mois`;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-ink/8 bg-card lg:flex">
      <div className="flex items-center gap-2.5 px-6 pb-2 pt-7">
        <LogoMark size={34} />
        <span className="font-display text-lg font-bold tracking-tight">
          Sen<span className="text-accent">Agro</span>
        </span>
      </div>

      <nav className="mt-6 flex flex-col gap-1 px-3" aria-label="Navigation du compte">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gold-400/15 text-ink shadow-[inset_0_0_0_1px_rgba(180,138,24,0.22)]"
                  : "text-ink/55 hover:bg-ink/[0.04] hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? "text-accent" : "text-ink/40 group-hover:text-accent"} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mt-6 rounded-3xl border border-ink/8 bg-card2 p-4">
        <div className="flex items-center justify-between">
          <p className="mono text-[9px] uppercase tracking-[0.18em] text-ink/40">Forfait</p>
          <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-accent">
            {plan?.limits.label ?? "Pousse"}
          </span>
        </div>

        <p className="font-display mt-2 text-sm font-semibold text-ink">
          {quotaLabel}
        </p>

        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full rounded-full transition-all duration-700 ${over || pct >= 100 ? "bg-rose-500" : "bg-gradient-to-r from-gold-300 to-gold-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <NavLink
          to="/pricing"
          className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-2 text-[11px] font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
        >
          {plan && plan.plan !== "free" ? "Gérer l'abonnement" : "Passer à Pro"} <ArrowUpRight size={12} />
        </NavLink>
      </div>

      <div className="mt-auto border-t border-ink/8 p-3">
        <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-xs font-bold text-ink">
            {email.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{email.split("@")[0]}</p>
            <p className="truncate text-[10px] text-ink/40">Forfait {plan?.limits.label ?? "Pousse"}</p>
          </div>
          <button
            onClick={onSignOut}
            aria-label="Se déconnecter"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/40 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
