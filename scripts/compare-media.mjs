import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const localSql = postgres('postgresql://postgres:localdev123@localhost:5432/digitalself');

// 1. 数据库中的 media 记录
const dbMedia = await localSql`SELECT id, storage_key FROM media`;
console.log('📊 数据库中的 media 记录：');
dbMedia.forEach(m => console.log(`  ${m.id} -> ${m.storage_key}`));

// 2. 文件系统中的图片文件
const mediaDir = 'data/media/me/2026/09';
const files = fs.readdirSync(mediaDir)
  .filter(f => !f.startsWith('.') && !f.includes('_thumb'));

console.log('\n📁 文件系统中的图片文件（不含缩略图）：');
console.log(`  总数: ${files.length}`);

// 3. 对比：哪些文件在数据库中有记录
console.log('\n🔍 对比分析：');
files.forEach(file => {
  const fileId = file.split('.')[0]; // 提取 ID
  const inDb = dbMedia.some(m => m.storage_key.includes(fileId));
  const status = inDb ? '✅ 有记录' : '❌ 无记录';
  console.log(`  ${status} ${file}`);
});

// 4. 统计
const filesInDb = files.filter(file => {
  const fileId = file.split('.')[0];
  return dbMedia.some(m => m.storage_key.includes(fileId));
});

console.log('\n📈 统计：');
console.log(`  文件系统: ${files.length} 个图片`);
console.log(`  数据库: ${dbMedia.length} 条记录`);
console.log(`  匹配: ${filesInDb.length} 个`);
console.log(`  孤立文件: ${files.length - filesInDb.length} 个`);

await localSql.end();
