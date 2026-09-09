"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Rule } from "@/components/ui/Primitives";
import { MoodPicker } from "@/components/state/MoodPicker";
import { PersonLinksPanel } from "@/components/moment/PersonLinksPanel";
import { PlaceLinksPanel } from "@/components/moment/PlaceLinksPanel";
import { TopicLinksPanel } from "@/components/moment/TopicLinksPanel";
import { GoalLinksPanel } from "@/components/moment/GoalLinksPanel";
import { ImageUploader } from "@/components/moment/ImageUploader";
import { MOMENT_TYPE_VALUES } from "@/domain/enums";
import { MOMENT_TYPE_LABELS, MOOD_LABELS } from "@/domain/labels";
import type { Moment, Person, Place, Topic, Goal, Media } from "@/domain/models";
import { deleteMomentAndReturn, updateMoment } from "../actions";
import {
  linkPerson,
  unlinkPerson,
  linkPlace,
  unlinkPlace,
  linkTopic,
  unlinkTopic,
  linkGoal,
  unlinkGoal,
  markAsMemory,
  unmarkAsMemory,
  uploadImage,
  deleteImage,
} from "../link-actions";

/**
 * IA 第 17 节的编辑层级：Level 1（内容）默认展开，
 * Level 2/3（类型、情绪、地点、为什么重要）折叠在「补充」里。
 * 记录时不该被要求分类，回看时才愿意补。
 */
export function MomentEditor({
  moment,
  linkedPeople,
  linkedPlaces,
  linkedTopics,
  linkedGoals,
  availableGoals,
  linkedMedia,
  isMemory,
}: {
  moment: Moment;
  linkedPeople: Person[];
  linkedPlaces: Place[];
  linkedTopics: Topic[];
  linkedGoals: Goal[];
  availableGoals: Goal[];
  linkedMedia: Media[];
  isMemory: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState(moment.mood);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

        <Rule className="my-11" />

        {/* 关联面板 - 非编辑模式下只读显示 */}
        <div className="space-y-9">
          {moment.mood && (
            <div>
              <Label>Mood</Label>
              <p className="mt-3 text-small text-ink-soft">
                {MOOD_LABELS[moment.mood].label} · {MOOD_LABELS[moment.mood].zh}
              </p>
            </div>
          )}

          {linkedPeople.length > 0 && (
            <div>
              <Label>People</Label>
              <ul className="mt-3 flex flex-wrap gap-2">
                {linkedPeople.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-full bg-paper-sunken px-3 py-1.5 text-small text-ink"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {linkedPlaces.length > 0 && (
            <div>
              <Label>Places</Label>
              <ul className="mt-3 flex flex-wrap gap-2">
                {linkedPlaces.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-full bg-paper-sunken px-3 py-1.5 text-small text-ink"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {linkedTopics.length > 0 && (
            <div>
              <Label>Topics</Label>
              <ul className="mt-3 flex flex-wrap gap-2">
                {linkedTopics.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-full bg-paper-sunken px-3 py-1.5 text-small text-ink"
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {linkedGoals.length > 0 && (
            <div>
              <Label>Goals</Label>
              <ul className="mt-3 space-y-2">
                {linkedGoals.map((g) => (
                  <li
                    key={g.id}
                    className="rounded-soft bg-paper-sunken px-3 py-2 text-small text-ink"
                  >
                    {g.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isMemory && (
            <div>
              <Label>Memory</Label>
              <p className="mt-3 text-small text-accent">已标记为长期记忆</p>
            </div>
          )}

          {/* 图片上传：显示模式也可用 */}
          <ImageUploader
            momentId={moment.id}
            existingImages={linkedMedia}
            onUpload={uploadImage}
            onDelete={deleteImage}
          />
        </div>

        <Rule className="my-11" />

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            编辑
          </Button>

          {isMemory ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await unmarkAsMemory(moment.id);
                })
              }
              disabled={pending}
            >
              {pending ? "处理中..." : "取消标记为记忆"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await markAsMemory(moment.id);
                })
              }
              disabled={pending}
            >
              {pending ? "处理中..." : "标记为记忆"}
            </Button>
          )}

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

        <PersonLinksPanel
          momentId={moment.id}
          linked={linkedPeople}
          onLink={linkPerson}
          onUnlink={unlinkPerson}
        />

        <PlaceLinksPanel
          momentId={moment.id}
          linked={linkedPlaces}
          onLink={linkPlace}
          onUnlink={unlinkPlace}
        />

        <TopicLinksPanel
          momentId={moment.id}
          linked={linkedTopics}
          onLink={linkTopic}
          onUnlink={unlinkTopic}
        />

        <GoalLinksPanel
          momentId={moment.id}
          linked={linkedGoals}
          available={availableGoals}
          onLink={linkGoal}
          onUnlink={unlinkGoal}
        />

        <ImageUploader
          momentId={moment.id}
          existingImages={linkedMedia}
          onUpload={uploadImage}
          onDelete={deleteImage}
        />
      </div>

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
