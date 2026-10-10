/**
 * 流式调用 AI（DeepSeek 的 Anthropic 兼容接口）。
 *
 * 用 fetch 手动解析 SSE，不依赖 SDK。
 */

import type { AiConfig } from "./config";

export interface StreamOptions {
  config: AiConfig;
  systemPrompt: string;
  /** 历史消息，role 必须交替，从 user 开始 */
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  signal?: AbortSignal;
}

export interface StreamChunk {
  type: "text" | "error" | "done";
  text?: string;
  error?: string;
}

/**
 * 流式调用 AI，返回一个 AsyncIterable，逐块 yield。
 */
export async function* streamAi(opts: StreamOptions): AsyncIterable<StreamChunk> {
  const { config, systemPrompt, messages, signal } = opts;

  const response = await fetch(`${config.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": config.apiKey,
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1000,
      stream: true,
      system: systemPrompt,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    yield { type: "error", error: `AI 请求失败 (${response.status}): ${text.slice(0, 200)}` };
    return;
  }

  if (!response.body) {
    yield { type: "error", error: "响应体为空" };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);

          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            yield { type: "text", text: event.delta.text };
          }

          if (event.type === "error") {
            yield { type: "error", error: event.error?.message || "未知错误" };
            return;
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }

    yield { type: "done" };
  } catch (err) {
    if (signal?.aborted) {
      yield { type: "done" }; // 用户主动停止
    } else {
      yield { type: "error", error: err instanceof Error ? err.message : "流式读取失败" };
    }
  } finally {
    reader.releaseLock();
  }
}
