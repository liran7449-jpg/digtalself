#!/usr/bin/env node
/**
 * 把已有数据的数据库标记为「基线已应用」，不实际执行基线 SQL。
 *
 * 为什么需要这一步：
 * 生产库和本地库的表都是 `drizzle-kit push` 直推出来的，没有 migration 记录。
 * `drizzle/0000_pg_baseline.sql` 是从这套现存结构反向生成的，里面 17 个
 * CREATE TABLE 都没有 IF NOT EXISTS —— 对已有数据的库执行会直接报错。
 *
 * 所以基线的正确用法分两种：
 * - 空库（比如测试库）：正常执行，建出全部表。
 * - 已有数据的库（生产 / 本地开发）：跳过执行，只写入记录，
 *   让后续 migration 从 0001 开始接着跑。这个脚本做的就是后者。
 *
 * 幂等：已经标记过就跳过，重复运行安全。
 *
 * 用法：
 *   DATABASE_URL="postgresql://..." node scripts/baseline-mark.mjs
 *   DATABASE_URL="postgresql://..." node scripts/baseline-mark.mjs --dry-run
 */

import crypto from "node:crypto";
import fs from "node:fs";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ 缺少 DATABASE_URL");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const MIGRATIONS_DIR = "drizzle";

/**
 * 哈希算法必须跟 drizzle-orm 的 migrator 完全一致，否则它会认为
 * 这条 migration 没跑过。参见 node_modules/drizzle-orm/migrator.js:
 * sha256 覆盖整个 .sql 文件原文，不做任何规范化。
 */
function readJournal() {
  const journal = JSON.parse(
    fs.readFileSync(`${MIGRATIONS_DIR}/meta/_journal.json`, "utf8"),
  );
  return journal.entries.map((e) => {
    const sqlText = fs.readFileSync(`${MIGRATIONS_DIR}/${e.tag}.sql`, "utf8");
    return {
      tag: e.tag,
      folderMillis: e.when,
      hash: crypto.createHash("sha256").update(sqlText).digest("hex"),
    };
  });
}

const sql = postgres(DATABASE_URL, { ssl: "prefer" });

async function main() {
  const entries = readJournal();
  const baseline = entries[0];
  if (!baseline) {
    console.error("❌ journal 里没有任何 migration");
    process.exit(1);
  }
  if (entries.length > 1) {
    console.log(`ℹ️  journal 有 ${entries.length} 条，只标记第一条（基线）：`);
    console.log("   后续 migration 应该用 drizzle-kit migrate 正常执行。");
  }

  console.log(`\n目标库：${DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`);
  console.log(`基线：  ${baseline.tag}`);
  console.log(`哈希：  ${baseline.hash.slice(0, 16)}...`);

  // 先确认这个库确实已经有表了 —— 空库不该走这个脚本
  const [{ c: tableCount }] = await sql`
    SELECT count(*)::int AS c FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  console.log(`已有表：${tableCount} 张`);

  if (tableCount === 0) {
    console.error("\n❌ 这是个空库，不该标记基线。");
    console.error("   空库请直接执行：npx drizzle-kit migrate");
    process.exit(1);
  }

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const existing = await sql`
    SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at
  `;

  if (existing.some((r) => r.hash === baseline.hash)) {
    console.log("\n✅ 基线已经标记过，无需重复（幂等）");
    return;
  }
  if (existing.length > 0) {
    console.error("\n❌ migration 表里已有其他记录，但不含这条基线：");
    existing.forEach((r) => console.error(`   ${r.hash.slice(0, 16)}... @ ${r.created_at}`));
    console.error("   状态不明，先人工确认，不自动写入。");
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("\n🔍 --dry-run：不写入。将要插入的记录：");
    console.log(`   hash = ${baseline.hash}`);
    console.log(`   created_at = ${baseline.folderMillis}`);
    return;
  }

  await sql`
    INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
    VALUES (${baseline.hash}, ${baseline.folderMillis})
  `;
  console.log("\n✅ 已标记基线。后续 migration 会从下一条开始执行。");
}

try {
  await main();
} catch (e) {
  console.error("\n❌ 失败：", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
