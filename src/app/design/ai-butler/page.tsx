"use client";

/**
 * /design/ai-butler —— AI Butler 对话面板原型。
 *
 * 假数据，不接 AI。顶部切换五种状态：首次打开 / 对话中 / 生成中 / 出错 / 历史。
 * 背后放一块示意的 Today 页面，看面板盖在真实页面上的效果。
 * 定稿后零件搬进 src/components/ai/ 接上真数据。
 */

import { useState } from "react";
import { Sparkle } from "@/components/ui/Primitives";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { Composer, EmptyState, HistoryList, Messages, PanelHeader, SAMPLE } from "./parts";

type View = "empty" | "chat" | "streaming" | "error" | "history";

const VIEWS: { key: View; label: string }[] = [
  { key: "empty", label: "首次打开" },
  { key: "chat", label: "对话中" },
  { key: "streaming", label: "生成中" },
  { key: "error", label: "出错" },
  { key: "history", label: "历史对话" },
];

export default function AiButlerDesignPage() {
  const [view, setView] = useState<View>("chat");
  const [open, setOpen] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  const streamingMsgs = [...SAMPLE, { role: "assistant" as const, text: "补洞的感觉确实很耗人。我注意到" }];

  return (
    <div className="min-h-dvh bg-paper">
      {/* 原型控制条：只在设计页出现 */}
      <div className="sticky top-[env(safe-area-inset-top,0px)] z-50 border-b border-line bg-paper-raised/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-3 text-small">
          <span className="label-caps mr-2 text-ink-faint">AI Butler 原型</span>
          {VIEWS.map((v) => (
            <button key={v.key} type="button" onClick={() => { setView(v.key); setOpen(true); }}
              className={`min-h-9 cursor-pointer rounded-full px-3.5 transition-colors ${
                view === v.key && open ? "bg-ai text-on-ai" : "text-ink-soft hover:bg-ai-soft hover:text-ai"}`}>
              {v.label}
            </button>
          ))}
          <button type="button" onClick={() => setShowPrompt((s) => !s)}
            className="ml-auto min-h-9 cursor-pointer text-ink-muted underline underline-offset-2 hover:text-ink">
            {showPrompt ? "收起系统提示词" : "查看系统提示词"}
          </button>
        </div>
        {showPrompt && (
          <pre className="mx-auto max-h-80 max-w-6xl overflow-auto whitespace-pre-wrap border-t border-line px-6 py-4 font-body text-small text-ink-soft">
            {buildSystemPrompt("Ran")}
          </pre>
        )}
      </div>

      {/* 示意的应用外壳 + Today 页，面板盖在它上面 */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <nav className="flex gap-6 text-small">
            <span className="font-medium text-ink">Today</span>
            <span className="text-ink-muted">Moments</span>
            <span className="text-ink-muted">Me</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="px-2 text-small text-ink-muted">Ran ▾</span>
            <button type="button" aria-label="打开 AI" onClick={() => setOpen((o) => !o)}
              className={`flex size-11 cursor-pointer items-center justify-center rounded-soft text-ai transition-colors hover:bg-ai-soft ${open ? "bg-ai-soft" : ""}`}>
              <Sparkle className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <p className="text-small text-ink-muted">10月10日 星期六</p>
        <h1 className="mt-2.5 font-display text-display text-ink">Good afternoon.</h1>
        <div className="mt-10 max-w-xl space-y-5">
          {["周二练了 40 分钟力量，状态还不错", "工作上的事一直收不了尾，有点累", "晚上看了一部电影"].map((t) => (
            <p key={t} className="border-l-2 border-line pl-4 text-body text-ink-soft">{t}</p>
          ))}
        </div>
      </main>

      {/* 面板：浮在右侧，竖直居中，圆角卡片。手机上居中显示。 */}
      {open && (
        <aside aria-label="AI 对话"
          className="animate-rise fixed inset-x-4 bottom-auto top-1/2 z-40 flex h-[min(42rem,90dvh)] -translate-y-1/2
            flex-col overflow-hidden rounded-sheet border border-line bg-paper/95 backdrop-blur-md
            shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]
            sm:inset-x-auto sm:right-6 sm:w-[24rem]">
          <PanelHeader inHistory={view === "history"} onToggleHistory={() => setView(view === "history" ? "chat" : "history")} />
          {view !== "empty" && view !== "history" && (
            <p className="border-b border-line-soft px-5 py-1.5 text-label text-ink-faint">
              对话和近期记录会发送给 AI 服务处理
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "empty" && <EmptyState />}
            {view === "chat" && <Messages messages={[...SAMPLE, { role: "assistant", text: "补洞的感觉确实很耗人。你 10 月 8 日也写到「很多缺口都没闭环」。\n\n如果愿意，可以说说现在最放不下的是哪一个？先把它单独拎出来，可能会轻一点。" }]} />}
            {view === "streaming" && <Messages messages={streamingMsgs} streaming />}
            {view === "error" && <Messages messages={SAMPLE} error />}
            {view === "history" && <HistoryList />}
          </div>
          {view !== "history" && <Composer streaming={view === "streaming"} />}
        </aside>
      )}
    </div>
  );
}
