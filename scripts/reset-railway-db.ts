/**
 * 重置 Railway PostgreSQL 数据库
 * 删除所有表并重新创建
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ 请设置 DATABASE_URL 环境变量");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    console.log("🗑️  删除所有表...");

    // 删除所有表（按依赖顺序）
    await sql`DROP TABLE IF EXISTS moment_topics CASCADE`;
    await sql`DROP TABLE IF EXISTS moment_people CASCADE`;
    await sql`DROP TABLE IF EXISTS moment_places CASCADE`;
    await sql`DROP TABLE IF EXISTS moment_media CASCADE`;
    await sql`DROP TABLE IF EXISTS moments CASCADE`;
    await sql`DROP TABLE IF EXISTS plan_items CASCADE`;
    await sql`DROP TABLE IF EXISTS goals CASCADE`;
    await sql`DROP TABLE IF EXISTS days CASCADE`;
    await sql`DROP TABLE IF EXISTS memories CASCADE`;
    await sql`DROP TABLE IF EXISTS topics CASCADE`;
    await sql`DROP TABLE IF EXISTS people CASCADE`;
    await sql`DROP TABLE IF EXISTS places CASCADE`;
    await sql`DROP TABLE IF EXISTS media CASCADE`;
    await sql`DROP TABLE IF EXISTS insights CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    console.log("✅ 所有表已删除");
    console.log("\n📝 现在运行: npm run db:push");

  } catch (error) {
    console.error("❌ 错误:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
