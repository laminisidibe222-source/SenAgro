// SenAgro — Schéma Neon (Postgres serverless) via Drizzle ORM
// Appliquer avec : npm run db:push
import {
  pgTable, uuid, text, timestamp, integer, numeric, jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  parcelName: text("parcel_name"),
  ph: numeric("ph", { precision: 4, scale: 2 }),
  moisturePct: integer("moisture_pct"),
  hectares: numeric("hectares", { precision: 10, scale: 2 }),
  soilType: text("soil_type"),
  goal: text("goal"),
  recommendation: jsonb("recommendation").notNull(),
  fitScore: integer("fit_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "pro", "elite"] }).notNull().default("free"),
  status: text("status", { enum: ["pending", "active", "failed", "cancelled"] }).notNull().default("pending"),
  provider: text("provider").notNull().default("saspay"),
  providerToken: text("provider_token"),
  amountXof: integer("amount_xof"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parcels = pgTable("parcels", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  hectares: numeric("hectares", { precision: 10, scale: 2 }),
  soilType: text("soil_type"),
  ph: numeric("ph", { precision: 4, scale: 2 }),
  centerLat: numeric("center_lat", { precision: 9, scale: 6 }),
  centerLng: numeric("center_lng", { precision: 9, scale: 6 }),
  ndvi: integer("ndvi"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Parcel = typeof parcels.$inferSelect;
