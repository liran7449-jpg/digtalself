import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Label } from "@/components/ui/Primitives";
import { MomentTime } from "@/components/moment/MomentTime";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { repo } from "@/repositories";
import {
  formatDayHeading,
  isMonthKey,
  toDayKey,
  toMonthKey,
  type DayKey,
  type MonthKey,
} from "@/domain/day-key";
import type { Moment } from "@/domain/models";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/** 按 DayKey 分组，保持传入的倒序。 */
function groupByDay(moments: Moment[]): { date: DayKey; items: Moment[] }[] {
  const groups: { date: DayKey; items: Moment[] }[] = [];
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
  const groups = groupByDay(moments);

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
                    <li key={m.id} className="flex gap-5">
                      <MomentTime
                        at={m.occurredAt}
                        dayKey={m.date}
                        className="w-16 shrink-0 pt-0.5"
                      />
                      <div className="min-w-0 flex-1 border-l border-line pl-5">
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
                            <span className="label-caps text-brand">有注解</span>
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
            ))}
          </div>

          {hasMore && (
            <div className="mt-16 flex justify-start">
              <Link
                href={`/moments?show=${limit + PAGE_SIZE}&cal=${calMonth}`}
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
