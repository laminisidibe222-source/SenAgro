// ─── End-to-end check of the money path ────────────────────────
// Covers the parts unit tests cannot: session JWTs, the free-tier quota,
// checkout attribution and the signed SasPay webhook.
//
// Prerequisites:
//   1. Postgres running and the schema applied (see README)
//   2. `node tools/stub-saspay.mjs` (or a real SASPAY_BASE_URL)
//   3. the API with:
//        DATABASE_URL=… SENAGRO_DB_DRIVER=pg JWT_SECRET=… \
//        SASPAY_API_KEY=sk_test_local SASPAY_BASE_URL=http://localhost:9999 \
//        SASPAY_WEBHOOK_SECRET=whsec_test_local npm run dev:api
//   4. `npm run test:e2e`
import crypto from "node:crypto";

const BASE = process.env.E2E_API ?? "http://localhost:8788/api";
const SECRET = process.env.SASPAY_WEBHOOK_SECRET ?? "whsec_test_local";

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });

async function call(path, { body, method, token, raw, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: method ?? (body || raw ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

const sign = (payload) => {
  const raw = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", SECRET).update(`${ts}.${raw}`).digest("hex");
  return { raw, headers: { "x-webhook-signature": signature, "x-webhook-timestamp": ts } };
};

const email = `e2e+${Date.now()}@senagro.test`;
const password = "senagro123";

// signup
const su = await call("/auth", { body: { action: "signup", email, password, name: "Awa Diop" } });
const token = su.body?.session?.access_token;
check("signup returns a session", su.status === 200 && Boolean(token), `${su.status}`);

// free plan
const p1 = await call("/subscription", { token });
check("new account is free with 1 analysis", p1.body?.plan === "free" && p1.body?.remaining === 1, JSON.stringify(p1.body));

// quota: first allowed, second blocked
const rec = { crop: "Arachide", reason: "x", score: 88, water: "Moyenne", pH: "5.3–6.8", plan: ["a"] };
const a1 = await call("/analyses", { token, body: { parcel_name: "P1", ph: 6.1, moisture: 40, hectares: 5, soil_type: "sandy", goal: "cash", recommendation: rec, fit_score: 88 } });
check("first analysis accepted", a1.status === 200 && Boolean(a1.body?.id), `${a1.status}`);
const a2 = await call("/analyses", { token, body: { parcel_name: "P2", ph: 6, recommendation: rec, fit_score: 80 } });
check("second analysis blocked (402)", a2.status === 402 && a2.body?.code === "PLAN_LIMIT", `${a2.status}`);
const other = await call("/analyses", { method: "GET" });
check("analysis list requires a session", other.status === 401, `${other.status}`);

// checkout requires auth
const anon = await call("/pay", { body: { plan: "pro" } });
check("checkout without a session is 401", anon.status === 401, `${anon.status}`);

// checkout creates a pending row
const pay = await call("/pay", { token, body: { plan: "pro" } });
check("checkout returns a hosted URL", pay.status === 200 && Boolean(pay.body?.checkout_url), `${pay.status}`);
const sessionId = pay.body?.session_id;

// webhook signature rules
const success = { event: "transaction.success", data: { checkout_session_id: sessionId, metadata: { plan: "pro" } } };
const badSig = await call("/pay/webhook", { raw: JSON.stringify(success), headers: { "x-webhook-signature": "deadbeef", "x-webhook-timestamp": String(Math.floor(Date.now() / 1000)) } });
check("webhook rejects a bad signature", badSig.status === 401, `${badSig.status}`);

const staleTs = String(Math.floor(Date.now() / 1000) - 900);
const staleRaw = JSON.stringify(success);
const staleSig = crypto.createHmac("sha256", SECRET).update(`${staleTs}.${staleRaw}`).digest("hex");
const stale = await call("/pay/webhook", { raw: staleRaw, headers: { "x-webhook-signature": staleSig, "x-webhook-timestamp": staleTs } });
check("webhook rejects a stale timestamp", stale.status === 401, `${stale.status}`);

// valid webhook activates the plan
const signed = sign(success);
const hook = await call("/pay/webhook", { raw: signed.raw, headers: signed.headers });
check("webhook activates the subscription", hook.status === 200 && hook.body?.matched === 1, JSON.stringify(hook.body));

const p2 = await call("/subscription", { token });
check("plan upgraded to pro (unlimited)", p2.body?.plan === "pro" && p2.body?.remaining === null, JSON.stringify(p2.body));
check("period end is set", Boolean(p2.body?.currentPeriodEnd), String(p2.body?.currentPeriodEnd));

const a3 = await call("/analyses", { token, body: { parcel_name: "P3", ph: 6.4, recommendation: rec, fit_score: 81 } });
check("quota lifted for pro", a3.status === 200, `${a3.status}`);

// idempotency and duplicate purchase
const replay = await call("/pay/webhook", { raw: signed.raw, headers: signed.headers });
check("webhook replay is idempotent", replay.status === 200 && replay.body?.matched === 1, JSON.stringify(replay.body));
const again = await call("/pay", { token, body: { plan: "pro" } });
check("buying the same plan twice is 409", again.status === 409, `${again.status}`);

// cancellation downgrades
const cancelled = sign({ event: "transaction.cancelled", data: { checkout_session_id: sessionId } });
const cancel = await call("/pay/webhook", { raw: cancelled.raw, headers: cancelled.headers });
const p3 = await call("/subscription", { token });
check("cancellation drops back to free", cancel.status === 200 && p3.body?.plan === "free", JSON.stringify(p3.body));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  <-- ${r.detail}`}`);
console.log(`\n${results.length - failed.length}/${results.length} passed  (${email})`);
process.exit(failed.length ? 1 : 0);
