import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, AlertCircle, BadgeCheck, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { getPlanInfo, startCheckout, type PlanInfo } from "../lib/api";

const PLANS = [
  {
    id: "free",
    name: "Pousse",
    price: "0",
    unit: "à vie",
    desc: "Premiers pas dans l'agriculture de précision.",
    features: ["1 analyse / mois", "Recommandation culture + pH", "Plan de base sur 12 semaines"],
    cta: "Commencer gratuitement",
    popular: false,
    payable: false,
  },
  {
    id: "pro",
    name: "Professionnel",
    price: "9 000",
    unit: "XOF / mois",
    desc: "Pour les producteurs décidés à gagner.",
    features: ["Analyses illimitées de parcelles", "Plan de saison complet + liste d'intrants", "Ré-étalonnage hebdomadaire", "Support prioritaire d'un agronome"],
    cta: "Passer à Pro",
    popular: true,
    payable: true,
  },
  {
    id: "elite",
    name: "Domaine",
    price: "25 000",
    unit: "XOF / mois",
    desc: "Pour agro-entreprises et coopératives.",
    features: ["Tout le plan Pro", "Portefeuille multi-parcelles (20 lots)", "Survols NDVI satellite", "Audit sol trimestriel sur site", "Agronome dédié"],
    cta: "Passer à Domaine",
    popular: false,
    payable: true,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [confirming, setConfirming] = useState(params.get("checkout") === "success");

  const loadPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      return null;
    }
    const { data } = await getPlanInfo();
    setPlan(data);
    return data;
  }, [user]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  // Coming back from SasPay: the webhook may land a second or two later, so
  // poll briefly instead of showing a stale "free" card.
  useEffect(() => {
    if (!confirming || !user) return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const fresh = await loadPlan();
      if (fresh && fresh.plan !== "free") {
        setConfirming(false);
        setParams({}, { replace: true });
        clearInterval(timer);
      } else if (tries >= 8) {
        setConfirming(false);
        clearInterval(timer);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [confirming, user, loadPlan, setParams]);

  const buy = async (planId: "pro" | "elite") => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setLoading(planId);
    setError(null);
    const { url, error: err } = await startCheckout(planId);
    if (err || !url) {
      setError(err ?? "Paiement indisponible pour le moment.");
      setLoading(null);
      return;
    }
    window.location.href = url;
  };

  const currentPlan = plan?.plan;

  return (
    <div className="grain min-h-screen bg-page text-ink">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8">
        <p className="mono text-center text-[10px] uppercase tracking-[0.3em] text-accent">Tarifs</p>
        <h1 className="font-display mt-4 text-center text-4xl font-bold text-ink sm:text-6xl">De belles terres,<br /><span className="text-gradient-gold">une meilleure science.</span></h1>
        <p className="mx-auto mt-4 max-w-md text-center text-ink-soft">Payez avec SasPay — Wave, Orange Money ou carte bancaire. Forfait activé dès le paiement.</p>

        {plan && (
          <p className="mono mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-[10px] uppercase tracking-widest text-accent">
            <BadgeCheck size={13} />
            Forfait actuel : {plan.limits.label}
            {plan.currentPeriodEnd ? ` · jusqu'au ${new Date(plan.currentPeriodEnd).toLocaleDateString("fr-FR")}` : ""}
          </p>
        )}

        {confirming && (
          <div className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-2xl border border-gold-400/30 bg-gold-400/10 p-4 text-sm text-accent">
            <Loader2 size={17} className="mt-0.5 shrink-0 animate-spin" />
            Paiement reçu. SasPay confirme la transaction, votre forfait s'active dans quelques secondes…
          </div>
        )}

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.id;
            return (
              <div key={p.id} className={`relative flex flex-col rounded-3xl p-7 ${p.popular ? "border border-gold-400/60 bg-card shadow-[0_0_44px_rgba(245,197,68,0.22)]" : "glass"}`}>
                {p.popular && !isCurrent && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-4 py-1 text-xs font-bold text-[#241a05]">LE PLUS POPULAIRE</div>}
                {isCurrent && <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-leaf px-4 py-1 text-xs font-bold text-[#0d1a10]"><BadgeCheck size={13} /> VOTRE FORFAIT</div>}
                <h3 className="font-display text-xl font-semibold text-ink">{p.name}</h3>
                <p className="mt-1 min-h-[36px] text-sm text-ink-soft">{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-ink">{p.price}</span>
                  <span className="mono text-[10px] uppercase text-ink/45">{p.unit}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink/80"><Check size={15} className="mt-0.5 shrink-0 text-accent" />{f}</li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button disabled className="mt-7 flex w-full cursor-default items-center justify-center gap-2 rounded-full border border-leaf/40 bg-leaf/10 py-3.5 text-sm font-semibold text-leaf">
                    <BadgeCheck size={17} /> Forfait actif
                  </button>
                ) : p.payable ? (
                  <button
                    onClick={() => buy(p.id as "pro" | "elite")}
                    disabled={loading === p.id}
                    className={`mt-7 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all disabled:opacity-60 ${p.popular ? "bg-gold-400 text-[#241a05] hover:scale-[1.02]" : "border border-gold-400/40 bg-gold-400/10 text-accent hover:bg-gold-400/20"}`}
                  >
                    {loading === p.id ? <><Loader2 size={17} className="animate-spin" /> Ouverture de SasPay…</> : <>{p.cta} <ArrowRight size={15} /></>}
                  </button>
                ) : (
                  <button onClick={() => navigate("/analyze")} className="btn-ghost mt-7 justify-center !py-3 text-sm">{p.cta}</button>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mx-auto mt-8 flex max-w-md items-start gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{error}
          </div>
        )}
        <p className="mono mt-8 text-center text-[9px] uppercase tracking-widest text-ink/35">Sécurisé par SasPay · Wave · Orange Money · Carte</p>
      </main>
      <Footer />
    </div>
  );
}
