"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Label } from "@/components/ui/Primitives";
import { MomentTime } from "@/components/moment/MomentTime";
import type { Moment } from "@/domain/models";
import { deleteMoment } from "./actions";

function Row({ moment }: { moment: Moment }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      await deleteMoment(moment.id);
    });
  }

  return (
    <li className="group flex gap-5">
      <MomentTime
        at={moment.occurredAt}
        dayKey={moment.date}
        className="w-16 shrink-0 pt-0.5"
      />
      <div className="flex-1 border-l border-line pl-5">
        <Link
          href={`/moments/${moment.id}`}
          className="block transition-colors hover:text-brand"
        >
          <p className="measure whitespace-pre-wrap text-body text-ink">
            {moment.content}
          </p>
        </Link>
        <div className="mt-1.5 flex items-center gap-4">
          <span className="label-caps text-ink-faint">{moment.type}</span>
          {moment.whyItMatters && (
            <span className="label-caps text-brand">有注解</span>
          )}

          {/* 删除是硬删除，所以要一次确认 */}
          {confirming ? (
            <span className="flex items-center gap-3">
              <button
                onClick={remove}
                disabled={pending}
                className="cursor-pointer text-label text-danger underline decoration-danger/40 underline-offset-2"
              >
                {pending ? "删除中…" : "确认删除"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="cursor-pointer text-label text-ink-muted"
              >
                取消
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="cursor-pointer text-label text-ink-faint opacity-0 transition-opacity
                hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`删除这条记录：${moment.content.slice(0, 20)}`}
            >
              删除
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function MomentList({ moments }: { moments: Moment[] }) {
  if (moments.length === 0) {
    return (
      <section>
        <Label>Today&apos;s Moments</Label>
        <p className="mt-3.5 measure text-body text-ink-muted">
          今天还没有记录。想到什么就写上面那一栏。
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <Label>Today&apos;s Moments</Label>
        <span className="text-small text-ink-muted">{moments.length}</span>
      </div>
      <ul className="mt-4 space-y-5">
        {moments.map((m) => (
          <Row key={m.id} moment={m} />
        ))}
      </ul>
    </section>
  );
}
