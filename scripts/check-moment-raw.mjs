import postgres from 'postgres';

const localSql = postgres('postgresql://postgres:localdev123@localhost:5432/digitalself');

console.log('🔍 检查 moments 表中的 media_paths 字段：\n');

const moments = await localSql`
  SELECT id, content, media_paths, occurred_at
  FROM moments
  ORDER BY occurred_at DESC
  LIMIT 10
`;

console.log(`查看最近 10 条 moments 的 media_paths：\n`);

moments.forEach((m, i) => {
  console.log(`${i + 1}. Moment ${m.id}`);
  console.log(`   内容: ${m.content.substring(0, 50)}...`);
  console.log(`   media_paths 类型: ${typeof m.media_paths}`);
  console.log(`   media_paths 值:`, JSON.stringify(m.media_paths));
  console.log('');
});

await localSql.end();
