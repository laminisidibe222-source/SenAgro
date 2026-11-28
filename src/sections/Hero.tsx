import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import SoilCore from "../three/SoilCore";

export default function Hero() {
  const [ph, setPh] = useState(6.2);
  const [moisture, setMoisture] = useState(41);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const id = setInterval(() => {
      setPh(() => +(6.1 + Math.random() * 0.25).toFixed(1));
      setMoisture(() => Math.round(37 + Math.random() * 9));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {/* 3D canvas background */}
      <div className="absolute inset-0">{reduced ? <StaticCore /> : <SoilCore />}</div>
      {/* Legibility gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(250,248,242,0.92)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-page via-page/70 to-transparent sm:w-2/3" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pb-16 pt-28 sm:px-8">
        <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-400" />
          Intelligence agricole
        </p>

        <h1 className="font-display text-[clamp(2.5rem,8vw,5.6rem)] font-bold leading-[0.96] tracking-tight">
          <span className="block text-ink">Arrêtez de deviner.</span>
          <span className="text-gradient-gold block">Commencez à croître.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
          SenAgro analyse <span className="text-ink">votre sol et votre eau</span> pour vous dire
          exactement quoi planter — et où le planter.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link to="/analyze" className="btn-gold">
            Analysez mon terrain <ArrowRight size={18} />
          </Link>
          <a href="#land" className="btn-ghost">
            <Play size={16} className="text-accent" /> Voir le moteur
          </a>
        </div>

        <p className="mono mt-6 text-[10px] uppercase tracking-[0.25em] text-ink/60">
          20 cultures · pH, humidité, sol, objectif · chaque score est expliqué
        </p>
      </div>

      {/* Floating live recommendation card */}
      <div className="absolute bottom-8 right-4 z-10 hidden sm:block">
        <div className="glass animate-float-slow w-72 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            <span className="mono text-[10px] uppercase tracking-widest text-accent">Exemple de lecture</span>
            <span className="mono h-2 w-2 rounded-full bg-leaf animate-pulse-soft" />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink/55">pH du sol</span><span className="mono text-ink">{ph.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-ink/55">Humidité</span><span className="mono text-ink">{moisture}%</span></div>
            <div className="flex justify-between"><span className="text-ink/55">Matière organique</span><span className="mono text-ink">3,1 %</span></div>
          </div>
          <div className="mt-3 rounded-xl border border-gold-400/25 bg-gold-400/10 px-3 py-2">
            <div className="mono text-[9px] uppercase tracking-widest text-accent">Culture optimale</div>
            <div className="font-display text-lg font-bold text-ink">Soja <span className="text-accent">→</span></div>
          </div>
          <p className="mono mt-2 text-[8px] uppercase tracking-widest text-ink/40">Illustration · vos chiffres dès la 1re analyse</p>
        </div>
      </div>
    </section>
  );
}

function StaticCore() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-64 w-64 rounded-full border border-gold-400/30 bg-[radial-gradient(circle_at_40%_35%,rgba(245,197,68,0.25),transparent_70%)]">
        <div className="absolute inset-8 rounded-full border border-leaf/25 animate-leaf-sway" />
        <div className="absolute inset-20 rounded-full border-2 border-gold-400/60 animate-leaf-sway" />
      </div>
    </div>
  );
}
