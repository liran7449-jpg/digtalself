/**
 * 测试用的临时库 + 临时媒体目录。
 *
 * 两个 env 都必须在 import repositories 之前设好：
 * - DIGITAL_SELF_DB：否则 db/client.ts 连到真实的 data/digital-self.db
 * - DIGITAL_SELF_MEDIA_ROOT：否则 media-repo.ts 把文件写进真实的 data/media/
 *
 * 后者是踩过的坑：media-repo 在模块顶层读这个 env（`const MEDIA_ROOT = ...`），
 * 一旦模块先被 import，之后再改 env 就没用了。测试必须用动态 import()。
 */

import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { readdirSync } from "node:fs";

export function useTempDb(): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-test-"));
  const dbPath = join(dir, "test.db");
  process.env.DIGITAL_SELF_DB = dbPath;
  // 媒体文件也隔离到临时目录，绝不碰用户真实的照片
  process.env.DIGITAL_SELF_MEDIA_ROOT = join(dir, "media");

  // 直接读取 migration 文件并应用，避免 drizzle-kit 卡住
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  const migrationDir = join(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationDir, file), "utf8");
    db.exec(sql);
  }

  db.close();
  return dir;
}

export function dropTempDb(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
