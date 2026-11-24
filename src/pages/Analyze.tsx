import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, ArrowLeft, ArrowRight, CheckCircle2, MapPin, FlaskConical, Droplets, Target, Lock } from "lucide-react";
import Navbar from "../components/Navbar";
import { CROPS } from "../lib/crops";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

const SOILS = [
  { id: "loam", label: "Limon profond", note: "Équilibré, drainé, riche" },
  { id: "clay", label: "Argile / Latérite", note: "Lourd, fertile, retient l'eau" },
  { id: "sandy", label: "Sableux", note: "Léger, sec, peu fertile" },
  { id: "silt", label: "Limon alluvial", note: "Dépôt fluvial, très fertile" },
];
const GOALS = [
  { id: "max_yield", label: "Rendement maximal", icon: Target },
  { id: "cash", label: "Meilleur prix / ha", icon: CoinsIconFallback },
  { id: "sustainability", label: "Santé du sol d'abord", icon: Sprout },
];
// Icône locale pour éviter une dépendance supplémentaire
function CoinsIconFallback({ size = 18, className = "" }: { size?: number; className?: string }) {
  return <span className={className} style={{ fontSize: size }}>💰</span>;
}

interface Recommendation {
  crop: string;
  reason: string;
  score: number;
  water: string;
  pH: string;
  plan: string[];
}

function decide(ph: number, soil: string, goal: string): Recommendation {
  const soilBonus = soil === "silt" ? 12 : soil === "loam" ? 10 : soil === "clay" ? 6 : 0;
  const ranked = CROPS.map((c) => {
    const [lo, hi] = c.soil;
    const phScore = ph >= lo && ph <= hi ? 40 : Math.max(0, 40 - Math.abs(ph - (lo + hi) / 2) * 9);
    let goalBonus = 0;
    if (goal === "max_yield") goalBonus = c.yieldIdx / 10;
    if (goal === "cash") goalBonus = c.id === "peanut" || c.id === "corn" ? 9 : c.id === "soybean" ? 7 : 2;
    if (goal === "sustainability") goalBonus = c.id === "soybean" || c.id === "millet" ? 9 : 3;
    return { c, total: phScore + soilBonus + goalBonus };
  }).sort((a, b) => b.total - a.total);

  const best = ranked[0];
  return {
    crop: best.c.name,
    reason: `${best.c.tagline}. ${best.c.best}`,
    score: Math.min(98, Math.round(best.total)),
    water: best.c.water,
    pH: `${best.c.soil[0]}–${best.c.soil[1]}`,
    plan: [
      `Semaines 1–2 · Préparation : labour profond + chaulage au pH ${((best.c.soil[0] + best.c.soil[1]) / 2).toFixed(1)}`,
      `Semaine 3 · Semis de ${best.c.name} avec inoculant, lignes à 75 cm`,
      `Semaines 5–6 · Premier désherbage + apport d'engrais NPK fractionné`,
      `Semaines 10–12 · Contrôle du stress hydrique — irriguer sous 35 %`,
      `Récolte · À maturité physiologique ; restituer les résidus au sol`,
    ],
  };
}

