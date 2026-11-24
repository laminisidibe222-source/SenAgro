import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import SideRail from "./SideRail";
import { Logo } from "../Logo";
import type { PlanInfo } from "../../lib/api";

const MOBILE_LINKS = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/analyze", label: "Nouvelle analyse" },
  { to: "/pricing", label: "Forfaits" },
];

/** Coquille des pages du compte : rail de navigation + contenu. */
export default function AppShell({
  plan,
  email,
  onSignOut,
  children,
}: {
  plan: PlanInfo | null;
  email: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page text-ink">
      <SideRail plan={plan} email={email} onSignOut={onSignOut} />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/8 bg-card/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/dashboard" aria-label="Accueil du tableau de bord">
          <Logo size={30} />
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 text-ink"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[57px] z-40 border-b border-ink/10 bg-card p-3 shadow-lg lg:hidden">
          {MOBILE_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 hover:bg-ink/[0.04]"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={onSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      )}

      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-8 lg:pt-9">{children}</div>
      </main>
    </div>
  );
}
