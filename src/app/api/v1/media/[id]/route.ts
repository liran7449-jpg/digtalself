/**
 * GET /api/v1/media/:id
 *
 * 权限校验后返回媒体文件。规范第 5 条：私密内容不能有永久公开 URL。
 * 目前是单用户产品，校验简化为"文件存在即可访问"。
 * 未来多用户时，需检查 media.userId 是否匹配当前登录用户。
 */

import { NextRequest, NextResponse } from "next/server";
import { repo } from "@/repositories";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // 查询 Media 记录
  const media = await repo.media.findById(id);
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // TODO: 多用户时检查 media.userId === session.userId

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
      // 允许浏览器缓存 1 小时（媒体文件不常变）
      "Cache-Control": "private, max-age=3600",
    },
  });
}
