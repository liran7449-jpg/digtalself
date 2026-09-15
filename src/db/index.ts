/**
 * 数据库连接适配层
 *
 * 统一使用 PostgreSQL
 */

import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// 导出 schema
export { schema };

// 创建数据库连接
let dbInstance: any;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log("📦 使用 PostgreSQL 数据库");
  const client = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  dbInstance = drizzlePostgres(client, { schema });

  return dbInstance;
}

export const db = getDb();

// 导出数据库类型（用于类型推断）
export type Database = ReturnType<typeof getDb>;
