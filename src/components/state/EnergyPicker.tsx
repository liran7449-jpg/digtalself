"use client";

import { useState } from "react";
import { ENERGY_VALUES, type Energy } from "@/domain/enums";
import { ENERGY_LABELS } from "@/domain/labels";

export type EnergyKey = Energy;

export function EnergyPicker({
  value,
  onChange,
}: {
  value?: EnergyKey | null;
  onChange?: (e: EnergyKey) => void;
}) {
  const [internal, setInternal] = useState<EnergyKey | null>(value ?? null);
  const selected = value !== undefined ? value : internal;

  function pick(e: EnergyKey) {
    setInternal(e);
    onChange?.(e);
  }

  return (
    <div role="radiogroup" aria-label="今天的精力" className="flex flex-wrap gap-2">
      {ENERGY_VALUES.map((key) => {
        const e = ENERGY_LABELS[key];
        const active = selected === key;
        return (
          <button
            key={key}
            // 同 MoodPicker：不写 type 会在 form 内变成 submit
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
            {/* 三格能量条，形状本身传达强弱，不只靠颜色 */}
            <span className="flex items-end gap-0.5" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-[var(--duration-quick)] ${
                    i === 1 ? "h-1.5" : i === 2 ? "h-2.5" : "h-3.5"
                  } ${
                    i <= e.bars
                      ? active
                        ? "bg-brand"
                        : "bg-ink-muted"
                      : "bg-line-strong"
                  }`}
                />
              ))}
            </span>
            {e.label}
          </button>
        );
      })}
    </div>
  );
}
