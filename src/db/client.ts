/**
 * 数据库连接客户端（PostgreSQL）
 *
 * dev 模式下 Next 会热重载模块，用 globalThis 缓存连接避免句柄泄漏。
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL 环境变量未设置。\n" +
    "请在 .env.local 中配置：\n" +
    "DATABASE_URL=postgresql://postgres:localdev123@localhost:5432/digitalself\n\n" +
    "本地开发需要启动 PostgreSQL：docker compose up -d"
  );
}

// 全局缓存
const globalForDb = globalThis as unknown as {
  __digitalSelfPostgres?: ReturnType<typeof postgres>;
};

console.log("📦 连接到 PostgreSQL 数据库");

const client = globalForDb.__digitalSelfPostgres ?? postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__digitalSelfPostgres = client;
}

export const db = drizzle(client, { schema });
export const rawPostgres = client;
export { schema };
export type Database = typeof db;
