// /api/auth — app-level auth (Neon + JWT, FR UI on the client).
// POST { action: "signup" | "signin" | "me", ...fields }
import { query } from "./_lib/db.js";
import {
  hashPassword,
  verifyPassword,
  findUserByEmail,
  findUserById,
  sessionPayload,
  requireAuth,
} from "./_lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "DATABASE_URL n'est pas encore configuré côté serveur." });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ error: "JWT_SECRET n'est pas encore configuré côté serveur." });
  }

  const body = req.body ?? {};
  const action = String(body.action ?? "").trim().toLowerCase();

  switch (action) {
    case "signup": {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const name = String(body.name ?? "").trim();

      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });
      if (password.length < MIN_PASSWORD_LEN)
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });

      const existing = await findUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Un compte existe déjà pour cet e-mail." });

      const passwordHash = await hashPassword(password);
      const rows = await query(
        "insert into public.users (email, password_hash, name) values ($1, $2, $3) returning id, email, name",
        [email, passwordHash, name || null]
      );
      const user = rows[0];
      if (!user?.id) return res.status(500).json({ error: "Échec de la création du compte." });
      return res.status(200).json(sessionPayload(user));
    }

    case "signin": {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!EMAIL_RE.test(email) || !password)
        return res.status(400).json({ error: "E-mail et mot de passe requis." });

      const user = await findUserByEmail(email);
      const ok = user ? await verifyPassword(password, user.password_hash) : false;
      if (!user || !ok) return res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
      return res.status(200).json(sessionPayload(user));
    }

    case "me": {
      const auth = await requireAuth(req);
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
      const user = await findUserById(auth.user.id);
      if (!user) return res.status(404).json({ error: "Compte introuvable." });
      return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name ?? "" } });
    }

    default:
      return res.status(400).json({ error: `Action d'authentification inconnue : "${action}".` });
  }
}
