/**
 * Goals V1.0 原型设计
 *
 * 基于 Goals_V1.0_PRD.md
 * 核心理念：目标不是任务清单，而是一条人生方向
 *
 * 本页面是静态原型，用假数据展示交互和视觉
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Label, Rule } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-16 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-baseline gap-4">
        <span className="font-display text-small text-ink-muted">{n}</span>
        <h2 className="font-display text-heading text-ink">{title}</h2>
      </div>
      {note && (
        <p className="mb-11 max-w-prose text-body leading-relaxed text-ink-soft">
          {note}
        </p>
      )}
      <div>{children}</div>
    </section>
  );
}

/**
 * Goal 关联交互演示：Popover + 多选
 */
function GoalLinkingDemo() {
  const [linkedGoals, setLinkedGoals] = useState<string[]>(["学会弹吉他"]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedInPopover, setSelectedInPopover] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const availableGoals = [
    "学会弹吉他",
    "成为更健康的人",
    "更丰富地生活",
    "成为更有表达力的人",
  ];

  // 打开 Popover 时同步当前已关联状态
  const handleOpenPopover = () => {
    setSelectedInPopover([...linkedGoals]);
    setPopoverOpen(true);
  };

  // 点击外部关闭
  useEffect(() => {
    if (!popoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const handleToggleGoal = (goal: string) => {
    setSelectedInPopover((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleConfirm = () => {
    setLinkedGoals(selectedInPopover);
    setPopoverOpen(false);
  };

  const handleRemove = (goal: string) => {
    setLinkedGoals((prev) => prev.filter((g) => g !== goal));
  };

  return (
    <div className="rounded-card border border-line bg-paper-raised p-6">
      <Label>Goals</Label>

      {/* 已关联的 Goals */}
      {linkedGoals.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {linkedGoals.map((goal) => (
            <li
              key={goal}
              className="flex items-center gap-2 rounded-full bg-paper-sunken px-3 py-1.5 text-small"
            >
              <span className="text-ink">{goal}</span>
              <button
                onClick={() => handleRemove(goal)}
                className="text-ink-faint hover:text-danger transition-colors"
                aria-label={`移除 ${goal}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 🎯 目标 按钮 + Popover */}
      <div className="relative mt-3">
        <button
          onClick={handleOpenPopover}
          className="text-small text-ink-soft underline decoration-line-strong
            underline-offset-2 hover:text-brand transition-colors"
        >
          🎯 关联目标
        </button>

        {popoverOpen && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-full z-10 mt-2 w-72 rounded-card border border-line
              bg-paper-raised p-4 shadow-lg"
          >
            <div className="mb-3 text-small font-medium text-ink">选择目标</div>
            <div className="space-y-2">
              {availableGoals.map((goal) => (
                <label
                  key={goal}
                  className="flex cursor-pointer items-center gap-3 rounded-soft
                    border border-line bg-paper-sunken px-3 py-2
                    transition-colors hover:border-line-strong"
                >
                  <input
                    type="checkbox"
                    checked={selectedInPopover.includes(goal)}
                    onChange={() => handleToggleGoal(goal)}
                    className="h-4 w-4 cursor-pointer accent-brand"
                  />
                  <span className="text-small text-ink">{goal}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleConfirm}>
                完成
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPopoverOpen(false)}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoalsPrototypePage() {
  const [createStep, setCreateStep] = useState<"input" | "created">("input");
  const [goalInput, setGoalInput] = useState("");

  return (
    <div className="min-h-screen bg-paper px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16">
          <h1 className="font-display text-display text-ink">
            Goals V1.0 Design
          </h1>
          <p className="mt-4 max-w-prose font-body text-lead leading-relaxed text-ink-soft">
            目标不是任务清单，而是一条人生方向。真实生活中的事件，会不断成为这条方向上的证据。
          </p>
        </header>

        <Section
          n="01"
          title="极简创建"
          note="用户只需一句话即可创建 Goal。不要求填写 Why / Becoming / Next Step。整个过程不超过几秒。"
        >
          <div className="rounded-card border border-line bg-paper-raised p-9">
            <Label htmlFor="goal-input">你想往哪里去？</Label>
            <input
              id="goal-input"
              type="text"
              placeholder="学会弹吉他"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              maxLength={200}
              className="mt-3 block w-full rounded-soft border border-line bg-paper-sunken
                px-5 py-4 font-body text-body text-ink
                transition-colors duration-[var(--duration-quick)]
                hover:border-line-strong focus:border-brand focus:outline-none"
            />
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={() => {
                  if (goalInput.trim()) setCreateStep("created");
                }}
                disabled={!goalInput.trim()}
              >
                添加目标
              </Button>
              {createStep === "created" && (
                <span className="text-small text-ink-muted">
                  已创建「{goalInput}」
                </span>
              )}
            </div>
          </div>
        </Section>

        <Section
          n="02"
          title="Active Goals 列表"
          note="推荐 3-5 个 Active Goals。不要进度条、不要百分比、不要 KPI Dashboard。只展示方向和真实证据数量。"
        >
          <div className="space-y-4">
            {[
              { title: "学会弹吉他", started: "Oct 2026", evidence: 12, milestones: 3 },
              { title: "成为更健康的人", started: "Sep 2026", evidence: 27, milestones: 5 },
              { title: "更丰富地生活", started: "Aug 2026", evidence: 8, milestones: 1 },
            ].map((goal, i) => (
              <div
                key={i}
                className="rounded-card border border-line bg-paper-raised p-6
                  transition-all duration-[var(--duration-quick)]
                  hover:border-line-strong hover:shadow-sm"
              >
                <h3 className="font-body text-lead font-medium text-ink">
                  {goal.title}
                </h3>
                <p className="mt-1 text-small text-ink-muted">
                  Started {goal.started}
                </p>
                <div className="mt-4 flex items-center gap-6 text-small text-ink-soft">
                  <span>{goal.evidence} Growth Evidence</span>
                  <span>{goal.milestones} Milestones</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          n="03"
          title="空状态"
          note="新创建的 Goal 还没有 Evidence 时，不要催促用户「立即开始任务」，而是提醒生活优先。"
        >
          <div className="rounded-card border border-line bg-paper-raised p-11 text-center">
            <p className="text-body text-ink-soft">还没有成长证据。</p>
            <p className="mt-4 text-body leading-relaxed text-ink-muted">
              先去生活。
              <br />
              当某些事情与这个方向产生联系，
              <br />
              它们会慢慢出现在这里。
            </p>
          </div>
        </Section>

        <Section
          n="04"
          title="Goal Detail"
          note="详情页不应该像任务管理器。更接近「一条正在生长的个人轨迹」。"
        >
          <div className="rounded-card border border-line bg-paper-raised p-9">
            <h2 className="font-display text-title text-ink">学会弹吉他</h2>
            <p className="mt-2 text-small text-ink-muted">Started Oct 2026</p>

            <Rule className="my-9" />

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="font-display text-display text-brand">12</div>
                <div className="mt-1 text-small text-ink-muted">
                  Growth Evidence
                </div>
              </div>
              <div className="text-center">
                <div className="font-display text-display text-brand">3</div>
                <div className="mt-1 text-small text-ink-muted">Milestones</div>
              </div>
            </div>

            <Rule className="my-9" />

            <div>
              <Label>Recent Evidence</Label>
              <div className="mt-4 space-y-3">
                {[
                  { emoji: "🎸", text: "买了第一把吉他", date: "Oct 08" },
                  { emoji: "🎵", text: "学会 C 大调", date: "Oct 05" },
                  { emoji: "🎤", text: "上了第一节课", date: "Sep 28" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-soft border border-line
                      bg-paper-sunken px-4 py-3 text-body text-ink"
                  >
                    <span className="text-heading">{item.emoji}</span>
                    <span className="flex-1">{item.text}</span>
                    <span className="text-small text-ink-muted">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-9 flex gap-3">
              <Button variant="secondary" size="sm">
                View all Moments
              </Button>
              <Button variant="ghost" size="sm">
                Edit Goal
              </Button>
            </div>
          </div>
        </Section>

        <Section
          n="05"
          title="Moment 关联 Goal"
          note="点击「🎯 目标」按钮弹出 Popover，显示所有 Active Goals，可以多选勾选。已关联的 Goal 显示为标签，类似 Person / Place。"
        >
          <GoalLinkingDemo />
        </Section>

        <Section
          n="06"
          title="状态流转"
          note="状态切换不会丢失 Evidence。Abandoned 的语义是「这已经不是我现在选择的方向」，不是 Failed。"
        >
          <div className="rounded-card border border-line bg-paper-raised p-9">
            <div className="space-y-6 text-body text-ink-soft">
              <div>
                <strong className="text-ink">Active</strong> →{" "}
                <span>Paused / Achieved / Abandoned</span>
              </div>
              <div>
                <strong className="text-ink">Paused</strong> →{" "}
                <span>Active / Abandoned</span>
              </div>
              <div>
                <strong className="text-ink">Achieved</strong> →{" "}
                <span>Active（重新激活）</span>
              </div>
              <div>
                <strong className="text-ink">Abandoned</strong> →{" "}
                <span>Active（重新激活）</span>
              </div>
            </div>
            <div className="mt-9 flex gap-3">
              <Button variant="secondary" size="sm">
                Pause
              </Button>
              <Button variant="secondary" size="sm">
                Mark as Achieved
              </Button>
              <Button variant="ghost" size="sm">
                Abandon
              </Button>
            </div>
          </div>
        </Section>

        <Section
          n="07"
          title="Me 页的 Goals 入口"
          note="最小版 Me 页，只展示当前 Active Goals。按 PRD，Goals 放在 Me 下面，不加一级导航。"
        >
          <div className="rounded-card border border-line bg-paper-raised p-9">
            <h2 className="font-display text-title text-ink">Current Goals</h2>
            <div className="mt-6 space-y-3">
              {[
                { title: "学会弹吉他", evidence: 12 },
                { title: "更健康地生活", evidence: 27 },
                { title: "成为更有表达力的人", evidence: 3 },
              ].map((goal, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-soft
                    border border-line bg-paper-sunken px-5 py-4"
                >
                  <span className="text-body text-ink">{goal.title}</span>
                  <span className="text-small text-ink-muted">
                    {goal.evidence} Evidence
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="secondary" size="sm">
                View All Goals
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
