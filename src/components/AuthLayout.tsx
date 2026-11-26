import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

/**
 * Coquille des pages d'authentification : grande carte blanche sur fond sable,
 * photo terrain à gauche, formulaire à droite. Même image que la page d'accueil.
 */
export default function AuthLayout({
  children,
  panel = "login",
}: {
  children: ReactNode;
  panel?: "login" | "signup";
}) {
  return (
    <div className="min-h-screen bg-[#EFEBE1] px-3 py-4 sm:px-6 sm:py-6 lg:py-9">
      <div className="mx-auto flex w-full max-w-[1120px] overflow-hidden rounded-[22px] bg-card shadow-[0_50px_110px_-70px_rgba(27,24,19,0.65)] ring-1 ring-ink/[0.05] lg:min-h-[calc(100vh-4.5rem)] lg:rounded-[28px]">
        {/* Panneau visuel */}
        <div className="relative hidden w-[47%] shrink-0 p-3.5 lg:block">
          <div className="relative h-full overflow-hidden rounded-[22px] bg-ink">
            <img
              src="/scenes/senegal-field.jpg"
              alt="Champ au Sénégal au lever du jour"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,19,14,0.35)_0%,rgba(21,19,14,0.55)_45%,rgba(21,19,14,0.95)_100%)]" />

            <div className="relative flex h-full flex-col justify-between p-8 xl:p-10">
              <Link to="/" className="inline-flex w-fit items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/10 ring-1 ring-white/15">
                  <svg viewBox="0 0 56 56" width="22" height="22" fill="none" aria-hidden>
                    <circle cx="32" cy="18" r="7.6" fill="#F5C544" />
                    <path d="M9 41q23-13 46 0" stroke="#FAF8F2" strokeWidth="4.6" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-display text-[17px] font-bold tracking-tight text-white">
                  Sen<span className="text-gold-300">Agro</span>
                </span>
              </Link>

              <div>
                <p className="mono text-[9px] uppercase tracking-[0.22em] text-white/60">
                  {panel === "login" ? "Intelligence agricole" : "Rejoindre SenAgro"}
                </p>
                <h2 className="font-display mt-3 text-[30px] font-bold leading-[1.12] text-white xl:text-[34px]">
                  La terre a des choses
                  <br />
                  <span className="text-gold-300">à vous dire.</span>
                </h2>
                <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-white/70">
                  SenAgro traduit le sol, le climat et la biologie en décisions — pour chaque hectare,
                  chaque saison.
                </p>

                <ul className="mt-7 grid grid-cols-3 gap-3 border-t border-white/15 pt-5 text-white/75">
                  {[
                    { k: "Sol", v: "pH, texture, eau" },
                    { k: "Score", v: "sur 100" },
                    { k: "Plan", v: "semis → récolte" },
                  ].map((item) => (
                    <li key={item.k}>
                      <p className="mono text-[8px] uppercase tracking-[0.18em] text-white/40">{item.k}</p>
                      <p className="mt-1 text-[11px] font-medium leading-snug">{item.v}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex w-full flex-col justify-center px-5 py-7 sm:px-10 sm:py-9 lg:w-[53%] lg:px-14">
          <div className="mx-auto w-full max-w-[392px]">
            <div className="mb-7 flex justify-center lg:hidden">
              <Logo size={32} />
            </div>
            {children}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[1120px] text-center text-[10px] text-ink/35">
        © {new Date().getFullYear()} SenAgro · Estimations indicatives, à valider avec votre technicien.
      </p>
    </div>
  );
}

/** En-tête centré du formulaire : logo (desktop), titre, sous-titre. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <div className="mb-6 hidden justify-center lg:flex">
        <Logo size={34} />
      </div>
      <h1 className="font-display text-[27px] font-bold leading-tight text-ink sm:text-[30px]">{title}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/50">{subtitle}</p>
    </div>
  );
}
