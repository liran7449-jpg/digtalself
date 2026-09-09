"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/Primitives";
import { MomentCard } from "@/components/moment/MomentCard";
import type { Moment, Media, Person, Place, Topic } from "@/domain/models";
import { deleteMoment } from "./actions";

interface MomentWithRelations extends Moment {
  media?: Media[];
  people?: Person[];
  places?: Place[];
  topics?: Topic[];
}

function Row({ moment }: { moment: MomentWithRelations }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      await deleteMoment(moment.id);
    });
  }

  return (
    <li className="group relative">
      <MomentCard
        moment={moment}
        media={moment.media}
        people={moment.people}
        places={moment.places}
        topics={moment.topics}
      />

      {/* 删除按钮 */}
      <div className="absolute right-0 top-0">
        {confirming ? (
          <span className="flex items-center gap-3">
            <button
              onClick={remove}
              disabled={pending}
              className="text-small text-danger hover:underline disabled:text-ink-faint"
            >
              {pending ? "删除中…" : "确认删除"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-small text-ink-muted hover:text-ink"
            >
              取消
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-small text-ink-muted opacity-0 transition-opacity
              hover:text-danger group-hover:opacity-100"
            aria-label={`删除这条记录：${moment.content.slice(0, 20)}`}
          >
            删除
          </button>
        )}
      </div>
    </li>
  );
}

export function MomentList({ moments }: { moments: MomentWithRelations[] }) {
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
