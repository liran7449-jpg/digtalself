"use client";

import Link from "next/link";
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
import { MOMENT_TYPE_LABELS } from "@/domain/labels";
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
 * 详情页只有一个状态：可编辑。
 *
 * 从 feed 点进来的人已经在 feed 上读过正文了，中间再插一层只读页
 * 是最没有信息增量的一次点击。原来只读态独有的两个操作搬进了表单：
 *
 * - 删除：底部最右，和保存拉开距离，保留二次确认。
 * - 记忆标记：表单里的一个区块，但不是表单的一个字段 ——
 *   updateMoment 的 schema 故意不收 isMemory（单写标记位会让
 *   memories 表对不上），所以它走 markAsMemory / unmarkAsMemory
 *   即时生效，不参与 save。
 *
 * 「取消」不再是「退出编辑」，没有可退回的态了，它是「不改了，回列表」。
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
  const [mood, setMood] = useState(moment.mood);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // 页面不再切换外观，保存后没有任何视觉变化 —— 得给一句明确的回执。
  const [saved, setSaved] = useState(false);

  function save(fd: FormData) {
    setError(null);
    setSaved(false);
    if (mood) fd.set("mood", mood);
    startTransition(async () => {
      const res = await updateMoment(moment.id, fd);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
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
        onChange={() => setSaved(false)}
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

        {/*
          Memory 和 mood 同级摆在这里，但它是即时生效的独立操作，
          不等 save —— 理由见组件顶部注释。
        */}
        <div>
          <Label>Memory</Label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  if (isMemory) await unmarkAsMemory(moment.id);
                  else await markAsMemory(moment.id);
                })
              }
              disabled={pending}
            >
              {pending
                ? "处理中..."
                : isMemory
                  ? "取消标记为记忆"
                  : "标记为记忆"}
            </Button>
            {isMemory && (
              <span className="text-small text-accent">已标记为长期记忆</span>
            )}
          </div>
        </div>

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

      <Rule className="my-11" />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : "保存"}
        </Button>

        {/*
          没有只读态可退回，「取消」= 回列表。
          用真链接而不是 onClick 跳转：可以中键 / 新标签打开，
          样式照 Button 的 ghost + md 对齐。
        */}
        <Link
          href="/moments"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2
            rounded-soft px-5 font-body text-body font-medium text-ink-soft
            transition-all duration-[var(--duration-quick)] ease-[var(--ease-calm)]
            hover:bg-brand-soft hover:text-ink"
        >
          取消
        </Link>

        {saved && (
          <span role="status" className="text-small text-ink-muted">
            已保存
          </span>
        )}

        {/*
          删除推到最右，和保存隔开整行宽度。
          原生 button 在 form 里默认 type=submit，必须显式写 button。
        */}
        <span className="ml-auto">
          {confirmingDelete ? (
            <span className="flex items-center gap-3">
              <button
                type="button"
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
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="min-h-10 cursor-pointer px-1 text-small text-ink-muted"
              >
                取消
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="min-h-10 cursor-pointer px-1 text-small text-ink-faint
                transition-colors hover:text-danger"
            >
              删除
            </button>
          )}
        </span>
      </div>
    </form>
  );
}
