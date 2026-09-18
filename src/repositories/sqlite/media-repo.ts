import { eq, inArray } from "drizzle-orm";
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
      const row = await db.select().from(media).where(eq(media.id, id)).then(rows => rows[0]);
      return row ?? null;
    },

    async listByMoment(momentId: string): Promise<Media[]> {
      const rows = await db
        .select({ media })
        .from(momentMedia)
        .innerJoin(media, eq(momentMedia.mediaId, media.id))
        .where(eq(momentMedia.momentId, momentId))
        ;

      return rows.map((r: { media: Media }) => r.media);
    },

    /**
     * 一次取回多条 Moment 的图片，按 momentId 分组。
     *
     * 列表页原本对每条 Moment 单独调 listByMoment，34 条记录就是 34 次往返；
     * 连接池只有 10 条连接，这些查询是排队执行的。批量版把它压成 1 次。
     *
     * 按 sortOrder 排序 —— 一条 Moment 的多张图有先后，顺序错了就不是原来那组照片。
     */
    async listByMoments(momentIds: string[]): Promise<Map<string, Media[]>> {
      const byMoment = new Map<string, Media[]>();
      // 空数组会让 inArray 生成非法 SQL，直接短路
      if (momentIds.length === 0) return byMoment;

      const rows = await db
        .select({ momentId: momentMedia.momentId, media })
        .from(momentMedia)
        .innerJoin(media, eq(momentMedia.mediaId, media.id))
        .where(inArray(momentMedia.momentId, momentIds))
        .orderBy(momentMedia.sortOrder);

      for (const r of rows as { momentId: string; media: Media }[]) {
        const list = byMoment.get(r.momentId);
        if (list) list.push(r.media);
        else byMoment.set(r.momentId, [r.media]);
      }
      return byMoment;
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

      await db.insert(media).values(record);
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
      await db.delete(media).where(eq(media.id, id));
    },
  };
}
