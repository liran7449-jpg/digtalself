#!/usr/bin/env node
/**
 * 重置本地测试数据库
 * 用于开发时清空测试数据，重新开始
 */

import postgres from 'postgres';

const LOCAL_DB = 'postgresql://postgres:localdev123@localhost:5432/digitalself';
const sql = postgres(LOCAL_DB);

console.log('🗑️  清空本地测试数据...\n');

try {
  // 清空所有表（保留 schema）
  await sql`TRUNCATE TABLE
    moment_media,
    moment_goals,
    moment_people,
    moment_places,
    moment_topics,
    growth_evidences,
    moments,
    plan_items,
    days,
    goals,
    memories,
    insights,
    people,
    places,
    topics,
    media,
    users
    CASCADE`;

  console.log('✅ 本地测试数据已清空');
  console.log('💡 现在可以开始测试新功能了\n');

} catch (error) {
  console.error('❌ 清空失败：', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
