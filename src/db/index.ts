/**
 * 数据库连接适配层
 *
 * 根据环境变量自动选择数据库：
 * - DATABASE_URL 存在 → 使用 PostgreSQL
 * - 否则 → 使用 SQLite (本地开发)
 */

import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import Database from "better-sqlite3";
import postgres from "postgres";

import * as schemaSQLite from "./schema";
import * as schemaPostgres from "./schema.pg";

const DATABASE_URL = process.env.DATABASE_URL;
const IS_POSTGRES = !!DATABASE_URL;

// 根据数据库类型导出对应的 schema
export const schema = IS_POSTGRES ? schemaPostgres : schemaSQLite;

// 创建数据库连接
let dbInstance: any;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (IS_POSTGRES) {
    // PostgreSQL 连接
    console.log("📦 使用 PostgreSQL 数据库");
    const client = postgres(DATABASE_URL!, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    dbInstance = drizzlePostgres(client, { schema: schemaPostgres });
  } else {
    // SQLite 连接
    console.log("📦 使用 SQLite 数据库");
    const dbPath = process.env.DIGITAL_SELF_DB ?? "./data/digital-self.db";
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    dbInstance = drizzleSQLite(sqlite, { schema: schemaSQLite });
  }

  return dbInstance;
}

export const db = getDb();

// 导出数据库类型（用于类型推断）
export type Database = ReturnType<typeof getDb>;
