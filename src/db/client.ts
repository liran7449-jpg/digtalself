/**
 * 数据库连接客户端
 *
 * 根据环境变量自动选择数据库：
 * - DATABASE_URL 存在 → PostgreSQL（生产环境）
 * - 否则 → SQLite（本地开发）
 *
 * dev 模式下 Next 会热重载模块，用 globalThis 缓存连接避免句柄泄漏。
 */

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schemaSQLite from "./schema";
import * as schemaPostgres from "./schema.pg";

const DATABASE_URL = process.env.DATABASE_URL;
const IS_POSTGRES = !!DATABASE_URL;

// 根据数据库类型导出对应的 schema
export const schema = IS_POSTGRES ? schemaPostgres : schemaSQLite;

// SQLite 路径（本地开发用）
const DB_PATH = process.env.DIGITAL_SELF_DB
  ? resolve(process.env.DIGITAL_SELF_DB)
  : resolve(process.cwd(), "data", "digital-self.db");

// SQLite 连接函数
function connectSQLite() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

// 全局缓存
const globalForDb = globalThis as unknown as {
  __digitalSelfDb?: any;
  __digitalSelfSqlite?: Database.Database;
  __digitalSelfPostgres?: ReturnType<typeof postgres>;
};

// 创建数据库连接
let dbInstance: any;
let rawSqlite: Database.Database | undefined;
let rawPostgres: ReturnType<typeof postgres> | undefined;

if (IS_POSTGRES) {
  // PostgreSQL 连接
  console.log("📦 连接到 PostgreSQL 数据库");
  const client = globalForDb.__digitalSelfPostgres ?? postgres(DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__digitalSelfPostgres = client;
  }

  dbInstance = drizzlePostgres(client, { schema: schemaPostgres });
  rawPostgres = client;
} else {
  // SQLite 连接
  console.log("📦 连接到 SQLite 数据库");
  const sqlite = globalForDb.__digitalSelfSqlite ?? connectSQLite();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__digitalSelfSqlite = sqlite;
  }

  dbInstance = drizzleSQLite(sqlite, { schema: schemaSQLite });
  rawSqlite = sqlite;
}

export const db = dbInstance;
export { rawSqlite, rawPostgres, DB_PATH };
export type Database = typeof db;
