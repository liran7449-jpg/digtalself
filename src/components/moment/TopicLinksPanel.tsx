/**
 * TopicLinksPanel: Moment 关联的 Topics 管理面板。
 */

"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import type { Topic } from "@/domain/models";

interface TopicLinksPanelProps {
  momentId: string;
  linked: Topic[];
  onLink: (momentId: string, topicName: string) => Promise<void>;
  onUnlink: (momentId: string, topicId: string) => Promise<void>;
}

export function TopicLinksPanel({
  momentId,
  linked,
  onLink,
  onUnlink,
}: TopicLinksPanelProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name.trim()) return;

    startTransition(async () => {
      await onLink(momentId, name.trim());
      setName("");
      setAdding(false);
    });
  };

  return (
    <div>
      <Label>Topics</Label>
      {linked.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {linked.map((topic) => (
            <li
              key={topic.id}
              className="flex items-center gap-2 rounded-full bg-paper-sunken px-3 py-1.5 text-small"
            >
              <span className="text-ink">{topic.name}</span>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await onUnlink(momentId, topic.id);
                  })
                }
                disabled={pending}
                className="text-ink-faint hover:text-danger transition-colors"
                aria-label={`移除 ${topic.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="话题标签"
            maxLength={100}
            autoFocus
            className="flex-1 min-h-10 rounded-soft border border-line bg-paper-sunken px-3
              text-small text-ink focus:border-brand focus:outline-none"
          />
          <Button size="sm" onClick={handleAdd} disabled={pending || !name.trim()}>
            添加
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setAdding(false);
              setName("");
            }}
          >
            取消
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 text-small text-ink-soft underline decoration-line-strong
            underline-offset-2 hover:text-brand transition-colors"
        >
          + 添加话题
        </button>
      )}
    </div>
  );
}
