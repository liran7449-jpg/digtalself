import postgres from 'postgres';

const localSql = postgres('postgresql://postgres:localdev123@localhost:5432/digitalself');

console.log('🔍 检查 moments 表中的 media_paths 字段：\n');

const momentsWithMedia = await localSql`
  SELECT id, content, media_paths, occurred_at
  FROM moments
  WHERE media_paths IS NOT NULL AND jsonb_array_length(media_paths) > 0
  ORDER BY occurred_at DESC
`;

console.log(`找到 ${momentsWithMedia.length} 条带图片的 moments：\n`);

momentsWithMedia.forEach((m, i) => {
  const paths = m.media_paths;
  console.log(`${i + 1}. Moment ${m.id}`);
  console.log(`   内容: ${m.content.substring(0, 50)}...`);
  console.log(`   时间: ${m.occurred_at.toISOString().split('T')[0]}`);
  console.log(`   图片: ${paths.length} 张`);
  paths.forEach(path => console.log(`     - ${path}`));
  console.log('');
});

await localSql.end();
