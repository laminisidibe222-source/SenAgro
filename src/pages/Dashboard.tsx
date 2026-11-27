import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sprout,
  Target,
} from "lucide-react";
import AppShell from "../components/dash/AppShell";
import { GOAL_LABELS, num, soilLabel, type SavedAnalysis } from "../components/dash/types";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getPlanInfo, type PlanInfo } from "../lib/api";

type Tab = "all" | "recent" | "old";

const PAGE_SIZE = 6;

function scoreTone(score: number | null) {
  if (score == null) return { bg: "bg-ink/[0.06]", text: "text-ink/55" };
  if (score >= 80) return { bg: "bg-leaf/10", text: "text-leaf" };
  if (score >= 60) return { bg: "bg-gold-400/25", text: "text-accent" };
  return { bg: "bg-ink/[0.07]", text: "text-ink/60" };
}

/**
 * Dossiers page, laid out like the order-admin reference: a header with the
 * counts, pill tabs, a search field, card-shaped table rows (the opened one
 * turns ink) and a paginated footer. Colours stay the warm paper + gold system.
 */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[] | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [fetching, setFetching] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<string | null>(null);

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
    const hectares = rows.reduce((s, a) => s + num(a.hectares), 0);
    const scores = rows.map((a) => a.fit_score).filter((n): n is number => typeof n === "number");
    const avg = scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null;
    return { hectares, avg };
  }, [rows]);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    return rows.filter((a) => {
      const t = new Date(a.created_at).getTime();
      if (tab === "recent" && !(t >= cutoff)) return false;
      if (tab === "old" && !(t < cutoff)) return false;
      if (!query.trim()) return true;
      const hay = `${a.parcel_name ?? ""} ${a.recommendation?.crop ?? ""} ${soilLabel(a.soil_type)}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [rows, tab, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(filtered.length, current * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [tab, query]);

  const recentCount = rows.filter((a) => new Date(a.created_at).getTime() >= Date.now() - 30 * 86_400_000).length;
  const dateRange = useMemo(() => {
    if (!rows.length) return null;
    const times = rows.map((a) => new Date(a.created_at).getTime()).sort((a, b) => a - b);
    const fmt = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    return { first: fmt(times[0]), last: fmt(times[times.length - 1]) };
  }, [rows]);

  const signOutNow = () => {
    signOut();
    navigate("/");
  };

  if (!user) return null;

  const pending = fetching && analyses === null;
  const empty = analyses !== null && rows.length === 0;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "Tous les dossiers", count: rows.length },
    { id: "recent", label: "Récents", count: recentCount },
    { id: "old", label: "Plus anciens", count: rows.length - recentCount },
  ];

  return (
    <AppShell plan={plan} email={user.email} name={user.name} onSignOut={signOutNow}>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[24px] font-bold leading-tight tracking-tight text-ink sm:text-[27px]">
            Dossiers de récolte
          </h1>
          <p className="mt-1 text-[12px] text-ink/45">
            {rows.length} dossier{rows.length === 1 ? "" : "s"} ·{" "}
            {stats.hectares.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ha suivis
            {stats.avg != null && ` · compatibilité moyenne ${stats.avg}/100`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Rafraîchir les dossiers"
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink/50 transition-colors hover:border-gold-400/60 hover:text-accent"
          >
            <RefreshCw size={15} className={fetching ? "animate-spin" : ""} />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[11px] font-extrabold text-gold-300">
            {(user.name || user.email).slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>

      {failed && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
          <p className="font-semibold">Impossible de charger vos dossiers.</p>
          <p className="mt-0.5 text-rose-600/80">{failed}</p>
        </div>
      )}

      {pending && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[62px] animate-pulse rounded-xl bg-card2" />
          ))}
        </div>
      )}

      {empty && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-8">
            <svg className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 opacity-40" viewBox="0 0 200 200" aria-hidden>
              {[92, 70, 48].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#F5C544" strokeOpacity={0.2} strokeWidth="1" />
              ))}
              <circle cx="150" cy="48" r="12" fill="#F5C544" fillOpacity="0.9" />
            </svg>
            <p className="mono relative text-[9px] uppercase tracking-[0.22em] text-white/45">Premier dossier</p>
            <h2 className="font-display relative mt-2 text-[24px] font-bold leading-tight sm:text-[30px]">
              Une parcelle, un sol,
              <br />
              <span className="text-gold-300">une recommandation claire.</span>
            </h2>
            <p className="relative mt-2 max-w-sm text-[12.5px] leading-relaxed text-white/70">
              Décrivez votre terrain une fois : culture, surface, sol, eau et budget. SenAgro calcule la culture
              adaptée et la marge attendue.
            </p>
            <Link to="/analyze" className="btn-gold relative mt-4 !bg-gold-400 !bg-none !px-4 !py-2.5 !text-[12.5px] !text-[#241a05]">
              <Sprout size={15} /> Analyser ma première parcelle
            </Link>
          </section>

          <div className="grid gap-2">
            {[
              { icon: Target, t: "Score de compatibilité", d: "Sur 100, à partir du sol, du pH et de l'eau." },
              { icon: CalendarDays, t: "Calendrier cultural", d: "Semis, fertilisation et récolte datés." },
              { icon: MapPin, t: "Surface suivie", d: "Chaque parcelle garde ses hectares." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-ink/8 bg-card p-3.5">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 text-accent">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">{t}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink/45">{d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!pending && !empty && (
        <>
          {/* tabs + range */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-ink/8">
            <div className="flex items-center gap-4">
              {tabs.map((item) => {
                const on = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`relative -mb-px pb-2.5 pt-1 text-[12.5px] font-semibold transition-colors ${
                      on ? "text-ink" : "text-ink/40 hover:text-ink/70"
                    }`}
                  >
                    {item.label}
                    <span className="ml-1.5 text-[10px] font-bold text-ink/30">{item.count}</span>
                    {on && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-gold-500" />}
                  </button>
                );
              })}
            </div>

            <div className="mb-2 flex items-center gap-2">
              <div className="relative">
                <label htmlFor="dossier-search" className="sr-only">
                  Rechercher un dossier
                </label>
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  id="dossier-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Parcelle ou culture"
                  className="h-8 w-[168px] rounded-full border border-ink/10 bg-card2 pl-7 pr-3 text-[11.5px] text-ink placeholder-ink/35 outline-none focus:border-gold-400/70 focus:bg-white"
                />
              </div>
              {dateRange && (
                <span className="hidden items-center gap-1 rounded-full bg-card2 px-2.5 py-1 text-[10.5px] text-ink/50 sm:flex">
                  <CalendarDays size={11} className="text-accent" />
                  {dateRange.first} → {dateRange.last}
                </span>
              )}
            </div>
          </div>

          {/* table head */}
          <div className="mono mt-3 hidden grid-cols-[64px_1.5fr_1fr_80px_70px_84px_32px] gap-3 px-3 text-[9px] uppercase tracking-[0.12em] text-ink/35 md:grid">
            <span>Réf.</span>
            <span>Parcelle</span>
            <span>Sol · pH</span>
            <span>Surface</span>
            <span>Score</span>
            <span>Date</span>
            <span />
          </div>

          {/* rows */}
          <ul className="mt-1.5 space-y-1.5">
            {slice.map((a) => {
              const isOpen = opened === a.id;
              const tone = scoreTone(a.fit_score);
              return (
                <li key={a.id}>
                  <div
                    className={`rounded-xl border transition-all ${
                      isOpen ? "border-transparent bg-ink text-white shadow-[0_18px_36px_-26px_rgba(27,24,19,0.9)]" : "border-ink/8 bg-card"
                    }`}
                  >
                    <button
                      onClick={() => setOpened(isOpen ? null : a.id)}
                      aria-expanded={isOpen}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 text-left md:grid-cols-[64px_1.5fr_1fr_80px_70px_84px_32px]"
                    >
                      <span className={`mono hidden text-[10.5px] md:block ${isOpen ? "text-white/50" : "text-ink/35"}`}>
                        #{a.id.slice(0, 4)}
                      </span>

                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                            isOpen ? "bg-white/15 text-white" : "bg-gold-400/20 text-accent"
                          }`}
                        >
                          {(a.recommendation?.crop ?? "?").slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className={`block truncate text-[12.5px] font-bold ${isOpen ? "text-white" : "text-ink"}`}>
                            {a.parcel_name ?? "Parcelle"}
                          </span>
                          <span className={`block truncate text-[10px] ${isOpen ? "text-white/55" : "text-ink/40"} md:hidden`}>
                            {a.recommendation?.crop ?? "—"} · {soilLabel(a.soil_type)} · {shortDateOrDash(a)}
                          </span>
                        </span>
                      </span>

                      <span className={`hidden truncate text-[11.5px] md:block ${isOpen ? "text-white/60" : "text-ink/50"}`}>
                        {soilLabel(a.soil_type)} · {a.ph ?? "—"}
                      </span>

                      <span className={`hidden text-[11.5px] font-semibold tabular-nums md:block ${isOpen ? "text-white/70" : "text-ink/60"}`}>
                        {a.hectares ? `${num(a.hectares).toLocaleString("fr-FR")} ha` : "—"}
                      </span>

                      <span className="hidden md:block">
                        <span
                          className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                            isOpen ? "bg-white/15 text-white" : `${tone.bg} ${tone.text}`
                          }`}
                        >
                          {a.fit_score ?? "—"}
                        </span>
                      </span>

                      <span className={`hidden text-[11px] md:block ${isOpen ? "text-white/60" : "text-ink/40"}`}>
                        {shortDateOrDash(a)}
                      </span>

                      <span className="flex items-center justify-end gap-2">
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-full ${
                            isOpen ? "bg-white/15 text-white" : "bg-card2 text-ink/45"
                          }`}
                        >
                          <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                        </span>
                      </span>
                    </button>

                    {isOpen && (
                      <div className="grid gap-3 border-t border-white/10 px-3 pb-3 pt-3 sm:grid-cols-3">
                        <Detail icon={<FlaskConical size={12} />} label="pH" value={String(a.ph ?? "—")} />
                        <Detail icon={<Droplets size={12} />} label="Humidité" value={`${a.moisture_pct ?? "—"}%`} />
                        <Detail icon={<Target size={12} />} label="Objectif" value={GOAL_LABELS[a.goal ?? ""] ?? "—"} />
                        <div className="sm:col-span-3">
                          <p className="mono text-[9px] uppercase tracking-[0.16em] text-white/40">Recommandation</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-white/75">
                            <span className="font-bold text-white">{a.recommendation?.crop ?? "—"}</span>
                            {a.recommendation?.reason ? ` — ${a.recommendation.reason}` : ""}
                          </p>
                        </div>
                        <div className="sm:col-span-3">
                          <Link
                            to="/analyze"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1.5 text-[11px] font-bold text-[#241a05]"
                          >
                            <Plus size={12} /> Nouvelle analyse
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink/40">
              Affichage {from}–{to} sur {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                aria-label="Page précédente"
                className="grid h-7 w-7 place-items-center rounded-lg border border-ink/10 text-ink/50 disabled:opacity-35"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: pages }).slice(0, 6).map((_, i) => {
                const n = i + 1;
                const on = n === current;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-7 min-w-7 rounded-lg px-1.5 text-[11px] font-bold ${
                      on ? "bg-ink text-white" : "text-ink/50 hover:bg-card2"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={current === pages}
                aria-label="Page suivante"
                className="grid h-7 w-7 place-items-center rounded-lg border border-ink/10 text-ink/50 disabled:opacity-35"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function shortDateOrDash(a: SavedAnalysis) {
  return new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.07] px-2.5 py-2">
      <p className="mono flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.16em] text-white/40">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-[12px] font-bold text-white">{value}</p>
    </div>
  );
}
