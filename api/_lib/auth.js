// ─── App-level auth for SenAgro ────────────────────────────────
// HS256 JWT sessions + bcrypt password hashes, Neon Postgres storage.
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "./db.js";

const JWT_SECRET = () => process.env.JWT_SECRET ?? "";
const SESSION_TTL = "7d";

export function signSessionToken({ sub, email, name }) {
  const secret = JWT_SECRET();
  if (!secret) throw new Error("JWT_SECRET is not configured on the server.");
  return jwt.sign({ sub, email, name }, secret, { algorithm: "HS256", expiresIn: SESSION_TTL });
}

export function verifySessionToken(token) {
  const secret = JWT_SECRET();
  if (!secret) throw new Error("JWT_SECRET is not configured on the server.");
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}

export function bearerToken(req) {
  const header = req.headers.authorization ?? req.headers.Authorization ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(String(header).trim());
  return m ? m[1] : null;
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function findUserByEmail(email) {
  const rows = await query("select * from public.users where email = $1 limit 1", [
    String(email).trim().toLowerCase(),
  ]);
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const rows = await query("select * from public.users where id = $1 limit 1", [id]);
  return rows[0] ?? null;
}

/** Build the session payload both client and server understand. */
export function sessionPayload(user) {
  const access_token = signSessionToken({ sub: user.id, email: user.email, name: user.name ?? "" });
  return {
    session: {
      access_token,
      token_type: "bearer",
      user: { id: user.id, email: user.email, name: user.name ?? "" },
    },
    user: { id: user.id, email: user.email, name: user.name ?? "" },
  };
}

/** Require a valid session — returns { ok, status, error?, user? }. */
export async function requireAuth(req) {
  const token = bearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Connexion requise." };
  try {
    const payload = verifySessionToken(token);
    const user = await findUserById(payload.sub);
    if (!user) return { ok: false, status: 401, error: "Compte introuvable." };
    return { ok: true, user: { id: user.id, email: user.email, name: user.name ?? "" } };
  } catch {
    return { ok: false, status: 401, error: "Session expirée ou invalide." };
  }
}
