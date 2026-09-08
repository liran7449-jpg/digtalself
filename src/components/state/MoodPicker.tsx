"use client";

import { useState } from "react";
import { MOOD_VALUES, type Mood } from "@/domain/enums";
import { MOOD_LABELS } from "@/domain/labels";

export type MoodKey = Mood;

export function MoodPicker({
  value,
  onChange,
}: {
  value?: MoodKey | null;
  onChange?: (m: MoodKey) => void;
}) {
  const [internal, setInternal] = useState<MoodKey | null>(value ?? null);
  const selected = value !== undefined ? value : internal;

  function pick(m: MoodKey) {
    setInternal(m);
    onChange?.(m);
  }

  return (
    <div role="radiogroup" aria-label="今天的心情" className="flex flex-wrap gap-2">
      {MOOD_VALUES.map((key) => {
        const m = MOOD_LABELS[key];
        const active = selected === key;
        return (
          <button
            key={key}
            // 必须显式声明：<button> 默认是 submit，放进 form 里点情绪会提前提交
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(key)}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-soft border px-4
              text-small transition-all duration-[var(--duration-quick)] ease-[var(--ease-calm)]
              ${
                active
                  ? "border-brand bg-brand-soft text-ink"
                  : "border-line bg-transparent text-ink-soft hover:border-line-strong hover:bg-paper-raised"
              }`}
          >
            <span
              className={`size-2 shrink-0 rounded-full ${m.dot} transition-transform duration-[var(--duration-quick)] ${
                active ? "scale-125" : "scale-100 opacity-55"
              }`}
            />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
