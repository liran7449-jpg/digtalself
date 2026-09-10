"use client";

import { useState, useTransition } from "react";
import { Label, Sparkle } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { priorityBar, priorityText } from "@/components/plan/priority-style";
import type { PlanItem } from "@/domain/models";
import { PLAN_PRIORITY_VALUES, type PlanPriority, type PlanStatus } from "@/domain/enums";
import { PRIORITY_LABELS } from "@/domain/labels";
import type { CarryOverResult } from "@/repositories/types";
import {
  addPlanItem,
  deletePlanItem,
  setPlanPriority,
  setPlanStatus,
  updatePlanItem,
} from "./actions";

/** 表单里的优先级选择。normal 是默认值，不需要用户操心。 */
function PrioritySelect({
  defaultValue = "normal",
  id,
}: {
  defaultValue?: PlanPriority;
  id?: string;
}) {
  return (
    <select
      id={id}
      name="priority"
      defaultValue={defaultValue}
      aria-label="优先级"
      className="min-h-11 rounded-soft border border-line bg-paper-sunken px-3
        text-small text-ink focus:border-brand focus:outline-none"
    >
      {PLAN_PRIORITY_VALUES.map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p].zh}
        </option>
      ))}
    </select>
  );
}

function ItemRow({ item }: { item: PlanItem }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<PlanStatus | null>(null);
  const [optimisticPriority, setOptimisticPriority] =
    useState<PlanPriority | null>(null);

  /**
   * 勾选框是受控输入，checked 绑在服务端状态上。没有乐观状态时，
   * 点一下要等服务端往返才有视觉反应，用户会以为没点上。
   * transition 结束后 item.status 已经是新值，自然回落即可。
   */
  const status = pending && optimistic ? optimistic : item.status;
  const priority =
    pending && optimisticPriority ? optimisticPriority : item.priority;
  const done = status === "completed";
  const skipped = status === "skipped";
  const dimmed = done || skipped;

  function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    onFail?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "操作失败。");
        onFail?.();
      } else {
        setEditing(false);
        setConfirmingDelete(false);
      }
      // 成功后也要清掉乐观值。虽然读取时用 pending 兜着，但残留的旧值
      // 会在下一次别的操作 pending 期间闪出来（改过优先级后再勾选就会）。
      setOptimistic(null);
      setOptimisticPriority(null);
    });
  }

  if (editing) {
    return (
      <li className="border-t border-line-soft first:border-0">
        <form
          action={(fd) => run(() => updatePlanItem(item.id, fd))}
          className="flex flex-wrap items-center gap-2.5 py-3"
        >
          <input
            name="startAt"
            type="time"
            defaultValue={item.startAt ?? ""}
            aria-label="时间"
            className="min-h-11 rounded-soft border border-line bg-paper-sunken px-3
              text-small text-ink focus:border-brand focus:outline-none"
          />
          <PrioritySelect defaultValue={item.priority} />
          <input
            name="title"
            type="text"
            defaultValue={item.title}
            required
            autoFocus
            maxLength={200}
            aria-label="事项"
            className="min-h-11 min-w-44 flex-1 rounded-soft border border-line bg-paper-sunken
              px-4 text-body text-ink focus:border-brand focus:outline-none"
          />
          <Button size="sm" type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
          >
            取消
          </Button>
        </form>
        {error && (
          <p role="alert" className="pb-2.5 text-small text-danger">
            {error}
          </p>
        )}
      </li>
    );
  }

  const bar = dimmed ? null : priorityBar(priority);

  return (
    <li className="group relative border-t border-line-soft first:border-0">
      {/* 高优先级的一道细竖线。单色，不引入红黄绿。 */}
      {bar && (
        <span
          aria-hidden="true"
          className={`absolute left-0 top-3.5 bottom-3.5 w-0.5 rounded-full ${bar}`}
        />
      )}

      <div className="flex items-start gap-3 py-3.5 pl-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={done}
            disabled={skipped}
            onChange={() => {
              const next = done ? "planned" : "completed";
              setOptimistic(next);
              run(
                () => setPlanStatus(item.id, next),
                () => setOptimistic(null),
              );
            }}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-brand
              disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`标记「${item.title}」${done ? "未完成" : "已完成"}`}
          />

          <label className="min-w-0 flex-1 cursor-pointer">
            <span
              className={`block text-body ${
                done
                  ? "text-ink-faint line-through decoration-line-strong"
                  : priorityText(priority, { dimmed })
              }`}
            >
              {item.title}
              {item.fromAi && (
                <Sparkle
                  className="ml-2 inline size-3 align-baseline text-ai"
                  aria-label="来自 AI 建议"
                />
              )}
            </span>

            {/* 优先级和操作按钮：hover 时才显示 */}
            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-0 transition-opacity duration-[var(--duration-quick)] group-hover:opacity-100">
              {!dimmed && (
                <span
                  role="radiogroup"
                  aria-label={`「${item.title}」的优先级`}
                  className="inline-flex items-center gap-1.5"
                >
                  {PLAN_PRIORITY_VALUES.map((p) => {
                    const active = p === priority;
                    return (
                      <button
                        key={p}
                        role="radio"
                        aria-checked={active}
                        disabled={active}
                        onClick={(e) => {
                          e.preventDefault();
                          setOptimisticPriority(p);
                          run(
                            () => setPlanPriority(item.id, p),
                            () => setOptimisticPriority(null),
                          );
                        }}
                        className={`text-label transition-colors ${
                          active
                            ? "cursor-default font-medium text-brand"
                            : "cursor-pointer text-ink-faint hover:text-ink"
                        }`}
                      >
                        {PRIORITY_LABELS[p].zh}
                      </button>
                    );
                  })}
                </span>
              )}

              {/* 操作按钮：改和删 */}
              {!dimmed && (
                <span className="inline-flex items-center gap-2.5">
                  {confirmingDelete ? (
                    <>
                      <button
                        onClick={() => run(() => deletePlanItem(item.id))}
                        disabled={pending}
                        className="cursor-pointer text-label text-danger underline
                          decoration-danger/40 underline-offset-2"
                      >
                        {pending ? "删除中…" : "确认"}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        className="cursor-pointer text-label text-ink-muted"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="cursor-pointer text-label text-ink-faint transition-colors
                          hover:text-brand"
                        aria-label={`编辑「${item.title}」`}
                      >
                        改
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer text-label text-ink-faint transition-colors
                          hover:text-danger"
                        aria-label={`删除「${item.title}」`}
                      >
                        删
                      </button>
                    </>
                  )}
                </span>
              )}
            </span>
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="pb-2.5 pl-16 text-small text-danger">
          {error}
        </p>
      )}
    </li>
  );
}

