/**
 * 存储适配层
 *
 * 提供统一的存储接口，根据环境变量自动选择：
 * - R2_ACCOUNT_ID 存在 → 使用 Cloudflare R2
 * - 否则 → 使用本地文件系统
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { writeFileSync, mkdirSync, unlinkSync, existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";

// 环境变量
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "digital-self";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 可选：自定义域名

const IS_R2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

// 本地存储路径
const MEDIA_ROOT = process.env.DIGITAL_SELF_MEDIA_ROOT || "data/media";

// R2 客户端（S3 兼容）
let r2Client: S3Client | null = null;

if (IS_R2) {
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
  console.log("📦 使用 Cloudflare R2 存储");
} else {
  console.log("📦 使用本地文件存储");
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
class R2StorageAdapter implements StorageAdapter {
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
    // 如果配置了自定义域名，使用自定义域名
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/${key}`;
    }
    // 否则返回 R2 的公开 URL（需要配置 Bucket 为公开访问）
    return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
  }
}

/**
 * 导出存储实例
 */
export const storage: StorageAdapter = IS_R2
  ? new R2StorageAdapter(r2Client!, R2_BUCKET_NAME)
  : new LocalStorageAdapter();

/**
 * 是否使用云存储
 */
export const isCloudStorage = IS_R2;
