"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { MoodPicker } from "@/components/state/MoodPicker";
import { EnergyPicker } from "@/components/state/EnergyPicker";
import type { Day } from "@/domain/models";
import { ENERGY_LABELS, MOOD_LABELS } from "@/domain/labels";
import { updateDayState } from "./actions";

/**
 * 白天状态随时可改。
 *
 * 早上填的 mood 到下午往往就不准了 —— 状态是流动的，
 * 一次性写入等于强迫用户守着一个过期的自我描述。
 * 折叠态只是一行安静的文字，点开才是编辑器。
 */
export function MyState({ day }: { day: Day }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(field: "mood" | "energy", value: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateDayState(field, value);
      if (!res.ok) setError(res.error);
    });
  }

  const summary = [
    day.mood ? MOOD_LABELS[day.mood].label : null,
    day.energy ? `${ENERGY_LABELS[day.energy].label} energy` : null,
  ].filter(Boolean);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group -mx-2 inline-flex min-h-11 items-center gap-2.5 rounded-soft px-2
          text-small text-ink-muted transition-colors duration-[var(--duration-quick)]
          hover:bg-paper-raised hover:text-ink"
      >
        {day.mood && (
          <span
            className={`size-2 shrink-0 rounded-full ${MOOD_LABELS[day.mood].dot}`}
            aria-hidden="true"
          />
        )}
        <span>{summary.length > 0 ? summary.join(" · ") : "记下现在的状态"}</span>
        <span className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
          改
        </span>
      </button>
    );
  }

  return (
    <div className="animate-rise rounded-card border border-line bg-paper-sunken p-6">
      <div className="space-y-7">
        <section>
          <Label>How are you feeling</Label>
          <div className="mt-3">
            <MoodPicker
              value={day.mood}
              onChange={(m) => set("mood", m)}
            />
          </div>
        </section>

        <section>
          <Label>Energy</Label>
          <div className="mt-3">
            <EnergyPicker
              value={day.energy}
              onChange={(e) => set("energy", e)}
            />
          </div>
        </section>
      </div>

      {error && (
        <p role="alert" className="mt-5 text-small text-danger">
          {error}
        </p>
      )}

      <div className="mt-7 flex items-center gap-4">
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
          收起
        </Button>
        {pending && <span className="text-small text-ink-faint">保存中…</span>}
      </div>
    </div>
  );
}
