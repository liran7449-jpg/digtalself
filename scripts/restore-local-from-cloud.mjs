#!/usr/bin/env node
/**
 * 用云端生产数据重建本地开发库。
 *
 * 为什么需要这个脚本：本地开发库被测试残留污染过两轮（9-16、9-18），
 * 真实数据和测试数据混在一起无法区分。云端是权威源，重新拉一份最干净。
 *
 * 安全设计：
 * - 云端只读。整个脚本对 CLOUD_DB_URL 只发 SELECT，一条写操作都没有。
 * - 目标库硬校验必须是 localhost，防止手滑把生产库当成目标清空。
 * - 导入前自动存一份 JSON 快照到 backups/，失败也能回头查。
 * - 导入后逐表比对条数，不一致直接非零退出（规范 §31）。
 *
 * 用法：
 *   CLOUD_DB_URL="postgresql://..." node scripts/restore-local-from-cloud.mjs
 *
 * 目标库取自 DATABASE_URL，默认本地 docker compose 那个。
 */

import postgres from "postgres";
import { writeFileSync, mkdirSync } from "node:fs";

const CLOUD_DB_URL = process.env.CLOUD_DB_URL;
const LOCAL_DB_URL = process.env.DATABASE_URL;

if (!CLOUD_DB_URL) {
  console.error("❌ 缺少 CLOUD_DB_URL（云端只读数据源）");
  process.exit(1);
}
if (!LOCAL_DB_URL) {
  console.error("❌ 缺少 DATABASE_URL（本地目标库）");
  process.exit(1);
}

/**
 * 硬守卫：目标库必须在本机。
 *
 * 这个脚本会 TRUNCATE 目标库的每一张表。如果哪天有人图省事
 * 把 DATABASE_URL 指到生产，这里是唯一挡得住的地方。
 */
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(LOCAL_DB_URL)) {
  console.error("❌ 拒绝执行：目标库不在 localhost。");
  console.error(`   DATABASE_URL = ${LOCAL_DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  console.error("   这个脚本会清空目标库所有表，只允许对本地库执行。");
  process.exit(1);
}

/**
 * 表顺序 = 外键依赖顺序。
 * 导入按这个顺序正序（先父后子），清空按倒序（先子后父）。
 */
const TABLES = [
  "users",
  "days",
  "goals",
  "people",
  "places",
  "topics",
  "media",
  "moments",
  "plan_items",
  "memories",
  "insights",
  "growth_evidences",
  "moment_goals",
  "moment_people",
  "moment_places",
  "moment_topics",
  "moment_media",
];

const cloud = postgres(CLOUD_DB_URL, { ssl: "prefer" });
const local = postgres(LOCAL_DB_URL);

async function main() {
  // ---- 1. 云端只读导出 ----
  console.log("☁️  从云端读取（只读）...\n");
  const snapshot = {};
  const cloudCounts = {};
  for (const t of TABLES) {
    const rows = await cloud.unsafe(`SELECT * FROM ${t}`);
    snapshot[t] = rows;
    cloudCounts[t] = rows.length;
    console.log(`   ${t.padEnd(18)} ${rows.length}`);
  }

  // ---- 2. 快照落盘（先备份再动目标库）----
  mkdirSync("backups", { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const snapPath = `backups/cloud-snapshot-${stamp}.json`;
  writeFileSync(
    snapPath,
    JSON.stringify({ exportedAt: new Date().toISOString(), ...snapshot }, null, 2),
  );
  console.log(`\n💾 快照已存：${snapPath}`);

  // ---- 3. 清空本地并导入（单事务，失败自动回滚）----
  console.log("\n🗑️  清空本地库并导入...");
  await local.begin(async (tx) => {
    // 倒序清空：先删子表再删父表
    for (const t of [...TABLES].reverse()) {
      await tx.unsafe(`TRUNCATE TABLE ${t} CASCADE`);
    }

    for (const t of TABLES) {
      const rows = snapshot[t];
      if (rows.length === 0) continue;
      /**
       * 必须用标签模板而不是 tx.unsafe：tx(rows) 返回的是 postgres.js
       * 的内部辅助对象，只有标签模板会把它展开成列名和参数占位符。
       * 塞进 unsafe 的字符串里会被 toString 成 "Object" 然后语法报错。
       * 表名不能参数化，所以用 tx(t) 让驱动做标识符转义。
       */
      await tx`INSERT INTO ${tx(t)} ${tx(rows)}`;
    }
  });

  /**
   * users 兜底：云端 users 表是空的（历史遗留），但 user-repo 的
   * getOrCreate 依赖 id='me' 这行存在，而 media 等表已有 user_id 外键。
   * 缺这行会让应用第一次访问时才报错，所以在这里补齐。
   */
  if (snapshot.users.length === 0) {
    await local`INSERT INTO users (id, name) VALUES ('me', 'Ran') ON CONFLICT (id) DO NOTHING`;
    console.log("   ℹ️  云端 users 为空，已补 id='me' 这行");
  }

  // ---- 4. 条数校验（规范 §31）----
  console.log("\n🔍 校验条数（云端 vs 本地）...\n");
  let failed = 0;
  for (const t of TABLES) {
    const [{ c }] = await local.unsafe(`SELECT count(*)::int AS c FROM ${t}`);
    const expected = t === "users" && cloudCounts.users === 0 ? 1 : cloudCounts[t];
    const ok = c === expected;
    if (!ok) failed++;
    console.log(`   ${ok ? "✓" : "✗"} ${t.padEnd(18)} 云端 ${cloudCounts[t]} → 本地 ${c}`);
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} 张表条数不一致，恢复失败`);
    process.exit(1);
  }
  console.log("\n✅ 全部一致，本地库已重建");
}

try {
  await main();
} catch (e) {
  console.error("\n❌ 失败：", e.message);
  process.exitCode = 1;
} finally {
  await Promise.all([cloud.end(), local.end()]);
}
