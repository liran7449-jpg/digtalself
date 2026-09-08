import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DIGITAL_SELF_DB ?? "./data/digital-self.db",
  },
  strict: true,
  verbose: true,
});
