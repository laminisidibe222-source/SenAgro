import { useState } from "react";
import { X, Sprout, Droplets, Thermometer, Calendar } from "lucide-react";
import { CROPS, type Crop } from "../lib/crops";

export default function CropGallery() {
  const [active, setActive] = useState<Crop | null>(null);

  return (
    <section id="crops" className="relative overflow-hidden bg-page py-24 lg:py-28">
      <div className="mx-auto mb-12 flex max-w-7xl flex-wrap items-end justify-between gap-6 px-5 sm:px-8">
        <div>
          <p className="mono mb-4 text-[10px] uppercase tracking-[0.3em] text-accent">Moteur de culture</p>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-5xl">
            Chaque graine a<br />une <span className="text-gradient-gold">terre d'élection.</span>
          </h2>
        </div>
        <p className="max-w-xs text-sm text-ink-soft">Survolez pour inspecter. Touchez une fiche pour le profil agronomique complet.</p>
      </div>

      {/* Galerie défilante */}
      <div className="group relative" aria-label="Galerie de cultures">
        <div className="flex w-max animate-marquee gap-6 pr-6 group-hover:[animation-play-state:paused]">
          {[...CROPS, ...CROPS].map((crop, i) => (
            <button
              key={`${crop.id}-${i}`}
              onClick={() => setActive(crop)}
              className="group/card relative h-[420px] w-64 shrink-0 overflow-hidden rounded-3xl border border-ink/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              aria-label={`Voir l'analyse du ${crop.name}`}
            >
              <img
                src={crop.image}
                alt={crop.name}
                onError={(e) => { (e.target as HTMLImageElement).src = "/crops/soybean.jpg"; }}
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-[1.6s] ease-out group-hover/card:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <p className="mono text-[9px] uppercase tracking-widest text-gold-300">{crop.fr}</p>
                <h3 className="font-display mt-1 text-2xl font-bold text-white">{crop.name}</h3>
                <p className="mt-1 text-xs text-white/70">{crop.tagline}</p>
                <span className="mt-4 inline-flex w-fit translate-y-2 items-center gap-1.5 rounded-full border border-gold-400/50 bg-gold-400/15 px-4 py-1.5 text-[11px] font-bold text-gold-300 opacity-0 backdrop-blur-md transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                  Voir l'analyse →
                </span>
              </div>
            </button>
          ))}
        </div>
        {/* Fades latérales */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-page to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-page to-transparent" />
      </div>

      {/* Modale */}
      {active && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Analyse du ${active.name}`}>
          <button className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" onClick={() => setActive(null)} aria-label="Fermer" />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold-400/25 bg-card">
            <img src={active.image} alt={active.name} onError={(e) => { (e.target as HTMLImageElement).src = "/crops/soybean.jpg"; }} className="h-44 w-full object-cover" />
            <button onClick={() => setActive(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80" aria-label="Fermer">
              <X size={18} />
            </button>
            <div className="p-6">
              <h3 className="font-display text-2xl font-bold text-ink">{active.name}</h3>
              <p className="mono mt-0.5 text-[10px] uppercase tracking-widest text-accent">{active.best}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-3">
                  <Sprout size={16} className="mx-auto text-leaf" />
                  <div className="font-display mt-1 text-lg font-bold text-ink">{active.yieldIdx}</div>
                  <div className="mono text-[8px] uppercase tracking-widest text-ink/45">Indice de rend.</div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-3">
                  <Droplets size={16} className="mx-auto text-cyan-400" />
                  <div className="font-display mt-1 text-lg font-bold text-ink">{active.water}</div>
                  <div className="mono text-[8px] uppercase tracking-widest text-ink/45">Eau</div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-3">
                  <Thermometer size={16} className="mx-auto text-accent" />
                  <div className="font-display mt-1 text-lg font-bold text-ink">{active.soil[0]}–{active.soil[1]}</div>
                  <div className="mono text-[8px] uppercase tracking-widest text-ink/45">Plage pH</div>
                </div>
              </div>
              <p className="mono mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/45">
                <Calendar size={12} /> Saison · {active.season}
              </p>
              <a href="/analyze" className="btn-gold mt-5 w-full justify-center">Analyser mon terrain pour cette culture</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
