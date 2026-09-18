import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Label, Rule, Sparkle } from "@/components/ui/Primitives";
import { MomentTime } from "@/components/moment/MomentTime";
import { priorityBar, priorityText } from "@/components/plan/priority-style";
import { ReflectionCard } from "@/components/day/ReflectionCard";
import { getRepo } from "@/repositories";
import {
  addDays,
  formatDayHeading,
  isDayKey,
  isFutureDay,
  toDayKey,
  type DayKey,
} from "@/domain/day-key";
import { MOOD_LABELS } from "@/domain/labels";
import type { PlanItem } from "@/domain/models";

export const dynamic = "force-dynamic";

function StateLine({
  mood,
}: {
  mood: keyof typeof MOOD_LABELS | null;
}) {
  if (!mood) return null;
  return (
    <p className="mt-4 flex items-center gap-2.5 text-small text-ink-muted">
      <span
        className={`size-2 shrink-0 rounded-full ${MOOD_LABELS[mood].color}`}
        aria-hidden="true"
      />
      <span>{MOOD_LABELS[mood].zh}</span>
    </p>
  );
}

function PlanLine({ item }: { item: PlanItem }) {
  const done = item.status === "completed";
  const skipped = item.status === "skipped";
  const dimmed = done || skipped;
  const bar = dimmed ? null : priorityBar(item.priority);

  return (
    <li className="relative flex items-start gap-4 border-t border-line-soft py-3 first:border-0">
      {bar && (
        <span
          aria-hidden="true"
          className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${bar}`}
        />
      )}
      <span className="w-12 shrink-0 pl-3 pt-0.5 font-mono text-small tabular-nums text-ink-faint">
        {item.startAt ?? "—"}
      </span>
      <span
        className={`text-body ${
          done
            ? "text-ink-faint line-through decoration-line-strong"
            : // 回看语境的基色比 Today 淡一档
              priorityText(item.priority, { dimmed, base: "text-ink-soft" })
        }`}
      >
        {item.title}
        {(skipped || item.carryCount > 0) && (
          <span className="ml-2.5 inline-flex gap-2.5 align-middle">
            {skipped && <span className="label-caps text-ink-faint">跳过</span>}
            {item.carryCount > 0 && (
              <span className="label-caps text-ink-faint">
                顺延 {item.carryCount} 天
              </span>
            )}
          </span>
        )}
        {item.fromAi && (
          <Sparkle className="ml-2 inline size-3 align-baseline text-ai" />
        )}
      </span>
    </li>
  );
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const repo = await getRepo();
  const { date: raw } = await params;
  if (!isDayKey(raw)) notFound();

  const date: DayKey = raw;
  const today = toDayKey();

  // 未来的日子没有内容可看
  if (isFutureDay(date, today)) notFound();

  const [day, plans, moments] = await Promise.all([
    repo.days.find(date),
    repo.plans.listByDate(date),
    repo.moments.listByDate(date),
  ]);

  // 今天就直接去 Today，那里能编辑
  const isToday = date === today;

  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const hasNext = !isFutureDay(next, today);

  // 反思也算「留下了什么」—— 只写了反思的一天不该显示成空白
  const isEmpty =
    !day?.mood &&
    !day?.focus &&
    !day?.reflectedAt &&
    plans.length === 0 &&
    moments.length === 0;

  return (
    <AppShell current="/moments">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/moments"
          className="inline-flex min-h-11 items-center text-small text-ink-muted
            transition-colors duration-[var(--duration-quick)] hover:text-ink"
        >
          ← Moments
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={`/days/${prev}`}
            aria-label="前一天"
            className="flex size-11 items-center justify-center rounded-soft text-ink-muted
              transition-colors hover:bg-paper-raised hover:text-ink"
          >
            ‹
          </Link>
          {hasNext ? (
            <Link
              href={`/days/${next}`}
              aria-label="后一天"
              className="flex size-11 items-center justify-center rounded-soft text-ink-muted
                transition-colors hover:bg-paper-raised hover:text-ink"
            >
              ›
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center text-line-strong"
            >
              ›
            </span>
          )}
        </div>
      </div>

      <article className="mt-8">
        <header>
          <h1 className="font-display text-display text-ink">
            {formatDayHeading(date, today)}
          </h1>
          <StateLine mood={day?.mood ?? null} />
          {isToday && (
            <Link
              href="/today"
              className="mt-4 inline-flex min-h-11 items-center text-small text-brand
                underline decoration-line-strong underline-offset-4
                transition-colors hover:text-brand-hover"
            >
              去 Today 编辑这一天
            </Link>
          )}
        </header>

        {isEmpty ? (
          <p className="mt-14 measure text-lead text-ink-muted">
            这一天没有留下什么。
          </p>
        ) : (
          <div className="mt-14 space-y-12">
            {day?.focus && (
              <section>
                <Label>Focus</Label>
                <p className="mt-3 measure font-display text-title text-ink">
                  {day.focus}
                </p>
              </section>
            )}

            {plans.length > 0 && (
              <>
                <Rule />
                <section>
                  {/* 同 Today：不显示完成率，不给一天打分（090823 文档 3.2 节） */}
                  <div className="flex items-baseline justify-between gap-4">
                    <Label>Your day</Label>
                  </div>
                  <ul className="mt-4">
                    {plans.map((p) => (
                      <PlanLine key={p.id} item={p} />
                    ))}
                  </ul>
                </section>
              </>
            )}

            {moments.length > 0 && (
              <>
                <Rule />
                <section>
                  <div className="flex items-baseline justify-between gap-4">
                    <Label>Moments</Label>
                    <span className="text-small text-ink-muted">
                      {moments.length}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-5">
                    {moments.map((m) => (
                      <li key={m.id} className="flex gap-5">
                        <MomentTime
                          at={m.occurredAt}
                          dayKey={m.date}
                          className="w-16 shrink-0 pt-0.5"
                        />
                        <div className="flex-1 border-l border-line pl-5">
                          <Link
                            href={`/moments/${m.id}`}
                            className="block transition-colors hover:text-brand"
                          >
                            <p className="measure whitespace-pre-wrap text-body text-ink">
                              {m.content}
                            </p>
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="label-caps text-ink-faint">
                              {m.type}
                            </span>
                            {m.whyItMatters && (
                              <span className="label-caps text-brand">
                                有注解
                              </span>
                            )}
                            {m.isMemory && (
                              <span className="label-caps text-accent">
                                值得记住
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {/* 反思放最后 —— 它就是这一天的收尾 */}
            {day?.reflectedAt && (
              <>
                <Rule />
                <section>
                  <ReflectionCard day={day} heading="这一天的反思" />
                </section>
              </>
            )}
          </div>
        )}
      </article>
    </AppShell>
  );
}
