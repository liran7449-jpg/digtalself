/**
 * 测试用的临时库 + 临时媒体目录。
 *
 * 隔离分两层：
 * 1. vitest.config.ts 的 setupFiles（src/test/setup-env.ts）在**任何测试模块
 *    被 import 之前**设好两个 env。这一层是必需的，因为 db/client.ts 和
 *    media-repo.ts 都在模块顶层读 env，静态 import 会在 beforeAll 之前就
 *    把路径固定住。
 * 2. useTempDb() 给这个已经连上的库跑迁移，并在开头硬校验隔离是否真的生效。
 *
 * 关键：useTempDb 不再另建目录换 env —— 那样会和已建立的连接错开，
 * 导致连接指向的库没有表。它给 setupFiles 已经指定的那个库建表。
 *
 * 这两个坑都踩过，而且都是静默的：
 * - media.test.ts 把图片写进用户真实照片目录
 * - services.test.ts 把测试数据写进用户真实数据库
 * 所以有了 assertIsolated 这道会响的警报。
 */

import { readFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import Database from "better-sqlite3";

/**
 * 硬守卫：确认进程真的连在临时库上，而不是用户的真实数据。
 *
 * 万一以后配置或 import 顺序把隔离弄坏，要让测试**大声失败**，
 * 而不是静默把测试数据写进用户的日记。
 */
function assertIsolated(): void {
  const dbPath = process.env.DIGITAL_SELF_DB;
  const mediaRoot = process.env.DIGITAL_SELF_MEDIA_ROOT;
  const tmp = resolve(tmpdir());

  if (!dbPath || !resolve(dbPath).startsWith(tmp)) {
    throw new Error(
      `测试隔离失效：DIGITAL_SELF_DB = ${dbPath ?? "(未设置)"}，不在临时目录内。\n` +
        `继续跑会把测试数据写进真实数据库。检查 vitest.config.ts 的 setupFiles。`,
    );
  }
  if (!mediaRoot || !resolve(mediaRoot).startsWith(tmp)) {
    throw new Error(
      `测试隔离失效：DIGITAL_SELF_MEDIA_ROOT = ${mediaRoot ?? "(未设置)"}，不在临时目录内。\n` +
        `继续跑会把图片写进用户真实照片目录。检查 vitest.config.ts 的 setupFiles。`,
    );
  }
}

/**
 * 给 setupFiles 已指定的临时库建表。返回该库所在目录，供 dropTempDb 清理。
 */
export function useTempDb(): string {
  assertIsolated();

  const dbPath = resolve(process.env.DIGITAL_SELF_DB!);
  const dir = dirname(dbPath);
  mkdirSync(dir, { recursive: true });

  // 直接读 migration 文件并应用，绕开 drizzle-kit 在子进程里卡住的问题
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  const migrationDir = join(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    db.exec(readFileSync(join(migrationDir, file), "utf8"));
  }

  db.close();
  return dir;
}

export function dropTempDb(dir: string): void {
  // 再确认一次：只删临时目录，绝不误删项目里的东西
  if (!resolve(dir).startsWith(resolve(tmpdir()))) {
    throw new Error(`拒绝删除非临时目录：${dir}`);
  }
  rmSync(dir, { recursive: true, force: true });
}
