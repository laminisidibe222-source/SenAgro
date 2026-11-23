// /api/pay — create a SasPay hosted checkout session for a plan.
// Requires a session: the pending subscriptions row is what the webhook later
// flips to active, so an anonymous checkout could never grant anything.
// Override only for a sandbox/stub: SASPAY_BASE_URL=http://localhost:9999
const SASPAY_BASE = (process.env.SASPAY_BASE_URL ?? "https://api.saspay.me/api/v1").replace(/\/+$/, "");

const PLANS = {
  pro: { amount: 9000, label: "SenAgro Professionnel — mensuel", plan: "pro" },
  elite: { amount: 25000, label: "SenAgro Domaine — mensuel", plan: "elite" },
};

function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.VITE_APP_URL ?? "http://localhost:5173").replace(/\/+$/, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    return res.status(503).json({ error: "La base de données n'est pas encore configurée." });
  }
  const apiKey = process.env.SASPAY_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "SasPay is not configured yet. Set SASPAY_API_KEY on the server." });
  }

  // Imported lazily so a missing env var cannot crash module load.
  const { requireAuth } = await import("./_lib/auth.js");
  const { query } = await import("./_lib/db.js");
  const { getPlan } = await import("./_lib/subscription.js");

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return res.status(401).json({ error: "Connectez-vous pour passer à un forfait payant." });
  }
  const user = auth.user;

  const planId = String(req.body?.plan ?? "").toLowerCase();
  const config = PLANS[planId];
  if (!config) return res.status(400).json({ error: "Unknown plan. Use 'pro' or 'elite'." });

  const current = await getPlan(user.id);
  if (current.plan === config.plan) {
    return res.status(409).json({ error: `Vous êtes déjà sur le forfait ${current.limits.label}.` });
  }

  const base = appBaseUrl();
  let sessionId = null;
  let checkoutUrl = null;

  try {
    const r = await fetch(`${SASPAY_BASE}/checkout-sessions/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `senagro-${planId}-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        amount: config.amount.toFixed(2),
        currency: "XOF",
        country: "SN",
        description: config.label,
        customer_email: user.email,
        customer_name: user.name || "SenAgro Farmer",
        return_url: `${base}/pricing?checkout=success`,
        metadata: { plan: config.plan, user_id: user.id },
      }),
    });
    const payload = await r.json().catch(() => null);
    sessionId = payload?.data?.id ?? null;
    checkoutUrl = payload?.data?.checkout_url ?? null;
    if (!r.ok || !sessionId || !checkoutUrl) {
      console.error("[pay] SasPay create-session failed:", JSON.stringify(payload));
      return res.status(502).json({ error: "SasPay could not create the checkout session.", details: payload });
    }
  } catch (err) {
    console.error("[pay] error:", err);
    return res.status(500).json({ error: "Payment is temporarily unavailable." });
  }

  // The webhook activates the row keyed by provider_token = checkout session id.
  try {
    const rows = await query(
      `insert into public.subscriptions
         (user_id, plan, status, provider, provider_token, amount_xof, updated_at)
       values ($1, $2, 'pending', 'saspay', $3, $4, now())
       returning id`,
      [user.id, config.plan, sessionId, config.amount]
    );
    return res.status(200).json({
      checkout_url: checkoutUrl,
      session_id: sessionId,
      subscription_id: rows[0]?.id ?? null,
      plan: config.plan,
    });
  } catch (err) {
    console.error("[pay] could not record the pending subscription:", err);
    // The checkout is already live; failing here would leave a paid user with
    // no row, so say so plainly instead of pretending it worked.
    return res.status(500).json({
      error: "Paiement créé mais non rattaché à votre compte. Contactez le support avant de payer.",
      session_id: sessionId,
    });
  }
}
