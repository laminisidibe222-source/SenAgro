import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import SideRail from "./SideRail";
import { Logo } from "../Logo";
import type { PlanInfo } from "../../lib/api";

const MOBILE_LINKS = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/analyze", label: "Nouvelle analyse" },
  { to: "/pricing", label: "Forfaits" },
];

/** Coquille du compte : rail flottant + zone de travail sur fond sable. */
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#EDE8DC] text-ink">
      <SideRail plan={plan} email={email} name={name} onSignOut={onSignOut} />

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink/8 bg-card/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/dashboard" aria-label="Accueil du tableau de bord">
          <Logo size={30} />
        </Link>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white"
        >
          <Menu size={18} />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo size={30} />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink"
              >
                <X size={17} />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {MOBILE_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3.5 py-3 text-sm font-medium ${
                      isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/[0.04]"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto space-y-3">
              <div className="rounded-2xl bg-card2 p-3">
                <p className="mono text-[9px] uppercase tracking-[0.18em] text-ink/40">Forfait</p>
                <p className="mt-1 text-sm font-semibold text-ink">{plan?.limits.label ?? "Pousse"}</p>
                <p className="text-[11px] text-ink/50">
                  {plan?.remaining == null ? "Analyses illimitées" : `${plan.remaining} analyse restante`}
                </p>
                <Link
                  to="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="btn-gold mt-2 w-full justify-center !py-2 text-xs"
                >
                  Passer à Pro
                </Link>
              </div>
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-[268px]">
        <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-7">{children}</div>
      </div>
    </div>
  );
}
