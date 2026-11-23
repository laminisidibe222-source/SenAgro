// /api/analyses — persist parcel recommendations to Neon.
// POST { action: "save", ...fields } (requires session)
// GET /                    → list the logged-in user's analyses
import { requireAuth } from "./_lib/auth.js";
import { query } from "./_lib/db.js";
import { quotaBlock } from "./_lib/subscription.js";

async function authUser(req) {
  const auth = await requireAuth(req);
  return auth.ok ? auth.user : null;
}

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    return res.status(503).json({ error: "La base de données n'est pas encore configurée." });
  }

  if (req.method === "GET") {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: "Connexion requise." });
    const rows = await query(
      `select id, parcel_name, ph, moisture_pct, hectares, soil_type, goal, fit_score, recommendation, created_at
         from public.analyses
        where user_id = $1
        order by created_at desc
        limit 20`,
      [user.id]
    );
    return res.status(200).json({ analyses: rows });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const user = await authUser(req);
  if (!user) return res.status(401).json({ error: "Connexion requise." });

  // Free tier allows one analysis per 30 days; paid tiers are unlimited.
  const blocked = await quotaBlock(user.id);
  if (blocked) return res.status(blocked.status).json(blocked.body);

  const b = req.body ?? {};
  const recommendation = b.recommendation ?? null;
  if (!recommendation) return res.status(400).json({ error: "recommendation est requis." });

  const rows = await query(
    `insert into public.analyses
       (user_id, parcel_name, ph, moisture_pct, hectares, soil_type, goal, recommendation, fit_score)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
     returning id`,
    [
      user.id,
      b.parcel_name ? String(b.parcel_name).slice(0, 120) : null,
      b.ph != null ? Number(b.ph) : null,
      b.moisture != null ? Math.round(Number(b.moisture)) : null,
      b.hectares != null ? Number(b.hectares) : null,
      b.soil_type ? String(b.soil_type).slice(0, 60) : null,
      b.goal ? String(b.goal).slice(0, 60) : null,
      JSON.stringify(recommendation),
      b.fit_score != null ? Math.round(Number(b.fit_score)) : null,
    ]
  );
  return res.status(200).json({ ok: true, id: rows[0]?.id ?? null });
}
