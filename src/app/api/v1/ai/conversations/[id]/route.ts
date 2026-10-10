/**
 * GET /api/v1/ai/conversations/[id]
 * DELETE /api/v1/ai/conversations/[id]
 *
 * 获取或删除一段对话。
 */

import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { db } from "@/db/client";
import { aiConversations, aiMessages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await db.query.aiConversations.findFirst({
    where: and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
  });

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, id))
    .orderBy(asc(aiMessages.createdAt));

  return Response.json({
    ...conversation,
    messages,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await db.query.aiConversations.findFirst({
    where: and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
  });

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(aiConversations).where(eq(aiConversations.id, id));

  return Response.json({ deleted: true });
}
