// ─── Plan state and quota helpers ──────────────────────────────
// A subscription row is only meaningful while it is active and not past its
// period end. Everything else (no row, pending, failed, expired) is free tier.
import { query } from "./db.js";

export const PLAN_LIMITS = {
  free: { label: "Pousse", analysesPer30d: 1 },
  pro: { label: "Professionnel", analysesPer30d: null },
  elite: { label: "Domaine", analysesPer30d: null },
};

const FREE = { plan: "free", status: "free", currentPeriodEnd: null, limits: PLAN_LIMITS.free };

export async function getPlan(userId) {
  const rows = await query(
    `select plan, status, current_period_end
       from public.subscriptions
      where user_id = $1
        and status = 'active'
        and (current_period_end is null or current_period_end > now())
      order by current_period_end desc nulls last
      limit 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return FREE;
  return {
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    limits: PLAN_LIMITS[row.plan] ?? PLAN_LIMITS.free,
  };
}

export async function analysesLast30d(userId) {
  const rows = await query(
    `select count(*)::int as n
       from public.analyses
      where user_id = $1 and created_at > now() - interval '30 days'`,
    [userId]
  );
  return rows[0]?.n ?? 0;
}

/**
 * Returns null when the user may run another analysis, or the 402 payload
 * the client renders as an upgrade prompt.
 */
export async function quotaBlock(userId) {
  const plan = await getPlan(userId);
  if (plan.limits.analysesPer30d === null) return null;
  const used = await analysesLast30d(userId);
  if (used < plan.limits.analysesPer30d) return null;
  return {
    status: 402,
    body: {
      error: `Le forfait ${plan.limits.label} est limité à ${plan.limits.analysesPer30d} analyse par mois. Passez à Professionnel pour analyser sans limite.`,
      code: "PLAN_LIMIT",
      plan: plan.plan,
      limit: plan.limits.analysesPer30d,
      used,
    },
  };
}
