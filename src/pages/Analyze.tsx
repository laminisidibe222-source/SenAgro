import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, ArrowLeft, ArrowRight, CheckCircle2, Coins, MapPin, FlaskConical, Droplets, Target, Lock } from "lucide-react";
import AppShell from "../components/dash/AppShell";
import { recommend } from "../lib/recommend";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getPlanInfo, type PlanInfo } from "../lib/api";

const SOILS = [
  { id: "loam", label: "Limon profond", note: "Équilibré, drainé, riche" },
  { id: "clay", label: "Argile / Latérite", note: "Lourd, fertile, retient l'eau" },
  { id: "sandy", label: "Sableux", note: "Léger, sec, peu fertile" },
  { id: "silt", label: "Limon alluvial", note: "Dépôt fluvial, très fertile" },
];
const GOALS = [
  { id: "max_yield", label: "Rendement maximal", icon: Target },
  { id: "cash", label: "Meilleur prix / ha", icon: Coins },
  { id: "sustainability", label: "Santé du sol d'abord", icon: Sprout },
];
interface Recommendation {
  crop: string;
  reason: string;
  score: number;
  water: string;
  pH: string;
  plan: string[];
}

export default function Analyze() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [ph, setPh] = useState("6.2");
  const [moisture, setMoisture] = useState("41");
  const [ha, setHa] = useState("10");
  const [soil, setSoil] = useState("loam");
  const [goal, setGoal] = useState("max_yield");
  const [result, setResult] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getPlanInfo().then(({ data, error }) => {
      if (alive && !error) setPlan(data);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  const run = () => {
    setLoading(true);
    setSavedNote(null);
    setQuotaError(null);
    setTimeout(() => {
      const rec = recommend(parseFloat(ph) || 6.2, parseFloat(moisture) || 41, soil as 'loam' | 'clay' | 'sandy' | 'silt', goal);
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
    <AppShell
      plan={plan}
      email={user?.email ?? ""}
      name={user?.name}
      onSignOut={() => {
        signOut();
        navigate("/");
      }}
    >
      <main className="pb-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[12px] text-ink/50 hover:text-accent">
          <ArrowLeft size={15} /> Retour au tableau de bord
        </Link>
        <h1 className="font-display mt-4 text-[26px] font-bold text-ink sm:text-[30px]">Analyse de <span className="text-gradient-gold">terrain</span></h1>
        <p className="mt-2 max-w-lg text-[13px] text-ink-soft">Entrez les données de votre parcelle — SenAgro renvoie la culture optimale, le raisonnement, et un plan de culture sur 12 semaines.</p>

        {!result ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Gauche : entrées */}
            <div className="rounded-2xl bg-card p-5 ring-1 ring-ink/[0.07]">
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
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-card2 p-5 ring-1 ring-ink/[0.06]">
                <p className="mono text-[10px] uppercase tracking-widest text-accent">Pourquoi SenAgro</p>
                <ul className="mt-4 space-y-3 text-sm text-ink/85">
                  {[
                    "Sol, humidité et objectif dans un seul calcul",
                    "Calibré pour 20 cultures d'Afrique de l'Ouest",
                    "Un score sur 100, expliqué facteur par facteur",
                    "Dossiers conservés pour comparer vos parcelles",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />{t}</li>
                  ))}
                </ul>
              </div>
              <button onClick={run} disabled={loading} className="btn-gold w-full justify-center !bg-gold-400 !bg-none !py-3.5 !text-[13.5px] hover:!translate-y-0 hover:!scale-100 disabled:opacity-60">
                {loading ? "Analyse du profil de sol…" : (<><Sprout size={20} /> Générer la recommandation <ArrowRight size={18} /></>)}
              </button>
              <p className="mono text-center text-[9px] uppercase tracking-widest text-ink/35">Gratuit · Sans carte bancaire</p>
            </div>
          </div>
        ) : (
          /* ── Résultat ── */
          <div className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-gold-400/30">
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
    </AppShell>
  );
}
