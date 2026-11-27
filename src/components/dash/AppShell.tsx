import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { CreditCard, FolderOpen, LogOut, Menu, Plus, X } from "lucide-react";
import { Logo, LogoMark } from "../Logo";
import type { PlanInfo } from "../../lib/api";

const NAV = [
  { to: "/dashboard", label: "Dossiers", icon: FolderOpen },
  { to: "/analyze", label: "Nouvelle analyse", icon: Plus },
  { to: "/pricing", label: "Forfaits", icon: CreditCard },
];

/**
 * Account frame from the fitness-dashboard reference: one large light card on
 * the sand canvas, with a narrow icon rail on the left instead of a wide
 * sidebar. The rail keeps icons only; the drawer below `lg` spells the labels.
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

  const railItem = `grid h-11 w-11 place-items-center rounded-xl transition-colors`;

  return (
    <div className="min-h-screen bg-[#DCD4C4] text-ink">
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
            <div className="flex items-center justify-between">
              <Logo size={30} />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            <nav className="mt-7 flex flex-col gap-1" aria-label="Navigation du compte">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13.5px] font-semibold transition-colors ${
                      isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/[0.07] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={isActive ? "text-gold-300" : "text-white/40"} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 rounded-2xl bg-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/40">Forfait</span>
                <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-[#241a05]">
                  {plan?.limits.label ?? "Pousse"}
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-white/70">
                {limit === null ? "Analyses illimitées" : over ? `${used} analyses ce mois` : `${used} / ${limit} analyses ce mois`}
              </p>
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-gold-400 px-3 py-2 text-[11.5px] font-bold text-[#241a05]"
              >
                {plan && plan.plan !== "free" ? "Gérer l'abonnement" : "Passer Pro"}
              </Link>
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-2.5 border-t border-white/10 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-400 text-[11px] font-extrabold text-[#241a05]">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold">{name || email.split("@")[0]}</p>
                  <p className="truncate text-[10px] text-white/40">{email}</p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-rose-300 hover:bg-white/[0.07]"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:p-5">
        <div className="mx-auto flex w-full max-w-[1440px] bg-[#F8F5EC] lg:min-h-[calc(100vh-40px)] lg:rounded-[26px] lg:p-3 lg:shadow-[0_40px_100px_-70px_rgba(27,24,19,0.8)]">
          {/* icon rail */}
          <aside className="hidden w-[76px] shrink-0 flex-col items-center py-4 lg:flex">
            <Link to="/dashboard" aria-label="SenAgro" className="mb-7">
              <LogoMarkOnly />
            </Link>

            <nav className="flex flex-col items-center gap-2" aria-label="Navigation du compte">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  title={label}
                  className={({ isActive }) =>
                    `${railItem} ${
                      isActive ? "bg-gold-400 text-[#241a05]" : "bg-ink/[0.05] text-ink/45 hover:bg-ink/10 hover:text-ink"
                    }`
                  }
                >
                  <Icon size={18} />
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-3">
              <Link
                to="/pricing"
                aria-label="Forfait et limites"
                title="Forfait et limites"
                className={`${railItem} bg-ink/[0.05] text-ink/45 hover:bg-ink/10 hover:text-ink`}
              >
                <CreditCard size={17} />
              </Link>
              <button
                onClick={onSignOut}
                aria-label="Déconnexion"
                title="Déconnexion"
                className={`${railItem} bg-ink/[0.05] text-ink/45 hover:bg-rose-100 hover:text-rose-600`}
              >
                <LogOut size={17} />
              </button>
              <span
                className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[11px] font-extrabold text-gold-300 ring-2 ring-gold-400/50 ring-offset-2 ring-offset-[#F8F5EC]"
                title={name || email}
              >
                {initials}
              </span>
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-5 lg:pb-5 lg:pt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Rail-sized mark: the tile without the wordmark. */
function LogoMarkOnly() {
  return <LogoMark size={40} />;
}
