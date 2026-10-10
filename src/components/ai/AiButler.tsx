"use client";

/**
 * AI Butler 对话面板。
 * 浮在页面右侧，竖直居中，圆角卡片。手机上居中显示。
 */

import { useEffect, useRef, useState } from "react";
import { Sparkle } from "@/components/ui/Primitives";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "ai-butler-last-conversation";

export function AiButler({ provider }: { provider: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contextStats, setContextStats] = useState({ moments: 0, goals: 0 });
  const [confirming, setConfirming] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 恢复上次对话
  useEffect(() => {
    if (open && messages.length === 0) {
      const lastId = localStorage.getItem(STORAGE_KEY);
      if (lastId) loadConversation(lastId);
    }
  }, [open]);

  // 自动滚到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 加载历史列表
  useEffect(() => {
    if (view === "history") {
      fetch("/api/v1/ai/conversations")
        .then((r) => r.json())
        .then(setConversations)
        .catch(console.error);
    }
  }, [view]);

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/v1/ai/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
      setConversationId(id);
      localStorage.setItem(STORAGE_KEY, id);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function send() {
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    abortRef.current = new AbortController();
    setStreaming(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const convId = res.headers.get("X-Conversation-Id");
      const moments = res.headers.get("X-Context-Moments");
      const goals = res.headers.get("X-Context-Goals");

      if (convId && convId !== conversationId) {
        setConversationId(convId);
        localStorage.setItem(STORAGE_KEY, convId);
      }

      if (moments && goals) {
        setContextStats({ moments: +moments, goals: +goals });
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantText;
            return updated;
          });
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // 用户主动停止
      } else {
        console.error("Chat error:", err);
        setError(true);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newConversation() {
    setMessages([]);
    setConversationId(null);
    setContextStats({ moments: 0, goals: 0 });
    localStorage.removeItem(STORAGE_KEY);
    setView("chat");
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/v1/ai/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) newConversation();
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setConfirming(null);
  }

  const iconBtn = "min-h-10 cursor-pointer rounded-soft px-2.5 transition-colors hover:text-ink";
  const isEmpty = messages.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="打开 AI"
        className={`flex size-11 cursor-pointer items-center justify-center rounded-soft text-ai transition-colors hover:bg-ai-soft ${open ? "bg-ai-soft" : ""}`}
      >
        <Sparkle className="size-4" />
      </button>

      {open && (
        <aside
          aria-label="AI 对话"
          className="animate-rise fixed inset-x-4 bottom-auto top-1/2 z-40 flex h-[min(42rem,90dvh)] -translate-y-1/2
            flex-col overflow-hidden rounded-sheet border border-line bg-paper/95 backdrop-blur-md
            shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]
            sm:inset-x-auto sm:right-6 sm:w-[24rem]"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-line px-5 py-2">
            <div className="flex items-center gap-2">
              <Sparkle className="size-4 text-ai" />
              <span className="text-small font-medium text-ink">{view === "history" ? "历史对话" : "AI"}</span>
            </div>
            <div className="flex items-center text-small text-ink-muted">
              <button type="button" onClick={() => setView(view === "history" ? "chat" : "history")} className={iconBtn}>
                {view === "history" ? "返回" : "历史"}
              </button>
              <button type="button" onClick={newConversation} className={iconBtn}>
                新对话
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭" className={`${iconBtn} text-lead`}>
                ×
              </button>
            </div>
          </header>

          {/* Privacy notice */}
          {view === "chat" && !isEmpty && (
            <p className="border-b border-line-soft px-5 py-1.5 text-label text-ink-faint">
              对话和近期记录会发送给 {provider} 处理
            </p>
          )}

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "history" ? (
              <ul className="px-3 py-3">
                {conversations.map((c) => (
                  <li key={c.id} className="group flex items-center gap-3 rounded-soft px-2 py-3 transition-colors hover:bg-paper-sunken">
                    <button
                      type="button"
                      onClick={() => {
                        loadConversation(c.id);
                        setView("chat");
                      }}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <span className="block truncate text-body text-ink">{c.title}</span>
                      <span className="mt-0.5 block text-small text-ink-muted">
                        {new Date(c.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      </span>
                    </button>
                    {confirming === c.id ? (
                      <span className="flex shrink-0 gap-3 text-small">
                        <button
                          type="button"
                          onClick={() => deleteConversation(c.id)}
                          className="min-h-10 cursor-pointer font-medium text-danger"
                        >
                          确认删除
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className="min-h-10 cursor-pointer text-ink-muted">
                          取消
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(c.id)}
                        className="min-h-10 shrink-0 cursor-pointer text-small text-ink-faint opacity-0 transition-opacity
                          hover:text-danger group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      >
                        删除
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : isEmpty ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <Sparkle className="size-6 text-ai" />
                <p className="mt-5 text-body leading-relaxed text-ink-soft">
                  我能看到你最近的记录和目标，
                  <br />
                  可以陪你回顾、整理、聊聊。
                </p>
                <p className="mt-3 text-small text-ink-muted">对话和近期记录会发送给 {provider} 处理。</p>
                <p className="mt-8 label-caps text-ink-faint">试试问我</p>
                <ul className="mt-3 space-y-2">
                  {["这周我过得怎么样？", "最近我离哪个目标更近了？", "帮我回顾一下今天"].map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => {
                          setInput(q);
                          inputRef.current?.focus();
                        }}
                        className="min-h-10 cursor-pointer rounded-full border border-ai-border px-4 text-small text-ink-soft
                          transition-colors hover:bg-ai-soft hover:text-ai"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-6 px-5 py-6">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] whitespace-pre-wrap rounded-card bg-paper-sunken px-4 py-2.5 text-body text-ink">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <div key={i} className="border-l-2 border-ai-border pl-4">
                      <p className="whitespace-pre-wrap text-body leading-relaxed text-ink">
                        {m.content || (streaming && i === messages.length - 1 && (
                          <span className="text-ink-muted">正在翻看你的记录…</span>
                        ))}
                        {streaming && i === messages.length - 1 && m.content && (
                          <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-ai" />
                        )}
                      </p>
                    </div>
                  )
                )}
                {error && (
                  <div role="alert" className="border-l-2 border-danger/40 pl-4 text-small">
                    <p className="text-ink-soft">AI 暂时没回应，稍后再试。你的消息已经保存。</p>
                    <button type="button" onClick={send} className="mt-1 min-h-10 cursor-pointer font-medium text-ai">
                      重试
                    </button>
                  </div>
                )}
                {!streaming && !error && messages.length > 0 && contextStats.moments > 0 && (
                  <p className="text-label text-ink-faint">
                    参考了近 14 天 {contextStats.moments} 条记录 · {contextStats.goals} 个目标
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          {view === "chat" && (
            <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <label htmlFor="ai-input" className="sr-only">
                发给 AI 的消息
              </label>
              <textarea
                ref={inputRef}
                id="ai-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                maxLength={2000}
                placeholder="想聊点什么…"
                className="block w-full resize-none rounded-card border border-line bg-paper-sunken px-4 py-3 text-body text-ink
                  placeholder:text-ink-hint transition-colors focus:border-ai focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-label text-ink-faint">Enter 发送 · Shift+Enter 换行</span>
                {streaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="min-h-10 cursor-pointer rounded-full border border-ai-border px-4 text-small text-ai hover:bg-ai-soft"
                  >
                    停止
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={send}
                    disabled={!input.trim()}
                    aria-label="发送"
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-ai text-on-ai transition-opacity
                      disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="currentColor">
                      <path d="M2 8l12-6-4 13-2.5-5.5L2 8z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
