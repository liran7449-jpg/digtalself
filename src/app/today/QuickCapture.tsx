"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Primitives";
import { captureMoment } from "./actions";

/**
 * PRD 第 10 节 Quick Capture：MVP 最重要的低摩擦入口。
 * 摩擦预算是「打开即可写，一次提交完成」，所以不做类型选择、不做标签、
 * 不做弹窗确认。类型和标签留给后续 AI 后处理补。
 */
export function QuickCapture() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  function save() {
    const content = value.trim();
    if (!content) {
      setError("写点什么。");
      ref.current?.focus();
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.set("content", content);
    fd.set("type", "thought");

    // 先清空输入框，写入失败再恢复 —— 记录类产品里等待感比失败更伤体验
    setValue("");
    startTransition(async () => {
      const res = await captureMoment(fd);
      if (res.ok) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2200);
      } else {
        setValue(content);
        setError(res.error);
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘/Ctrl + Enter 提交，Enter 保留换行
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor="capture-input">Capture</Label>
        {justSaved && (
          <span className="label-caps text-brand" role="status">
            已记下
          </span>
        )}
      </div>

      <textarea
        id="capture-input"
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={20000}
        placeholder="现在在想什么？"
        aria-describedby="capture-hint"
        className="mt-3.5 block w-full resize-y rounded-card border border-line bg-paper-sunken px-5 py-4
          text-body leading-relaxed text-ink transition-colors duration-[var(--duration-quick)]
          hover:border-line-strong focus:border-brand focus:outline-none"
      />

      {error && (
        <p role="alert" className="mt-2.5 text-small text-danger">
          {error}
        </p>
      )}

      <div className="mt-3.5 flex items-center gap-4">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "保存中…" : "记下"}
        </Button>
        <span id="capture-hint" className="text-small text-ink-muted">
          ⌘ + Enter 快速保存
        </span>
      </div>
    </section>
  );
}
