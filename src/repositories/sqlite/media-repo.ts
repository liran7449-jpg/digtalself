import { eq } from "drizzle-orm";
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import sharp from "sharp";
import { db } from "@/db/client";
import { media, momentMedia } from "@/db/schema";
import type { Media } from "@/domain/models";
import type { MediaRepository } from "../types";
import { newId } from "./helpers";

const MEDIA_ROOT = process.env.DIGITAL_SELF_MEDIA_ROOT || "data/media";

/**
 * 生成存储路径：{MEDIA_ROOT}/{userId}/{yyyy}/{MM}/{id}.{ext}
 * 按年月分组，避免单目录文件过多。
 */
function storageKeyFor(userId: string, id: string, mimeType: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const ext = mimeType.split("/")[1] || "bin";
  return `${userId}/${yyyy}/${MM}/${id}.${ext}`;
}

/**
 * 用 resolve 而不是 join：MEDIA_ROOT 可能是绝对路径（外挂盘、测试临时目录）。
 * join 不会在绝对路径处重置，会拼成 <cwd>/var/folders/... 这种错位路径，
 * 文件静默写到项目目录里去。resolve 对相对和绝对路径都正确。
 */
function absolutePath(storageKey: string): string {
  return resolve(process.cwd(), MEDIA_ROOT, storageKey);
}

export function createMediaRepository(): MediaRepository {
  return {
    async findById(id: string): Promise<Media | null> {
      const row = await db.select().from(media).where(eq(media.id, id)).get();
      return row ?? null;
    },

    async listByMoment(momentId: string): Promise<Media[]> {
      const rows = await db
        .select({ media })
        .from(momentMedia)
        .innerJoin(media, eq(momentMedia.mediaId, media.id))
        .where(eq(momentMedia.momentId, momentId))
        .all();

      return rows.map((r) => r.media);
    },

    async create(input: {
      userId: string;
      file: Buffer;
      type: string;
      size: number;
      width?: number;
      height?: number;
    }): Promise<Media> {
      const id = newId();
      const storageKey = storageKeyFor(input.userId, id, input.type);
      const fullPath = absolutePath(storageKey);

      // 确保目录存在
      mkdirSync(dirname(fullPath), { recursive: true });

      // 如果是图片，生成缩略图
      let thumbnailKey: string | null = null;
      const isImage = input.type.startsWith("image/");

      if (isImage) {
        // 原图写入
        writeFileSync(fullPath, input.file);

        // 生成缩略图（最大 400px 宽）
        const thumbId = `${id}_thumb`;
        const thumbKey = storageKeyFor(input.userId, thumbId, input.type);
        const thumbPath = absolutePath(thumbKey);

        await sharp(input.file).resize(400, undefined, { withoutEnlargement: true }).toFile(thumbPath);
        thumbnailKey = thumbKey;
      } else {
        // 非图片直接写入
        writeFileSync(fullPath, input.file);
      }

      const record: Media = {
        id,
        userId: input.userId,
        storageKey,
        type: input.type,
        size: input.size,
        width: input.width ?? null,
        height: input.height ?? null,
        thumbnailKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(media).values(record).run();
      return record;
    },

    async delete(id: string): Promise<void> {
      const record = await this.findById(id);
      if (!record) return;

      // 删除文件
      const fullPath = absolutePath(record.storageKey);
      if (existsSync(fullPath)) unlinkSync(fullPath);

      // 删除缩略图
      if (record.thumbnailKey) {
        const thumbPath = absolutePath(record.thumbnailKey);
        if (existsSync(thumbPath)) unlinkSync(thumbPath);
      }

      // 删除数据库记录
      await db.delete(media).where(eq(media.id, id)).run();
    },
  };
}
