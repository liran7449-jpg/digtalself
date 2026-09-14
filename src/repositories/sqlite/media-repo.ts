import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db/client";
import { media, momentMedia } from "@/db/schema";
import type { Media } from "@/domain/models";
import type { MediaRepository } from "../types";
import { newId } from "./helpers";
import { storage } from "@/lib/storage";

/**
 * 生成存储路径：{userId}/{yyyy}/{MM}/{id}.{ext}
 * 按年月分组，避免单目录文件过多。
 */
function storageKeyFor(userId: string, id: string, mimeType: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const ext = mimeType.split("/")[1] || "bin";
  return `${userId}/${yyyy}/${MM}/${id}.${ext}`;
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

      return rows.map((r: { media: Media }) => r.media);
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

      // 如果是图片，生成缩略图
      let thumbnailKey: string | null = null;
      const isImage = input.type.startsWith("image/");

      if (isImage) {
        // 上传原图
        await storage.upload(storageKey, input.file, input.type);

        // 生成并上传缩略图（最大 400px 宽）
        const thumbId = `${id}_thumb`;
        const thumbKey = storageKeyFor(input.userId, thumbId, input.type);
        const thumbBuffer = await sharp(input.file)
          .resize(400, undefined, { withoutEnlargement: true })
          .toBuffer();

        await storage.upload(thumbKey, thumbBuffer, input.type);
        thumbnailKey = thumbKey;
      } else {
        // 非图片直接上传
        await storage.upload(storageKey, input.file, input.type);
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
      await storage.delete(record.storageKey);

      // 删除缩略图
      if (record.thumbnailKey) {
        await storage.delete(record.thumbnailKey);
      }

      // 删除数据库记录
      await db.delete(media).where(eq(media.id, id)).run();
    },
  };
}
