/**
 * 测试库准备与清理。
 *
 * 隔离分两层：
 * 1. vitest.config.ts 的 setupFiles（src/test/setup-env.ts）在**任何测试
 *    模块被 import 之前**把 DATABASE_URL 指向 digitalself_test。这一层是
 *    必需的，因为 db/client.ts 在模块顶层读 env，import 就会定连接。
 * 2. useTempDb() 硬校验隔离是否真的生效，然后把库清空建表。
 *
 * ⚠️ 守卫检查的变量必须是代码实际使用的变量。
 * 2026-09-18 之前这里查的是 DIGITAL_SELF_DB（SQLite 时代遗留），
 * 而 db/client.ts 早已改读 DATABASE_URL。于是守卫全绿通过，测试
 * 同时连在用户的真实开发库上，写进 19 条 moment。守卫查错了变量
 * 比没有守卫更危险 —— 它给的是虚假的安全感。
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import postgres from "postgres";

/** 表顺序 = 外键依赖顺序，清空时倒序（先子后父）。 */
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

/**
 * 硬守卫：确认进程真的连在测试库上，而不是用户的真实数据。
 *
 * 判据是**库名必须以 _test 结尾**。这条规则的好处是不管地址怎么变
 * （本地 / CI / 容器），意图都写在库名里，一眼能看出来。
 *
 * 万一以后配置或 import 顺序把隔离弄坏，要让测试**大声失败**，
 * 而不是静默把测试数据写进用户的日记。
 */
function assertIsolated(): void {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "测试隔离失效：DATABASE_URL 未设置。\n" +
        "应该由 vitest.config.ts 的 setupFiles（src/test/setup-env.ts）设好。",
    );
  }

  let dbName: string;
  try {
    dbName = new URL(url).pathname.replace(/^\//, "");
  } catch {
    throw new Error(`测试隔离失效：DATABASE_URL 不是合法 URL：${url}`);
  }

  if (!dbName.endsWith("_test")) {
    throw new Error(
      `测试隔离失效：数据库名 "${dbName}" 不以 _test 结尾。\n` +
        `继续跑会把测试数据写进真实数据库（2026-09-18 就这么丢过一次）。\n` +
        `DATABASE_URL = ${url.replace(/:[^:@]+@/, ":***@")}\n` +
        `检查 src/test/setup-env.ts，或设置 TEST_DATABASE_URL 指向 *_test 库。`,
    );
  }

  const mediaRoot = process.env.DIGITAL_SELF_MEDIA_ROOT;
  if (!mediaRoot || !resolve(mediaRoot).startsWith(resolve(tmpdir()))) {
    throw new Error(
      `测试隔离失效：DIGITAL_SELF_MEDIA_ROOT = ${mediaRoot ?? "(未设置)"}，不在临时目录内。\n` +
        `继续跑会把图片写进用户真实照片目录。检查 vitest.config.ts 的 setupFiles。`,
    );
  }
}

/** 从连接串里换掉库名，用来连 postgres 维护库去 CREATE DATABASE。 */
function withDatabase(url: string, dbName: string): string {
  const u = new URL(url);
  u.pathname = `/${dbName}`;
  return u.toString();
}

let schemaReady = false;

/**
 * 准备测试库：不存在就建库，然后应用 migration 建表。
 *
 * 建表走 drizzle-kit migrate（跟生产同一套 migration），而不是手写
 * CREATE TABLE —— 那样两边会漂移，测试就测不到真实结构。
 * 一个 vitest 进程内只做一次，之后各测试文件只需清空数据。
 */
async function ensureSchema(url: string): Promise<void> {
  if (schemaReady) return;

  const dbName = new URL(url).pathname.replace(/^\//, "");

  // 建库（连维护库 postgres 执行）
  const admin = postgres(withDatabase(url, "postgres"), { max: 1 });
  try {
    const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (exists.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  // 建表：和生产共用 drizzle/ 里的 migration
  execFileSync("npx", ["drizzle-kit", "migrate"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  // updated_at 触发器不在 migration 里，靠脚本装（只装有该列的表）
  execFileSync("npx", ["tsx", "scripts/setup-pg-triggers.ts"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  schemaReady = true;
}

/**
 * 清空测试库的所有表，返回媒体临时目录供 dropTempDb 清理。
 *
 * 名字保留 useTempDb 是为了不动 4 个测试文件的调用点；
 * 现在的语义是「准备一个干净的测试库」。
 */
export async function useTempDb(): Promise<string> {
  assertIsolated();

  const url = process.env.DATABASE_URL!;
  await ensureSchema(url);

  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe(`TRUNCATE TABLE ${[...TABLES].reverse().map((t) => `"${t}"`).join(", ")} CASCADE`);
  } finally {
    await sql.end();
  }

  const mediaRoot = process.env.DIGITAL_SELF_MEDIA_ROOT!;
  mkdirSync(mediaRoot, { recursive: true });
  return dirname(mediaRoot);
}

export function dropTempDb(dir: string): void {
  // 再确认一次：只删临时目录，绝不误删项目里的东西
  if (!resolve(dir).startsWith(resolve(tmpdir()))) {
    throw new Error(`拒绝删除非临时目录：${dir}`);
  }
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
