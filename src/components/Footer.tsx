import { ArrowUp } from "lucide-react";
import { Logo } from "./Logo";

export default function Footer() {
  const cols = [
    { title: "Produit", links: ["Intelligence foncière", "Moteur de culture", "Tarifs", "Analysez mon terrain"] },
    { title: "Entreprise", links: ["À propos", "Notes de terrain", "Partenaires", "Contact"] },
    { title: "Légal", links: ["Politique de confidentialité", "Conditions d'utilisation", "Éthique des données", "Sécurité"] },
  ];
  return (
    <footer className="relative border-t border-ink/10 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo size={34} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              L'intelligence agricole à partir de votre sol, de votre eau et de votre objectif — sachez quoi planter et où le planter.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/35">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-ink/60 transition-colors hover:text-accent">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-between gap-4 border-t border-ink/5 pt-6 text-xs text-ink/35">
          <div>
            <p>© {new Date().getFullYear()} SenAgro. Cultivé avec des données.</p>
            <p className="mt-1.5">
              Photos :{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Champ_d%27arachide_en_Casamance.JPG" target="_blank" rel="noreferrer" className="underline decoration-ink/20 underline-offset-2 hover:text-accent">
                Ajocom (CC BY-SA 4.0)
              </a>
              {" · "}
              <a href="https://commons.wikimedia.org/wiki/File:Bermo_commune_02.jpg" target="_blank" rel="noreferrer" className="underline decoration-ink/20 underline-offset-2 hover:text-accent">
                Ibrahimassoumane (CC0)
              </a>
              {" · "}Wikimedia Commons
            </p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Haut de page"
            className="group grid h-12 w-12 place-items-center rounded-full border border-gold-400/30 bg-gold-400/10 text-accent transition-all duration-300 hover:scale-110 hover:shadow-[0_0_26px_rgba(245,197,68,0.4)]"
          >
            <ArrowUp size={20} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
