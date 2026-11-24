import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 2.4, suffix: " M", label: "Hectares analysés", decimals: 1 },
  { value: 18, suffix: " %", label: "Hausse moyenne du rendement", decimals: 0 },
  { value: 3400, suffix: "", label: "Exploitations conseillées", decimals: 0 },
  { value: 32, suffix: " %", label: "Réduction de la consommation d'eau", decimals: 0 },
];

function Counter({ value, suffix, decimals }: { value: number; suffix: string; decimals: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState("0");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          const dur = 1800;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(2, -10 * p);
            const v = value * (p === 1 ? 1 : eased);
            setDisplay(v.toFixed(decimals));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, decimals, started]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-5xl font-bold text-ink sm:text-6xl">
        {display}<span className="text-accent">{suffix}</span>
      </div>
    </div>
  );
}

export default function SocialProof() {
  return (
    <section aria-label="Impact" className="relative border-y border-ink/10 bg-card2 py-20">
      {/* Trame de fond — champ de blé numérique */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 46px, rgba(245,197,68,0.5) 46px 47px, transparent 47px 92px), repeating-linear-gradient(0deg, transparent 0 90px, rgba(123,224,139,0.28) 90px 91px, transparent 91px 180px)",
        }}
      />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-5 sm:grid-cols-4 sm:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
            <p className="mono mt-3 text-[10px] uppercase tracking-[0.25em] text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
