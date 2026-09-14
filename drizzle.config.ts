import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL;
const IS_POSTGRES = !!DATABASE_URL;

export default defineConfig({
  schema: IS_POSTGRES ? "./src/db/schema.pg.ts" : "./src/db/schema.ts",
  out: "./drizzle",
  dialect: IS_POSTGRES ? "postgresql" : "sqlite",
  dbCredentials: IS_POSTGRES
    ? {
        url: DATABASE_URL!,
      }
    : {
        url: process.env.DIGITAL_SELF_DB ?? "./data/digital-self.db",
      },
  strict: true,
  verbose: true,
});