export function Timeline({ items }: { items: PlanItem[] }) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  function add(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPlanItem(fd);
      if (res.ok) setAdding(false);
      else setError(res.error);
    });
  }

  /**
   * 已完成的安静收成一行，不占视觉空间。
   * 跳过的留在主列表里（淡显 + 「跳过」标签）—— 那是主动的决定，
   * 不是「做完了」，收进「已完成 N 件」里会歪曲它的含义。
   */
  const done = items.filter((i) => i.status === "completed");
  const active = items.filter((i) => i.status !== "completed");

  return (
    <section>
      {/*
        刻意不显示「已完成/总数」计数。090823 文档 3.2 节：
        不给一天做 1–10 分评分，避免产品变成生活效率评分器。
        YOUR DAY 代表今天真实发生过的一切，不是完成率。
      */}
      <Label>Your day</Label>

      {items.length === 0 && !adding ? (
        <p className="mt-3 text-body text-ink-muted">
          今天还没有安排。可以先什么都不排。
        </p>
      ) : (
        <>
          {active.length > 0 && (
            <ul className="mt-3">
              {active.map((i) => (
                <ItemRow key={i.id} item={i} />
              ))}
            </ul>
          )}

          {/* 完成的事收成一行，点开才展开 —— 已经做完的不需要一直占地方 */}
          {done.length > 0 && (
            <div className={active.length > 0 ? "mt-4" : "mt-3"}>
              <button
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5
                  text-small text-ink-muted transition-colors hover:text-ink"
              >
                <span className="text-brand">✓</span>
                今天已完成 {done.length} 件
                <span className="text-ink-faint">{showDone ? "收起" : "看看"}</span>
              </button>

              {showDone && (
                <ul className="animate-rise mt-1.5">
                  {done.map((i) => (
                    <ItemRow key={i.id} item={i} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {adding ? (
        <form action={add} className="mt-5 flex flex-wrap items-center gap-2.5">
          <input
            name="startAt"
            type="time"
            aria-label="时间"
            className="min-h-11 rounded-soft border border-line bg-paper-sunken px-3 text-small text-ink
              focus:border-brand focus:outline-none"
          />
          <PrioritySelect />
          <input
            name="title"
            type="text"
            required
            autoFocus
            maxLength={200}
            placeholder="要做什么？"
            aria-label="事项"
            className="min-h-11 min-w-44 flex-1 rounded-soft border border-line bg-paper-sunken px-4
              text-body text-ink focus:border-brand focus:outline-none"
          />
          <Button size="sm" type="submit" disabled={pending}>
            添加
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            取消
          </Button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 min-h-11 cursor-pointer text-small text-ink-muted transition-colors
            hover:text-brand"
        >
          + 加一件事
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2.5 text-small text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
