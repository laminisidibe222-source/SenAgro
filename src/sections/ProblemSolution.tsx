import { useRef, useState, useEffect } from "react";
import { Leaf } from "lucide-react";

/**
 * Problème → Solution : une section épinglée où l'image "avant" (champ sec)
 * est effacée par un clip-path animé au fil du défilement (piste 220vh).
 */
export default function ProblemSolution() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      setProgress(Math.min(1, Math.max(0, -rect.top / total)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wipe = progress * 100;
  const reveal = Math.max(0, (progress - 0.35) / 0.65);

  return (
    <section ref={trackRef} className="relative h-[220vh] bg-[#100f0c]" aria-label="Avant et après">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* AVANT — champ sec et souffrant */}
        <div
          className="absolute inset-0 bg-[#1a150f]"
          style={{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595825965241-0b475c0d9e08?w=1600&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute bottom-24 left-5 max-w-md sm:left-16">
            <p className="mono text-[10px] uppercase tracking-[0.3em] text-red-400">Sans SenAgro</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-cream/85 sm:text-5xl">
              Des saisons à l'aveugle,<br />des récoltes perdues.
            </h2>
            <p className="mt-3 text-sm text-cream/55">
              Mauvaise culture, mauvais sol, mauvaise semaine — argent brûlé et terre morte.
            </p>
          </div>
        </div>

        {/* APRÈS — champ vibrant et données surimposées */}
        <div className="absolute inset-0 bg-[#141a10]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1600&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/35 to-transparent" />
          {/* Lignes topographiques lumineuses */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M -40 ${560 + i * 60} C 300 ${500 + i * 55}, 500 ${650 - i * 30}, 800 ${520 + i * 70} S 1300 ${600 + i * 40}, 1500 ${480 + i * 65}`}
                stroke="#F5C544"
                strokeOpacity={0.28 + i * 0.1}
                strokeWidth={1.5 + i * 0.5}
                fill="none"
                strokeDasharray="10 8"
              />
            ))}
          </svg>
          <div
            className="absolute right-5 top-28 max-w-md text-right sm:right-16"
            style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 40}px)` }}
          >
            <p className="mono text-[10px] uppercase tracking-[0.3em] text-gold-400">Avec SenAgro</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-cream sm:text-5xl">
              La terre vous envoie<br />des signaux.<br /><span className="text-gradient-gold">SenAgro vous donne la traduction.</span>
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-400/35 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-300">
              <Leaf size={14} /> +18 % de rendement moyen · −32 % de gaspillage d'eau
            </div>
          </div>
        </div>

        {/* Ligne de balayage */}
        <div
          className="absolute inset-y-0 z-10 w-[3px] bg-gradient-to-b from-transparent via-gold-400 to-transparent shadow-[0_0_25px_rgba(245,197,68,0.8)]"
          style={{ left: `calc(${wipe}% - 1.5px)` }}
        />

        {/* Indice de défilement */}
        {progress < 0.08 && (
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <div className="mono animate-float-slow text-[10px] uppercase tracking-[0.3em] text-cream/50">Faites défiler pour révéler →</div>
          </div>
        )}
      </div>
    </section>
  );
}
