/**
 * MeContent：/me 的客户端部分。
 *
 * 样式沿用 /design/me-styles 定稿的方案：
 * - 左栏目标是「浮动」的 —— 没有卡片、没有白底，选中时文字变品牌色、右移、下方一道短线
 * - 右栏是选中目标关联的 Moment 原文，不是统计数字（PRD §14：Goal Detail 不像任务管理器）
 *
 * 操作按「作用对象」分开放：
 * - 编辑 / 删除改的是目标本身 → 左栏每个目标的右侧，鼠标悬停才出现，平时不打扰
 * - 暂停 / 已达成 / 不再前往改的是这条方向的进展 → 放在右栏证据的右下角，看完证据再决定
 *
 * 所有操作都在这一页完成。切换目标只改 ?goalId，顶部导航始终在。
 */

"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Goal } from "@/domain/models";
import type { GoalStatus } from "@/domain/enums";
import type { GoalEvidence } from "@/services/goal-link-service";

export type GoalWithCount = Goal & { evidenceCount: number };

const GROUPS: { status: GoalStatus; title: string }[] = [
  { status: "active", title: "Current Goals" },
  { status: "paused", title: "Paused" },
  { status: "achieved", title: "Achieved" },
  { status: "abandoned", title: "Abandoned" },
];

/**
 * 每个状态下能做的操作，和 transitions.ts 的 GOAL_TRANSITIONS 一致。
 * 文案刻意不用「失败」「放弃」—— PRD §6：这只是不再选择的方向。
 */
const ACTIONS: Record<GoalStatus, { to: GoalStatus; label: string }[]> = {
  draft: [],
  active: [
    { to: "paused", label: "暂停" },
    { to: "achieved", label: "已达成" },
    { to: "abandoned", label: "不再前往" },
  ],
  paused: [
    { to: "active", label: "继续" },
    { to: "abandoned", label: "不再前往" },
  ],
  achieved: [{ to: "active", label: "重新开始" }],
  abandoned: [{ to: "active", label: "重新开始" }],
};

const STATUS_NOTE: Partial<Record<GoalStatus, string>> = {
  paused: "暂时停下",
  achieved: "已经到达",
  abandoned: "这已经不是现在选择的方向",
};

/** DayKey（YYYY-MM-DD）→ 12月15日；跨年才带年份。按字符串拆，避免时区把日期挪一天。 */
function formatDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return y === new Date().getFullYear() ? `${m}月${d}日` : `${y}年${m}月${d}日`;
}

