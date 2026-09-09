/**
 * PersonLinksPanel: Moment 关联的 People 管理面板。
 *
 * 显示已关联的 Person，支持添加新关联（自动补全）和移除关联。
 * 符合规范第 17 节：补充信息折叠在「补充」区域，不强制填写。
 */

"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import type { Person } from "@/domain/models";

interface PersonLinksPanelProps {
  momentId: string;
  linked: Person[];
  onLink: (momentId: string, personName: string) => Promise<void>;
  onUnlink: (momentId: string, personId: string) => Promise<void>;
}

export function PersonLinksPanel({
  momentId,
  linked,
  onLink,
  onUnlink,
}: PersonLinksPanelProps) {
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
      <Label>People</Label>
      {linked.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {linked.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-2 rounded-full bg-paper-sunken px-3 py-1.5 text-small"
            >
              <span className="text-ink">{person.name}</span>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await onUnlink(momentId, person.id);
                  })
                }
                disabled={pending}
                className="text-ink-faint hover:text-danger transition-colors"
                aria-label={`移除 ${person.name}`}
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
            placeholder="人名"
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
          + 添加相关的人
        </button>
      )}
    </div>
  );
}
