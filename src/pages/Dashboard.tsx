import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CreditCard,
  Gauge,
  Layers,
  Plus,
  RefreshCw,
  Sprout,
} from "lucide-react";
import AppShell from "../components/dash/AppShell";
import KpiCard from "../components/dash/KpiCard";
import GroupedBars from "../components/dash/GroupedBars";
import CropDonut from "../components/dash/CropDonut";
import { num, shortDate, soilLabel, type SavedAnalysis } from "../components/dash/types";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getPlanInfo, type PlanInfo } from "../lib/api";

const SOIL_COLORS = ["#1B1813", "#F5C544", "#9FBE97", "#C88F1C"];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[] | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [fetching, setFetching] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
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
  const isEmpty = rows.length === 0;

  const stats = useMemo(() => {
    const hectares = rows.reduce((sum, a) => sum + num(a.hectares), 0);
    const scores = rows.map((a) => a.fit_score).filter((n): n is number => typeof n === "number");
    const avg = scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : null;
    const delta = scores.length > 1 ? scores[0] - scores[1] : null;

    const crops = new Map<string, { count: number; score: number | null; hectares: number }>();
    for (const a of rows) {
      const crop = a.recommendation?.crop?.trim();
      if (!crop) continue;
      const prev = crops.get(crop) ?? { count: 0, score: null, hectares: 0 };
      const score = typeof a.fit_score === "number" ? a.fit_score : null;
      crops.set(crop, {
        count: prev.count + 1,
        score:
          score == null
            ? prev.score
            : prev.score == null
              ? score
              : (prev.score * prev.count + score) / (prev.count + 1),
        hectares: prev.hectares + num(a.hectares),
      });
    }

    const soils = new Map<string, number>();
    for (const a of rows) {
      const key = soilLabel(a.soil_type);
      soils.set(key, (soils.get(key) ?? 0) + Math.max(num(a.hectares), 1));
    }
    const soilTotal = [...soils.values()].reduce((s, n) => s + n, 0) || 1;

    return {
      hectares,
      avg,
      delta,
      crops: [...crops.entries()]
        .map(([crop, v]) => ({ crop, ...v }))
        .sort((a, b) => b.count - a.count),
      soils: [...soils.entries()]
        .map(([label, value]) => ({ label, value, pct: Math.round((value / soilTotal) * 100) }))
        .sort((a, b) => b.value - a.value),
    };
  }, [rows]);

  const signOutNow = () => {
    signOut();
    navigate("/");
  };

  if (!user) return null;

  const firstName = (user.name || user.email.split("@")[0] || "").split(" ")[0];
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const pending = fetching && analyses === null;

  return (
    <AppShell plan={plan} email={user.email} name={user.name} onSignOut={signOutNow}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold leading-none tracking-tight sm:text-[30px]">
            Tableau de bord
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink/45">
            <CalendarDays size={12} className="text-accent" />
            <span className="capitalize">{today}</span>
            <span className="text-ink/20">·</span>
            <span>Bonjour {firstName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Rafraîchir les données"
            className="grid h-10 w-10 place-items-center rounded-xl bg-card text-ink/50 ring-1 ring-ink/10 transition-colors hover:border-gold-400/60 hover:text-accent"
          >
            <RefreshCw size={15} className={fetching ? "animate-spin" : ""} />
          </button>
          <Link to="/analyze" className="btn-gold !bg-gold-400 !bg-none !px-4 !py-2.5 !text-[12.5px] !text-[#241a05] hover:!translate-y-0 hover:!scale-100">
            <Plus size={15} /> Nouvelle analyse
          </Link>
        </div>
      </div>

      {failed && (
        <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
          <p className="font-semibold">Impossible de charger vos parcelles.</p>
          <p className="mt-0.5 text-rose-600/80">{failed}</p>
        </div>
      )}

      {pending ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Chargement de vos parcelles">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07]">
              <div className="flex items-center justify-between">
                <span className="h-9 w-9 animate-pulse rounded-xl bg-ink/8" />
                <span className="h-4 w-14 animate-pulse rounded-full bg-ink/8" />
              </div>
              <span className="mt-4 block h-2.5 w-24 animate-pulse rounded-full bg-ink/8" />
              <span className="mt-2 block h-6 w-16 animate-pulse rounded-md bg-ink/10" />
              <span className="mt-2 block h-2 w-28 animate-pulse rounded-full bg-ink/[0.06]" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="mt-4 space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1B1813_0%,#2A2418_55%,#3B3113_100%)] p-6 text-white shadow-[0_26px_54px_-38px_rgba(27,24,19,0.9)] sm:p-8">
            <svg className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 opacity-50" viewBox="0 0 200 200" aria-hidden>
              {[96, 74, 52].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#F5C544" strokeOpacity={0.14 + (96 - r) / 500} strokeWidth="1" />
              ))}
              <circle cx="156" cy="44" r="14" fill="#F5C544" fillOpacity="0.9" />
            </svg>
            <div className="relative max-w-lg">
              <p className="mono text-[9px] uppercase tracking-[0.22em] text-white/45">Première parcelle</p>
              <h2 className="font-display mt-3 text-[26px] font-bold leading-tight sm:text-[34px]">
                Une parcelle, un sol,
                <br />
                <span className="text-gold-300">une recommandation claire.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Décrivez votre terrain une fois — culture, surface, sol, eau et budget. SenAgro calcule la
                culture la plus adaptée, le calendrier cultural et les marges attendues.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link to="/analyze" className="btn-gold !px-4 !py-2.5 text-sm">
                  <Sprout size={15} /> Analyser ma première parcelle
                </Link>
                <span className="mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                  3 minutes · résultat immédiat
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Gauge, title: "Score de compatibilité", body: "Sur 100, à partir du sol, du pH, de l'eau et de la saison." },
              { icon: CalendarDays, title: "Calendrier cultural daté", body: "Semis, fertilisation, traitements et récolte sur vos dates." },
              { icon: CreditCard, title: "Budget et marge", body: "Intrants, main-d'œuvre et transport chiffrés, revenu attendu." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07]">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-400/15 text-accent">
                  <Icon size={16} />
                </span>
                <p className="font-display mt-3 text-[13px] font-bold text-ink">{title}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink/50">{body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
              <KpiCard
                tone="dark"
                icon={Layers}
                label="Surface suivie"
                value={stats.hectares.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
                suffix="ha"
                badge={`${rows.length} parcelle${rows.length === 1 ? "" : "s"}`}
                sub={`Dernière analyse le ${shortDate(rows[0].created_at)}`}
              />
              <KpiCard
                icon={Gauge}
                label="Compatibilité moyenne"
                value={stats.avg == null ? "—" : String(Math.round(stats.avg))}
                suffix="/100"
                badge={stats.delta == null ? "Cible 80" : `${stats.delta >= 0 ? "+" : ""}${Math.round(stats.delta)} pts`}
                sub={stats.avg == null ? "En attente de données" : stats.avg >= 80 ? "Terrain bien adapté" : "Des ajustements possibles"}
              />
              <KpiCard
                icon={Sprout}
                label="Analyses enregistrées"
                value={String(rows.length)}
                badge={`${plan?.analysesLast30d ?? 0} / 30 j`}
                sub={stats.crops[0] ? `Culture dominante : ${stats.crops[0].crop}` : "Aucune culture dominante"}
              />
              <KpiCard
                icon={CreditCard}
                label="Analyses restantes"
                value={plan?.remaining == null ? "∞" : String(plan.remaining)}
                suffix={plan?.remaining == null ? undefined : "ce mois"}
                badge={plan?.limits.label ?? "Pousse"}
                sub={plan?.remaining === 0 ? "Quota atteint — passez à Pro" : "Renouvelé tous les 30 jours"}
              />
            </div>

            <div className="flex flex-col rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07] lg:col-span-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-[15px] font-bold">Répartition des cultures</h2>
                  <p className="mt-0.5 text-[11px] text-ink/45">Vos parcelles, par culture</p>
                </div>
              </div>
              <div className="mt-4">
                {stats.crops.length > 1 ? (
                  <CropDonut rows={stats.crops} />
                ) : (
                  <div className="rounded-xl bg-[#F4F1E8] p-4">
                    <p className="mono text-[9px] uppercase tracking-[0.16em] text-ink/40">Culture dominante</p>
                    <p className="font-display mt-1 text-xl font-bold text-ink">{stats.crops[0]?.crop ?? "—"}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
                      Une seconde parcelle fera apparaître la répartition de vos cultures.
                    </p>
                    {stats.crops[0] && (
                      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3 text-[11px]">
                        <span className="text-ink/50">{stats.crops[0].count} parcelle · {num(stats.crops[0].hectares).toLocaleString("fr-FR")} ha</span>
                        <span className="rounded-full bg-leaf/10 px-2 py-0.5 font-bold text-leaf">
                          {stats.crops[0].score == null ? "—" : Math.round(stats.crops[0].score)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <div className="rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07] lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-[15px] font-bold">Compatibilité par parcelle</h2>
                  <p className="mt-0.5 text-[11px] text-ink/45">Chaque analyse, comparée à l'humidité déclarée</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-ink/50">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gold-400" /> Compatibilité
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#9FBE97]" /> Humidité
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <GroupedBars analyses={rows} />
              </div>
              {rows.length < 2 && (
                <p className="mt-1 text-[10px] text-ink/40">
                  Ajoutez une seconde parcelle pour comparer la saison.
                </p>
              )}
            </div>

            <div className="self-start rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07] lg:col-span-4">
              <h2 className="font-display text-[15px] font-bold">Vos sols</h2>
              <p className="mt-0.5 text-[11px] text-ink/45">Part de la surface suivie</p>
              <ul className="mt-4 space-y-3.5">
                {stats.soils.map((s, i) => (
                  <li key={s.label}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-medium text-ink/70">{s.label}</span>
                      <span className="mono text-[10px] text-ink/40">{s.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/[0.08]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.pct}%`, background: SOIL_COLORS[i % SOIL_COLORS.length] }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-ink/8 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-ink/50">Humidité déclarée moyenne</span>
                  <span className="font-display text-[13px] font-bold text-ink">
                    {rows.length
                      ? `${Math.round(rows.reduce((s, a) => s + (a.moisture_pct ?? 0), 0) / rows.length)}%`
                      : "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/[0.08]">
                  <div
                    className="h-full rounded-full bg-[#9FBE97]"
                    style={{
                      width: `${rows.length ? Math.round(rows.reduce((s, a) => s + (a.moisture_pct ?? 0), 0) / rows.length) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-ink/[0.07]">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
              <div>
                <h2 className="font-display text-[15px] font-bold">Dernières analyses</h2>
                <p className="mt-0.5 text-[11px] text-ink/45">Conservées dans votre compte, accessibles partout</p>
              </div>
              <Link to="/analyze" className="btn-ghost !px-3 !py-1.5 text-[11px]">
                Ajouter une parcelle
              </Link>
            </div>

            <div className="hidden overflow-x-auto px-4 pb-4 sm:block">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="mono text-[9px] uppercase tracking-[0.1em] text-ink/55">
                    <th className="border-b border-ink/6 pb-2 font-medium">Parcelle</th>
                    <th className="border-b border-ink/6 pb-2 font-medium">Culture</th>
                    <th className="border-b border-ink/6 pb-2 font-medium">Sol</th>
                    <th className="border-b border-ink/6 pb-2 font-medium">pH</th>
                    <th className="border-b border-ink/6 pb-2 font-medium">Surface</th>
                    <th className="border-b border-ink/6 pb-2 font-medium">Score</th>
                    <th className="border-b border-ink/6 pb-2 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 6).map((a) => (
                    <tr key={a.id} className="border-b border-ink/5 last:border-0">
                      <td className="py-2.5 font-semibold text-ink">{a.parcel_name ?? "Parcelle"}</td>
                      <td className="py-2.5 text-ink/70">{a.recommendation?.crop ?? "—"}</td>
                      <td className="py-2.5 text-ink/55">{soilLabel(a.soil_type)}</td>
                      <td className="py-2.5 text-ink/55">{a.ph ?? "—"}</td>
                      <td className="py-2.5 text-ink/55">{a.hectares ? `${num(a.hectares).toLocaleString("fr-FR")} ha` : "—"}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            (a.fit_score ?? 0) >= 80
                              ? "bg-leaf/10 text-leaf"
                              : (a.fit_score ?? 0) >= 60
                                ? "bg-gold-400/20 text-accent"
                                : "bg-ink/[0.06] text-ink/55"
                          }`}
                        >
                          {a.fit_score ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[11px] text-ink/40">{shortDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-ink/6 px-4 pb-2 sm:hidden">
              {rows.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400/15 text-[11px] font-bold text-accent">
                    {(a.recommendation?.crop ?? "?").slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{a.parcel_name ?? "Parcelle"}</p>
                    <p className="truncate text-[10px] text-ink/45">
                      {a.recommendation?.crop ?? "—"} · {a.hectares ? `${num(a.hectares).toLocaleString("fr-FR")} ha` : "—"} · pH {a.ph ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[13px] font-bold text-ink">{a.fit_score ?? "—"}</p>
                    <p className="text-[10px] text-ink/35">{shortDate(a.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {rows[0].recommendation?.reason && (
            <div className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400/20 text-accent">
                <Gauge size={16} />
              </span>
              <div>
                <p className="mono text-[9px] uppercase tracking-[0.16em] text-ink/40">
                  Dernière recommandation · {rows[0].recommendation.crop}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink/65">{rows[0].recommendation.reason}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
