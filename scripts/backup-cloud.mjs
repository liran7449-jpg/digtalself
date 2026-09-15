#!/usr/bin/env node
/**
 * 备份云端生产数据
 * 建议每周运行一次：node scripts/backup-cloud.mjs
 */

import postgres from 'postgres';
import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';

const CLOUD_DB_URL = process.env.CLOUD_DB_URL || 'postgresql://postgres:FUQtDjndJKLGNVcWByupxCSsnPOKEWIb@tokaido.proxy.rlwy.net:55374/railway';
const sql = postgres(CLOUD_DB_URL);

console.log('☁️  备份云端生产数据...\n');

try {
  // 导出所有表
  const users = await sql`SELECT * FROM users`;
  const days = await sql`SELECT * FROM days`;
  const moments = await sql`SELECT * FROM moments ORDER BY occurred_at`;
  const goals = await sql`SELECT * FROM goals`;
  const planItems = await sql`SELECT * FROM plan_items`;
  const memories = await sql`SELECT * FROM memories`;
  const insights = await sql`SELECT * FROM insights`;
  const people = await sql`SELECT * FROM people`;
  const places = await sql`SELECT * FROM places`;
  const topics = await sql`SELECT * FROM topics`;
  const media = await sql`SELECT * FROM media`;

  // 导出关联表
  const momentGoals = await sql`SELECT * FROM moment_goals`;
  const momentPeople = await sql`SELECT * FROM moment_people`;
  const momentPlaces = await sql`SELECT * FROM moment_places`;
  const momentTopics = await sql`SELECT * FROM moment_topics`;
  const momentMedia = await sql`SELECT * FROM moment_media`;
  const growthEvidences = await sql`SELECT * FROM growth_evidences`;

  const data = {
    exportedAt: new Date().toISOString(),
    users,
    days,
    moments,
    goals,
    planItems,
    memories,
    insights,
    people,
    places,
    topics,
    media,
    momentGoals,
    momentPeople,
    momentPlaces,
    momentTopics,
    momentMedia,
    growthEvidences,
  };

  // 创建备份目录
  mkdirSync('backups', { recursive: true });

  // 保存备份
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `backups/cloud-backup-${timestamp}.json`;
  writeFileSync(filename, JSON.stringify(data, null, 2));

  console.log('✅ 备份成功：', filename);
  console.log('\n📊 数据统计：');
  console.log('  Moments:', moments.length);
  console.log('  Days:', days.length);
  console.log('  Goals:', goals.length);
  console.log('  Plan Items:', planItems.length);
  console.log('  People:', people.length);
  console.log('  Places:', places.length);
  console.log('  Topics:', topics.length);
  console.log('  Media:', media.length);
  console.log('\n💾 定期备份很重要！建议每周运行一次。\n');

} catch (error) {
  console.error('❌ 备份失败：', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
