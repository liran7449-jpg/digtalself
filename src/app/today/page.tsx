import { AppShell } from "@/components/layout/AppShell";
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
      <AppShell current="/today" width="wide">
        <MorningSetup greeting={greeting(now)} dateLabel={dateLabel} />
      </AppShell>
    );
  }

  const [plans, moments] = await Promise.all([
    repo.plans.listByDate(date),
    repo.moments.listByDate(date),
  ]);

  /**
   * 为每个 Moment 加载关联数据（图片/人物/地点/话题）。
   *
   * 四次批量查询，而不是每条记录查四次 —— 后者是 N+1：34 条记录会发出
   * 136 次查询，而连接池只有 10 条连接，这些查询得排队。
   * 批量版固定 4 次，与记录条数无关。
   */
  const momentIds = moments.map((m) => m.id);
  const [mediaByMoment, peopleByMoment, placesByMoment, topicsByMoment] =
    await Promise.all([
      repo.media.listByMoments(momentIds),
      repo.people.listByMoments(momentIds),
      repo.places.listByMoments(momentIds),
      repo.topics.listByMoments(momentIds),
    ]);

  const momentsWithRelations = moments.map((m) => ({
    ...m,
    // 没有关联时给空数组，下游按数组渲染，不该看到 undefined
    media: mediaByMoment.get(m.id) ?? [],
    people: peopleByMoment.get(m.id) ?? [],
    places: placesByMoment.get(m.id) ?? [],
    topics: topicsByMoment.get(m.id) ?? [],
  }));

  // 没做完的事只在 End My Day 问一次，白天不催
  const unfinishedCount = plans.filter(
    (p) => p.status === "planned" || p.status === "in_progress",
  ).length;

  return (
    <AppShell current="/today" width="wide">
      {/*
        左右分栏：左边是「今天的意图」（状态 + 日程），右边是「今天的真实」（记录流）。
        分开的理由是这两件事的节奏不同 —— 意图早上定一次，记录整天在长。
        挤在一栏里会让页面越用越长，而且读的时候要一直往下滚才能看到今天写了什么。

        左栏窄且 sticky 常驻：状态和日程是「参照」，滚动看记录时不该消失。
        窄屏堆叠，左栏在上（先知道今天什么状态，再看记录）。
      */}
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-x-14">
        <div className="space-y-6 lg:sticky lg:top-10 lg:self-start">
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

          <Timeline items={plans} />

          <div className="border-t border-line pt-7">
            <EndMyDay day={day} unfinishedCount={unfinishedCount} />
          </div>
        </div>

        <div className="space-y-10">
          {/* 输入条常驻顶部：写完的内容直接落到下面流的顶部，视线不用来回跳 */}
          <MomentComposerWrapper />

          <MomentList moments={momentsWithRelations} />
        </div>
      </div>
    </AppShell>
  );
}
