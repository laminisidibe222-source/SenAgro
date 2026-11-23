import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sprout, LogOut, Loader2, Lock, BadgeCheck, ArrowUpRight, Gauge } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getPlanInfo, type PlanInfo } from "../lib/api";

interface SavedAnalysis {
  id: string;
  parcel_name: string | null;
  ph: string | number | null;
  moisture_pct: number | null;
  hectares: string | number | null;
  soil_type: string | null;
  fit_score: number | null;
  recommendation: { crop?: string } | null;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[] | null>(null);
  const [fetching, setFetching] = useState(true);
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await apiFetch("/api/analyses", { method: "GET" });
      if (cancelled) return;
      if (!error && Array.isArray(data?.analyses)) setAnalyses(data.analyses);
      else setAnalyses([]);
      setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getPlanInfo().then(({ data }) => {
      if (!cancelled) setPlan(data);
    });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-screen bg-charcoal text-cream">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-cream/50 hover:text-gold-300">
          <ArrowLeft size={16} /> Retour
        </Link>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Mes <span className="text-gradient-gold">parcelles</span></h1>
            {user && <p className="mt-1 text-sm text-cream/50">{user.email}</p>}
          </div>
          {user && (
            <button onClick={() => { signOut(); navigate("/"); }} className="btn-ghost !px-4 !py-2 text-sm">
              <LogOut size={16} /> Déconnexion
            </button>
          )}
        </div>

        {user && plan && (
          <section className="glass mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-400/15 text-gold-300">
                <BadgeCheck size={20} />
              </span>
              <div>
                <p className="mono text-[9px] uppercase tracking-widest text-cream/45">Forfait actuel</p>
                <p className="font-display mt-1 text-xl font-semibold text-cream">
                  {plan.limits.label}
                  {plan.plan !== "free" && plan.currentPeriodEnd && (
                    <span className="ml-2 text-xs font-normal text-cream/50">
                      jusqu'au {new Date(plan.currentPeriodEnd).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-cream/55">
                  <Gauge size={13} className="text-gold-400" />
                  {plan.remaining === null
                    ? "Analyses illimitées"
                    : `${plan.remaining} analyse${plan.remaining === 1 ? "" : "s"} restante${plan.remaining === 1 ? "" : "s"} sur 30 jours`}
                  <span className="text-cream/30">·</span>
                  {plan.analysesLast30d} utilisée{plan.analysesLast30d === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Link to="/pricing" className="btn-ghost !px-4 !py-2 text-sm">
              {plan.plan === "free" ? "Passer à Pro" : "Changer de forfait"} <ArrowUpRight size={15} />
            </Link>
          </section>
        )}

        {!user ? (
          <div className="glass mt-8 rounded-3xl p-10 text-center">
            <Lock size={30} className="mx-auto text-gold-400" />
            <p className="mt-4 text-mute">Votre compte n'est pas encore connecté ou Neon n'est pas configuré.</p>
            <Link to="/login" className="btn-gold mt-6 inline-flex"><Sprout size={17} /> Se connecter</Link>
          </div>
        ) : fetching ? (
          <div className="mt-10 flex justify-center"><Loader2 size={26} className="animate-spin text-gold-400" /></div>
        ) : analyses && analyses.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {analyses.map((a) => (
              <div key={a.id} className="glass rounded-3xl p-5">
                <p className="mono text-[9px] uppercase tracking-widest text-gold-400">{new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                <h2 className="font-display mt-2 text-2xl font-bold text-cream">{a.recommendation?.crop ?? "Analyse"}</h2>
                <p className="mt-1 text-sm text-cream/60">
                  {a.parcel_name ?? "Parcelle"} · pH {a.ph ?? "—"} · {a.hectares ?? "—"} ha · score {a.fit_score ?? "—"}/100
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass mt-8 rounded-3xl p-10 text-center">
            <Sprout size={34} className="mx-auto text-gold-400" />
            <p className="mt-4 text-mute">Aucune analyse enregistrée pour l'instant. Lancez votre première analyse — moins d'une minute.</p>
            <Link to="/analyze" className="btn-gold mt-6 inline-flex"><Sprout size={17} /> Analysez mon terrain</Link>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-white/10 p-6 text-sm text-mute">
          <p className="mono text-[10px] uppercase tracking-widest text-cream/45">Comment ça marche</p>
          <p className="mt-2">Chaque analyse est enregistrée dans votre base Neon (table <code className="text-gold-300">analyses</code>), liée à votre compte (<code className="text-gold-300">users</code>). Les montées de forfait proviennent des webhooks SasPay vers <code className="text-gold-300">subscriptions</code>.</p>
        </div>
      </main>
    </div>
  );
}
