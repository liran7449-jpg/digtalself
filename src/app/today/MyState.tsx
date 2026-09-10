"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import type { Day } from "@/domain/models";
import type { Mood } from "@/domain/enums";
import { MOOD_LABELS } from "@/domain/labels";
import { updateDayState } from "./actions";

/**
 * 轻量状态选择器。点击圆点向右弹出三色按钮。
 *
 * 早上填的 mood 到下午往往就不准了 —— 状态是流动的，
 * 随时可改，不做复杂面板。
 */
export function MyState({ day }: { day: Day }) {
  const [moodOpen, setMoodOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const moodRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭 mood picker
  useEffect(() => {
    if (!moodOpen) return;
    function handleClick(e: MouseEvent) {
      if (moodRef.current && !moodRef.current.contains(e.target as Node)) {
        setMoodOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moodOpen]);

  function setMood(mood: Mood) {
    setError(null);
    startTransition(async () => {
      const res = await updateDayState("mood", mood);
      if (!res.ok) setError(res.error);
      else setMoodOpen(false);
    });
  }

  return (
    <div>
      {/* 轻量状态选择器 */}
      <div className="relative inline-flex items-center gap-2" ref={moodRef}>
        <button
          onClick={() => setMoodOpen(!moodOpen)}
          className="group inline-flex min-h-8 items-center gap-2 rounded-soft px-2
              text-small text-ink-muted transition-colors duration-[var(--duration-quick)]
              hover:bg-paper-raised hover:text-ink"
        >
          <span
            className={`size-2.5 rounded-full ${day.mood && MOOD_LABELS[day.mood] ? MOOD_LABELS[day.mood].color : "bg-line-strong"}`}
          />
          <span>{day.mood && MOOD_LABELS[day.mood] ? MOOD_LABELS[day.mood].zh : "记下状态"}</span>
        </button>

        {moodOpen && (
          <div className="animate-rise absolute left-full top-0 ml-2 flex gap-1.5 rounded-soft border border-line bg-paper p-1.5 shadow-sm">
            {(["good", "okay", "bad"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                disabled={pending}
                className={`flex size-8 items-center justify-center rounded-soft transition-all
                  ${day.mood === m ? "ring-2 ring-brand ring-offset-1" : "hover:scale-110"}`}
                title={MOOD_LABELS[m].zh}
              >
                <span className={`size-3 rounded-full ${MOOD_LABELS[m].color}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
