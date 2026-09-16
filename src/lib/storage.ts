/**
 * 存储适配层
 *
 * 提供统一的存储接口，根据环境变量自动选择：
 * - 配置了 S3 凭证 → 使用云存储（S3 兼容：Backblaze B2 / Cloudflare R2 / 阿里云 OSS 等）
 * - 否则 → 使用本地文件系统
 *
 * ⚠️ 生产环境必须用云存储。容器文件系统是临时的（ephemeral），
 * 每次部署都会换新容器，本地存的图片会全部丢失 —— 数据库记录还在，
 * 但文件没了，图片全部 404。这个坑踩过一次，别再踩。
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { writeFileSync, mkdirSync, unlinkSync, existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";

/**
 * 云存储配置。
 *
 * 优先读通用的 S3_* 变量，回退到旧的 R2_* 变量（向后兼容已有部署）。
 * 任何 S3 兼容服务都能用，区别只在 endpoint 和 region：
 *   Backblaze B2 → S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com  S3_REGION=us-east-005
 *   Cloudflare R2 → S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com  S3_REGION=auto
 */
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME =
  process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || "digital-self";

/** 可选：CDN 或自定义域名。私有桶不需要，图片走 /api/v1/media/:id 代理。 */
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL;

/**
 * Endpoint 解析。显式配置优先；只给了 R2_ACCOUNT_ID 时按 R2 规则拼。
 * B2 的 region 必须是真实区域（如 us-east-005），不能用 R2 那套 "auto"。
 */
const S3_ENDPOINT =
  process.env.S3_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined);
const S3_REGION = process.env.S3_REGION || (process.env.R2_ACCOUNT_ID ? "auto" : "us-east-1");

const IS_CLOUD_STORAGE = !!(S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);

// 本地存储路径
const MEDIA_ROOT = process.env.DIGITAL_SELF_MEDIA_ROOT || "data/media";

// S3 客户端
let s3Client: S3Client | null = null;

if (IS_CLOUD_STORAGE) {
  s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
  });
  const host = new URL(S3_ENDPOINT!).host;
  console.log(`📦 使用云存储 ${host} / bucket=${S3_BUCKET_NAME}`);
} else if (process.env.NODE_ENV === "production") {
  // 生产环境用本地存储 = 下次部署图片全丢。必须吼出来。
  console.error(
    "🚨 警告：生产环境未配置云存储，正在使用容器本地磁盘。\n" +
      "   每次部署都会丢失所有已上传的图片！\n" +
      "   请配置 S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_BUCKET_NAME",
  );
} else {
  console.log("📦 使用本地文件存储（开发环境）");
}

/**
 * 存储接口
 */
export interface StorageAdapter {
  /**
   * 上传文件
   * @param key 存储路径（例如：user-id/2024/01/file.jpg）
   * @param buffer 文件内容
   * @param contentType MIME 类型
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<void>;

  /**
   * 读取文件
   * @param key 存储路径
   * @returns 文件内容，如果不存在返回 null
   */
  read(key: string): Promise<Buffer | null>;

  /**
   * 删除文件
   * @param key 存储路径
   */
  delete(key: string): Promise<void>;

  /**
   * 检查文件是否存在
   * @param key 存储路径
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取访问 URL
   * @param key 存储路径
   * @returns 访问 URL（本地返回 API 路径，R2 返回直接 URL）
   */
  getUrl(key: string): string;
}

/**
 * 本地文件系统适配器
 */
class LocalStorageAdapter implements StorageAdapter {
  private absolutePath(key: string): string {
    return resolve(process.cwd(), MEDIA_ROOT, key);
  }

  async upload(key: string, buffer: Buffer, _contentType: string): Promise<void> {
    const fullPath = this.absolutePath(key);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, buffer);
  }

  async read(key: string): Promise<Buffer | null> {
    const fullPath = this.absolutePath(key);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.absolutePath(key);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.absolutePath(key));
  }

  getUrl(key: string): string {
    // 本地存储通过 API 访问（需要在 API 路由中处理）
    return `/api/v1/storage/${encodeURIComponent(key)}`;
  }
}

/**
 * Cloudflare R2 适配器
 */
class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor(client: S3Client, bucket: string) {
    this.client = client;
    this.bucket = bucket;
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });

    await upload.done();
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      if (!response.Body) return null;

      // 将流转换为 Buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error: any) {
      if (error.name === "NoSuchKey") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const buffer = await this.read(key);
      return buffer !== null;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    // 配置了 CDN / 自定义域名就用它
    if (S3_PUBLIC_URL) {
      return `${S3_PUBLIC_URL}/${key}`;
    }
    // 私有桶没有可直接访问的 URL，走应用内代理（/api/v1/media/:id）。
    // 这也避免了把存储凭证或桶地址暴露给浏览器。
    return `/api/v1/media/${encodeURIComponent(key)}`;
  }
}

/**
 * 导出存储实例
 */
export const storage: StorageAdapter = IS_CLOUD_STORAGE
  ? new S3StorageAdapter(s3Client!, S3_BUCKET_NAME)
  : new LocalStorageAdapter();

/**
 * 是否使用云存储
 */
export const isCloudStorage = IS_CLOUD_STORAGE;
