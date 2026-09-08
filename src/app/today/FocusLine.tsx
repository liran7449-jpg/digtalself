"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { updateDayState } from "./actions";

/**
 * Today's Focus，就地编辑。
 *
 * Focus 是一句话而不是一个选项，所以用文本输入而非 picker。
 * 空 focus 时显示一个安静的邀约，不显示空标题占位。
 */
export function FocusLine({ focus }: { focus: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(focus ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    const value = draft.trim();
    startTransition(async () => {
      const res = await updateDayState("focus", value || null);
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  }

  function cancel() {
    setDraft(focus ?? "");
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <section className="animate-rise">
        <Label htmlFor="focus-edit">Today&apos;s Focus</Label>
        <input
          id="focus-edit"
          type="text"
          value={draft}
          autoFocus
          maxLength={280}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") cancel();
          }}
          placeholder="今天最想专注什么？"
          className="mt-3 block w-full max-w-xl rounded-card border border-line bg-paper-sunken
            px-5 py-3.5 text-body text-ink transition-colors duration-[var(--duration-quick)]
            hover:border-line-strong focus:border-brand focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-2.5 text-small text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
          <Button size="sm" variant="ghost" onClick={cancel}>
            取消
          </Button>
          {focus && (
            <button
              onClick={() => {
                setDraft("");
                startTransition(async () => {
                  const res = await updateDayState("focus", null);
                  if (res.ok) setEditing(false);
                  else setError(res.error);
                });
              }}
              className="min-h-10 cursor-pointer px-1 text-small text-ink-faint
                transition-colors hover:text-danger"
            >
              清空
            </button>
          )}
        </div>
      </section>
    );
  }

  if (!focus) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="-mx-2 inline-flex min-h-11 items-center rounded-soft px-2 text-small
          text-ink-muted transition-colors duration-[var(--duration-quick)]
          hover:bg-paper-raised hover:text-brand"
      >
        + 定一个今天的重点
      </button>
    );
  }

  return (
    <section>
      <Label>Today&apos;s Focus</Label>
      <button
        onClick={() => setEditing(true)}
        className="group -mx-2 mt-3 block w-full rounded-soft px-2 py-1 text-left
          transition-colors duration-[var(--duration-quick)] hover:bg-paper-raised"
      >
        <span className="measure font-display text-title text-ink">{focus}</span>
        <span className="ml-3 align-middle text-small text-ink-faint opacity-0
          transition-opacity group-hover:opacity-100">
          改
        </span>
      </button>
    </section>
  );
}
