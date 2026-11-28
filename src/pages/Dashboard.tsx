import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Droplets,
  Gauge,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sprout,
} from "lucide-react";
import AppShell from "../components/dash/AppShell";
import { num, type SavedAnalysis } from "../components/dash/types";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getPlanInfo, type PlanInfo } from "../lib/api";

type Filter = "all" | "recent" | "old";

/** Tiny sparkline with a marked peak, drawn from the dossier series. */
function Spark({ values, color, peakLabel }: { values: number[]; color: string; peakLabel: string }) {
  const W = 132;
  const H = 74;
  const pts = values.length >= 2 ? values : [...values, ...values];
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const span = Math.max(max - min, 1);
  const x = (i: number) => (i / Math.max(pts.length - 1, 1)) * (W - 8) + 4;
  const y = (v: number) => H - 8 - ((v - min) / span) * (H - 20);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const peakIdx = pts.indexOf(Math.max(...pts));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[74px] w-full" aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={`${path} L ${x(pts.length - 1)} ${H} L ${x(0)} ${H} Z`} fill={color} opacity="0.12" />
      <line x1={x(peakIdx)} x2={x(peakIdx)} y1={y(pts[peakIdx]) + 4} y2={H} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
      <circle cx={x(peakIdx)} cy={y(pts[peakIdx])} r="3.4" fill={color} />
      <text x={x(peakIdx)} y={Math.max(9, y(pts[peakIdx]) - 7)} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={color}>
        {peakLabel}
      </text>
    </svg>
  );
}

function Ring({ value }: { value: number }) {
  const size = 92;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F5C544"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-[18px] font-extrabold leading-none tabular-nums">{Math.round(pct)}</span>
        <span className="mono text-[8px] uppercase tracking-[0.14em] text-white/55">sur 100</span>
      </div>
    </div>
  );
}

