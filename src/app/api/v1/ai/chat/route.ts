/**
 * POST /api/v1/ai/chat
 *
 * 发送消息并流式返回 AI 回复。
 * 第一次调用时会创建新对话，后续带上 conversationId 继续。
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { getAiConfig } from "@/lib/ai/config";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { buildAiContext } from "@/lib/ai/context";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { streamAi } from "@/lib/ai/stream";
import { db } from "@/db/client";
import { aiConversations, aiMessages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { newId } from "@/repositories/sqlite/helpers";
import { userRepo } from "@/repositories";

const reqSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  console.log("[AI Chat] Request received");

  const userId = await getCurrentUserId();
  console.log("[AI Chat] userId:", userId);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getAiConfig();
  console.log("[AI Chat] config:", config ? "present" : "missing");
  if (!config) {
    return Response.json({ error: "AI 未配置" }, { status: 503 });
  }

  const body = await request.json();
  console.log("[AI Chat] body:", body);
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[AI Chat] Validation failed:", parsed.error.flatten());
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { message, conversationId } = parsed.data;

  // 限频
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  // 确定对话 ID
  let convId = conversationId || null;
  if (convId) {
    // 验证对话归属
    const conv = await db.query.aiConversations.findFirst({
      where: and(eq(aiConversations.id, convId), eq(aiConversations.userId, userId)),
    });
    if (!conv) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    // 新建对话
    const title = message.slice(0, 30) + (message.length > 30 ? "…" : "");
    convId = newId();
    await db.insert(aiConversations).values({
      id: convId,
      userId,
      title,
    });
  }

  // 存用户消息
  const userMsgId = newId();
  await db.insert(aiMessages).values({
    id: userMsgId,
    conversationId: convId,
    userId,
    role: "user",
    content: message,
  });

  // 拉取历史（只取最近 10 轮，即 20 条消息）
  const allHistory = await db.query.aiMessages.findMany({
    where: eq(aiMessages.conversationId, convId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
    columns: { role: true, content: true },
  });

  // 滑动窗口：只保留最近 20 条（10 轮对话）
  const WINDOW_SIZE = 20;
  const history = allHistory.slice(-WINDOW_SIZE);

  // 构建上下文
  const user = await userRepo.findById(userId);
  const context = await buildAiContext(userId);
  const systemPrompt = buildSystemPrompt(user?.name || null) + "\n\n" + context.text;

  // 流式响应
  const encoder = new TextEncoder();
  let assistantText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAi({
          config,
          systemPrompt,
          messages: history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
          signal: request.signal,
        })) {
          if (chunk.type === "text" && chunk.text) {
            assistantText += chunk.text;
            controller.enqueue(encoder.encode(chunk.text));
          } else if (chunk.type === "error") {
            console.error("AI stream error:", chunk.error);
            break;
          } else if (chunk.type === "done") {
            break;
          }
        }
      } catch (err) {
        console.error("Stream failed:", err);
      } finally {
        // 存 AI 回复
        if (assistantText.trim()) {
          await db.insert(aiMessages).values({
            id: newId(),
            conversationId: convId,
            userId,
            role: "assistant",
            content: assistantText,
          });
          // 更新对话时间
          await db
            .update(aiConversations)
            .set({ updatedAt: new Date() })
            .where(eq(aiConversations.id, convId));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": convId,
      "X-Context-Moments": String(context.stats.momentCount),
      "X-Context-Goals": String(context.stats.goalCount),
    },
  });
}
