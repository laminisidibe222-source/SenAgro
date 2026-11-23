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

export async function query(text, params = []) {
  return getSql()(text, params);
}
