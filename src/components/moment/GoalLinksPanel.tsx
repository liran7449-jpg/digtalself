/**
 * GoalLinksPanel: Moment 关联的 Goals 管理面板。
 *
 * 交互方式：🎯 按钮 + Popover + 多选
 * 已关联的 Goals 显示为标签（类似 Person / Place）
 */

"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Label } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import type { Goal } from "@/domain/models";

interface GoalLinksPanelProps {
  momentId: string;
  linked: Goal[];
  available: Goal[]; // 所有可选的 Goals
  onLink: (momentId: string, goalId: string) => Promise<void>;
  onUnlink: (momentId: string, goalId: string) => Promise<void>;
}

export function GoalLinksPanel({
  momentId,
  linked,
  available,
  onLink,
  onUnlink,
}: GoalLinksPanelProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);

  const linkedIds = new Set(linked.map((g) => g.id));

  // 打开 Popover 时同步当前已关联状态
  const handleOpenPopover = () => {
    setSelectedIds(linked.map((g) => g.id));
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

  const handleToggleGoal = (goalId: string) => {
    setSelectedIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const currentIds = new Set(linked.map((g) => g.id));
      const newSelectedIds = new Set(selectedIds);

      // 需要新增的关联
      const toLink = selectedIds.filter((id) => !currentIds.has(id));
      // 需要删除的关联
      const toUnlink = linked.filter((g) => !newSelectedIds.has(g.id)).map((g) => g.id);

      await Promise.all([
        ...toLink.map((id) => onLink(momentId, id)),
        ...toUnlink.map((id) => onUnlink(momentId, id)),
      ]);

      setPopoverOpen(false);
    });
  };

  return (
    <div>
      <Label>Goals</Label>

      {/* 已关联的 Goals */}
      {linked.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {linked.map((goal) => (
            <li
              key={goal.id}
              className="flex items-center gap-2 rounded-full bg-paper-sunken px-3 py-1.5 text-small"
            >
              <span className="text-ink">{goal.title}</span>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await onUnlink(momentId, goal.id);
                  })
                }
                disabled={pending}
                className="text-ink-faint hover:text-danger transition-colors"
                aria-label={`移除目标：${goal.title}`}
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
          disabled={available.length === 0}
          className="text-small text-ink-soft underline decoration-line-strong
            underline-offset-2 hover:text-brand transition-colors disabled:opacity-50
            disabled:cursor-not-allowed"
        >
          {available.length > 0 ? "🎯 关联目标" : "（无可关联的目标）"}
        </button>

        {popoverOpen && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-full z-10 mt-2 w-80 rounded-card border border-line
              bg-paper-raised p-4 shadow-lg"
          >
            <div className="mb-3 text-small font-medium text-ink">选择目标</div>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {available.map((goal) => (
                <label
                  key={goal.id}
                  className="flex cursor-pointer items-center gap-3 rounded-soft
                    border border-line bg-paper-sunken px-3 py-2
                    transition-colors hover:border-line-strong"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(goal.id)}
                    onChange={() => handleToggleGoal(goal.id)}
                    className="h-4 w-4 cursor-pointer accent-brand"
                  />
                  <span className="flex-1 text-small text-ink">{goal.title}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleConfirm} disabled={pending}>
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
