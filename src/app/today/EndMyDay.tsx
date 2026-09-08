"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Primitives";
import { MoodPicker } from "@/components/state/MoodPicker";
import { ReflectionCard } from "@/components/day/ReflectionCard";
import type { Mood } from "@/domain/enums";
import type { Day } from "@/domain/models";
import { submitReflection } from "./actions";

/**
 * IA 第 20 节 End My Day + PRD 第 14 节 Evening Reflection。
 *
 * 一次性表单而非分步向导：PRD 第 44 节要求 1–3 分钟完成，
 * 分页会把「随手写两句」变成一场仪式。
 * 三项都可跳过（IA 第 21 节），直接提交等于什么都不写。
 *
 * PRD 14.2 第 4 步「Your Day」是 AI 生成的回顾，等接 AI 后再补。
 */
export function EndMyDay({ day }: { day: Day }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (day.reflectedAt !== null) {
    return (
      <section>
        <ReflectionCard
          day={day}
          heading="今天的反思"
          closing="今天收尾了。晚安。"
        />
      </section>
    );
  }

  if (!open) {
    return (
      <div className="flex justify-center">
        {/* 任何时候都可用：不假设作息，下午两点想收尾也行 */}
        <Button variant="secondary" onClick={() => setOpen(true)}>
          End my day
        </Button>
      </div>
    );
  }

  return (
    <section>
      <Label tone="muted">今天的反思</Label>
      <p className="mt-3 measure text-body text-ink-soft">
        想写就写，不想写就直接收尾。
      </p>

      <form
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await submitReflection(fd);
            if (!res.ok) setError(res.error ?? "保存失败。");
          });
        }}
        className="mt-7 space-y-7"
      >
        {/* 提交时读的是这个 hidden 值；MoodPicker 是受控组件 */}
        <input type="hidden" name="eveningMood" value={mood ?? ""} />

        <div>
          <p className="text-small text-ink-soft">这一天过得怎么样？</p>
          <div className="mt-3">
            <MoodPicker
              value={mood}
              onChange={setMood}
              ariaLabel="这一天过得怎么样"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="stayed-with-you"
            className="text-small text-ink-soft"
          >
            今天什么留在了心里？
          </label>
          <textarea
            id="stayed-with-you"
            name="stayedWithYou"
            rows={3}
            maxLength={2000}
            className="mt-3 w-full measure resize-y rounded-soft border border-line bg-paper-sunken
              px-4 py-3 text-body text-ink placeholder:text-ink-faint
              focus:border-brand focus:outline-none"
            placeholder="一件事、一个念头、一种感觉都算。"
          />
        </div>

        <div>
          <label htmlFor="learned" className="text-small text-ink-soft">
            学到了什么？
          </label>
          <textarea
            id="learned"
            name="learned"
            rows={3}
            maxLength={2000}
            className="mt-3 w-full measure resize-y rounded-soft border border-line bg-paper-sunken
              px-4 py-3 text-body text-ink placeholder:text-ink-faint
              focus:border-brand focus:outline-none"
            placeholder="没有也没关系。"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "正在收尾…" : "收尾今天"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
          >
            再等等
          </Button>
        </div>

        {/* 交了就锁住，先说清楚再让人写 */}
        <p className="text-small text-ink-faint">
          提交后就不能改了 —— 留住此刻真实的想法。
        </p>

        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
