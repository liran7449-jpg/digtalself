/**
 * Media 集成测试：上传 → 存储 → 删除
 *
 * 注意 import 顺序：MediaService / repo 必须用动态 import()。
 * media-repo.ts 在模块顶层读 DIGITAL_SELF_MEDIA_ROOT
 * （`const MEDIA_ROOT = ...`），静态 import 会在 beforeAll 之前就把它
 * 固定成 "data/media"，测试文件就会写进用户真实的照片目录。
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { useTempDb, dropTempDb } from "./test-setup";

let tempDir: string;

beforeAll(() => {
  tempDir = useTempDb();
});

afterAll(() => {
  dropTempDb(tempDir);
});

const load = async () => {
  const { MediaService } = await import("@/services/media-service");
  const { repo } = await import("@/repositories");
  return { MediaService, repo };
};

/** 生成一张真实可解码的 PNG，让 sharp 能读出尺寸并生成缩略图 */
async function pngBuffer(width = 100, height = 60): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 40, b: 40 },
    },
  })
    .png()
    .toBuffer();
}

/** 校验文件确实落在临时目录里，而不是项目的 data/media */
function assertInTempDir(storageKey: string) {
  const root = process.env.DIGITAL_SELF_MEDIA_ROOT!;
  expect(root.startsWith(tempDir)).toBe(true);
  expect(existsSync(join(root, storageKey))).toBe(true);
}

describe("Media Service", () => {
  it("上传图片：落库、写文件、提取尺寸、生成缩略图", async () => {
    const { MediaService } = await load();
    const file = await pngBuffer(120, 80);

    const media = await MediaService.uploadImage({
      userId: "me",
      file,
      mimeType: "image/png",
    });

    expect(media.id).toBeTruthy();
    expect(media.type).toBe("image/png");
    expect(media.size).toBe(file.length);
    expect(media.width).toBe(120);
    expect(media.height).toBe(80);
    expect(media.storageKey).toMatch(/^me\/\d{4}\/\d{2}\/.+\.png$/);
    expect(media.thumbnailKey).toBeTruthy();

    // 关键：文件写在临时目录，不是用户的 data/media
    assertInTempDir(media.storageKey);
    assertInTempDir(media.thumbnailKey!);
  });

  it("getUrl 返回带权限校验的 API 路径，而不是可直接访问的文件路径", async () => {
    const { MediaService } = await load();
    const media = await MediaService.uploadImage({
      userId: "me",
      file: await pngBuffer(),
      mimeType: "image/png",
    });

    // 规范第 5 条：不能是永久公开 URL
    expect(MediaService.getUrl(media.id)).toBe(`/api/v1/media/${media.id}`);
  });

  it("删除：文件和记录都清掉，缩略图一起删", async () => {
    const { MediaService, repo } = await load();
    const media = await MediaService.uploadImage({
      userId: "me",
      file: await pngBuffer(),
      mimeType: "image/png",
    });

    const root = process.env.DIGITAL_SELF_MEDIA_ROOT!;
    const filePath = join(root, media.storageKey);
    const thumbPath = join(root, media.thumbnailKey!);
    expect(existsSync(filePath)).toBe(true);

    await MediaService.delete(media.id);

    expect(await repo.media.findById(media.id)).toBeNull();
    expect(existsSync(filePath)).toBe(false);
    // 缩略图不能变成孤儿文件留在磁盘上
    expect(existsSync(thumbPath)).toBe(false);
  });

  it("listByMoment 只返回该 Moment 关联的图片", async () => {
    const { MediaService, repo } = await load();
    const { db } = await import("@/db/client");
    const { momentMedia } = await import("@/db/schema");

    const a = await repo.moments.capture({ content: "有图的一条" });
    const b = await repo.moments.capture({ content: "没图的一条" });

    const media = await MediaService.uploadImage({
      userId: "me",
      file: await pngBuffer(),
      mimeType: "image/png",
    });
    await db.insert(momentMedia).values({ momentId: a.id, mediaId: media.id });

    expect((await repo.media.listByMoment(a.id)).map((m) => m.id)).toEqual([media.id]);
    expect(await repo.media.listByMoment(b.id)).toEqual([]);
  });
});
