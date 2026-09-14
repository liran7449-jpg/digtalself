/**
 * 本地图片迁移到 Cloudflare R2 脚本
 *
 * 使用方法：
 *   R2_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx npm run migrate:media-to-r2
 *
 * 功能：
 * - 读取数据库中所有 Media 记录
 * - 从本地文件系统读取文件
 * - 上传到 R2
 * - 验证上传成功
 */

import { resolve } from "node:path";
import { readFileSync, existsSync } from "fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";

// 检查环境变量
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "digital-self";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("❌ 错误：缺少 R2 环境变量");
  console.log("使用方法：");
  console.log("  R2_ACCOUNT_ID=xxx \\");
  console.log("  R2_ACCESS_KEY_ID=xxx \\");
  console.log("  R2_SECRET_ACCESS_KEY=xxx \\");
  console.log("  npm run migrate:media-to-r2");
  process.exit(1);
}

const SQLITE_PATH = process.env.DIGITAL_SELF_DB ?? "./data/digital-self.db";
const MEDIA_ROOT = process.env.DIGITAL_SELF_MEDIA_ROOT || "data/media";

console.log("🚀 开始图片迁移：本地文件 → Cloudflare R2");
console.log(`📁 SQLite 路径: ${SQLITE_PATH}`);
console.log(`📁 媒体根目录: ${MEDIA_ROOT}`);
console.log(`🪣 R2 Bucket: ${R2_BUCKET_NAME}\n`);

async function migrate() {
  // 连接 SQLite
  const sqlitePath = resolve(process.cwd(), SQLITE_PATH);
  const sqlite = new Database(sqlitePath);
  const db = drizzle(sqlite, { schema });

  console.log("✅ 已连接到 SQLite 数据库");

  // 连接 R2
  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });

  console.log("✅ 已连接到 Cloudflare R2\n");

  // 读取所有 Media 记录
  const mediaRecords = await db.select().from(schema.media);
  console.log(`📊 找到 ${mediaRecords.length} 个媒体文件\n`);

  if (mediaRecords.length === 0) {
    console.log("✅ 没有需要迁移的文件");
    sqlite.close();
    return;
  }

  let successCount = 0;
  let failCount = 0;
  const failures: Array<{ id: string; key: string; error: string }> = [];

  // 迁移每个文件
  for (let i = 0; i < mediaRecords.length; i++) {
    const record = mediaRecords[i];
    const progress = `[${i + 1}/${mediaRecords.length}]`;

    console.log(`${progress} 处理: ${record.storageKey}`);

    try {
      // 上传原文件
      const mainPath = resolve(process.cwd(), MEDIA_ROOT, record.storageKey);
      if (!existsSync(mainPath)) {
        throw new Error("本地文件不存在");
      }

      const mainBuffer = readFileSync(mainPath);
      const upload = new Upload({
        client: r2Client,
        params: {
          Bucket: R2_BUCKET_NAME,
          Key: record.storageKey,
          Body: mainBuffer,
          ContentType: record.type,
        },
      });

      await upload.done();
      console.log(`  ✓ 原文件已上传 (${(mainBuffer.length / 1024).toFixed(1)} KB)`);

      // 上传缩略图（如果存在）
      if (record.thumbnailKey) {
        const thumbPath = resolve(process.cwd(), MEDIA_ROOT, record.thumbnailKey);
        if (existsSync(thumbPath)) {
          const thumbBuffer = readFileSync(thumbPath);
          const thumbUpload = new Upload({
            client: r2Client,
            params: {
              Bucket: R2_BUCKET_NAME,
              Key: record.thumbnailKey,
              Body: thumbBuffer,
              ContentType: record.type,
            },
          });

          await thumbUpload.done();
          console.log(`  ✓ 缩略图已上传 (${(thumbBuffer.length / 1024).toFixed(1)} KB)`);
        }
      }

      // 验证上传成功
      const headCommand = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: record.storageKey,
      });
      await r2Client.send(headCommand);

      console.log(`  ✅ 验证成功\n`);
      successCount++;
    } catch (error: any) {
      console.error(`  ❌ 失败: ${error.message}\n`);
      failCount++;
      failures.push({
        id: record.id,
        key: record.storageKey,
        error: error.message,
      });
    }
  }

  // 关闭连接
  sqlite.close();

  // 汇总
  console.log("\n" + "=".repeat(60));
  console.log("📊 迁移完成");
  console.log("=".repeat(60));
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);

  if (failures.length > 0) {
    console.log("\n失败列表：");
    failures.forEach((f) => {
      console.log(`  - ${f.key} (${f.id}): ${f.error}`);
    });
  }

  console.log("\n⚠️  下一步：");
  console.log("  1. 验证 R2 中的文件可以正常访问");
  console.log("  2. 更新应用环境变量启用 R2 存储");
  console.log("  3. 测试上传和访问功能");
  console.log("  4. 确认无误后删除本地文件");
}

migrate()
  .then(() => {
    console.log("\n🎉 迁移脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 迁移脚本失败：", error);
    process.exit(1);
  });
