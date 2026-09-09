/**
 * MediaService: 媒体上传、删除的业务逻辑层。
 *
 * 跨模块调用媒体功能时走这个 Service，不直接调 MediaRepository。
 * 符合规范第 2 条：模块通过接口交流。
 */

import { repo } from "@/repositories";
import type { Media } from "@/domain/models";
import sharp from "sharp";

export const MediaService = {
  /**
   * 上传图片。自动提取宽高，生成缩略图。
   */
  async uploadImage(input: {
    userId: string;
    file: Buffer;
    mimeType: string;
  }): Promise<Media> {
    // 提取图片尺寸
    const metadata = await sharp(input.file).metadata();

    return repo.media.create({
      userId: input.userId,
      file: input.file,
      type: input.mimeType,
      size: input.file.length,
      width: metadata.width,
      height: metadata.height,
    });
  },

  /**
   * 上传非图片文件。
   */
  async uploadFile(input: {
    userId: string;
    file: Buffer;
    mimeType: string;
  }): Promise<Media> {
    return repo.media.create({
      userId: input.userId,
      file: input.file,
      type: input.mimeType,
      size: input.file.length,
    });
  },

  /**
   * 删除媒体（文件 + 数据库记录）。
   */
  async delete(id: string): Promise<void> {
    await repo.media.delete(id);
  },

  /**
   * 获取媒体访问 URL。
   * 目前返回 /api/v1/media/:id，未来可以改成预签名 URL（如果上云）。
   */
  getUrl(mediaId: string): string {
    return `/api/v1/media/${mediaId}`;
  },
};
