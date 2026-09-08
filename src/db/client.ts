/**
 * SQLite 连接。仅服务端使用。
 *
 * 数据文件默认落在项目根 data/digital-self.db，可用 DIGITAL_SELF_DB 覆盖。
 * dev 模式下 Next 会热重载模块，用 globalThis 缓存连接避免句柄泄漏。
 */

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH = process.env.DIGITAL_SELF_DB
  ? resolve(process.env.DIGITAL_SELF_DB)
  : resolve(process.cwd(), "data", "digital-self.db");

function connect() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  // WAL 提升并发读性能；foreign_keys 默认关闭，必须显式打开才能让 references 生效
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

const globalForDb = globalThis as unknown as {
  __digitalSelfSqlite?: Database.Database;
};

const sqlite = globalForDb.__digitalSelfSqlite ?? connect();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__digitalSelfSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export const rawSqlite = sqlite;
export { DB_PATH };
