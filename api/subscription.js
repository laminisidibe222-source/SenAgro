// /api/subscription — the signed-in user's plan and remaining quota.
// GET → { plan, status, currentPeriodEnd, limits, analysesLast30d }
import { requireAuth } from "./_lib/auth.js";
import { getPlan, analysesLast30d } from "./_lib/subscription.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    return res.status(503).json({ error: "La base de données n'est pas encore configurée." });
  }

  const auth = await requireAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const plan = await getPlan(auth.user.id);
  const used = await analysesLast30d(auth.user.id);
  const limit = plan.limits.analysesPer30d;

  return res.status(200).json({
    ...plan,
    analysesLast30d: used,
    remaining: limit === null ? null : Math.max(0, limit - used),
  });
}
