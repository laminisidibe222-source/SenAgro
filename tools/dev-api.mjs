// ─── Local API runner for SenAgro ──────────────────────────────
// Vercel runs /api/*.js as serverless functions; this reproduces that
// contract locally so `npm run dev` exercises the real handlers instead of
// a mocked fetch. Usage:
//
//   npm run dev:api        (reads .env.local, or .env, if present)
//
// The handlers get the same (req, res) shape Vercel provides, including
// res.status().json(), so what works here works in production.
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.API_PORT ?? 8788);
const API_ROOT = path.resolve(process.cwd(), "api");

const MIME = "application/json; charset=utf-8";

function decorate(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader("content-type")) res.setHeader("content-type", MIME);
    res.end(JSON.stringify(payload ?? null));
    return res;
  };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function resolveHandler(pathname) {
  // /api/pay/webhook -> <root>/pay/webhook.js
  const clean = pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  if (clean.includes("..")) return null;
  return path.join(API_ROOT, `${clean || "index"}.js`);
}

const server = http.createServer(async (req, res) => {
  decorate(res);
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (!url.pathname.startsWith("/api")) {
    return res.status(404).json({ error: "Only /api/* is served here. Run `npm run dev` for the UI." });
  }

  const file = resolveHandler(url.pathname);
  if (!file) return res.status(400).json({ error: "Bad path." });

  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND") {
      return res.status(404).json({ error: `No handler for ${url.pathname}` });
    }
    console.error(`[dev-api] failed to load ${file}:`, err);
    return res.status(500).json({ error: String(err?.message ?? err) });
  }
  if (typeof mod.default !== "function") {
    return res.status(500).json({ error: `${path.basename(file)} has no default export` });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const raw = await readBody(req);
    req.rawBody = raw;
    const type = String(req.headers["content-type"] ?? "");
    if (type.includes("application/json") && raw.length) {
      try {
        req.body = JSON.parse(raw.toString("utf8"));
      } catch {
        return res.status(400).json({ error: "Invalid JSON body." });
      }
    } else {
      req.body = raw;
    }
  }

  try {
    await mod.default(req, res);
  } catch (err) {
    console.error(`[dev-api] ${req.method} ${url.pathname} failed:`, err);
    if (!res.writableEnded) res.status(500).json({ error: String(err?.message ?? err) });
  }
});

server.listen(PORT, () => {
  console.log(`[dev-api] SenAgro API on http://localhost:${PORT}  (db driver: ${process.env.SENAGRO_DB_DRIVER ?? "neon-http"})`);
});

// Keep a friendly message instead of an EADDRINUSE stack trace.
server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(`[dev-api] port ${PORT} is already in use — set API_PORT to another value.`);
    process.exit(1);
  }
  throw err;
});
