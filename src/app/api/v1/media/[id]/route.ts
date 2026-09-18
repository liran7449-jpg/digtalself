/**
 * GET /api/v1/media/:id
 *
 * 权限校验后返回媒体文件。规范第 5/6 条：私密内容不能有永久公开 URL，
 * 知道 URL ≠ 有权限访问。
 *
 * 这里曾经是「文件存在即可访问」，还留着一行
 * `TODO: 多用户时检查 media.userId === session.userId`。
 * 单用户下没问题，多用户下它就是最直接的一条泄露路径 ——
 * 照片 id 是 ULID，出现在别人分享的页面 HTML 里、浏览器历史里，
 * 拿到就能看。现在归属校验由 repo 实例保证：
 * findById 只在当前用户名下查，别人的照片直接 404。
 */

import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/repositories";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // repo 绑定当前登录用户，findById 自带 userId 过滤
  const repo = await getRepo();
  const media = await repo.media.findById(id);
  if (!media) {
    // 不区分「不存在」和「不属于你」—— 后者会泄露 id 的有效性
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // 读取文件（通过存储适配层）
  const buffer = await storage.read(media.storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  // 返回文件
  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type": media.type,
      "Content-Length": String(buffer.length),
      /**
       * private 而不是 public：这些是私密照片，
       * 不能让中间的 CDN / 代理缓存下来跨用户复用。
       */
      "Cache-Control": "private, max-age=3600",
    },
  });
}
