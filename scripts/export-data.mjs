#!/usr/bin/env node
/**
 * 导出本地 PostgreSQL 数据为 JSON
 * 用于同步到云端数据库
 */

import postgres from 'postgres';
import { writeFileSync } from 'fs';

const LOCAL_DB = 'postgresql://postgres:localdev123@localhost:5432/digitalself';
const sql = postgres(LOCAL_DB);

console.log('📦 导出本地数据...\n');

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

const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
writeFileSync(filename, JSON.stringify(data, null, 2));

console.log('✅ 数据导出成功：', filename);
console.log('\n📊 数据统计：');
console.log('  Users:', users.length);
console.log('  Days:', days.length);
console.log('  Moments:', moments.length);
console.log('  Goals:', goals.length);
console.log('  Plan Items:', planItems.length);
console.log('  Memories:', memories.length);
console.log('  People:', people.length);
console.log('  Places:', places.length);
console.log('  Topics:', topics.length);
console.log('  Media:', media.length);

await sql.end();
