import { AppShell } from "@/components/layout/AppShell";
import { MomentsTimeline } from "./MomentsTimeline";
import { getRepo } from "@/repositories";
import {
  isMonthKey,
  toDayKey,
  toMonthKey,
  type DayKey,
  type MonthKey,
} from "@/domain/day-key";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * 按 DayKey 分组，保持传入的倒序。
 * 泛型保留调用方的具体类型 —— Moment 挂了 media/people 等关联字段时不能丢掉。
 */
function groupByDay<T extends { date: DayKey }>(
  moments: T[],
): { date: DayKey; items: T[] }[] {
  const groups: { date: DayKey; items: T[] }[] = [];
  for (const m of moments) {
    const last = groups.at(-1);
    if (last && last.date === m.date) last.items.push(m);
    else groups.push({ date: m.date, items: [m] });
  }
  return groups;
}

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; cal?: string }>;
}) {
  const repo = await getRepo();
  const { show, cal } = await searchParams;
  const limit = Math.min(Math.max(Number(show) || PAGE_SIZE, PAGE_SIZE), 1000);
  const today = toDayKey();

  // 日历常驻，?cal 只决定看哪个月；非法值回落到本月
  const calMonth: MonthKey = cal && isMonthKey(cal) ? cal : toMonthKey(today);

  // 多取一条用来判断还有没有更多，避免额外的 count 查询
  const [rows, summaries] = await Promise.all([
    repo.moments.list({ limit: limit + 1 }),
    repo.days.listMonth(calMonth),
  ]);

  const hasMore = rows.length > limit;
  const moments = hasMore ? rows.slice(0, limit) : rows;

  /**
   * 为每个 Moment 加载关联数据（图片/人物/地点/话题）。
   *
   * 四次批量查询，而不是每条记录查四次 —— 后者是 N+1。这一页 limit 是 50，
   * 逐条查会发出 200 次查询，而连接池只有 10 条连接、得排队。
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

  const groups = groupByDay(momentsWithRelations);

  const keepShow = show ? `&show=${limit}` : "";

  if (moments.length === 0) {
    return (
      <AppShell current="/moments">
        <header>
          <h1 className="font-display text-display text-ink">Moments</h1>
        </header>
        {/* PRD 第 25 节：空状态要有产品情绪，不写「暂无数据」 */}
        <div className="mt-16 measure">
          <p className="text-lead text-ink-soft">Nothing here yet.</p>
          <p className="mt-2 text-lead text-ink-muted">
            Your life is still unfolding.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell current="/moments" width="wide">
      <header>
        <h1 className="font-display text-display text-ink">Moments</h1>
        <p className="mt-5 measure text-lead text-ink-soft">
          你留下的生活，按时间流动。
        </p>
      </header>

      <MomentsTimeline
        groups={groups}
        summaries={summaries}
        today={today}
        calMonth={calMonth}
        keepShow={keepShow}
        hasMore={hasMore}
        limit={limit}
      />
    </AppShell>
  );
}