const fadeLine = "h-px bg-gradient-to-r from-line to-transparent";
const linkBtn =
  "min-h-10 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function MeContent({
  goals,
  selectedId,
  evidence,
}: {
  goals: GoalWithCount[];
  selectedId: string | null;
  evidence: GoalEvidence[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  // 左栏：悬停哪个目标就能编辑/删除哪个，不要求先选中。同一时间只处理一个。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  // 右栏：状态操作
  const [statusError, setStatusError] = useState<string | null>(null);

  const selected = goals.find((g) => g.id === selectedId) ?? null;

  function resetItem() {
    setEditingId(null);
    setEditTitle("");
    setDeletingId(null);
    setItemError(null);
  }

  function select(id: string) {
    resetItem();
    setStatusError(null);
    router.push(`/me?goalId=${id}`, { scroll: false });
  }

  function cancelCreate() {
    setCreating(false);
    setTitle("");
    setCreateError(null);
  }

  function create() {
    const t = title.trim();
    if (!t) return;
    setCreateError(null);
    startTransition(async () => {
      const res = await fetch("/api/v1/goals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!res.ok) {
        setCreateError("没能添加，请再试一次。");
        return;
      }
      const { goal } = (await res.json()) as { goal: Goal };
      setTitle("");
      setCreating(false);
      // 新建的目标直接选中，右栏立刻显示它的空状态
      router.push(`/me?goalId=${goal.id}`, { scroll: false });
    });
  }

  function changeStatus(to: GoalStatus) {
    if (!selected) return;
    resetItem();
    setStatusError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/goals/${selected.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (!res.ok) {
        setStatusError("状态没改成功，请再试一次。");
        return;
      }
      router.refresh();
    });
  }

  function startEdit(g: GoalWithCount) {
    resetItem();
    setEditTitle(g.title);
    setEditingId(g.id);
  }

  function startDelete(g: GoalWithCount) {
    resetItem();
    setDeletingId(g.id);
  }

  function saveEdit(g: GoalWithCount) {
    const t = editTitle.trim();
    if (!t) return;
    if (t === g.title) {
      setEditingId(null);
      return;
    }
    setItemError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/goals/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!res.ok) {
        setItemError("没能保存，请再试一次。");
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function removeGoal(g: GoalWithCount) {
    setItemError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/goals/${g.id}`, { method: "DELETE" });
      if (!res.ok) {
        setItemError("没能删除，请再试一次。");
        return;
      }
      resetItem();
      // 删的正好是右栏在看的那个，就回到默认选中（第一个当前目标）
      if (g.id === selectedId) router.push("/me", { scroll: false });
      router.refresh();
    });
  }

  /** 删除确认，出现在被删目标的下方 */
  function deleteConfirm(g: GoalWithCount): ReactNode {
    return (
      <div className="mt-3 pl-2 text-small">
        <p className="text-ink-soft">
          删除「{g.title}」？目标会彻底消失。
          {g.evidenceCount > 0 &&
            ` 关联的 ${g.evidenceCount} 条 Moment 会保留，只是不再关联到它。`}
        </p>
        {ACTIONS[g.status].some((a) => a.to === "abandoned") && (
          <p className="mt-1 text-ink-muted">
            只是不想继续的话，可以选「不再前往」，它会留在你的轨迹里。
          </p>
        )}
        <div className="mt-2 flex items-center gap-5">
          <button
            type="button"
            onClick={() => removeGoal(g)}
            disabled={pending}
            className={`${linkBtn} font-medium text-danger`}
          >
            {pending ? "删除中…" : "确认删除"}
          </button>
          <button
            type="button"
            onClick={() => setDeletingId(null)}
            className={`${linkBtn} text-ink-muted hover:text-ink`}
          >
            取消
          </button>
        </div>
        {itemError && (
          <p role="alert" className="mt-2 text-danger">
            {itemError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-x-16">
      {/* ---------------- 左栏：目标 ---------------- */}
      <div className="space-y-12 lg:sticky lg:top-10 lg:self-start">
        {GROUPS.map(({ status, title: groupTitle }) => {
          const items = goals.filter((g) => g.status === status);
          const isActive = status === "active";
          // Current Goals 始终显示（创建入口在这里），其他分组没有就不占地方
          if (!isActive && items.length === 0) return null;

          return (
            <section key={status} aria-labelledby={`goals-${status}`}>
              <h2
                id={`goals-${status}`}
                className={
                  isActive
                    ? "font-display text-heading text-ink"
                    : "label-caps text-ink-muted"
                }
              >
                {groupTitle}
              </h2>
              <div className={`mt-4 ${fadeLine}`} />

              {items.length > 0 && (
                <ul className={isActive ? "mt-6 space-y-6" : "mt-5 space-y-5"}>
                  {items.map((g) => {
                    // 编辑时，标题原位变成输入框
                    if (g.id === editingId) {
                      return (
                        <li key={g.id}>
                          <label htmlFor="edit-goal" className="sr-only">
                            目标名称
                          </label>
                          <input
                            id="edit-goal"
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(g);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            maxLength={200}
                            autoFocus
                            className={`block w-full border-0 border-b border-line bg-transparent px-0 py-1.5
                              font-medium text-ink transition-colors focus:border-brand focus:outline-none ${
                                isActive ? "text-lead" : "text-body"
                              }`}
                          />
                          <div className="mt-2 flex items-center gap-5 text-small">
                            <button
                              type="button"
                              onClick={() => saveEdit(g)}
                              disabled={pending || !editTitle.trim()}
                              className={`${linkBtn} font-medium text-brand`}
                            >
                              {pending ? "保存中…" : "保存"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className={`${linkBtn} text-ink-muted hover:text-ink`}
                            >
                              取消
                            </button>
                          </div>
                          {itemError && (
                            <p role="alert" className="mt-2 text-small text-danger">
                              {itemError}
                            </p>
                          )}
                        </li>
                      );
                    }

                    return (
                      <GoalItem
                        key={g.id}
                        goal={g}
                        quiet={!isActive}
                        selected={g.id === selectedId}
                        disabled={pending}
                        onSelect={() => select(g.id)}
                        onEdit={() => startEdit(g)}
                        onDelete={() => startDelete(g)}
                      >
                        {g.id === deletingId && deleteConfirm(g)}
                      </GoalItem>
                    );
                  })}
                </ul>
              )}

              {isActive && items.length === 0 && !creating && (
                <p className="mt-6 text-body text-ink-muted">
                  还没有正在前往的方向。
                </p>
              )}

              {isActive &&
                (creating ? (
                  <div className="mt-8">
                    {/* 视觉上不显示提示语，但保留给读屏软件，输入框不能没有名字 */}
                    <label htmlFor="new-goal" className="sr-only">
                      你想往哪里去？
                    </label>
                    <input
                      id="new-goal"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") create();
                        if (e.key === "Escape") cancelCreate();
                      }}
                      placeholder="学会弹吉他"
                      maxLength={200}
                      autoFocus
                      className="block w-full border-0 border-b border-line bg-transparent px-0 py-2
                        text-lead text-ink placeholder:text-ink-faint transition-colors
                        focus:border-brand focus:outline-none"
                    />
                    <div className="mt-3 flex items-center gap-5 text-small">
                      <button
                        type="button"
                        onClick={create}
                        disabled={pending || !title.trim()}
                        className={`${linkBtn} font-medium text-brand`}
                      >
                        {pending ? "添加中…" : "添加目标"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelCreate}
                        className={`${linkBtn} text-ink-muted hover:text-ink`}
                      >
                        取消
                      </button>
                    </div>
                    {createError && (
                      <p role="alert" className="mt-2 text-small text-danger">
                        {createError}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="mt-8 min-h-11 cursor-pointer text-body text-ink-muted
                      transition-colors hover:text-brand"
                  >
                    + 添加新目标
                  </button>
                ))}
            </section>
          );
        })}
      </div>

      {/* ---------------- 右栏：证据 ---------------- */}
      <section aria-labelledby="evidence-heading">
        {selected ? (
          <>
            <header>
              <h2 id="evidence-heading" className="font-display text-heading text-ink">
                Growth Evidence
              </h2>
              <p className="mt-1 text-small text-ink-muted">
                {evidence.length} moments related to “{selected.title}”
                {STATUS_NOTE[selected.status] && ` · ${STATUS_NOTE[selected.status]}`}
              </p>
              <div className={`mt-4 ${fadeLine}`} />
            </header>

            {evidence.length > 0 ? (
              <ul className="mt-8 space-y-6">
                {evidence.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/moments/${m.id}`}
                      className="block border-l-2 border-transparent pl-4 transition-all duration-200
                        hover:translate-x-1 hover:border-brand focus-visible:border-brand
                        focus-visible:outline-none motion-reduce:transition-none"
                    >
                      <p className="line-clamp-3 whitespace-pre-wrap text-body leading-relaxed text-ink">
                        {m.content || "（图片）"}
                      </p>
                      <p className="mt-2 text-small text-ink-muted">{formatDay(m.date)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              // PRD §22 的空状态文案
              <div className="py-16 text-center">
                <p className="text-body text-ink-soft">还没有成长证据。</p>
                <p className="mt-4 text-body leading-relaxed text-ink-muted">
                  先去生活。
                  <br />
                  当某些事情与这个方向产生联系，
                  <br />
                  它们会慢慢出现在这里。
                </p>
                <p className="mt-6 text-small text-ink-faint">
                  在 Today 记录时点 🎯 目标，就能关联到这里
                </p>
              </div>
            )}

            {/* 状态操作在证据右下角：先看完走过的路，再决定这条方向接下来怎样 */}
            {ACTIONS[selected.status].length > 0 && (
              <footer className="mt-12">
                <div className="h-px bg-gradient-to-l from-line to-transparent" />
                <div className="mt-2 flex flex-wrap justify-end gap-x-5 text-small">
                  {ACTIONS[selected.status].map((a) => (
                    <button
                      key={a.to}
                      type="button"
                      onClick={() => changeStatus(a.to)}
                      disabled={pending}
                      className={`${linkBtn} text-ink-muted hover:text-brand`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                {statusError && (
                  <p role="alert" className="mt-1 text-right text-small text-danger">
                    {statusError}
                  </p>
                )}
              </footer>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <h2 id="evidence-heading" className="font-display text-heading text-ink">
              你想往哪里去？
            </h2>
            <p className="mt-4 text-body leading-relaxed text-ink-muted">
              写下一个方向就够了，不需要先想清楚为什么。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function GoalItem({
  goal,
  quiet,
  selected,
  disabled,
  onSelect,
  onEdit,
  onDelete,
  children,
}: {
  goal: GoalWithCount;
  /** 非 Active 分组的目标降一级字号和颜色 */
  quiet: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** 挂在下方的删除确认。放在选中按钮外面 —— button 里不能再嵌 button */
  children?: ReactNode;
}) {
  const titleColor = selected
    ? "text-brand"
    : quiet
      ? "text-ink-soft group-hover:text-brand"
      : "text-ink group-hover:text-brand";

  return (
    <li className="group/item">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
          className={`group block min-w-0 flex-1 cursor-pointer text-left transition-transform duration-200
            motion-reduce:transition-none ${selected ? "translate-x-2" : "hover:translate-x-1"}`}
        >
          <span
            className={`block break-words font-body font-medium transition-colors ${
              quiet ? "text-body" : "text-lead"
            } ${titleColor}`}
          >
            {goal.title}
          </span>
          <span className="mt-1 block text-small text-ink-muted">
            {goal.evidenceCount} Evidence
          </span>
          {selected && <span className="mt-2 block h-0.5 w-12 bg-brand" />}
        </button>

        {/*
          悬停这一行才出现。另外两种情况也要能看到，否则就点不到：
          - 键盘 Tab 到按钮上（focus-within）
          - 触屏没有悬停（hover:none 时常显）
        */}
        <div
          className="flex shrink-0 items-center gap-3 text-small opacity-0 transition-opacity duration-150
            group-hover/item:opacity-100 focus-within:opacity-100
            motion-reduce:transition-none [@media(hover:none)]:opacity-100"
        >
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            aria-label={`编辑「${goal.title}」`}
            className={`${linkBtn} text-ink-muted hover:text-brand`}
          >
            编辑
          </button>
          {/* 删除颜色最淡，悬停才变红 */}
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            aria-label={`删除「${goal.title}」`}
            className={`${linkBtn} text-ink-faint hover:text-danger`}
          >
            删除
          </button>
        </div>
      </div>
      {children}
    </li>
  );
}
