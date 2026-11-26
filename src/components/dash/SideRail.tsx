import { NavLink, Link } from "react-router-dom";
import { ArrowUpRight, CreditCard, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { LogoMark } from "../Logo";
import type { PlanInfo } from "../../lib/api";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/analyze", label: "Nouvelle analyse", icon: Sparkles },
  { to: "/pricing", label: "Forfaits", icon: CreditCard },
];

/** Rail de navigation : carte blanche flottante sur le fond sable. */
export default function SideRail({
  plan,
  email,
  name,
  onSignOut,
}: {
  plan: PlanInfo | null;
  email: string;
  name?: string;
  onSignOut: () => void;
}) {
  const used = plan?.analysesLast30d ?? 0;
  const limit = plan?.limits.analysesPer30d ?? null;
  const over = limit !== null && used > limit;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 100;
  const quota = limit === null ? "Analyses illimitées" : `${used} / ${limit} ce mois`;
  const initials = (name || email).trim().slice(0, 2).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] flex-col px-4 py-5 lg:flex">
      <div className="flex h-full flex-col overflow-hidden rounded-[26px] bg-card shadow-[0_24px_60px_-40px_rgba(27,24,19,0.45)] ring-1 ring-ink/[0.06]">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-5 pb-1 pt-5">
          <LogoMark size={36} />
          <span className="font-display text-[17px] font-bold tracking-tight">
            Sen<span className="text-accent">Agro</span>
          </span>
        </Link>

        <p className="mono px-5 pb-2 pt-6 text-[9px] uppercase tracking-[0.22em] text-ink/35">Menu</p>

        <nav className="flex flex-col gap-1 px-3" aria-label="Navigation du compte">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? "bg-ink text-white shadow-[0_10px_24px_-16px_rgba(27,24,19,0.9)]"
                    : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg ${
                      isActive ? "bg-white/10 text-gold-300" : "text-ink/40 group-hover:text-accent"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative mx-3 mb-3 mt-auto overflow-hidden rounded-2xl bg-[radial-gradient(120%_120%_at_20%_0%,#2C2A20_0%,#16140F_60%)] p-4 text-white">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold-400/20 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/45">Forfait</span>
            <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-[#241a05]">
              {plan?.limits.label ?? "Pousse"}
            </span>
          </div>
          <p className="font-display mt-2 text-[15px] font-bold leading-tight">
            {plan && plan.plan !== "free" ? "Votre exploitation suit son plan" : "Débloquez la saison entière"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-white/60">{quota}</p>

          {!(plan && plan.plan !== "free") && (
            <>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full ${over ? "bg-rose-400" : pct >= 100 ? "bg-gold-500" : "bg-gold-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <Link
                to="/pricing"
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gold-400 px-3 py-2 text-[11px] font-bold text-[#241a05] transition-transform hover:scale-[1.02]"
              >
                Passer à Pro · 9 000 F <ArrowUpRight size={12} />
              </Link>
            </>
          )}
        </div>

        <div className="p-3 pt-0">
          <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-gold-300">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{name || email.split("@")[0]}</p>
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
      </div>
    </aside>
  );
}
