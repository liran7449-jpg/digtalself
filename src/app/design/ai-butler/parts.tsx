"use client";

/**
 * AI Butler 原型的面板零件。全部是假数据，不接 AI、不读库。
 * 样式定稿后，这些零件会搬进 src/components/ai/ 接上真数据。
 */

import { useState } from "react";
import { Sparkle } from "@/components/ui/Primitives";

export type Msg = { role: "user" | "assistant"; text: string };

export const SAMPLE: Msg[] = [
  { role: "user", text: "这周我过得怎么样？" },
  {
    role: "assistant",
    text: "这周你记了 9 条，其中 4 条和「身体更健康」有关 —— 周二练了 40 分钟力量，周四又跑了一次步。\n\n周三那条提到工作上的事一直收不了尾，那天的心情也是这周最低的。这只是我从记录里看到的，你自己觉得这周最累的是哪一块？",
  },
  { role: "user", text: "工作吧，感觉一直在补洞" },
];

const HISTORY = [
  { id: "1", title: "这周我过得怎么样？", date: "今天" },
  { id: "2", title: "最近我离哪个目标更近了", date: "10月8日" },
  { id: "3", title: "帮我回顾一下今天", date: "10月6日" },
];

const SUGGESTIONS = ["这周我过得怎么样？", "最近我离哪个目标更近了？", "帮我回顾一下今天"];

const iconBtn = "min-h-10 cursor-pointer rounded-soft px-2.5 transition-colors hover:text-ink";

export function PanelHeader({ inHistory, onToggleHistory }: { inHistory: boolean; onToggleHistory: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-2">
      <div className="flex items-center gap-2">
        <Sparkle className="size-4 text-ai" />
        <span className="text-small font-medium text-ink">{inHistory ? "历史对话" : "AI"}</span>
      </div>
      <div className="flex items-center text-small text-ink-muted">
        <button type="button" onClick={onToggleHistory} className={iconBtn}>
          {inHistory ? "返回" : "历史"}
        </button>
        <button type="button" className={iconBtn}>新对话</button>
        <button type="button" aria-label="关闭" className={`${iconBtn} text-lead`}>×</button>
      </div>
    </header>
  );
}

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <Sparkle className="size-6 text-ai" />
      <p className="mt-5 text-body leading-relaxed text-ink-soft">
        我能看到你最近的记录和目标，
        <br />
        可以陪你回顾、整理、聊聊。
      </p>
      <p className="mt-3 text-small text-ink-muted">对话和近期记录会发送给 AI 服务处理。</p>
      <p className="mt-8 label-caps text-ink-faint">试试问我</p>
      <ul className="mt-3 space-y-2">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              className="min-h-10 cursor-pointer rounded-full border border-ai-border px-4 text-small text-ink-soft
                transition-colors hover:bg-ai-soft hover:text-ai"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Messages({ messages, streaming = false, error = false }: { messages: Msg[]; streaming?: boolean; error?: boolean }) {
  const last = messages.length - 1;
  return (
    <div className="space-y-6 px-5 py-6">
      {messages.map((m, i) =>
        m.role === "user" ? (
          <div key={i} className="flex justify-end">
            <p className="max-w-[85%] whitespace-pre-wrap rounded-card bg-paper-sunken px-4 py-2.5 text-body text-ink">{m.text}</p>
          </div>
        ) : (
          <div key={i} className="border-l-2 border-ai-border pl-4">
            <p className="whitespace-pre-wrap text-body leading-relaxed text-ink">
              {m.text || (streaming && i === last && <span className="text-ink-muted">正在翻看你的记录…</span>)}
              {streaming && i === last && m.text && (
                <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-ai" />
              )}
            </p>
          </div>
        ),
      )}
      {error && (
        <div role="alert" className="border-l-2 border-danger/40 pl-4 text-small">
          <p className="text-ink-soft">AI 暂时没回应，稍后再试。你的消息已经保存。</p>
          <button type="button" className="mt-1 min-h-10 cursor-pointer font-medium text-ai">重试</button>
        </div>
      )}
      {!streaming && !error && (
        <p className="text-label text-ink-faint">参考了近 14 天 23 条记录 · 3 个目标</p>
      )}
    </div>
  );
}

export function HistoryList() {
  const [confirming, setConfirming] = useState<string | null>(null);
  return (
    <ul className="px-3 py-3">
      {HISTORY.map((h) => (
        <li key={h.id} className="group flex items-center gap-3 rounded-soft px-2 py-3 transition-colors hover:bg-paper-sunken">
          <button type="button" className="min-w-0 flex-1 cursor-pointer text-left">
            <span className="block truncate text-body text-ink">{h.title}</span>
            <span className="mt-0.5 block text-small text-ink-muted">{h.date}</span>
          </button>
          {confirming === h.id ? (
            <span className="flex shrink-0 gap-3 text-small">
              <button type="button" onClick={() => setConfirming(null)} className="min-h-10 cursor-pointer font-medium text-danger">确认删除</button>
              <button type="button" onClick={() => setConfirming(null)} className="min-h-10 cursor-pointer text-ink-muted">取消</button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(h.id)}
              className="min-h-10 shrink-0 cursor-pointer text-small text-ink-faint opacity-0 transition-opacity hover:text-danger
                group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
            >
              删除
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Composer({ streaming }: { streaming: boolean }) {
  const [v, setV] = useState("");
  return (
    <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <label htmlFor="ai-input" className="sr-only">发给 AI 的消息</label>
      <textarea
        id="ai-input"
        rows={2}
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={2000}
        placeholder="想聊点什么…"
        className="block w-full resize-none rounded-card border border-line bg-paper-sunken px-4 py-3 text-body text-ink
          placeholder:text-ink-hint transition-colors focus:border-ai focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-label text-ink-faint">Enter 发送 · Shift+Enter 换行</span>
        {streaming ? (
          <button type="button" className="min-h-10 cursor-pointer rounded-full border border-ai-border px-4 text-small text-ai hover:bg-ai-soft">
            停止
          </button>
        ) : (
          <button type="button" aria-label="发送" disabled={!v.trim()}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-ai text-on-ai transition-opacity
              disabled:cursor-not-allowed disabled:opacity-40">
            <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="currentColor"><path d="M2 8l12-6-4 13-2.5-5.5L2 8z" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
