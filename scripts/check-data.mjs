import postgres from 'postgres';

const sql = postgres('postgresql://postgres:localdev123@localhost:5432/digitalself');

const moments = await sql`SELECT COUNT(*) as count FROM moments`;
const days = await sql`SELECT COUNT(*) as count FROM days`;
const goals = await sql`SELECT COUNT(*) as count FROM goals`;
const planItems = await sql`SELECT COUNT(*) as count FROM plan_items`;

console.log('📊 数据完整性检查：');
console.log('✓ Moments:', moments[0].count);
console.log('✓ Days:', days[0].count);
console.log('✓ Goals:', goals[0].count);
console.log('✓ Plan Items:', planItems[0].count);

await sql.end();
