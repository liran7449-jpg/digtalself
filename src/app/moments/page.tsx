import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Label } from "@/components/ui/Primitives";
import { MomentCard } from "@/components/moment/MomentCard";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { getRepo } from "@/repositories";
import {
  formatDayHeading,
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

      {/*
        宽屏分两栏：时间流在左，日历在右。窄屏堆叠，日历在上 ——
        它是「我在时间里的哪个位置」的锚点，放底下就没人看见了。
        DOM 顺序主内容在前，靠 order 调换视觉位置。
      */}
      {/* 侧栏 20rem：日历 7 格 × 2.75rem 触控最小宽度 = 19.25rem，再窄会溢出 */}
      <div className="mt-12 flex flex-col lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14">
        <div className="order-2 lg:order-1">
          <div className="space-y-14">
            {groups.map((g) => (
              <section key={g.date}>
                {/* 日期是分组锚点，用线而不是卡片来分区 */}
                <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
                  <Label tone={g.date === today ? "brand" : "muted"}>
                    {formatDayHeading(g.date, today)}
                  </Label>
                  <Link
                    href={`/days/${g.date}`}
                    className="text-label text-ink-faint transition-colors hover:text-brand"
                  >
                    看这一天
                  </Link>
                </div>

                <ul className="mt-6 space-y-6">
                  {g.items.map((m) => (
                    <li key={m.id}>
                      <MomentCard
                        moment={m}
                        media={m.media}
                        people={m.people}
                        places={m.places}
                        topics={m.topics}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {hasMore && (
            <div className="mt-16 flex justify-start">
              {/*
                scroll={false}：Next 跳转默认滚回顶部，翻到底再点会被甩回最上面。
                不滚动时已有的记录不重新挂载，更早的直接接在下面；
                show=N 仍留在地址里，刷新或从详情返回不丢已加载的数量。
              */}
              <Link
                href={`/moments?show=${limit + PAGE_SIZE}&cal=${calMonth}`}
                scroll={false}
                className="inline-flex min-h-11 items-center rounded-soft border border-line-strong px-5
                  text-small text-ink transition-colors duration-[var(--duration-quick)]
                  hover:border-ink-muted hover:bg-paper-raised"
              >
                看更早的
              </Link>
            </div>
          )}
        </div>

        <aside className="order-1 mb-14 lg:order-2 lg:mb-0 lg:sticky lg:top-10 lg:self-start">
          <MonthCalendar
            month={calMonth}
            summaries={summaries}
            today={today}
            monthHref={(m) => `/moments?cal=${m}${keepShow}`}
          />
        </aside>
      </div>
    </AppShell>
  );
}
