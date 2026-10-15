#!/usr/bin/env node
/**
 * 只导入 media 和 moment_media 表
 */

import postgres from "postgres";
import fs from "fs";

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
const dataFile = process.argv[3] || "./railway-data-export.json";

if (!databaseUrl) {
  console.error("Usage: node scripts/import-media.mjs <DATABASE_URL> [data-file.json]");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function importMedia() {
  console.log(`正在从 ${dataFile} 导入媒体数据...\n`);

  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  // 只导入 media 和 moment_media
  const tables = ["media", "moment_media"];

  for (const table of tables) {
    const rows = data[table] || [];
    if (rows.length === 0) {
      console.log(`⊘ ${table}: 无数据`);
      continue;
    }

    try {
      await sql`INSERT INTO ${sql(table)} ${sql(rows)}`;
      console.log(`✓ ${table}: 导入 ${rows.length} 条`);
    } catch (err) {
      console.error(`✗ ${table}: ${err.message}`);
    }
  }

  console.log(`\n✓ 媒体数据导入完成`);
  await sql.end();
}

importMedia().catch((err) => {
  console.error("导入失败:", err);
  process.exit(1);
});
