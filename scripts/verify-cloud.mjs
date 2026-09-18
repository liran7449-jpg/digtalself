import { connectCloud } from './cloud-db.mjs';

const sql = connectCloud();

const moments = await sql`SELECT COUNT(*) as count FROM moments`;
const days = await sql`SELECT COUNT(*) as count FROM days`;
const goals = await sql`SELECT COUNT(*) as count FROM goals`;
const planItems = await sql`SELECT COUNT(*) as count FROM plan_items`;

console.log('☁️ 云端数据验证：');
console.log('✓ Moments:', moments[0].count);
console.log('✓ Days:', days[0].count);
console.log('✓ Goals:', goals[0].count);
console.log('✓ Plan Items:', planItems[0].count);

// 检查最新的 moment
const latest = await sql`SELECT id, content, occurred_at FROM moments ORDER BY occurred_at DESC LIMIT 3`;
console.log('\n📝 最新 3 条 Moments:');
latest.forEach((m, i) => {
  console.log(`  ${i + 1}. ${m.content.substring(0, 50)}... (${m.occurred_at.toISOString().split('T')[0]})`);
});

await sql.end();
