import postgres from 'postgres';
import { connectCloud } from './cloud-db.mjs';

const localSql = postgres(process.env.DATABASE_URL ?? 'postgresql://postgres:localdev123@localhost:5432/digitalself');
const cloudSql = connectCloud();

console.log('📷 本地 media 表记录：');
const localMedia = await localSql`SELECT id, storage_key, type, size, created_at FROM media ORDER BY created_at`;
console.log(`  总数: ${localMedia.length}`);
localMedia.forEach(m => {
  console.log(`  - ${m.storage_key} | ${m.type} | ${(m.size / 1024).toFixed(1)}KB`);
});

console.log('\n📷 云端 media 表记录：');
const cloudMedia = await cloudSql`SELECT id, storage_key, type, size, created_at FROM media ORDER BY created_at`;
console.log(`  总数: ${cloudMedia.length}`);
cloudMedia.forEach(m => {
  console.log(`  - ${m.storage_key} | ${m.type} | ${(m.size / 1024).toFixed(1)}KB`);
});

console.log('\n🔗 本地 moment_media 关联：');
const localMM = await localSql`SELECT moment_id, media_id FROM moment_media`;
console.log(`  总数: ${localMM.length}`);
localMM.forEach(mm => console.log(`  - Moment ${mm.moment_id} -> Media ${mm.media_id}`));

console.log('\n🔗 云端 moment_media 关联：');
const cloudMM = await cloudSql`SELECT moment_id, media_id FROM moment_media`;
console.log(`  总数: ${cloudMM.length}`);
cloudMM.forEach(mm => console.log(`  - Moment ${mm.moment_id} -> Media ${mm.media_id}`));

console.log('\n📁 本地文件系统：');
const fs = await import('fs');
const path = await import('path');
const mediaDir = 'data/media/me/2026/09';
if (fs.existsSync(mediaDir)) {
  const files = fs.readdirSync(mediaDir).filter(f => !f.startsWith('.'));
  console.log(`  总数: ${files.length} 个文件`);
  files.slice(0, 10).forEach(f => console.log(`  - ${f}`));
  if (files.length > 10) console.log(`  ... 还有 ${files.length - 10} 个文件`);
} else {
  console.log('  目录不存在');
}

await localSql.end();
await cloudSql.end();
