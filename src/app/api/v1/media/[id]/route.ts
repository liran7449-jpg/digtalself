/**
 * GET /api/v1/media/:id
 *
 * 权限校验后返回媒体文件。规范第 5 条：私密内容不能有永久公开 URL。
 * 目前是单用户产品，校验简化为"文件存在即可访问"。
 * 未来多用户时，需检查 media.userId 是否匹配当前登录用户。
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { repo } from "@/repositories";

const MEDIA_ROOT = process.env.DIGITAL_SELF_MEDIA_ROOT || "data/media";

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

  // 读取文件
  // resolve 而不是 join：MEDIA_ROOT 可能是绝对路径，join 不会在绝对路径处重置，
  // 会拼出 <cwd>/var/... 这种错位路径，读不到写进去的文件。
  const fullPath = resolve(process.cwd(), MEDIA_ROOT, media.storageKey);
  if (!existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const buffer = readFileSync(fullPath);

  // 返回文件
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": media.type,
      "Content-Length": String(buffer.length),
      // 允许浏览器缓存 1 小时（媒体文件不常变）
      "Cache-Control": "private, max-age=3600",
    },
  });
}
