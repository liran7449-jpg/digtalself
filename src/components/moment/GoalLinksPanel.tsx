/**
 * GoalLinksPanel: Moment 关联的 Goals 管理面板。
 *
 * Goals 不能随时创建（需要在 Goals 页面管理），
 * 这里只能从已有 Goals 中选择关联。
 */

"use client";

import { useState, useTransition } from "react";
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
  const [selecting, setSelecting] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [pending, startTransition] = useTransition();

  const linkedIds = new Set(linked.map((g) => g.id));
  const unlinkedGoals = available.filter((g) => !linkedIds.has(g.id));

  const handleLink = () => {
    if (!selectedGoalId) return;

    startTransition(async () => {
      await onLink(momentId, selectedGoalId);
      setSelectedGoalId("");
      setSelecting(false);
    });
  };

  return (
    <div>
      <Label>Goals</Label>
      {linked.length > 0 && (
        <ul className="mt-3 space-y-2">
          {linked.map((goal) => (
            <li
              key={goal.id}
              className="flex items-start justify-between gap-3 rounded-soft bg-paper-sunken
                px-3 py-2 text-small"
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

      {selecting ? (
        <div className="mt-3 space-y-2">
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="block w-full min-h-10 rounded-soft border border-line bg-paper-sunken
              px-3 text-small text-ink focus:border-brand focus:outline-none"
          >
            <option value="">选择目标...</option>
            {unlinkedGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleLink} disabled={pending || !selectedGoalId}>
              关联
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelecting(false);
                setSelectedGoalId("");
              }}
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setSelecting(true)}
          disabled={unlinkedGoals.length === 0}
          className="mt-3 text-small text-ink-soft underline decoration-line-strong
            underline-offset-2 hover:text-brand transition-colors disabled:opacity-50
            disabled:cursor-not-allowed"
        >
          {unlinkedGoals.length > 0 ? "+ 关联目标" : "（无可关联的目标）"}
        </button>
      )}
    </div>
  );
}
