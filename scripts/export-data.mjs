#!/usr/bin/env node
/**
 * 导出 Railway 数据到 JSON 文件
 */

import postgres from "postgres";
import fs from "fs";

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Usage: node scripts/export-data.mjs <DATABASE_URL>");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function exportData() {
  console.log("正在导出数据...");

  const data = {};

  // 导出所有表
  const tables = [
    "users",
    "media",
    "moments",
    "moment_media",
    "days",
    "goals",
    "moment_goals",
    "ai_conversations",
    "ai_messages",
  ];

  for (const table of tables) {
    try {
      const rows = await sql`SELECT * FROM ${sql(table)}`;
      data[table] = rows;
      console.log(`✓ ${table}: ${rows.length} 条`);
    } catch (err) {
      console.log(`✗ ${table}: ${err.message}`);
      data[table] = [];
    }
  }

  const outputPath = "./railway-data-export.json";
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n✓ 数据已导出到 ${outputPath}`);
  console.log(`文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

  await sql.end();
}

exportData().catch((err) => {
  console.error("导出失败:", err);
  process.exit(1);
});
