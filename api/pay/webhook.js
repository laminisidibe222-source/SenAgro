// /api/pay/webhook — SasPay IPN.
// Verifies X-Webhook-Signature = HMAC-SHA256 hex of `${timestamp}.${raw_body}`
// with SASPAY_WEBHOOK_SECRET, inside a ±300 s window, then moves the pending
// subscription created by /api/pay to active / failed / cancelled.
import crypto from "node:crypto";
import { query } from "../_lib/db.js";

async function readRawBody(req) {
  // The signature covers the exact bytes SasPay sent, so prefer whatever the
  // platform preserved: req.rawBody (local dev runner), then req.body, and
  // only then the stream (Vercel's Node runtime).
  if (req.rawBody) return Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody, "utf8");
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const secret = process.env.SASPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook secret not configured." });

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  if (!signature || !timestamp) return res.status(401).json({ error: "Missing signature or timestamp." });

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return res.status(401).json({ error: "Timestamp outside the 5-minute window." });
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");
  const given = Buffer.from(String(signature), "utf8");
  const want = Buffer.from(expected, "utf8");
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return res.status(401).json({ error: "Signature mismatch." });
  }

  let event = null;
  let data = null;
  try {
    const parsed = JSON.parse(rawBody.toString("utf8"));
    event = parsed?.event ?? null;
    data = parsed?.data ?? null;
  } catch {
    return res.status(400).json({ error: "Malformed JSON." });
  }

  if (!process.env.DATABASE_URL) {
    console.error("[pay/webhook] DATABASE_URL missing — cannot apply", event);
    return res.status(503).json({ error: "Database not configured." });
  }

  const sessionId = data?.checkout_session_id ?? data?.id ?? null;
  const subscriptionId = data?.metadata?.subscription_id ?? null;
  const status =
    event === "transaction.success" ? "active" : event === "transaction.cancelled" ? "cancelled" : event === "transaction.failed" ? "failed" : null;

  if (!status) {
    // Acknowledge unknown events so SasPay does not retry them forever.
    return res.status(200).json({ received: true, ignored: event });
  }

  try {
    // Matched by checkout session id, falling back to the subscription id we
    // stamped into the checkout metadata at creation time.
    const rows = await query(
      `update public.subscriptions
          set status = $1,
              provider_token = coalesce(provider_token, $2),
              current_period_end = case when $1 = 'active' then now() + interval '30 days' else current_period_end end,
              updated_at = now()
        where ($2::text is not null and provider_token = $2::text)
           or ($3::uuid is not null and id = $3::uuid)
        returning id, user_id, plan, status`,
      [status, sessionId, subscriptionId]
    );

    if (rows.length === 0) {
      console.error(
        `[pay/webhook] ${event} could not be matched to a subscription (session=${sessionId}, subscription=${subscriptionId})`
      );
      // 200 so SasPay stops retrying an event we cannot ever match.
      return res.status(200).json({ received: true, matched: 0 });
    }
    console.log(`[pay/webhook] ${event} → ${status} for ${rows.length} subscription(s)`);
    return res.status(200).json({ received: true, matched: rows.length });
  } catch (err) {
    console.error("[pay/webhook] database error:", err);
    return res.status(500).json({ error: "Could not apply the transaction." });
  }
}
