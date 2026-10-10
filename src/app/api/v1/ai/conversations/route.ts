/**
 * GET /api/v1/ai/conversations
 *
 * 列出当前用户的对话历史，按更新时间倒序。
 */

import { getCurrentUserId } from "@/lib/session";
import { db } from "@/db/client";
import { aiConversations } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      createdAt: aiConversations.createdAt,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(50);

  return Response.json(conversations);
}
