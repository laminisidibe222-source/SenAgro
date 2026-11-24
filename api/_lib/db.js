// ─── Database access for SenAgro ───────────────────────────────
// The browser never holds DATABASE_URL — every query goes through the
// serverless functions in /api (scoped to the session user).
//
// Production: Neon serverless Postgres over HTTP (no TCP pool to keep warm).
// Local dev:   any Postgres on a normal connection string. Start one with
//              docker run -d --name senagro-db -p 5433:5432 \
//                -e POSTGRES_PASSWORD=senagro postgres:16
//              then set SENAGRO_DB_DRIVER=pg to use it.
import { neon } from "@neondatabase/serverless";
import pg from "pg";

let runner = null;

function buildRunner() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured on the server.");
  }
  if (process.env.SENAGRO_DB_DRIVER === "pg") {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /sslmode=require/.test(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : undefined,
    });
    return async (text, params = []) => (await pool.query(text, params)).rows;
  }
  const sql = neon(process.env.DATABASE_URL);
  return (text, params = []) => sql(text, params);
}

export function getSql() {
  if (!runner) runner = buildRunner();
  return runner;
}

// Neon suspends idle computes; the first request after a pause can lose the
// TCP/TLS handshake ("fetch failed" / ETIMEDOUT) before the statement lands.
// Retrying is safe: the query never reached Postgres.
const RETRYABLE = /fetch failed|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up/i;

function isConnectionError(err) {
  if (!err) return false;
  if (err.code && ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(err.code)) return true;
  return RETRYABLE.test(String(err.message ?? "")) || RETRYABLE.test(String(err.cause?.message ?? ""));
}

export async function query(text, params = [], { retries = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await getSql()(text, params);
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isConnectionError(err)) throw err;
      await new Promise((r) => setTimeout(r, 300 * 3 ** attempt)); // 300ms, 900ms, 2.7s
    }
  }
  throw lastError;
}
