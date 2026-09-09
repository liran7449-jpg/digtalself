import { AppShell } from "@/components/layout/AppShell";
import { Rule } from "@/components/ui/Primitives";
import { repo } from "@/repositories";
import { formatDayLong, greeting, toDayKey } from "@/domain/day-key";
import { MorningSetup } from "./MorningSetup";
import { MyState } from "./MyState";
import { FocusLine } from "./FocusLine";
import { MomentComposerWrapper } from "./MomentComposerWrapper";
import { Timeline } from "./Timeline";
import { MomentList } from "./MomentList";
import { EndMyDay } from "./EndMyDay";

// 个人数据每次都要读最新的，不缓存
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const date = toDayKey();
  const now = new Date();
  const day = await repo.days.ensure(date);
  const dateLabel = formatDayLong(date);

  // IA 第 8.1 节：今天还没初始化就先走 Morning Setup
  if (day.status === "not_started") {
    return (
      <AppShell current="/today">
        <MorningSetup greeting={greeting(now)} dateLabel={dateLabel} />
      </AppShell>
    );
  }

  const [plans, moments, peeked] = await Promise.all([
    repo.plans.listByDate(date),
    repo.moments.listByDate(date),
    // 只读探测。不在这里直接顺延 —— 渲染是 GET，不该有副作用，
    // 而且 Next 可能重复渲染。自动顺延在 Morning Setup 提交时发生。
    repo.plans.peekCarryable(date),
  ]);

  // 为每个 Moment 加载关联数据（图片/人物/地点/话题）
  const momentsWithRelations = await Promise.all(
    moments.map(async (m) => {
      const [media, people, places, topics] = await Promise.all([
        repo.media.listByMoment(m.id),
        repo.people.listByMoment(m.id),
        repo.places.listByMoment(m.id),
        repo.topics.listByMoment(m.id),
      ]);
      return { ...m, media, people, places, topics };
    })
  );

  // 说过「不用」就别再问。这个判断必须基于落库的标记 ——
  // 只存客户端状态的话，刷新后提示又冒出来。
  const carryable = day.carryDismissed ? { count: 0, from: null } : peeked;

  return (
    <AppShell current="/today">
      <div className="space-y-11">
        <header>
          <p className="text-small text-ink-muted">{dateLabel}</p>
          <h1 className="mt-2.5 font-display text-display text-ink">
            {greeting(now)}
          </h1>
          <div className="mt-4">
            <MyState day={day} />
          </div>
        </header>

        <FocusLine focus={day.focus} />

        <Rule />

        <Timeline items={plans} carryable={carryable} />

        <Rule />

        <MomentComposerWrapper />

        <MomentList moments={momentsWithRelations} />

        <Rule />

        <EndMyDay day={day} />
      </div>
    </AppShell>
  );
}
