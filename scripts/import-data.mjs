#!/usr/bin/env node
/**
 * 导入 Railway 导出的数据到 Vercel Supabase
 */

import postgres from "postgres";
import fs from "fs";

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
const dataFile = process.argv[3] || "./railway-data-export.json";

if (!databaseUrl) {
  console.error("Usage: node scripts/import-data.mjs <DATABASE_URL> [data-file.json]");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function importData() {
  console.log(`正在从 ${dataFile} 导入数据...\n`);

  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  // 导入顺序很重要（外键依赖）
  const importOrder = [
    "users",
    "media",
    "days",
    "goals",
    "moments",
    "moment_media",
    "moment_goals",
    "ai_conversations",
    "ai_messages",
  ];

  for (const table of importOrder) {
    const rows = data[table] || [];
    if (rows.length === 0) {
      console.log(`⊘ ${table}: 无数据`);
      continue;
    }

    try {
      // 批量插入
      await sql`INSERT INTO ${sql(table)} ${sql(rows)}`;
      console.log(`✓ ${table}: 导入 ${rows.length} 条`);
    } catch (err) {
      console.error(`✗ ${table}: ${err.message}`);
      // 继续导入其他表
    }
  }

  console.log(`\n✓ 数据导入完成`);
  await sql.end();
}

importData().catch((err) => {
  console.error("导入失败:", err);
  process.exit(1);
});
