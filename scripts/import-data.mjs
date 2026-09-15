#!/usr/bin/env node
/**
 * 导入数据到云端 PostgreSQL
 *
 * 使用方法：
 *   CLOUD_DB_URL="postgresql://..." node scripts/import-data.mjs backup-2026-09-15.json
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';

const CLOUD_DB_URL = process.env.CLOUD_DB_URL;
if (!CLOUD_DB_URL) {
  console.error('❌ 错误：缺少 CLOUD_DB_URL 环境变量');
  console.log('\n使用方法：');
  console.log('  CLOUD_DB_URL="postgresql://..." node scripts/import-data.mjs backup-2026-09-15.json');
  process.exit(1);
}

const filename = process.argv[2];
if (!filename) {
  console.error('❌ 错误：请提供备份文件名');
  console.log('  node scripts/import-data.mjs backup-2026-09-15.json');
  process.exit(1);
}

console.log('📥 导入数据到云端数据库...\n');

const sql = postgres(CLOUD_DB_URL);
const data = JSON.parse(readFileSync(filename, 'utf8'));

try {
  // 导入基础数据（有依赖关系，按顺序）
  console.log('1️⃣ 导入 users...');
  if (data.users.length > 0) {
    await sql`INSERT INTO users ${sql(data.users)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.users.length, '条');

  console.log('2️⃣ 导入 days...');
  if (data.days.length > 0) {
    await sql`INSERT INTO days ${sql(data.days)} ON CONFLICT (date) DO NOTHING`;
  }
  console.log('  ✓', data.days.length, '条');

  console.log('3️⃣ 导入 goals...');
  if (data.goals.length > 0) {
    await sql`INSERT INTO goals ${sql(data.goals)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.goals.length, '条');

  console.log('4️⃣ 导入 people...');
  if (data.people.length > 0) {
    await sql`INSERT INTO people ${sql(data.people)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.people.length, '条');

  console.log('5️⃣ 导入 places...');
  if (data.places.length > 0) {
    await sql`INSERT INTO places ${sql(data.places)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.places.length, '条');

  console.log('6️⃣ 导入 topics...');
  if (data.topics.length > 0) {
    await sql`INSERT INTO topics ${sql(data.topics)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.topics.length, '条');

  console.log('7️⃣ 导入 media...');
  if (data.media.length > 0) {
    await sql`INSERT INTO media ${sql(data.media)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.media.length, '条');

  console.log('8️⃣ 导入 moments...');
  if (data.moments.length > 0) {
    await sql`INSERT INTO moments ${sql(data.moments)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.moments.length, '条');

  console.log('9️⃣ 导入 plan_items...');
  if (data.planItems.length > 0) {
    await sql`INSERT INTO plan_items ${sql(data.planItems)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.planItems.length, '条');

  console.log('🔟 导入 memories...');
  if (data.memories.length > 0) {
    await sql`INSERT INTO memories ${sql(data.memories)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.memories.length, '条');

  console.log('1️⃣1️⃣ 导入 insights...');
  if (data.insights.length > 0) {
    await sql`INSERT INTO insights ${sql(data.insights)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.insights.length, '条');

  console.log('1️⃣2️⃣ 导入 growth_evidences...');
  if (data.growthEvidences.length > 0) {
    await sql`INSERT INTO growth_evidences ${sql(data.growthEvidences)} ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  ✓', data.growthEvidences.length, '条');

  // 导入关联表
  console.log('🔗 导入关联数据...');

  if (data.momentGoals.length > 0) {
    await sql`INSERT INTO moment_goals ${sql(data.momentGoals)} ON CONFLICT DO NOTHING`;
  }
  console.log('  ✓ moment_goals:', data.momentGoals.length, '条');

  if (data.momentPeople.length > 0) {
    await sql`INSERT INTO moment_people ${sql(data.momentPeople)} ON CONFLICT DO NOTHING`;
  }
  console.log('  ✓ moment_people:', data.momentPeople.length, '条');

  if (data.momentPlaces.length > 0) {
    await sql`INSERT INTO moment_places ${sql(data.momentPlaces)} ON CONFLICT DO NOTHING`;
  }
  console.log('  ✓ moment_places:', data.momentPlaces.length, '条');

  if (data.momentTopics.length > 0) {
    await sql`INSERT INTO moment_topics ${sql(data.momentTopics)} ON CONFLICT DO NOTHING`;
  }
  console.log('  ✓ moment_topics:', data.momentTopics.length, '条');

  if (data.momentMedia.length > 0) {
    await sql`INSERT INTO moment_media ${sql(data.momentMedia)} ON CONFLICT DO NOTHING`;
  }
  console.log('  ✓ moment_media:', data.momentMedia.length, '条');

  console.log('\n✅ 数据导入完成！');

} catch (error) {
  console.error('❌ 导入失败：', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
