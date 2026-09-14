/**
 * SQLite → PostgreSQL 数据迁移脚本
 *
 * 使用方法：
 *   DATABASE_URL="postgresql://..." npm run migrate:to-postgres
 *
 * 注意：
 * - 会清空目标 PostgreSQL 数据库的所有表
 * - 迁移前请确保已备份数据
 * - 图片文件需要单独迁移到 R2
 */

import { resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schemaSQLite from "../src/db/schema";
import * as schemaPostgres from "../src/db/schema.pg";

// 检查环境变量
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ 错误：缺少 DATABASE_URL 环境变量");
  console.log("使用方法：DATABASE_URL='postgresql://...' npm run migrate:to-postgres");
  process.exit(1);
}

const SQLITE_PATH = process.env.DIGITAL_SELF_DB ?? "./data/digital-self.db";

console.log("🚀 开始数据迁移：SQLite → PostgreSQL");
console.log(`📁 SQLite 路径: ${SQLITE_PATH}`);
console.log(`🗄️  PostgreSQL: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

async function migrate() {
  // 连接 SQLite（源数据库）
  const sqlitePath = resolve(process.cwd(), SQLITE_PATH);
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");
  const sourceDb = drizzleSQLite(sqlite, { schema: schemaSQLite });

  console.log("✅ 已连接到 SQLite 源数据库");

  // 连接 PostgreSQL（目标数据库）
  const pgClient = postgres(DATABASE_URL, {
    max: 1,
  });
  const targetDb = drizzlePostgres(pgClient, { schema: schemaPostgres });

  console.log("✅ 已连接到 PostgreSQL 目标数据库\n");

  try {
    // 读取 SQLite 数据
    console.log("📖 读取 SQLite 数据...");

    const users = await sourceDb.select().from(schemaSQLite.users);
    const days = await sourceDb.select().from(schemaSQLite.days);
    const goals = await sourceDb.select().from(schemaSQLite.goals);
    const planItems = await sourceDb.select().from(schemaSQLite.planItems);
    const moments = await sourceDb.select().from(schemaSQLite.moments);
    const memories = await sourceDb.select().from(schemaSQLite.memories);
    const insights = await sourceDb.select().from(schemaSQLite.insights);
    const people = await sourceDb.select().from(schemaSQLite.people);
    const places = await sourceDb.select().from(schemaSQLite.places);
    const topics = await sourceDb.select().from(schemaSQLite.topics);
    const media = await sourceDb.select().from(schemaSQLite.media);
    const growthEvidences = await sourceDb.select().from(schemaSQLite.growthEvidences);

    // 关联表
    const momentPeople = await sourceDb.select().from(schemaSQLite.momentPeople);
    const momentPlaces = await sourceDb.select().from(schemaSQLite.momentPlaces);
    const momentTopics = await sourceDb.select().from(schemaSQLite.momentTopics);
    const momentGoals = await sourceDb.select().from(schemaSQLite.momentGoals);
    const momentMedia = await sourceDb.select().from(schemaSQLite.momentMedia);

    console.log(`  ✓ Users: ${users.length}`);
    console.log(`  ✓ Days: ${days.length}`);
    console.log(`  ✓ Goals: ${goals.length}`);
    console.log(`  ✓ Plan Items: ${planItems.length}`);
    console.log(`  ✓ Moments: ${moments.length}`);
    console.log(`  ✓ Memories: ${memories.length}`);
    console.log(`  ✓ Insights: ${insights.length}`);
    console.log(`  ✓ People: ${people.length}`);
    console.log(`  ✓ Places: ${places.length}`);
    console.log(`  ✓ Topics: ${topics.length}`);
    console.log(`  ✓ Media: ${media.length}`);
    console.log(`  ✓ Growth Evidences: ${growthEvidences.length}\n`);

    // 清空目标数据库（按依赖顺序删除）
    console.log("🗑️  清空 PostgreSQL 数据库...");

    await targetDb.delete(schemaPostgres.momentMedia);
    await targetDb.delete(schemaPostgres.momentGoals);
    await targetDb.delete(schemaPostgres.momentTopics);
    await targetDb.delete(schemaPostgres.momentPlaces);
    await targetDb.delete(schemaPostgres.momentPeople);
    await targetDb.delete(schemaPostgres.growthEvidences);
    await targetDb.delete(schemaPostgres.media);
    await targetDb.delete(schemaPostgres.topics);
    await targetDb.delete(schemaPostgres.places);
    await targetDb.delete(schemaPostgres.people);
    await targetDb.delete(schemaPostgres.insights);
    await targetDb.delete(schemaPostgres.memories);
    await targetDb.delete(schemaPostgres.moments);
    await targetDb.delete(schemaPostgres.planItems);
    await targetDb.delete(schemaPostgres.goals);
    await targetDb.delete(schemaPostgres.days);
    await targetDb.delete(schemaPostgres.users);

    console.log("  ✓ 已清空所有表\n");

    // 插入数据到 PostgreSQL（按依赖顺序）
    console.log("📝 写入数据到 PostgreSQL...");

    if (users.length > 0) {
      await targetDb.insert(schemaPostgres.users).values(users);
      console.log(`  ✓ Users: ${users.length}`);
    }

    if (days.length > 0) {
      await targetDb.insert(schemaPostgres.days).values(days);
      console.log(`  ✓ Days: ${days.length}`);
    }

    if (goals.length > 0) {
      await targetDb.insert(schemaPostgres.goals).values(goals);
      console.log(`  ✓ Goals: ${goals.length}`);
    }

    if (planItems.length > 0) {
      await targetDb.insert(schemaPostgres.planItems).values(planItems);
      console.log(`  ✓ Plan Items: ${planItems.length}`);
    }

    if (moments.length > 0) {
      await targetDb.insert(schemaPostgres.moments).values(moments);
      console.log(`  ✓ Moments: ${moments.length}`);
    }

    if (memories.length > 0) {
      await targetDb.insert(schemaPostgres.memories).values(memories);
      console.log(`  ✓ Memories: ${memories.length}`);
    }

    if (insights.length > 0) {
      await targetDb.insert(schemaPostgres.insights).values(insights);
      console.log(`  ✓ Insights: ${insights.length}`);
    }

    if (people.length > 0) {
      await targetDb.insert(schemaPostgres.people).values(people);
      console.log(`  ✓ People: ${people.length}`);
    }

    if (places.length > 0) {
      await targetDb.insert(schemaPostgres.places).values(places);
      console.log(`  ✓ Places: ${places.length}`);
    }

    if (topics.length > 0) {
      await targetDb.insert(schemaPostgres.topics).values(topics);
      console.log(`  ✓ Topics: ${topics.length}`);
    }

    if (media.length > 0) {
      await targetDb.insert(schemaPostgres.media).values(media);
      console.log(`  ✓ Media: ${media.length}`);
    }

    if (growthEvidences.length > 0) {
      await targetDb.insert(schemaPostgres.growthEvidences).values(growthEvidences);
      console.log(`  ✓ Growth Evidences: ${growthEvidences.length}`);
    }

    // 关联表
    if (momentPeople.length > 0) {
      await targetDb.insert(schemaPostgres.momentPeople).values(momentPeople);
      console.log(`  ✓ Moment-People: ${momentPeople.length}`);
    }

    if (momentPlaces.length > 0) {
      await targetDb.insert(schemaPostgres.momentPlaces).values(momentPlaces);
      console.log(`  ✓ Moment-Places: ${momentPlaces.length}`);
    }

    if (momentTopics.length > 0) {
      await targetDb.insert(schemaPostgres.momentTopics).values(momentTopics);
      console.log(`  ✓ Moment-Topics: ${momentTopics.length}`);
    }

    if (momentGoals.length > 0) {
      await targetDb.insert(schemaPostgres.momentGoals).values(momentGoals);
      console.log(`  ✓ Moment-Goals: ${momentGoals.length}`);
    }

    if (momentMedia.length > 0) {
      await targetDb.insert(schemaPostgres.momentMedia).values(momentMedia);
      console.log(`  ✓ Moment-Media: ${momentMedia.length}`);
    }

    console.log("\n✅ 数据迁移完成！");
    console.log("\n⚠️  下一步：");
    console.log("  1. 验证数据完整性");
    console.log("  2. 迁移图片文件到 Cloudflare R2");
    console.log("  3. 更新应用环境变量");

  } catch (error) {
    console.error("\n❌ 迁移失败：", error);
    throw error;
  } finally {
    // 关闭连接
    sqlite.close();
    await pgClient.end();
    console.log("\n🔌 已断开数据库连接");
  }
}

migrate()
  .then(() => {
    console.log("\n🎉 迁移脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 迁移脚本失败：", error);
    process.exit(1);
  });
