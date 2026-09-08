"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Rule } from "@/components/ui/Primitives";
import { MoodPicker } from "@/components/state/MoodPicker";
import { MOMENT_TYPE_VALUES } from "@/domain/enums";
import { MOMENT_TYPE_LABELS, MOOD_LABELS } from "@/domain/labels";
import type { Moment } from "@/domain/models";
import { deleteMomentAndReturn, updateMoment } from "../actions";

/**
 * IA 第 17 节的编辑层级：Level 1（内容）默认展开，
 * Level 2/3（类型、情绪、地点、为什么重要）折叠在「补充」里。
 * 记录时不该被要求分类，回看时才愿意补。
 */
export function MomentEditor({ moment }: { moment: Moment }) {
  const [editing, setEditing] = useState(false);
  const [showExtra, setShowExtra] = useState(
    Boolean(moment.place || moment.mood || moment.whyItMatters),
  );
  const [mood, setMood] = useState(moment.mood);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save(fd: FormData) {
    setError(null);
    if (mood) fd.set("mood", mood);
    startTransition(async () => {
      const res = await updateMoment(moment.id, fd);
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  }

  if (!editing) {
    return (
      <div>
        {/* 内容本身是主角，用 editorial 尺度 */}
        <p className="measure-wide whitespace-pre-wrap text-lead text-ink">
          {moment.content}
        </p>

        {moment.whyItMatters && (
          <div className="mt-11">
            <Label tone="brand">Why it matters</Label>
            <p className="mt-3 measure whitespace-pre-wrap text-body text-ink-soft">
              {moment.whyItMatters}
            </p>
          </div>
        )}

        {(moment.place || moment.mood || moment.isMemory) && (
          <>
            <Rule className="my-11" />
            <div className="space-y-3.5">
              <Label>Context</Label>
              <dl className="space-y-2.5 text-small">
                {moment.mood && (
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 text-ink-faint">Mood</dt>
                    <dd className="text-ink-soft">
                      {MOOD_LABELS[moment.mood].label} ·{" "}
                      {MOOD_LABELS[moment.mood].zh}
                    </dd>
                  </div>
                )}
                {moment.place && (
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 text-ink-faint">Place</dt>
                    <dd className="text-ink-soft">{moment.place}</dd>
                  </div>
                )}
                {moment.isMemory && (
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 text-ink-faint">Memory</dt>
                    <dd className="text-accent">值得长期记住</dd>
                  </div>
                )}
              </dl>
            </div>
          </>
        )}

        <Rule className="my-11" />

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            编辑
          </Button>

          {confirmingDelete ? (
            <span className="flex items-center gap-3">
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deleteMomentAndReturn(moment.id);
                  })
                }
                disabled={pending}
                className="min-h-10 cursor-pointer px-1 text-small text-danger underline
                  decoration-danger/40 underline-offset-2"
              >
                {pending ? "删除中…" : "确认永久删除"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="min-h-10 cursor-pointer px-1 text-small text-ink-muted"
              >
                取消
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="min-h-10 cursor-pointer px-1 text-small text-ink-faint
                transition-colors hover:text-danger"
            >
              删除
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={save}>
      <Label htmlFor="content">What happened</Label>
      <textarea
        id="content"
        name="content"
        defaultValue={moment.content}
        rows={7}
        maxLength={20000}
        required
        className="mt-3 block w-full resize-y rounded-card border border-line bg-paper-sunken
          px-5 py-4 text-body leading-relaxed text-ink transition-colors
          duration-[var(--duration-quick)] hover:border-line-strong
          focus:border-brand focus:outline-none"
      />

      {!showExtra ? (
        <button
          type="button"
          onClick={() => setShowExtra(true)}
          className="mt-5 min-h-11 cursor-pointer text-small text-ink-muted
            transition-colors hover:text-brand"
        >
          + 补充情绪、地点，或写下为什么重要
        </button>
      ) : (
        <div className="mt-11 space-y-9">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={moment.type}
              className="mt-3 block min-h-11 rounded-soft border border-line bg-paper-sunken
                px-4 text-body text-ink focus:border-brand focus:outline-none"
            >
              {MOMENT_TYPE_VALUES.map((t) => (
                <option key={t} value={t}>
                  {MOMENT_TYPE_LABELS[t].label} · {MOMENT_TYPE_LABELS[t].zh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Mood</Label>
            <div className="mt-3">
              <MoodPicker value={mood} onChange={setMood} />
            </div>
          </div>

          <div>
            <Label htmlFor="place">Place</Label>
            <input
              id="place"
              name="place"
              type="text"
              defaultValue={moment.place ?? ""}
              maxLength={160}
              placeholder="在哪里？"
              className="mt-3 block w-full max-w-md min-h-11 rounded-soft border border-line
                bg-paper-sunken px-4 text-body text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <Label htmlFor="whyItMatters">Why it matters</Label>
            <p className="mt-1.5 measure text-small text-ink-muted">
              过一段时间再看，你会想知道当时为什么记下这件事。
            </p>
            <textarea
              id="whyItMatters"
              name="whyItMatters"
              defaultValue={moment.whyItMatters ?? ""}
              rows={4}
              maxLength={4000}
              className="mt-3 block w-full resize-y rounded-card border border-line
                bg-paper-sunken px-5 py-4 text-body leading-relaxed text-ink
                focus:border-brand focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="isMemory"
              defaultChecked={moment.isMemory}
              className="size-4 cursor-pointer accent-brand"
            />
            <span className="text-small text-ink-soft">
              这件事值得长期记住
            </span>
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 text-small text-danger">
          {error}
        </p>
      )}

      <div className="mt-11 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : "保存"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setEditing(false);
            setMood(moment.mood);
            setError(null);
          }}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
