"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Primitives";
import { MoodPicker, type MoodKey } from "@/components/state/MoodPicker";
import { submitMorningSetup } from "./actions";

/**
 * IA 第 9 节 Morning Setup。简化为两步：mood + focus。
 * 每一步都可跳过 —— 强制填写会让用户在状态不好的那天直接放弃打开产品。
 */
export function MorningSetup({ greeting, dateLabel }: { greeting: string; dateLabel: string }) {
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(withState: boolean) {
    setError(null);
    const fd = new FormData();
    if (withState) {
      if (mood) fd.set("mood", mood);
      if (focus.trim()) fd.set("focus", focus.trim());
    }
    startTransition(async () => {
      const res = await submitMorningSetup(fd);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="animate-rise">
      <header>
        <p className="text-small text-ink-muted">{dateLabel}</p>
        <h1 className="mt-2.5 font-display text-display text-ink">{greeting}</h1>
        <p className="mt-5 measure text-lead text-ink-soft">
          先看看今天的自己。这两项都可以跳过。
        </p>
      </header>

      <div className="mt-11 space-y-9">
        <section>
          <Label>现在感觉怎么样</Label>
          <div className="mt-3.5">
            <MoodPicker value={mood} onChange={setMood} />
          </div>
        </section>

        {mood && (
          <section className="animate-rise">
            <Label htmlFor="focus-input">What matters most today</Label>
            <input
              id="focus-input"
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="今天最想专注什么？"
              maxLength={280}
              className="mt-3.5 block w-full max-w-xl rounded-card border border-line bg-paper-sunken px-5 py-3.5
                text-body text-ink transition-colors duration-[var(--duration-quick)]
                hover:border-line-strong focus:border-brand focus:outline-none"
            />
          </section>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-6 text-small text-danger">
          {error}
        </p>
      )}

      <div className="mt-11 flex flex-wrap items-center gap-3">
        <Button onClick={() => submit(true)} disabled={pending}>
          {pending ? "正在开始…" : "Shape my day"}
        </Button>
        <Button variant="ghost" onClick={() => submit(false)} disabled={pending}>
          今天先跳过
        </Button>
      </div>
    </div>
  );
}
