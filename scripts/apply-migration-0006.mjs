#!/usr/bin/env node
/**
 * 手动执行 0006 迁移，建 AI 对话表。
 * 用法：node scripts/apply-migration-0006.mjs
 */

import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL 未设置");
  console.error("在项目根目录运行：export $(grep -v '^#' .env.local | xargs) && node scripts/apply-migration-0006.mjs");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

try {
  const migration = readFileSync(join(root, "drizzle/0006_amazing_nuke.sql"), "utf8");

  console.log("正在执行 migration 0006...");
  await sql.unsafe(migration);

  console.log("✓ Migration 0006 applied");

  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
    ORDER BY tablename
  `;

  console.log("✓ AI tables created:", tables.map((r) => r.tablename).join(", "));

  await sql.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  await sql.end();
  process.exit(1);
}
