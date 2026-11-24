import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Intelligence foncière", href: "#land" },
    { label: "Cultures", href: "#crops" },
    { label: "Tarifs", href: "/pricing" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Navigation principale"
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 sm:px-8 ${
          scrolled ? "mt-3 rounded-2xl border border-ink/10 bg-white/85 py-3 backdrop-blur-2xl" : "py-5"
        }`}
      >
        <Link to="/" className="group flex items-center gap-2.5" aria-label="SenAgro — accueil">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-[#2a1f05] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            <Sprout size={22} strokeWidth={2.2} />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-ink">
            Sen<span className="text-accent">Agro</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
            l.href.startsWith("/") ? (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-ink/60 transition-colors hover:text-accent">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm font-medium text-ink/60 transition-colors hover:text-accent">
                {l.label}
              </a>
            )
          )}
        </div>

        <div className="hidden md:flex md:items-center md:gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 text-sm text-ink/80 hover:border-gold-400/40">
                <User size={15} /> Mon compte
              </Link>
              <button onClick={() => { signOut(); navigate("/"); }} className="flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 text-sm text-ink/80 hover:border-red-400/40 hover:text-red-300" aria-label="Se déconnecter">
                <LogOut size={15} /> Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm font-medium text-ink/80 hover:text-accent">
              Se connecter
            </Link>
          )}
          <Link to="/analyze" className="rounded-full bg-gold-400 px-6 py-2.5 text-sm font-semibold text-[#241a05] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_34px_rgba(245,197,68,0.45)]">
            Analysez mon terrain
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 text-ink md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="mx-4 mt-2 rounded-2xl border border-ink/10 bg-white/95 p-5 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) =>
              l.href.startsWith("/") ? (
                <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium text-ink/80 hover:bg-white/5">
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium text-ink/80 hover:bg-white/5">
                  {l.label}
                </a>
              )
            )}
          </div>
          <div className="mt-3 border-t border-ink/10 pt-3">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-base font-medium text-ink/85 hover:bg-white/5">
                  Mon compte
                </Link>
                <button onClick={() => { signOut(); setOpen(false); navigate("/"); }} className="block w-full rounded-xl px-4 py-3 text-left text-base font-medium text-red-300 hover:bg-white/5">
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-base font-medium text-ink/85 hover:bg-white/5">
                Se connecter
              </Link>
            )}
          </div>
          <Link to="/analyze" onClick={() => setOpen(false)} className="btn-gold mt-3 w-full justify-center">
            <Sprout size={18} /> Analysez mon terrain
          </Link>
        </div>
      )}
    </header>
  );
}