export default function Analyze() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ph, setPh] = useState("6.2");
  const [moisture, setMoisture] = useState("41");
  const [ha, setHa] = useState("10");
  const [soil, setSoil] = useState("loam");
  const [goal, setGoal] = useState("max_yield");
  const [result, setResult] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const run = () => {
    setLoading(true);
    setSavedNote(null);
    setQuotaError(null);
    setTimeout(() => {
      const rec = decide(parseFloat(ph) || 6.2, soil, goal);
      setResult(rec);
      setLoading(false);
      try {
        localStorage.setItem("senagro_last", JSON.stringify({ rec, ph, moisture, ha, soil, goal, at: Date.now() }));
      } catch { /* mode privé */ }
      // Persistance Neon si connecté (silencieuse sinon)
      if (user) {
        apiFetch("/api/analyses", {
          method: "POST",
          body: {
            parcel_name: `Parcelle ${ha} ha`,
            ph: parseFloat(ph) || 6.2,
            moisture: parseFloat(moisture) || 41,
            hectares: parseFloat(ha) || 10,
            soil_type: soil,
            goal,
            recommendation: rec,
            fit_score: rec.score,
          },
        }).then(({ error }) => {
          if (!error) {
            setSavedNote("enregistrée dans votre compte");
            return;
          }
          if (error.status === 402) setQuotaError(error.message);
          else console.warn("Sauvegarde Neon échouée:", error.message);
        });
      }
    }, 900);
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-accent">
          <ArrowLeft size={16} /> Retour
        </Link>
        <h1 className="font-display mt-6 text-4xl font-bold text-ink">Analyse de <span className="text-gradient-gold">terrain</span></h1>
        <p className="mt-2 max-w-lg text-ink-soft">Entrez les données de votre parcelle — SenAgro renvoie la culture optimale, le raisonnement, et un plan de culture sur 12 semaines.</p>

        {!result ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Gauche : entrées */}
            <div className="glass rounded-3xl p-6">
              <p className="mono flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent"><FlaskConical size={13} /> Échantillon de sol</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "pH", value: ph, set: setPh, step: "0.1", icon: FlaskConical },
                  { label: "Humidité %", value: moisture, set: setMoisture, step: "1", icon: Droplets },
                  { label: "Hectares", value: ha, set: setHa, step: "1", icon: MapPin },
                ].map((f) => (
                  <label key={f.label} className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-3">
                    <span className="mono flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-ink/50"><f.icon size={11} /> {f.label}</span>
                    <input type="number" step={f.step} value={f.value} onChange={(e) => f.set(e.target.value)} className="mono mt-1 w-full bg-transparent text-xl font-semibold text-ink outline-none" />
                  </label>
                ))}
              </div>

              <p className="mono mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent"><MapPin size={13} /> Type de sol</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SOILS.map((s) => (
                  <button key={s.id} onClick={() => setSoil(s.id)}
                    className={`rounded-2xl border p-3 text-left transition-all ${soil === s.id ? "border-gold-400/60 bg-gold-400/10" : "border-ink/10 hover:border-gold-400/30"}`}>
                    <div className="text-sm font-semibold text-ink">{s.label}</div>
                    <div className="text-[10px] text-ink/50">{s.note}</div>
                  </button>
                ))}
              </div>

              <p className="mono mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent"><Target size={13} /> Objectif</p>
              <div className="mt-2 flex gap-2">
                {GOALS.map((g) => (
                  <button key={g.id} onClick={() => setGoal(g.id)}
                    className={`flex-1 rounded-2xl border p-3 text-center transition-all ${goal === g.id ? "border-gold-400/60 bg-gold-400/10" : "border-ink/10"}`}>
                    <g.icon size={16} className="mx-auto text-accent" />
                    <div className="mt-1 text-[10px] font-semibold leading-tight text-ink/80">{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Droite : synthèse + CTA */}
            <div className="flex flex-col justify-between gap-6">
              <div className="glass-gold rounded-3xl p-6">
                <p className="mono text-[10px] uppercase tracking-widest text-accent">Pourquoi SenAgro</p>
                <ul className="mt-4 space-y-3 text-sm text-ink/85">
                  {[
                    "Sol + climat + biologie dans un seul modèle",
                    "Localisé pour les zones agro d'Afrique de l'Ouest",
                    "+18 % de rendement moyen sur les parcelles ré-analysées",
                    "Rafraîchi chaque saison — gratuitement",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />{t}</li>
                  ))}
                </ul>
              </div>
              <button onClick={run} disabled={loading} className="btn-gold justify-center !py-4 text-lg disabled:opacity-60">
                {loading ? "Analyse du profil de sol…" : (<><Sprout size={20} /> Générer la recommandation <ArrowRight size={18} /></>)}
              </button>
              <p className="mono text-center text-[9px] uppercase tracking-widest text-ink/35">Gratuit · Sans carte bancaire</p>
            </div>
          </div>
        ) : (
          /* ── Résultat ── */
          <div className="mt-10 overflow-hidden rounded-3xl border border-gold-400/30 bg-card">
            <div className="border-b border-ink/10 bg-gradient-to-r from-gold-400/15 via-gold-400/5 to-transparent p-6">
              <p className="mono text-[10px] uppercase tracking-[0.3em] text-accent">Recommandation SenAgro</p>
              <div className="mt-2 flex items-end justify-between gap-6">
                <h2 className="font-display text-5xl font-bold text-ink">{result.crop}</h2>
                <div className="text-right">
                  <div className="font-display text-4xl font-bold text-accent">{result.score}<span className="text-lg text-ink/50">/100</span></div>
                  <p className="mono text-[9px] uppercase tracking-widest text-ink/45">Score d'adéquation</p>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-sm text-ink/70">{result.reason}</p>
              {savedNote && (
                <p className="mono mt-2 text-[9px] uppercase tracking-widest text-leaf">✓ {savedNote}</p>
              )}
              {quotaError && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-gold-400/30 bg-gold-400/10 p-3 text-xs text-accent">
                  <Lock size={14} className="shrink-0 text-accent" />
                  <span className="flex-1">{quotaError}</span>
                  <Link to="/pricing" className="mono shrink-0 rounded-full bg-gold-400 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#241a05]">
                    Voir les forfaits
                  </Link>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/60">
                <span className="mono rounded-full border border-ink/10 px-3 py-1.5">Eau · {result.water}</span>
                <span className="mono rounded-full border border-ink/10 px-3 py-1.5">pH optimal · {result.pH}</span>
                <span className="mono rounded-full border border-ink/10 px-3 py-1.5">{ha} ha</span>
              </div>
            </div>
            <div className="p-6">
              <p className="mono text-[10px] uppercase tracking-widest text-ink/45">Plan de culture sur 12 semaines</p>
              <ol className="mt-3 space-y-2.5">
                {result.plan.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink/80">
                    <span className="mono mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gold-400/40 text-[10px] font-bold text-accent">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setResult(null)} className="btn-ghost !px-5 !py-2.5 text-sm">Ré-analyser</button>
                <button onClick={() => navigate("/pricing")} className="btn-gold !px-5 !py-2.5 text-sm">Débloquer le plan de saison complet <ArrowRight size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
