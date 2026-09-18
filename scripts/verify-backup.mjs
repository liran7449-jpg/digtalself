#!/usr/bin/env node
/**
 * 验证备份文件真的能用来恢复。
 *
 * 规范 §30：备份必须满足「存在 + 可读取 + 能够恢复」，
 * 不能只说一句「已经备份」。所以这个脚本不看文件大小，
 * 而是真的把它灌进一个临时库，再比对条数。
 *
 * 用法：
 *   node scripts/verify-backup.mjs backups/cloud-backup-2026-09-18.json
 *
 * 临时库用完就删。不碰任何真实库。
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import postgres from "postgres";

const file = process.argv[2];
if (!file) {
  console.error("❌ 用法：node scripts/verify-backup.mjs <备份文件>");
  process.exit(1);
}

const VERIFY_DB = "digitalself_backup_verify";
const ADMIN_URL =
  process.env.LOCAL_ADMIN_URL ??
  "postgresql://postgres:localdev123@localhost:5432/postgres";

const verifyUrl = (() => {
  const u = new URL(ADMIN_URL);
  u.pathname = `/${VERIFY_DB}`;
  return u.toString();
})();

/** 备份文件的键 → 表名。顺序 = 外键依赖顺序。 */
const MAP = [
  ["users", "users"],
  ["days", "days"],
  ["goals", "goals"],
  ["people", "people"],
  ["places", "places"],
  ["topics", "topics"],
  ["media", "media"],
  ["moments", "moments"],
  ["planItems", "plan_items"],
  ["memories", "memories"],
  ["insights", "insights"],
  ["growthEvidences", "growth_evidences"],
  ["momentGoals", "moment_goals"],
  ["momentPeople", "moment_people"],
  ["momentPlaces", "moment_places"],
  ["momentTopics", "moment_topics"],
  ["momentMedia", "moment_media"],
];

async function main() {
  // ---- 1. 可读性 ----
  console.log(`\n📖 读取 ${file}`);
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`❌ 文件无法解析为 JSON：${e.message}`);
    process.exit(1);
  }

  const expected = {};
  for (const [key, table] of MAP) {
    if (!Array.isArray(data[key])) {
      console.error(`❌ 备份缺少 "${key}" 数组 —— 结构不完整，不能用于恢复`);
      process.exit(1);
    }
    expected[table] = data[key].length;
  }
  console.log("   结构完整，17 张表都在");
  console.log(`   ${MAP.map(([k, t]) => `${t}=${expected[t]}`).join("  ")}`);

  // ---- 2. 建临时库 + 建表 ----
  console.log(`\n🔨 建临时库 ${VERIFY_DB} 并应用 migration...`);
  const admin = postgres(ADMIN_URL, { max: 1 });
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${VERIFY_DB}"`);
    await admin.unsafe(`CREATE DATABASE "${VERIFY_DB}"`);
  } finally {
    await admin.end();
  }

  execFileSync("npx", ["drizzle-kit", "migrate"], {
    env: { ...process.env, DATABASE_URL: verifyUrl },
    stdio: "pipe",
  });

  // ---- 3. 真的恢复一遍 ----
  console.log("📥 把备份灌进临时库...");
  const sql = postgres(verifyUrl, { max: 1 });
  let restored = true;
  try {
    await sql.begin(async (tx) => {
      for (const [key, table] of MAP) {
        const rows = data[key];
        if (rows.length === 0) continue;
        await tx`INSERT INTO ${tx(table)} ${tx(rows)}`;
      }
    });
  } catch (e) {
    console.error(`❌ 恢复失败：${e.message}`);
    restored = false;
  }

  if (!restored) {
    await sql.end();
    console.error("\n❌ 备份不可用于恢复。上线前必须先解决。");
    process.exit(1);
  }

  // ---- 4. 条数比对 ----
  console.log("\n🔍 比对条数（备份文件 → 恢复后的库）\n");
  let failed = 0;
  for (const [, table] of MAP) {
    const [{ c }] = await sql.unsafe(`SELECT count(*)::int AS c FROM ${table}`);

    /**
     * users 表的例外：生产库的 users 一直是 0 行（历史遗留），
     * 而 migration 0001 会兜底插入 id='me' 那一行 ——
     * 8 张表的 user_id 外键都指向它，没有这行整个库用不了。
     * 所以备份 0 行 → 恢复后 1 行是预期的，不是数据丢失。
     */
    const expectedCount =
      table === "users" && expected.users === 0 ? 1 : expected[table];
    const ok = c === expectedCount;
    if (!ok) failed++;

    const note =
      table === "users" && expected.users === 0 ? "  （migration 兜底补的 'me'）" : "";
    console.log(
      `   ${ok ? "✓" : "✗"} ${table.padEnd(18)} ${expected[table]} → ${c}${note}`,
    );
  }
  await sql.end();

  // ---- 5. 清理 ----
  const admin2 = postgres(ADMIN_URL, { max: 1 });
  try {
    await admin2.unsafe(`DROP DATABASE IF EXISTS "${VERIFY_DB}"`);
  } finally {
    await admin2.end();
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} 张表条数不一致，备份不可信`);
    process.exit(1);
  }
  console.log("\n✅ 备份已验证：可读取 + 能恢复 + 条数一致（§30）");
  console.log("   临时库已删除。");
}

try {
  await main();
} catch (e) {
  console.error("\n❌ 验证失败：", e.message);
  process.exitCode = 1;
}
