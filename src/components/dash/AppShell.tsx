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
 * Account frame from the bills-dashboard reference: a large light card on the
 * sand canvas, with the ink sidebar floating inside it (gap on every side) and
 * the content column beside it. Below `lg` the same panel slides in from the
 * left, with the trigger on that same side.
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
              `flex min-h-10 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/[0.07] hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-gold-300" : "text-white/40"} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative mt-6 overflow-hidden rounded-2xl bg-white/[0.08] p-4">
        <svg className="pointer-events-none absolute right-2 top-2 opacity-25" width="52" height="52" aria-hidden>
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 5 }).map((__, c) => (
              <circle key={`${r}-${c}`} cx={r * 11 + 4} cy={c * 11 + 4} r="1.2" fill="#F5C544" />
            )),
          )}
        </svg>
        <p className="relative text-[12px] font-bold leading-snug text-white">
          {plan && plan.plan !== "free" ? "Votre exploitation suit son plan." : "Débloquez la saison entière."}
        </p>
        <p className="relative mt-1 text-[10.5px] text-white/50">
          {limit === null ? "Analyses illimitées" : over ? `${used} analyses ce mois` : `${used} / ${limit} analyses ce mois`}
        </p>
        <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full ${over ? "bg-rose-400" : pct >= 100 ? "bg-gold-500" : "bg-gold-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <Link
          to={plan && plan.plan !== "free" ? "/pricing" : "/pricing"}
          onClick={onClose}
          className="relative mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-card px-3 py-2 text-[11px] font-bold text-accent hover:bg-gold-300"
        >
          {plan && plan.plan !== "free" ? "Gérer l'abonnement" : "Passer Pro"}
          <ArrowUpRight size={11} />
        </Link>
      </div>

      <button
        onClick={onSignOut}
        className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        <LogOut size={16} className="text-white/40" />
        Déconnexion
      </button>

      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-400 text-[11px] font-extrabold text-[#241a05]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-white">{name || email.split("@")[0]}</p>
            <p className="truncate text-[10px] text-white/40">{email}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#EDE8DC] text-ink">
      {/* mobile bar */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-ink/8 bg-[#F8F5EC]/95 px-3 py-2.5 backdrop-blur-md lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white"
        >
          <Menu size={18} />
        </button>
        <Link to="/dashboard" aria-label="SenAgro — accueil">
          <Logo size={28} />
        </Link>
        <Link to="/analyze" className="btn-gold ml-auto !bg-gold-400 !bg-none !px-3 !py-2 !text-[11px] !text-[#241a05]">
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
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-[300px] flex-col bg-ink p-5 text-white shadow-2xl">
            {panel(() => setOpen(false))}
          </div>
        </div>
      )}

      <div className="lg:p-5">
        <div className="mx-auto flex w-full max-w-[1440px] bg-[#F8F5EC] lg:min-h-[calc(100vh-40px)] lg:rounded-[26px] lg:p-3 lg:shadow-[0_40px_100px_-70px_rgba(27,24,19,0.75)]">
          <aside className="hidden w-[236px] shrink-0 lg:block">
            <div className="sticky top-3 flex h-[calc(100vh-64px)] flex-col rounded-[20px] bg-ink px-4 py-5 text-white">
              {panel()}
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-5 lg:pb-5 lg:pt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
