-- SenAgro — portable schema (equivalent to db/schema.ts).
-- Use this when drizzle-kit is not available, e.g. a plain Postgres or a
-- psql session against Neon. `npm run db:push` applies db/schema.ts instead.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text,
  created_at    timestamptz not null default now()
);

create table if not exists public.parcels (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  label      text not null,
  hectares   numeric(10,2),
  soil_type  text,
  ph         numeric(4,2),
  center_lat numeric(9,6),
  center_lng numeric(9,6),
  ndvi       integer,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users(id) on delete cascade,
  parcel_name    text,
  ph             numeric(4,2),
  moisture_pct   integer,
  hectares       numeric(10,2),
  soil_type      text,
  goal           text,
  recommendation jsonb not null,
  fit_score      integer,
  created_at     timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.users(id) on delete cascade,
  plan               text not null default 'free' check (plan in ('free','pro','elite')),
  status             text not null default 'pending' check (status in ('pending','active','failed','cancelled')),
  provider           text not null default 'saspay',
  provider_token     text,
  amount_xof         integer,
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Lookups used by the API on every request.
create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
-- The webhook resolves a checkout session id to the row it must activate.
create unique index if not exists subscriptions_provider_token_idx
  on public.subscriptions (provider_token)
  where provider_token is not null;
