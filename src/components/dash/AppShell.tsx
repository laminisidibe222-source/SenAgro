import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, CreditCard, FolderOpen, LogOut, Menu, Plus, X } from "lucide-react";
import { Logo } from "../Logo";
import type { PlanInfo } from "../../lib/api";

const NAV = [
  { to: "/dashboard", label: "Dossiers", icon: FolderOpen },
  { to: "/analyze", label: "Nouvelle analyse", icon: Plus },
  { to: "/pricing", label: "Forfaits", icon: CreditCard },
];

/**
 * Account frame from the order-dashboard reference: one floating white card
 * with an ink sidebar, a header strip inside the content and a light canvas.
 * Below `lg` the sidebar slides in from the left, with the trigger on that side.
 */
export default function AppShell({
  plan,
  email,
  name,
  onSignOut,
  children,
}: {
  plan: PlanInfo | null;
  email: string;
  name?: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = (name || email).trim().slice(0, 2).toUpperCase();
  const used = plan?.analysesLast30d ?? 0;
  const limit = plan?.limits.analysesPer30d ?? null;
  const over = limit !== null && used > limit;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 100;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const panel = (onClose?: () => void) => (
    <>
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="SenAgro">
          <Logo size={32} />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Navigation du compte">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `relative flex min-h-10 items-center gap-3 rounded-full py-2.5 pl-4 pr-3 text-[13px] font-semibold transition-colors ${
                isActive ? "bg-card text-ink shadow-[0_10px_26px_-18px_rgba(0,0,0,0.65)]" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-accent" : "text-white/45"} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-white/[0.06] p-3.5">
        <div className="flex items-center justify-between">
          <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/40">Forfait</span>
          <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-[#241a05]">
            {plan?.limits.label ?? "Pousse"}
          </span>
        </div>
        <p className="mt-1.5 text-[11.5px] font-semibold text-white/80">
          {limit === null
            ? "Analyses illimitées"
            : over
              ? `${used} analyses ce mois · quota ${limit}`
              : `${used} / ${limit} analyse${limit === 1 ? "" : "s"} ce mois`}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full ${over ? "bg-rose-400" : pct >= 100 ? "bg-gold-500" : "bg-gold-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!(plan && plan.plan !== "free") && (
          <Link
            to="/pricing"
            onClick={onClose}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-full bg-gold-400 px-3 py-1.5 text-[11px] font-bold text-[#241a05] hover:bg-gold-300"
          >
            Passer à Pro <ArrowUpRight size={11} />
          </Link>
        )}
      </div>

      <button
        onClick={onSignOut}
        className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-full py-2.5 pl-4 pr-3 text-left text-[13px] font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut size={16} className="text-white/45" />
        Déconnexion
      </button>

      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-400 text-[11px] font-extrabold text-[#241a05]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-white">{name || email.split("@")[0]}</p>
            <p className="truncate text-[10px] text-white/40">Forfait {plan?.limits.label ?? "Pousse"}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#EDE8DC] text-ink">
      {/* mobile bar */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-ink/8 bg-card/95 px-3 py-2.5 backdrop-blur-md lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-white"
        >
          <Menu size={18} />
        </button>
        <Link to="/dashboard" aria-label="SenAgro — accueil">
          <Logo size={28} />
        </Link>
        <Link to="/analyze" className="btn-gold ml-auto !px-3 !py-2 !bg-gold-400 !bg-none !text-[11px] !text-[#241a05]">
          <Plus size={13} /> Analyser
        </Link>
      </header>

      {/* drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[292px] flex-col bg-ink p-5 text-white shadow-2xl">
            {panel(() => setOpen(false))}
          </div>
        </div>
      )}

      <div className="lg:p-4">
        <div className="mx-auto flex w-full max-w-[1440px] overflow-hidden bg-card lg:min-h-[calc(100vh-32px)] lg:rounded-[24px] lg:shadow-[0_40px_100px_-70px_rgba(27,24,19,0.7)]">
          <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[228px] shrink-0 flex-col bg-ink px-5 py-6 text-white lg:flex">
            {panel()}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="px-4 pb-10 pt-5 sm:px-7 sm:pt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