/**
 * Account home from the fitness-dashboard reference: greeting header, a wide
 * three-chart card, a calendar of analysis days, a score ring, the quota bar
 * and a tile row of recent dossiers.
 */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[] | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [fetching, setFetching] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    setFailed(null);
    (async () => {
      const [list, quota] = await Promise.all([apiFetch("/api/analyses", { method: "GET" }), getPlanInfo()]);
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
    const chronological = [...rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const scores = chronological.map((a) => a.fit_score ?? 0);
    const moisture = chronological.map((a) => a.moisture_pct ?? 0);
    const hectares = chronological.map((a) => num(a.hectares));
    const avgScore = scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0;
    const totalHa = hectares.reduce((s, n) => s + n, 0);
    return { chronological, scores, moisture, hectares, avgScore, totalHa };
  }, [rows]);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    return rows.filter((a) => {
      const t = new Date(a.created_at).getTime();
      if (filter === "recent" && !(t >= cutoff)) return false;
      if (filter === "old" && !(t < cutoff)) return false;
      if (!query.trim()) return true;
      return `${a.parcel_name ?? ""} ${a.recommendation?.crop ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [rows, filter, query]);

  const cropShare = useMemo(() => {
    const tally = new Map<string, number>();
    for (const a of rows) {
      const crop = a.recommendation?.crop?.trim();
      if (crop) tally.set(crop, (tally.get(crop) ?? 0) + 1);
    }
    const total = Math.max(rows.length, 1);
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([crop, count]) => ({ crop, count, pct: Math.round((count / total) * 100) }));
  }, [rows]);

  const used = plan?.analysesLast30d ?? rows.length;
  const limit = plan?.limits.analysesPer30d ?? null;
  const quotaPct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 100;

  const signOutNow = () => {
    signOut();
    navigate("/");
  };

  if (!user) return null;

  const firstName = (user.name || user.email.split("@")[0] || "").split(" ")[0];
  const pending = fetching && analyses === null;
  const noPlan = analyses !== null && rows.length === 0;

  const today = new Date();
  const monthLabel = today.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstWeekday = (new Date(today.getFullYear(), today.getMonth(), 1).getDay() + 6) % 7;
  const analysisDays = new Set(
    rows
      .map((a) => new Date(a.created_at))
      .filter((d) => d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
      .map((d) => d.getDate()),
  );

  return (
    <AppShell plan={plan} email={user.email} name={user.name} onSignOut={signOutNow}>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold leading-tight tracking-tight sm:text-[25px]">
            Bonjour, {firstName} !
          </h1>
          <p className="mt-0.5 text-[11.5px] text-ink/45">
            {rows.length
              ? `${rows.length} dossier${rows.length === 1 ? "" : "s"} · ${stats.totalHa.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ha suivis`
              : "Prêt pour votre premier relevé de parcelle ?"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label htmlFor="dash-search" className="sr-only">
              Rechercher un dossier
            </label>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              id="dash-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher une parcelle"
              className="h-9 w-[190px] rounded-full bg-card pl-8 pr-3 text-[11.5px] text-ink placeholder-ink/35 ring-1 ring-ink/8 outline-none focus:ring-gold-400/70"
            />
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Rafraîchir"
            className="grid h-9 w-9 place-items-center rounded-full bg-card text-ink/50 ring-1 ring-ink/8 hover:text-accent"
          >
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          </button>
          <Link to="/analyze" className="btn-gold !bg-gold-400 !bg-none !px-3.5 !py-2 !text-[11.5px] !text-[#241a05]">
            <Plus size={13} /> Nouveau dossier
          </Link>
        </div>
      </div>

      {failed && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
          <p className="font-semibold">Impossible de charger vos parcelles.</p>
          <p className="mt-0.5 text-rose-600/80">{failed}</p>
        </div>
      )}

      {pending && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="h-[236px] animate-pulse rounded-2xl bg-card lg:col-span-2" />
          <div className="h-[236px] animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {noPlan && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <section className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white lg:col-span-2">
            <svg className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 opacity-40" viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#F5C544" strokeOpacity="0.25" strokeWidth="1" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="#F5C544" strokeOpacity="0.15" strokeWidth="1" />
              <circle cx="160" cy="44" r="11" fill="#F5C544" />
            </svg>
            <p className="mono relative text-[9px] uppercase tracking-[0.2em] text-white/55">Premier dossier</p>
            <h2 className="font-display relative mt-2 text-[23px] font-bold leading-tight">
              Une parcelle, un sol,
              <br />
              <span className="text-gold-300">une recommandation claire.</span>
            </h2>
            <p className="relative mt-2 max-w-sm text-[12.5px] leading-relaxed text-white/65">
              Décrivez votre terrain une fois : culture, surface, sol, eau et budget. SenAgro calcule la culture
              adaptée et la marge attendue.
            </p>
            <Link to="/analyze" className="btn-gold relative mt-4 !bg-gold-400 !bg-none !px-4 !py-2.5 !text-[12px] !text-[#241a05]">
              <Sprout size={14} /> Analyser ma première parcelle
            </Link>
          </section>
          <div className="grid gap-2">
            {["Score de compatibilité sur 100", "Calendrier cultural daté", "Échantillon de sol conservé"].map((t) => (
              <div key={t} className="flex items-center gap-2.5 rounded-xl bg-card p-3 ring-1 ring-ink/8">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-400/15 text-accent">
                  <Layers size={14} />
                </span>
                <p className="text-[12px] font-semibold text-ink/70">{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analyses !== null && rows.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 lg:grid-cols-3">
            {/* activity card */}
            <section className="flex flex-col justify-between rounded-2xl bg-ink p-4 text-white lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13.5px] font-bold">Activité des parcelles</h2>
                <span className="mono flex items-center gap-1 text-[9.5px] uppercase tracking-[0.14em] text-white/55">
                  Dernières analyses <ChevronDown size={11} />
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 divide-x divide-white/10">
                <div className="pr-3">
                  <Spark values={stats.scores} color="#F5C544" peakLabel={String(Math.max(...stats.scores, 0))} />
                  <p className="mono mt-1 text-[8.5px] uppercase tracking-[0.14em] text-white/50">Compatibilité</p>
                  <p className="text-[18px] font-extrabold leading-none tabular-nums">{stats.scores.at(-1) ?? "—"}</p>
                  <p className="mt-0.5 text-[9.5px] text-white/50">
                    Moyenne {stats.avgScore} sur vos dossiers
                  </p>
                </div>
                <div className="px-3">
                  <Spark values={stats.moisture} color="#9FBE97" peakLabel={`${Math.max(...stats.moisture, 0)}%`} />
                  <p className="mono mt-1 text-[8.5px] uppercase tracking-[0.14em] text-white/50">Humidité</p>
                  <p className="text-[18px] font-extrabold leading-none tabular-nums">{stats.moisture.at(-1) ?? "—"}%</p>
                  <p className="mt-0.5 text-[9.5px] text-white/50">Dernier relevé</p>
                </div>
                <div className="pl-3">
                  <Spark values={stats.hectares} color="#8FB7DE" peakLabel={`${Math.max(...stats.hectares, 0)}`} />
                  <p className="mono mt-1 text-[8.5px] uppercase tracking-[0.14em] text-white/50">Surface</p>
                  <p className="text-[18px] font-extrabold leading-none tabular-nums">
                    {stats.totalHa.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
                    <span className="ml-0.5 text-[10px] font-semibold text-white/55">ha</span>
                  </p>
                  <p className="mt-0.5 text-[9.5px] text-white/50">Cumul des parcelles</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2.5">
                {cropShare.map((c) => (
                  <div key={c.crop} className="flex items-center gap-2">
                    <span className="w-[88px] shrink-0 truncate text-[10px] text-white/60">{c.crop}</span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-gold-400/80" style={{ width: `${c.pct}%` }} />
                    </span>
                    <span className="mono w-8 shrink-0 text-right text-[9px] text-white/50">{c.count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5">
                <p className="text-[10px] text-white/50">
                  Dernière analyse le{" "}
                  {new Date(rows[0].created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <Link to="/analyze" className="inline-flex items-center gap-1 text-[10.5px] font-bold text-gold-300">
                  Nouvelle analyse <ArrowRight size={11} />
                </Link>
              </div>
            </section>

            {/* calendar card */}
            <section className="rounded-2xl bg-gold-400 p-4 text-[#241a05]">
              <div className="flex items-center justify-between">
                <h2 className="text-[13.5px] font-bold">Vos analyses</h2>
                <span className="mono flex items-center gap-1 text-[9.5px] uppercase tracking-[0.12em] text-[#241a05]/65">
                  {monthLabel} <ChevronDown size={11} />
                </span>
              </div>

              <div className="mono mt-3 grid grid-cols-7 gap-1 text-center text-[8px] uppercase tracking-[0.08em] text-[#241a05]/60">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 justify-items-center">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <span key={`pad-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const hasAnalysis = analysisDays.has(day);
                  const isToday = day === today.getDate();
                  return (
                    <span
                      key={day}
                      title={hasAnalysis ? "Analyse enregistrée" : undefined}
                      className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold tabular-nums ${
                        isToday
                          ? "bg-ink text-gold-300"
                          : hasAnalysis
                            ? "bg-[#241a05]/85 text-gold-300"
                            : "border border-dashed border-[#241a05]/25 text-[#241a05]/65"
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-snug text-[#241a05]/70">
                {analysisDays.size
                  ? `${analysisDays.size} jour${analysisDays.size === 1 ? "" : "s"} avec une analyse ce mois-ci.`
                  : "Aucune analyse ce mois-ci."}
              </p>
            </section>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="grid gap-3">
              <section className="rounded-2xl bg-ink p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[13.5px] font-bold">Score du domaine</h2>
                    <p className="mt-0.5 text-[10px] text-white/55">
                      {stats.avgScore >= 80 ? "Terrain bien adapté" : stats.avgScore >= 60 ? "Des ajustements possibles" : "À retravailler"}
                    </p>
                  </div>
                  <Ring value={stats.avgScore} />
                </div>
                <p className="mt-2 text-[10px] text-white/50">
                  Moyenne calculée sur {rows.length} dossier{rows.length === 1 ? "" : "s"} analysé{rows.length === 1 ? "" : "s"}.
                </p>
              </section>

              <section className="rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07]">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-ink">Forfait {plan?.limits.label ?? "Pousse"}</h2>
                  <span className="mono text-[9.5px] uppercase tracking-[0.12em] text-ink/40">
                    {limit === null ? "illimité" : `${quotaPct}%`}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={`h-full rounded-full ${limit !== null && used > limit ? "bg-amber-500" : "bg-gold-500"}`}
                    style={{ width: `${limit === null ? 100 : Math.min(100, quotaPct)}%` }}
                  />
                </div>
                <div className="mono mt-1.5 flex items-center justify-between text-[9.5px] text-ink/40">
                  <span>{used} utilisée{used === 1 ? "" : "s"}</span>
                  <span>{limit === null ? "∞" : `${limit} / mois`}</span>
                </div>
                <Link
                  to="/pricing"
                  className="mt-2.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-accent hover:underline"
                >
                  {plan && plan.plan !== "free" ? "Gérer l'abonnement" : "Passer à Pro"} <ArrowUpRight size={11} />
                </Link>
              </section>
            </div>

            {/* dossier tiles */}
            <section className="rounded-2xl bg-card p-4 ring-1 ring-ink/[0.07] lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[13.5px] font-bold text-ink">Mes dossiers</h2>
                <p className="text-[10.5px] text-ink/40">{filtered.length} dossier{filtered.length === 1 ? "" : "s"}</p>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5">
                {(
                  [
                    { id: "all" as Filter, label: "Tous" },
                    { id: "recent" as Filter, label: "Récents" },
                    { id: "old" as Filter, label: "Anciens" },
                  ]
                ).map((f) => {
                  const on = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors ${
                        on ? "bg-gold-400 text-[#241a05]" : "bg-ink/[0.05] text-ink/50 hover:bg-ink/10"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, 5).map((a) => {
                  const tone = (a.fit_score ?? 0) >= 80 ? "bg-leaf" : (a.fit_score ?? 0) >= 60 ? "bg-gold-500" : "bg-ink/40";
                  return (
                    <Link
                      key={a.id}
                      to="/analyze"
                      className="group relative overflow-hidden rounded-xl bg-ink p-3 text-white transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className={`h-1.5 w-1.5 rounded-full ${tone}`} />
                        <ArrowUpRight size={13} className="text-white/35 group-hover:text-gold-300" />
                      </div>
                      <p className="mt-6 truncate text-[12.5px] font-bold">{a.parcel_name ?? "Parcelle"}</p>
                      <p className="truncate text-[10px] text-white/50">
                        {a.recommendation?.crop ?? "—"} · {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[9.5px] text-white/55">
                        <span className="inline-flex items-center gap-1">
                          <Gauge size={9} /> {a.fit_score ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Droplets size={9} /> {a.moisture_pct ?? "—"}%
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers size={9} /> {num(a.hectares)} ha
                        </span>
                      </div>
                    </Link>
                  );
                })}

                <Link
                  to="/analyze"
                  className="grid min-h-[104px] place-items-center rounded-xl border border-dashed border-ink/20 p-3 text-center text-ink/40 transition-colors hover:border-gold-400 hover:text-accent"
                >
                  <span>
                    <Plus size={16} className="mx-auto" />
                    <span className="mt-1 block text-[10.5px] font-bold">Nouvelle analyse</span>
                  </span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
