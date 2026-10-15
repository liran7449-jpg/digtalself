#!/usr/bin/env node
/**
 * 清空数据库所有表
 */

import postgres from "postgres";

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Usage: node scripts/clear-data.mjs <DATABASE_URL>");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function clearData() {
  console.log("正在清空数据库...\n");

  const tables = [
    "ai_messages",
    "ai_conversations",
    "moment_goals",
    "moment_media",
    "moments",
    "goals",
    "days",
    "users",
  ];

  for (const table of tables) {
    try {
      await sql`DELETE FROM ${sql(table)}`;
      console.log(`✓ ${table}: 已清空`);
    } catch (err) {
      console.error(`✗ ${table}: ${err.message}`);
    }
  }

  console.log(`\n✓ 数据库已清空`);
  await sql.end();
}

clearData().catch((err) => {
  console.error("清空失败:", err);
  process.exit(1);
});
