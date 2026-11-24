# SenAgro — Agricultural Intelligence SaaS

Stop guessing. Start growing. SenAgro reads soil, climate and biology and tells you
what to plant, where to plant it, and what to do for the next 12 weeks.

French UI, XOF pricing (Wave · Orange Money · card via SasPay), serverless API on Neon.

## Stack

- **Frontend** — React 18 + Vite + TypeScript + Tailwind, Three.js soil-core hero,
  Lenis smooth scroll, HashRouter.
- **API** — Vercel-style serverless handlers in `api/` (plain Node, no framework).
- **Database** — Postgres (Neon over HTTP in production, any Postgres locally).
- **Payments** — SasPay hosted checkout + signed IPN webhook.

## Run it

```bash
npm install

# 1. a database — either a Neon project, or local Postgres:
docker run -d --name senagro-db -p 5433:5432 \
  -e POSTGRES_PASSWORD=senagro -e POSTGRES_DB=senagro postgres:16

# 2. configuration
cp .env.example .env.local      # then edit DATABASE_URL + JWT_SECRET

# 3. schema
npm run db:push                 # drizzle-kit
# or, without drizzle: psql "$DATABASE_URL" -f db/schema.sql

# 4. run the UI (5173) and the API (8788) together
npm run dev
```

`npm run dev` starts both halves with `concurrently`. The Vite dev server proxies
`/api` to `tools/dev-api.mjs`, which runs the production handlers with the same
`(req, res)` contract Vercel uses — so a route that works locally works deployed.

Local Postgres needs one extra line in `.env.local`:

```
SENAGRO_DB_DRIVER=pg
```

Without it the API expects a Neon HTTP endpoint.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | API (8788) + Vite (5173) together |
| `npm run dev:api` / `dev:web` | one half only |
| `npm run build` | typecheck (`tsc -b`) + production bundle in `dist/` |
| `npm run preview` | serve the built bundle |
| `npm run db:push` | apply `db/schema.ts` to the database |
| `npm run db:generate` | generate Drizzle SQL migrations |
| `npm run test:e2e` | 16 end-to-end checks of auth, quota, checkout and webhook (needs the API running) |

## API

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/auth` | — | `{action:"signup"\|"signin"\|"me"}` → JWT session |
| `GET /api/subscription` | yes | plan, expiry, quota used/remaining |
| `POST /api/analyses` | yes | save a parcel recommendation (quota-checked) |
| `GET /api/analyses` | yes | last 20 analyses for the account |
| `POST /api/pay` | yes | create a SasPay checkout + pending subscription row |
| `POST /api/pay/webhook` | signature | SasPay IPN → activate / fail / cancel a plan |

Sessions are HS256 JWTs (`Authorization: Bearer …`), 7-day expiry, stored in
`localStorage` under `senagro.session`.

## Plans and quotas

| Plan | Price | Analyses per 30 days |
|---|---|---|
| Pousse (free) | 0 | 1 |
| Professionnel | 9 000 XOF / mois | unlimited |
| Domaine | 25 000 XOF / mois | unlimited |

The limit is enforced server-side in `api/_lib/subscription.js`, not in the UI:
a second analysis on the free tier returns `402` with `code:"PLAN_LIMIT"`, and the
Analyze page turns that into an upgrade banner.

## Payments

1. `POST /api/pay` requires a session, asks SasPay for a checkout session, and
   immediately writes a `subscriptions` row with `status='pending'` and
   `provider_token` = the SasPay checkout session id. Without that row a webhook
   could never grant anything — anonymous checkouts used to be lost.
2. The user pays on SasPay's hosted page (Wave, Orange Money, card).
3. SasPay calls `POST /api/pay/webhook`. The handler verifies
   `X-Webhook-Signature` = HMAC-SHA256 of `"{timestamp}.{raw body}"` with
   `SASPAY_WEBHOOK_SECRET`, rejects timestamps outside ±300 s, then flips the
   matching row to `active` with a 30-day period. Repeat deliveries are safe
   (same row, same status); unknown events are acknowledged and ignored.
4. `transaction.failed` / `transaction.cancelled` mark the row and the account
   drops back to the free tier.

Buying a plan you already hold returns `409` instead of creating a second row.

## Data model

`users` · `parcels` · `analyses` · `subscriptions` — see `db/schema.ts`
(Drizzle) or `db/schema.sql` (plain SQL). Deleting a user cascades to their
parcels, analyses and subscriptions.

## Security notes

- Passwords are bcrypt (cost 10); hashes never leave the server.
- `DATABASE_URL`, `JWT_SECRET`, `SASPAY_API_KEY` and `SASPAY_WEBHOOK_SECRET` are
  server-only. Vite exposes nothing but `VITE_*`.
- Every `/api/analyses` and `/api/subscription` query is scoped to the JWT subject,
  and each analysis insert takes `user_id` from the token, not from the body.
- Webhook body is read raw so the signature covers exactly what was sent, and the
  comparison is `timingSafeEqual`.
- `.env*` is git-ignored; `.env.example` documents the variables.

## Deploy

1. Push the repo, import it in Vercel (framework: Vite).
2. Environment variables: `DATABASE_URL`, `JWT_SECRET`, `APP_URL`,
   `SASPAY_API_KEY`, `SASPAY_WEBHOOK_SECRET`.
3. `npm run db:push` against the production database.
4. Register `https://<domain>/api/pay/webhook` in the SasPay dashboard for
   `transaction.success`, `transaction.failed`, `transaction.cancelled`.
5. `vercel.json` already rewrites unknown paths to `index.html` for the SPA and
   keeps `api/` as real functions.

## Notes

- The Analyze engine is deterministic and offline: same parcel inputs, same
  recommendation. No model keys required.
- Theme: warm paper page (`#FAF8F2`), white cards, ink text, gold as fill and
  `#7A5A08` as the readable accent on light backgrounds. All colours live in
  `tailwind.config.js` and the `:root` variables in `src/index.css`; the 3D hero
  uses non-additive blending because additive particles are invisible on white.
- Photography is self-hosted: `public/crops/*.jpg` (7 crops) and
  `public/scenes/*.jpg` (2 backgrounds), referenced by `src/lib/crops.ts` and the
  auth/before-after panels. Sources are Wikimedia Commons — check and add the
  per-file author/licence credits before a commercial launch.
- Layout is checked at 390 / 1440 px with no horizontal overflow.
