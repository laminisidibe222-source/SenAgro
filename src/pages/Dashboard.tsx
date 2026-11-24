import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  CreditCard,
  FlaskConical,
  Gauge,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Sprout,
  X,
} from "lucide-react";
import SideRail from "../components/dash/SideRail";
import StatCard from "../components/dash/StatCard";
import ScoreRing from "../components/dash/ScoreRing";
import ScoreBars from "../components/dash/ScoreBars";
import { Logo } from "../components/Logo";
import { GOAL_LABELS, SOIL_LABELS, num, shortDate, type SavedAnalysis } from "../components/dash/types";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getPlanInfo, type PlanInfo } from "../lib/api";

const MOBILE_LINKS = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/analyze", label: "Nouvelle analyse" },
  { to: "/pricing", label: "Forfaits" },
  { to: "/", label: "Site public" },
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[] | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [fetching, setFetching] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    setFailed(null);
    (async () => {
      const [list, quota] = await Promise.all([
        apiFetch("/api/analyses", { method: "GET" }),
        getPlanInfo(),
      ]);
      if (cancelled) return;
      if (list.error) setFailed(list.error.message);
      else setAnalyses(Array.isArray(list.data?.analyses) ? (list.data.analyses as SavedAnalysis[]) : []);
      if (!quota.error) setPlan(quota.data);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const rows = analyses ?? [];
  const stats = useMemo(() => {
    const hectares = rows.reduce((sum, a) => sum + num(a.hectares), 0);
    const scores = rows.map((a) => a.fit_score).filter((n): n is number => typeof n === "number");
    const avg = scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : null;
    const delta = scores.length > 1 ? scores[0] - scores[1] : null;
    const crops = new Map<string, number>();
    for (const a of rows) {
      const crop = a.recommendation?.crop;
      if (crop) crops.set(crop, (crops.get(crop) ?? 0) + 1);
    }
    return {
      hectares,
      avg,
      delta,
      crops: [...crops.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    };
  }, [rows]);

  const steps = [
    { label: "Lancer votre première analyse", done: rows.length > 0, to: "/analyze" },
    { label: "Suivre une deuxième parcelle", done: rows.length > 1, to: "/analyze" },
    { label: "Débloquer les analyses illimitées", done: Boolean(plan && plan.plan !== "free"), to: "/pricing" },
  ];
  const doneSteps = steps.filter((s) => s.done).length;

  const pending = fetching && analyses === null;

  const signOutNow = () => {
    signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page">
        <Loader2 size={26} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-page px-5 text-ink">
        <div className="glass w-full max-w-sm rounded-3xl p-8 text-center">
          <Sprout size={28} className="mx-auto text-accent" />
          <h1 className="font-display mt-3 text-2xl font-bold">Espace producteur</h1>
          <p className="mt-2 text-sm text-ink-soft">Connectez-vous pour retrouver vos parcelles et vos analyses.</p>
          <Link to="/login" className="btn-gold mt-6 inline-flex w-full justify-center">
            Se connecter
          </Link>
          <Link to="/" className="mt-3 inline-block text-xs text-ink/45 hover:text-accent">
            Retour au site
          </Link>
        </div>
      </div>
    );
  }

  const firstName = (user.name || user.email.split("@")[0] || "").split(" ")[0];
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-page text-ink">
      <SideRail plan={plan} email={user.email} onSignOut={signOutNow} />

      {/* Barre mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/8 bg-card/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/dashboard" aria-label="Accueil du tableau de bord">
          <Logo size={30} />
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 text-ink"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[57px] z-40 border-b border-ink/10 bg-card p-3 shadow-lg lg:hidden">
          {MOBILE_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 hover:bg-ink/[0.04]"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={signOutNow}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      )}

      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-8 lg:pt-9">
          {/* En-tête */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                <CalendarDays size={12} className="text-accent" /> {today}
              </p>
              <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Bonjour, <span className="text-gradient-gold">{firstName}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                aria-label="Rafraîchir les données"
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink/50 transition-colors hover:border-gold-400/50 hover:text-accent"
              >
                <RefreshCw size={15} className={fetching ? "animate-spin" : ""} />
              </button>
              <Link to="/analyze" className="btn-gold !px-5 !py-2.5 text-sm">
                <Sprout size={16} /> Nouvelle analyse
              </Link>
            </div>
          </div>

          {failed && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <span className="mt-0.5">⚠</span>
              <div>
                <p className="font-semibold">Impossible de charger vos parcelles.</p>
                <p className="mt-0.5 text-rose-600/80">{failed}</p>
              </div>
            </div>
          )}

          {pending ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-3xl border border-ink/8 bg-card" />
              ))}
            </div>
          ) : (
            <>
              {/* Carte principale + jauge */}
              <section className="mt-6 grid gap-4 lg:grid-cols-12">
                <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#171410_0%,#2A2419_52%,#3E3418_100%)] p-6 text-white shadow-[0_24px_50px_-32px_rgba(27,24,19,0.8)] sm:p-7 lg:col-span-8">
                  <svg className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 opacity-70" viewBox="0 0 200 200" aria-hidden>
                    {[92, 72, 52].map((r) => (
                      <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#F5C544" strokeOpacity={0.12 + (92 - r) / 400} strokeWidth="1" />
                    ))}
                    <circle cx="100" cy="100" r="26" fill="#F5C544" fillOpacity="0.12" />
                  </svg>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(ellipse_at_bottom,rgba(245,197,68,0.28),transparent_70%)]" />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between">
                      <p className="mono text-[9px] uppercase tracking-[0.22em] text-white/45">Votre exploitation</p>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-gold-300">
                        {plan?.limits.label ?? "Pousse"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                      <span className="font-display text-[3.4rem] font-bold leading-none tracking-tight">
                        {stats.hectares.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
                      </span>
                      <span className="pb-1 text-sm font-medium text-white/55">hectares suivis</span>
                    </div>
                    <p className="mt-1.5 text-sm text-white/55">
                      {rows.length === 0
                        ? "Aucune parcelle analysée pour le moment."
                        : `${rows.length} parcelle${rows.length === 1 ? "" : "s"} · dernière analyse le ${shortDate(rows[0].created_at)}`}
                    </p>

                    <div className="mt-auto grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                      <div>
                        <p className="mono text-[8px] uppercase tracking-[0.18em] text-white/35">Analyses</p>
                        <p className="font-display mt-1 text-xl font-bold">{rows.length}</p>
                      </div>
                      <div>
                        <p className="mono text-[8px] uppercase tracking-[0.18em] text-white/35">Score moyen</p>
                        <p className="font-display mt-1 text-xl font-bold text-gold-300">
                          {stats.avg == null ? "—" : Math.round(stats.avg)}
                        </p>
                      </div>
                      <div>
                        <p className="mono text-[8px] uppercase tracking-[0.18em] text-white/35">Quota</p>
                        <p className="font-display mt-1 text-xl font-bold">
                          {plan?.remaining == null ? "∞" : plan.remaining}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-3xl border border-ink/8 bg-card p-6 lg:col-span-4">
                  <p className="mono text-[9px] uppercase tracking-[0.2em] text-ink/40">Qualité du domaine</p>
                  <div className="mt-5">
                    <ScoreRing value={stats.avg} caption="Moyenne des parcelles" />
                  </div>
                  {stats.crops.length > 0 && (
                    <div className="mt-5 flex flex-wrap justify-center gap-1.5 border-t border-ink/8 pt-4">
                      {stats.crops.map(([crop, count]) => (
                        <span key={crop} className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[10px] font-semibold text-ink/60">
                          {crop} · {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Indicateurs */}
              <section className="mt-4 grid gap-4 sm:grid-cols-3">
                <StatCard
                  icon={FlaskConical}
                  label="Analyses enregistrées"
                  value={String(rows.length)}
                  sub={rows.length ? `Dernière le ${shortDate(rows[0].created_at)}` : "Lancez la première"}
                  accent="ink"
                />
                <StatCard
                  icon={Gauge}
                  label="Score de compatibilité"
                  value={stats.avg == null ? "—" : String(Math.round(stats.avg))}
                  suffix={stats.avg == null ? undefined : "/100"}
                  sub={stats.avg == null ? "En attente de données" : stats.avg >= 80 ? "Terrain bien adapté" : "Des ajustements possibles"}
                  delta={stats.delta}
                  accent="gold"
                />
                <StatCard
                  icon={CreditCard}
                  label="Analyses restantes"
                  value={plan?.remaining == null ? "∞" : String(plan.remaining)}
                  suffix={plan?.remaining == null ? undefined : "ce mois"}
                  sub={`${plan?.analysesLast30d ?? 0} utilisée${(plan?.analysesLast30d ?? 0) === 1 ? "" : "s"} sur 30 jours`}
                  accent="leaf"
                />
              </section>

              {/* Graphique + étapes */}
              <section className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="flex h-full flex-col rounded-3xl border border-ink/8 bg-card p-6 lg:col-span-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-bold text-ink">Historique des scores</h2>
                      <p className="mt-0.5 text-xs text-ink/45">Chaque analyse notée sur 100, la cible est à 80.</p>
                    </div>
                    <span className="mono rounded-full bg-ink/[0.05] px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-ink/45">
                      {rows.length} point{rows.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <ScoreBars analyses={rows} />
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-3xl border border-ink/8 bg-card p-6 lg:col-span-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-ink">Prochaines étapes</h2>
                    <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                      {doneSteps}/{steps.length}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all duration-700"
                      style={{ width: `${(doneSteps / steps.length) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-4 space-y-1">
                    {steps.map((s) => (
                      <li key={s.label}>
                        <Link
                          to={s.to}
                          className="group flex items-start gap-2.5 rounded-2xl px-1.5 py-2 transition-colors hover:bg-ink/[0.03]"
                        >
                          {s.done ? (
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-leaf" />
                          ) : (
                            <Circle size={16} className="mt-0.5 shrink-0 text-ink/25" />
                          )}
                          <span className={`text-sm ${s.done ? "text-ink/40 line-through" : "text-ink/75"}`}>{s.label}</span>
                          <ArrowUpRight size={13} className="ml-auto mt-1 shrink-0 text-ink/20 group-hover:text-accent" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto border-t border-ink/8 pt-3 text-[11px] leading-relaxed text-ink/40">
                    Une analyse couvre une parcelle pour une saison : recommencez après la récolte pour suivre l'évolution du sol.
                  </p>
                </div>
              </section>

              {/* Tableau des parcelles */}
              <section id="parcelles" className="mt-4 rounded-3xl border border-ink/8 bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink">Analyses récentes</h2>
                    <p className="mt-0.5 text-xs text-ink/45">Conservées dans votre compte, accessibles partout.</p>
                  </div>
                  {rows.length > 0 && (
                    <Link to="/analyze" className="btn-ghost !px-4 !py-2 text-xs">
                      Ajouter une parcelle
                    </Link>
                  )}
                </div>

                {rows.length === 0 ? (
                  <div className="m-6 mt-2 rounded-2xl border border-dashed border-ink/12 p-10 text-center">
                    <Sprout size={30} className="mx-auto text-accent" />
                    <p className="mt-3 text-sm text-ink-soft">
                      Aucune analyse pour l'instant. Une parcelle, un sol, un objectif — et vous obtenez votre première recommandation.
                    </p>
                    <Link to="/analyze" className="btn-gold mt-5 inline-flex">
                      <Sprout size={16} /> Analyser mon terrain
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="hidden px-6 sm:block">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="mono text-[9px] uppercase tracking-[0.15em] text-ink/35">
                            <th className="pb-2 font-medium">Parcelle</th>
                            <th className="pb-2 font-medium">Culture</th>
                            <th className="pb-2 font-medium">Sol</th>
                            <th className="pb-2 font-medium">pH</th>
                            <th className="pb-2 font-medium">Surface</th>
                            <th className="pb-2 font-medium">Score</th>
                            <th className="pb-2 text-right font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 6).map((a) => (
                            <tr key={a.id} className="border-t border-ink/6">
                              <td className="py-3 font-medium text-ink">{a.parcel_name ?? "Parcelle"}</td>
                              <td className="py-3 text-ink/70">{a.recommendation?.crop ?? "—"}</td>
                              <td className="py-3 text-ink/55">{SOIL_LABELS[a.soil_type ?? ""] ?? a.soil_type ?? "—"}</td>
                              <td className="py-3 text-ink/55">{a.ph ?? "—"}</td>
                              <td className="py-3 text-ink/55">{a.hectares ? `${num(a.hectares)} ha` : "—"}</td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex min-w-11 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                    (a.fit_score ?? 0) >= 80
                                      ? "bg-leaf/10 text-leaf"
                                      : (a.fit_score ?? 0) >= 60
                                        ? "bg-gold-400/20 text-accent"
                                        : "bg-ink/[0.06] text-ink/60"
                                  }`}
                                >
                                  {a.fit_score ?? "—"}
                                </span>
                              </td>
                              <td className="py-3 text-right text-xs text-ink/40">{shortDate(a.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="divide-y divide-ink/6 px-4 pb-2 sm:hidden">
                      {rows.slice(0, 6).map((a) => (
                        <li key={a.id} className="flex items-center gap-3 py-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/15 text-sm font-bold text-accent">
                            {(a.recommendation?.crop ?? "?").slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{a.parcel_name ?? "Parcelle"}</p>
                            <p className="truncate text-[11px] text-ink/45">
                              {a.recommendation?.crop ?? "—"} · {a.hectares ? `${num(a.hectares)} ha` : "—"} · pH {a.ph ?? "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-sm font-bold text-ink">{a.fit_score ?? "—"}</p>
                            <p className="text-[10px] text-ink/35">{shortDate(a.created_at)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              {rows.length > 0 && rows[0].recommendation?.reason && (
                <p className="mt-4 flex items-start gap-2 rounded-2xl border border-gold-400/25 bg-gold-400/8 p-4 text-xs text-ink/60">
                  <Gauge size={14} className="mt-0.5 shrink-0 text-accent" />
                  <span>
                    <strong className="font-semibold text-ink">Dernière recommandation ({rows[0].recommendation.crop}) :</strong>{" "}
                    {rows[0].recommendation.reason} Objectif : {GOAL_LABELS[rows[0].goal ?? ""] ?? "rendement"}.
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
