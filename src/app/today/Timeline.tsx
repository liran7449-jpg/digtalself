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
  carryOverToToday,
  deletePlanItem,
  dismissCarryOver,
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

      <div className="flex items-start gap-4 py-3.5 pl-3">
        <span
          className={`w-12 shrink-0 pt-0.5 font-mono text-small tabular-nums ${
            dimmed ? "text-ink-faint" : "text-ink-muted"
          }`}
        >
          {item.startAt ?? "—"}
        </span>

        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={done}
            // 不因 pending 而 disabled：点完立刻锁住会让人以为点失败了。
            // 乐观状态已经给出即时反馈，重复点击由服务端幂等处理。
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
          <span className="min-w-0">
            <span
              className={`text-body ${
                done
                  ? "text-ink-faint line-through decoration-line-strong"
                  : priorityText(priority, { dimmed })
              }`}
            >
              {item.title}
            </span>
            {item.fromAi && (
              <Sparkle
                className="ml-2 inline size-3 align-baseline text-ai"
                aria-label="来自 AI 建议"
              />
            )}

            {/* 顺延天数摆在明面上，让用户自己决定是不是该放掉它 */}
            {(skipped || item.carryCount > 0) && (
              <span className="ml-2.5 inline-flex gap-2.5 align-middle">
                {skipped && (
                  <span className="label-caps text-ink-faint">跳过</span>
                )}
                {item.carryCount > 0 && (
                  <span
                    className="label-caps text-ink-faint"
                    title={`这件事已经跟着你 ${item.carryCount} 天`}
                  >
                    顺延 {item.carryCount} 天
                  </span>
                )}
              </span>
            )}
          </span>
        </label>

        {/* 行内动作：默认隐形，hover 或键盘聚焦时出现 */}
        <div
          className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity
            duration-[var(--duration-quick)] focus-within:opacity-100 group-hover:opacity-100"
        >
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
              {/*
                三档直选而非循环切换。
                改优先级会让这一行按新顺序跳走，而行内按钮靠 hover 才显形 ——
                循环切换要点第二下时按钮已经不在鼠标底下了，实际点不到。
                一次点击到位就没有这个问题，也不用猜按钮的语义。
              */}
              {!dimmed && (
                <span
                  role="radiogroup"
                  aria-label={`「${item.title}」的优先级`}
                  className="flex items-center gap-2"
                >
                  {PLAN_PRIORITY_VALUES.map((p) => {
                    const active = p === priority;
                    return (
                      <button
                        key={p}
                        role="radio"
                        aria-checked={active}
                        disabled={active}
                        onClick={() => {
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
              <button
                onClick={() => setEditing(true)}
                className="cursor-pointer text-label text-ink-faint transition-colors
                  hover:text-brand"
                aria-label={`编辑「${item.title}」`}
              >
                改
              </button>
              {!done && (
                <button
                  onClick={() => {
                    const next = skipped ? "planned" : "skipped";
                    setOptimistic(next);
                    run(
                      () => setPlanStatus(item.id, next),
                      () => setOptimistic(null),
                    );
                  }}
                  className="cursor-pointer text-label text-ink-faint transition-colors
                    hover:text-ink"
                  aria-label={
                    skipped ? `恢复「${item.title}」` : `跳过「${item.title}」`
                  }
                >
                  {skipped ? "恢复" : "跳过"}
                </button>
              )}
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

export function Timeline({
  items,
  carryable,
}: {
  items: PlanItem[];
  /** 有多少项可以从前一天顺延过来。count 为 0 时不显示入口。 */
  carryable: CarryOverResult;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /**
   * 只用于点「不用」后立刻收起，等服务端往返完成。
   * 真正的记忆在 day.carryDismissed（落库），所以刷新后也不会再问 ——
   * 之前只有这个客户端状态，刷新提示就又冒出来了。
   */
  const [hiding, setHiding] = useState(false);

  function add(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPlanItem(fd);
      if (res.ok) setAdding(false);
      else setError(res.error);
    });
  }

  const showCarry = carryable.count > 0 && !hiding;

  return (
    <section>
      {/*
        刻意不显示「已完成/总数」计数。090823 文档 3.2 节：
        不给一天做 1–10 分评分，避免产品变成生活效率评分器。
        YOUR DAY 代表今天真实发生过的一切，不是完成率。
      */}
      <div className="flex items-baseline justify-between gap-4">
        <Label>Your day</Label>
      </div>

      {/*
        顺延入口。只在真有东西可顺延时出现，用陈述而非催促的语气 ——
        产品的前提是不评判（Product Bible 第 4 节）。
      */}
      {showCarry && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card
          border border-line bg-paper-sunken px-5 py-3.5">
          <p className="text-small text-ink-soft">
            上一次还有 {carryable.count} 件没做完。
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                startTransition(async () => {
                  const res = await carryOverToToday();
                  if (!res.ok) setError(res.error);
                })
              }
              disabled={pending}
              className="min-h-10 cursor-pointer px-1 text-small text-brand underline
                decoration-brand/30 underline-offset-4 transition-colors
                hover:text-brand-hover disabled:opacity-50"
            >
              {pending ? "正在带过来…" : "带到今天"}
            </button>
            <button
              onClick={() => {
                setHiding(true); // 先收起，别等往返
                startTransition(async () => {
                  const res = await dismissCarryOver();
                  if (!res.ok) {
                    setError(res.error ?? "操作失败。");
                    setHiding(false);
                  }
                });
              }}
              className="min-h-10 cursor-pointer px-1 text-small text-ink-muted
                transition-colors hover:text-ink"
            >
              不用
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <p className="mt-3.5 measure text-body text-ink-muted">
          今天还没有安排。可以先什么都不排。
        </p>
      ) : (
        <ul className="mt-4">
          {items.map((i) => (
            <ItemRow key={i.id} item={i} />
          ))}
        </ul>
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
