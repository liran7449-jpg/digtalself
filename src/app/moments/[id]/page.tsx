import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Label } from "@/components/ui/Primitives";
import { MomentTime } from "@/components/moment/MomentTime";
import { repo } from "@/repositories";
import { formatDayHeading, toDayKey } from "@/domain/day-key";
import { MOMENT_TYPE_LABELS } from "@/domain/labels";
import { MomentEditor } from "./MomentEditor";
import { PersonService } from "@/services/person-service";
import { PlaceService } from "@/services/place-service";
import { TopicService } from "@/services/topic-service";
import { GoalLinkService } from "@/services/goal-link-service";
import { MemoryService } from "@/services/memory-service";

export const dynamic = "force-dynamic";

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const moment = await repo.moments.find(id);
  if (!moment) notFound();

  // 加载关联数据
  const [linkedPeople, linkedPlaces, linkedTopics, linkedGoals, allGoals, isMemory, linkedMedia] =
    await Promise.all([
      PersonService.listByMoment(id),
      PlaceService.listByMoment(id),
      TopicService.listByMoment(id),
      GoalLinkService.listByMoment(id),
      repo.goals.listActive(),
      MemoryService.isMomentMarkedAsMemory(id),
      repo.media.listByMoment(id),
    ]);

  const today = toDayKey();
  const isToday = moment.date === today;

  return (
    <AppShell current="/moments">
      {/* IA 第 38 节：任何详情页都有明确的返回，不做迷宫 */}
      <Link
        href="/moments"
        className="inline-flex min-h-11 items-center text-small text-ink-muted
          transition-colors duration-[var(--duration-quick)] hover:text-ink"
      >
        ← Moments
      </Link>

      <article className="mt-8">
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <p className="text-small text-ink-muted">
            {formatDayHeading(moment.date, today)}
          </p>
          <MomentTime at={moment.occurredAt} dayKey={moment.date} />
          <span className="label-caps text-ink-faint">
            {MOMENT_TYPE_LABELS[moment.type].label}
          </span>
        </header>

        <div className="mt-11">
          <MomentEditor
            moment={moment}
            linkedPeople={linkedPeople}
            linkedPlaces={linkedPlaces}
            linkedTopics={linkedTopics}
            linkedGoals={linkedGoals}
            availableGoals={allGoals}
            linkedMedia={linkedMedia}
            isMemory={isMemory}
          />
        </div>
      </article>

      {/*
        Related：P0 只有「回到今天」这一条真实链接，People / Place / Goal 是 P1。
        历史记录暂时无处可跳，就不渲染一个只重复头部日期的死区块。
      */}
      {isToday && (
        <footer className="mt-16 border-t border-line pt-8">
          <Label>Related</Label>
          <div className="mt-3.5">
            <Link
              href="/today"
              className="inline-flex min-h-11 items-center text-small text-ink-soft
                underline decoration-line-strong underline-offset-4
                transition-colors hover:text-brand"
            >
              今天
            </Link>
          </div>
        </footer>
      )}
    </AppShell>
  );
}
