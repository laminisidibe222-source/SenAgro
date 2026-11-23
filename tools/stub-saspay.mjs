// ─── Local SasPay stand-in (sandbox only) ──────────────────────
// Answers POST /checkout-sessions/ with a fake session id and checkout URL so
// the payment flow can be tested without touching the real provider.
//   node tools/stub-saspay.mjs
//   SASPAY_API_KEY=sk_test_local SASPAY_BASE_URL=http://localhost:9999
import http from "node:http";
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Bearer sk_test")) {
      res.writeHead(401, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "bad key" }));
    }
    const parsed = JSON.parse(body || "{}");
    const id = "cs_test_" + Math.random().toString(36).slice(2, 10);
    console.log("[stub saspay] checkout", parsed.metadata?.plan, parsed.amount, "->", id);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ data: { id, checkout_url: `http://localhost:9999/checkout/${id}` } }));
  });
}).listen(9999, () => console.log("stub saspay on 9999"));
