#!/usr/bin/env node
/**
 * 在生产数据的副本上演练 migration。
 *
 * 规范 §13 要求迁移前后比对数据完整性。这个脚本把生产数据完整拷进
 * 一个本地副本库，跑 migration，然后逐表比对条数和归属。
 *
 * 生产库全程只读。副本是本地的，随便炸。
 *
 * 用法：
 *   CLOUD_DB_URL="postgresql://..." node scripts/rehearse-migration.mjs
 *
 * 副本库名固定 digitalself_rehearsal，每次运行重建。
 */

import { execFileSync } from "node:child_process";
import postgres from "postgres";
import { connectCloud, maskUrl } from "./cloud-db.mjs";

const REHEARSAL_DB = "digitalself_rehearsal";
const LOCAL_ADMIN =
  process.env.LOCAL_ADMIN_URL ??
  "postgresql://postgres:localdev123@localhost:5432/postgres";

const rehearsalUrl = (() => {
  const u = new URL(LOCAL_ADMIN);
  u.pathname = `/${REHEARSAL_DB}`;
  return u.toString();
})();

/** 表顺序 = 外键依赖顺序。 */
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

/** migration 之后应该带 user_id 的表。 */
const USER_SCOPED = [
  "days",
  "goals",
  "growth_evidences",
  "insights",
  "media",
  "memories",
  "moments",
  "people",
  "places",
  "plan_items",
  "topics",
];

const cloud = connectCloud();

async function main() {
  // ---- 1. 生产库只读快照 ----
  console.log("\n☁️  读取生产数据（只读）...");
  const snapshot = {};
  const before = {};
  for (const t of TABLES) {
    const rows = await cloud.unsafe(`SELECT * FROM ${t}`);
    snapshot[t] = rows;
    before[t] = rows.length;
  }
  console.log(`   ${TABLES.map((t) => `${t}=${before[t]}`).join("  ")}`);

  // ---- 2. 重建副本库 ----
  console.log(`\n🔨 重建副本库 ${REHEARSAL_DB}...`);
  const admin = postgres(LOCAL_ADMIN, { max: 1 });
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${REHEARSAL_DB}"`);
    await admin.unsafe(`CREATE DATABASE "${REHEARSAL_DB}"`);
  } finally {
    await admin.end();
  }

  // ---- 3. 建基线结构（迁移前的样子）----
  // 只跑 0000 基线，先让副本长成生产现在的形状
  console.log("   应用基线结构 0000...");
  const rehearsal = postgres(rehearsalUrl, { max: 1 });
  const baselineSql = (await import("node:fs")).readFileSync(
    "drizzle/0000_pg_baseline.sql",
    "utf8",
  );
  for (const stmt of baselineSql.split("--> statement-breakpoint")) {
    if (stmt.trim()) await rehearsal.unsafe(stmt);
  }

  // ---- 4. 灌入生产数据 ----
  console.log("   灌入生产数据...");
  await rehearsal.begin(async (tx) => {
    for (const t of TABLES) {
      if (snapshot[t].length === 0) continue;
      await tx`INSERT INTO ${tx(t)} ${tx(snapshot[t])}`;
    }
  });

  // users 为空时补出 'me'，跟 restore 脚本同一个理由
  if (snapshot.users.length === 0) {
    await rehearsal`INSERT INTO users (id, name) VALUES ('me', 'Ran')`;
    console.log("   ℹ️  生产 users 为空，副本补出 id='me'");
  }
  await rehearsal.end();

  // 标记基线已应用，让 migrate 从 0001 开始
  console.log("   标记基线...");
  execFileSync("node", ["scripts/baseline-mark.mjs"], {
    env: { ...process.env, DATABASE_URL: rehearsalUrl },
    stdio: "pipe",
  });

  // ---- 5. 跑 migration（真正要验证的东西）----
  console.log("\n🚀 执行 migration 0001_multi_user...");
  try {
    execFileSync("npx", ["drizzle-kit", "migrate"], {
      env: { ...process.env, DATABASE_URL: rehearsalUrl },
      stdio: "pipe",
    });
    console.log("   ✅ migration 执行成功");
  } catch (e) {
    console.error("   ❌ migration 失败：");
    console.error(e.stdout?.toString() ?? "");
    console.error(e.stderr?.toString() ?? "");
    process.exit(1);
  }

  // ---- 6. 完整性校验（§31）----
  console.log("\n🔍 数据完整性校验\n");
  const after = postgres(rehearsalUrl, { max: 1 });
  let failed = 0;

  console.log("   条数比对（生产 → 迁移后）：");
  for (const t of TABLES) {
    const [{ c }] = await after.unsafe(`SELECT count(*)::int AS c FROM ${t}`);
    // users 表若生产为空，副本补了一行
    const expected = t === "users" && before.users === 0 ? 1 : before[t];
    const ok = c === expected;
    if (!ok) failed++;
    console.log(`     ${ok ? "✓" : "✗"} ${t.padEnd(18)} ${before[t]} → ${c}`);
  }

  console.log("\n   归属校验（所有行都应属于 'me'）：");
  for (const t of USER_SCOPED) {
    const [{ c }] = await after.unsafe(
      `SELECT count(*)::int AS c FROM ${t} WHERE user_id IS DISTINCT FROM 'me'`,
    );
    const ok = c === 0;
    if (!ok) failed++;
    console.log(`     ${ok ? "✓" : "✗"} ${t.padEnd(18)} 非 me 的行: ${c}`);
  }

  console.log("\n   users 表登录字段：");
  const [u] = await after`SELECT id, username, must_change_password FROM users WHERE id = 'me'`;
  const userOk = u?.username === "ran";
  if (!userOk) failed++;
  console.log(`     ${userOk ? "✓" : "✗"} id=me username=${u?.username} must_change=${u?.must_change_password}`);

  console.log("\n   days 复合主键：");
  const [pk] = await after`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='days' AND constraint_type='PRIMARY KEY'
  `;
  const pkCols = await after`
    SELECT column_name FROM information_schema.key_column_usage
    WHERE constraint_name = ${pk.constraint_name} ORDER BY ordinal_position
  `;
  const pkOk = pkCols.map((r) => r.column_name).join(",") === "user_id,date";
  if (!pkOk) failed++;
  console.log(`     ${pkOk ? "✓" : "✗"} ${pk.constraint_name} = (${pkCols.map((r) => r.column_name).join(", ")})`);

  await after.end();

  if (failed > 0) {
    console.error(`\n❌ ${failed} 项校验未通过，migration 不可用于生产`);
    process.exit(1);
  }
  console.log("\n✅ 全部通过。migration 在生产数据副本上验证成功。");
  console.log(`   副本保留在 ${REHEARSAL_DB}，可以连上去手工检查。`);
  console.log(`   ${maskUrl(rehearsalUrl)}`);
}

try {
  await main();
} catch (e) {
  console.error("\n❌ 演练失败：", e.message);
  process.exitCode = 1;
} finally {
  await cloud.end();
}
