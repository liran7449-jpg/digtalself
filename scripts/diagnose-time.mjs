import postgres from 'postgres';

const sql = postgres('postgresql://postgres:FUQtDjndJKLGNVcWByupxCSsnPOKEWIb@tokaido.proxy.rlwy.net:55374/railway');

const rows = await sql`
  SELECT id, date, occurred_at, LEFT(content, 20) as preview
  FROM moments ORDER BY occurred_at DESC LIMIT 5
`;

console.log('云端最近 5 条 moment 的时间：\n');
rows.forEach(r => {
  const d = new Date(r.occurred_at);
  const utcH = String(d.getUTCHours()).padStart(2, '0');
  const utcM = String(d.getUTCMinutes()).padStart(2, '0');
  // 北京时间 = UTC+8
  const bjH = String((d.getUTCHours() + 8) % 24).padStart(2, '0');
  console.log(`  date字段=${r.date}  UTC=${utcH}:${utcM}  北京=${bjH}:${utcM}  "${r.preview}"`);
});

console.log('\n数据库 now() 时间：');
const [{ now }] = await sql`SELECT now()`;
const n = new Date(now);
console.log(`  UTC: ${n.toISOString().slice(11,16)}`);
console.log(`  北京: ${String((n.getUTCHours()+8)%24).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}`);

await sql.end();
