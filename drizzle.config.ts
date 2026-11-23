import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@ep-placeholder.aws.neon.tech/senagro?sslmode=require",
  },
  strict: true,
  verbose: true,
});
