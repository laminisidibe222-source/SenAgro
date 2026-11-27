import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
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

const PAGE_SIZE = 5;

type Tab = "all" | "recent" | "old";

function status(a: SavedAnalysis) {
  const s = a.fit_score ?? 0;
  if (s >= 80) return { label: "Adapté", cls: "bg-leaf/10 text-leaf" };
  if (s >= 60) return { label: "À ajuster", cls: "bg-gold-400/25 text-accent" };
  return { label: "Limité", cls: "bg-ink/[0.07] text-ink/55" };
}

const fmtPh = (v: string | number | null) =>
  v == null || v === ""
    ? "—"
    : Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Dossiers page from the bills-dashboard reference: title with square action
 * buttons, a wide search pill, then one table card whose rows are tall, carry
 * checkboxes and a status pill, and expand into an attached detail panel.
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
  const [checked, setChecked] = useState<string[]>([]);

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

  const allChecked = slice.length > 0 && slice.every((a) => checked.includes(a.id));
  const toggleAll = () =>
    setChecked(allChecked ? checked.filter((id) => !slice.some((a) => a.id === id)) : [...new Set([...checked, ...slice.map((a) => a.id)])]);
  const toggleOne = (id: string) =>
    setChecked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const signOutNow = () => {
    signOut();
    navigate("/");
  };

  if (!user) return null;

  const pending = fetching && analyses === null;
  const empty = analyses !== null && rows.length === 0;
  const recentCount = rows.filter((a) => new Date(a.created_at).getTime() >= Date.now() - 30 * 86_400_000).length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "Tous", count: rows.length },
    { id: "recent", label: "Récents", count: recentCount },
    { id: "old", label: "Plus anciens", count: rows.length - recentCount },
  ];

  return (
    <AppShell plan={plan} email={user.email} name={user.name} onSignOut={signOutNow}>
      {/* title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[25px] font-bold leading-tight tracking-tight text-ink sm:text-[28px]">
            Dossiers de récolte
          </h1>
          <p className="mt-1 text-[11.5px] text-ink/45">
            {rows.length} dossier{rows.length === 1 ? "" : "s"} ·{" "}
            {stats.hectares.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ha suivis
            {stats.avg != null && ` · compatibilité moyenne ${stats.avg}/100`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Rafraîchir les dossiers"
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-ink text-white"
          >
            <RefreshCw size={16} className={fetching ? "animate-spin" : ""} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-[#F8F5EC]" />
          </button>
          <Link
            to="/analyze"
            aria-label="Nouvelle analyse"
            className="grid h-10 w-10 place-items-center rounded-xl bg-card text-accent ring-1 ring-ink/8 transition-colors hover:bg-white"
          >
            <Plus size={17} />
          </Link>
          <Link
            to="/pricing"
            aria-label="Forfaits"
            className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400 text-[#241a05] transition-colors hover:bg-gold-300"
          >
            <Bell size={16} />
          </Link>
        </div>
      </div>

      {/* search row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-[430px]">
          <label htmlFor="dossier-search" className="sr-only">
            Rechercher un dossier
          </label>
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            id="dossier-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un dossier…"
            className="h-10 w-full rounded-full border border-ink/8 bg-card pl-10 pr-4 text-[12.5px] text-ink placeholder-ink/35 outline-none focus:border-gold-400/70 focus:bg-white"
          />
        </div>
        <Link
          to="/analyze"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-[12px] font-semibold text-accent ring-1 ring-ink/8 hover:bg-white"
        >
          <Sprout size={14} /> Nouvelle parcelle
        </Link>
      </div>

      {failed && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
          <p className="font-semibold">Impossible de charger vos dossiers.</p>
          <p className="mt-0.5 text-rose-600/80">{failed}</p>
        </div>
      )}

      {pending && (
        <div className="mt-4 space-y-2 rounded-2xl bg-card p-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[64px] animate-pulse rounded-xl bg-card2" />
          ))}
        </div>
      )}

      {empty && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-7">
            <svg className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 opacity-40" viewBox="0 0 200 200" aria-hidden>
              {[92, 70, 48].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#F5C544" strokeOpacity={0.2} strokeWidth="1" />
              ))}
              <circle cx="150" cy="48" r="12" fill="#F5C544" fillOpacity="0.9" />
            </svg>
            <p className="mono relative text-[9px] uppercase tracking-[0.22em] text-white/45">Premier dossier</p>
            <h2 className="font-display relative mt-2 text-[24px] font-bold leading-tight">
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
              { icon: FlaskConical, t: "Échantillon de sol", d: "pH, humidité et texture conservés." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3 rounded-xl bg-card p-3.5 ring-1 ring-ink/8">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 text-accent">
                  <Icon size={15} />
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-ink">{t}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink/45">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!pending && !empty && (
        <div className="mt-3 rounded-2xl bg-card p-2 ring-1 ring-ink/[0.06] sm:p-3">
          {/* tabs inside the card, like the reference's header strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 pb-2">
            <div className="flex items-center gap-1.5">
              {tabs.map((item) => {
                const on = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                      on ? "bg-ink text-white" : "text-ink/45 hover:bg-card2 hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span className={`ml-1.5 text-[10px] font-bold ${on ? "text-white/50" : "text-ink/30"}`}>{item.count}</span>
                  </button>
                );
              })}
            </div>
            <span className="mono flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-ink/30">
              <CalendarDays size={11} className="text-accent" /> 30 derniers jours
            </span>
          </div>

          {/* column header */}
          <div className="mono hidden grid-cols-[28px_1.6fr_92px_96px_1fr_80px_72px_24px] items-center gap-3 border-y border-ink/[0.06] px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-ink/35 md:grid">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              aria-label="Sélectionner cette page"
              className="h-3.5 w-3.5 accent-[#1B1813]"
            />
            <span>Parcelle</span>
            <span>Statut</span>
            <span>Date</span>
            <span>Sol</span>
            <span>Surface</span>
            <span>Score</span>
            <span />
          </div>

          <ul>
            {slice.map((a) => {
              const isOpen = opened === a.id;
              const st = status(a);
              return (
                <li key={a.id} className="border-b border-ink/[0.05] last:border-0">
                  <div
                    className={`grid grid-cols-[1fr_auto] items-center gap-3 px-2 py-3 md:grid-cols-[28px_1.6fr_92px_96px_1fr_80px_72px_24px] md:px-3 ${
                      isOpen ? "rounded-t-xl bg-ink text-white" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.includes(a.id)}
                      onChange={() => toggleOne(a.id)}
                      aria-label={`Sélectionner ${a.parcel_name ?? "ce dossier"}`}
                      className="hidden h-3.5 w-3.5 accent-[#F5C544] md:block"
                    />

                    <button
                      onClick={() => setOpened(isOpen ? null : a.id)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 items-center gap-2.5 text-left"
                    >
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
                        <span className={`block truncate text-[10px] ${isOpen ? "text-white/55" : "text-ink/40"}`}>
                          {a.recommendation?.crop ?? "—"} · {soilLabel(a.soil_type)} · {fmtDate(a.created_at)}
                        </span>
                      </span>
                    </button>

                    <span className="hidden md:block">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${isOpen ? "bg-white/15 text-white" : st.cls}`}>
                        {st.label}
                      </span>
                    </span>

                    <span className={`hidden text-[11px] md:block ${isOpen ? "text-white/60" : "text-ink/45"}`}>
                      {fmtDate(a.created_at)}
                    </span>

                    <span className={`hidden truncate text-[11px] md:block ${isOpen ? "text-white/60" : "text-ink/50"}`}>
                      {soilLabel(a.soil_type)} · {fmtPh(a.ph)}
                    </span>

                    <span className={`hidden text-[11.5px] font-semibold tabular-nums md:block ${isOpen ? "text-white/75" : "text-ink/60"}`}>
                      {a.hectares ? `${num(a.hectares).toLocaleString("fr-FR")} ha` : "—"}
                    </span>

                    <span className={`hidden text-[12px] font-extrabold tabular-nums md:block ${isOpen ? "text-gold-300" : "text-ink"}`}>
                      {a.fit_score ?? "—"}
                    </span>

                    <button
                      onClick={() => setOpened(isOpen ? null : a.id)}
                      aria-label={isOpen ? "Replier" : "Déplier"}
                      className={`ml-auto grid h-7 w-7 place-items-center rounded-full ${
                        isOpen ? "bg-white/15 text-white" : "bg-card2 text-ink/40"
                      }`}
                    >
                      <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="grid gap-3 rounded-b-xl bg-white p-3 sm:grid-cols-3 sm:divide-x sm:divide-ink/8">
                      <div className="sm:pr-3">
                        <p className="mono text-[9px] uppercase tracking-[0.16em] text-ink/35">Culture recommandée</p>
                        <p className="mt-1.5 text-[15px] font-bold text-ink">{a.recommendation?.crop ?? "—"}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink/55">
                          {a.recommendation?.reason ?? "Aucun motif enregistré."}
                        </p>
                        <p className="mono mt-2 inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-accent">
                          <Target size={9} /> {GOAL_LABELS[a.goal ?? ""] ?? "—"}
                        </p>
                      </div>

                      <div className="sm:px-3">
                        <p className="mono text-[9px] uppercase tracking-[0.16em] text-ink/35">Échantillon de sol</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-card2 px-2.5 py-1.5">
                            <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-ink/35">
                              <FlaskConical size={9} /> pH
                            </p>
                            <p className="text-[12.5px] font-bold text-ink">{fmtPh(a.ph)}</p>
                          </div>
                          <div className="rounded-lg bg-card2 px-2.5 py-1.5">
                            <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-ink/35">
                              <Droplets size={9} /> Humidité
                            </p>
                            <p className="text-[12.5px] font-bold text-ink">{a.moisture_pct ?? "—"}%</p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-ink/50">
                          {soilLabel(a.soil_type)} · {a.hectares ? `${num(a.hectares).toLocaleString("fr-FR")} ha` : "—"}
                        </p>
                      </div>

                      <div className="flex flex-col justify-between sm:pl-3">
                        <div className="space-y-1 text-[11px]">
                          <p className="flex items-center justify-between gap-2">
                            <span className="text-ink/40">Réf.</span>
                            <span className="mono font-semibold text-ink">#{a.id.slice(0, 6)}</span>
                          </p>
                          <p className="flex items-center justify-between gap-2">
                            <span className="text-ink/40">Statut</span>
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                          </p>
                          <p className="flex items-center justify-between gap-2">
                            <span className="text-ink/40">Date payée</span>
                            <span className="font-semibold text-ink">{fmtDate(a.created_at)}</span>
                          </p>
                        </div>
                        <div className="mt-2 flex items-end justify-between border-t border-ink/8 pt-2 sm:border-0 sm:pt-0">
                          <div>
                            <p className="mono text-[9px] uppercase tracking-[0.14em] text-ink/35">Score</p>
                            <p className="font-display text-[22px] font-bold leading-none text-ink">
                              {a.fit_score ?? "—"}
                              <span className="text-[11px] font-semibold text-ink/35">/100</span>
                            </p>
                          </div>
                          <Link
                            to="/analyze"
                            className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[10.5px] font-bold text-gold-300"
                          >
                            Relancer <ArrowUpRight size={11} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 sm:px-3">
            <p className="text-[10.5px] text-ink/40">
              Affichage {from}–{to} sur <span className="font-bold text-ink/70">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                aria-label="Page précédente"
                className="grid h-7 w-7 place-items-center rounded-lg text-ink/45 disabled:opacity-35"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: pages }).slice(0, 6).map((_, i) => {
                const n = i + 1;
                const on = n === current;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold ${
                      on ? "bg-ink text-white" : "bg-card2 text-ink/50 hover:bg-ink/10"
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
                className="grid h-7 w-7 place-items-center rounded-lg text-ink/45 disabled:opacity-35"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
