import { useRef, useState } from "react";
import { ArrowRight, Sprout } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTASection() {
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - (r.left + r.width / 2)) / r.width) * 18,
      y: ((e.clientY - (r.top + r.height / 2)) / r.height) * 14,
    });
  };

  return (
    <section aria-label="Appel à l'action" className="relative overflow-hidden">
      {/* Dégradé heure dorée */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_50%_115%,rgba(245,197,68,0.35),transparent_60%),radial-gradient(ellipse_60%_70%_at_50%_-20%,rgba(229,168,52,0.22),transparent_60%),linear-gradient(180deg,#14120e_0%,#241a0c_55%,#14120e_100%)]" />
      {/* Plante stylisée lumineuse */}
      <div className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 opacity-90" aria-hidden>
        <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
          <circle cx="130" cy="130" r="118" stroke="#F5C544" strokeOpacity="0.14" strokeDasharray="6 10" strokeWidth="2" />
          <circle cx="130" cy="130" r="86" stroke="#F5C544" strokeOpacity="0.22" strokeWidth="1.4" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 130 130)`}>
              <path d="M130 130 C 124 96, 124 66, 130 34 C 136 66, 136 96, 130 130 Z" fill="#F5C544" fillOpacity="0.32" stroke="#F5C544" strokeOpacity="0.6" strokeWidth="1.2" />
            </g>
          ))}
          <circle cx="130" cy="130" r="16" fill="#F5C544" />
          <circle cx="130" cy="130" r="7" fill="#241a05" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-3xl px-5 pb-36 pt-40 text-center sm:px-8">
        <h2 className="font-display text-4xl font-bold tracking-tight text-cream sm:text-6xl">
          Votre terrain essaie<br />de vous <span className="text-gradient-gold">dire quelque chose.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-mute">
          Neuf parcelles. Quatorze profils de sol. Une réponse — en moins de deux minutes.
        </p>
        <div
          ref={btnRef}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setPos({ x: 0, y: 0 })}
          className="mt-10 inline-block"
        >
          <Link
            to="/analyze"
            className="btn-gold !px-9 !py-4 text-lg"
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform .18s cubic-bezier(.2,1.4,.3,1)" }}
          >
            <Sprout size={22} /> Analysez mon terrain <ArrowRight size={20} />
          </Link>
        </div>
        <p className="mono mt-6 text-[10px] uppercase tracking-[0.25em] text-cream/40">Première analyse gratuite · Sans carte bancaire</p>
      </div>
    </section>
  );
}
