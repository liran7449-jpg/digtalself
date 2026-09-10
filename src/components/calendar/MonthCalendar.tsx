import Link from "next/link";
import {
  WEEKDAY_LABELS,
  addMonths,
  formatMonthLong,
  isFutureDay,
  monthGrid,
  toMonthKey,
  type DayKey,
  type MonthKey,
} from "@/domain/day-key";
import { MOOD_LABELS } from "@/domain/labels";
import type { DaySummary } from "@/repositories/types";

/**
 * 月历。有记录的日子在数字下方标一个按当天 mood 着色的点。
 *
 * 刻意不做网格线、边框和悬浮卡片 —— Product Bible 29.3 明确反对
 * 「传统后台、复杂表格」。这里只有数字和点，它是时间流的安静辅助层，
 * 不能抢走 Moments 主体的位置。
 *
 * 全部由 URL 驱动（?cal=YYYY-MM），没有客户端状态：
 * 月份可分享、可后退，禁用 JS 也能用。
 */
export function MonthCalendar({
  month,
  summaries,
  today,
  /** 当前正在查看的某一天，会被高亮 */
  activeDate,
  /** 传了才显示「收起」；侧栏常驻时不传 */
  closeHref,
  /** 生成切换月份的链接 */
  monthHref,
}: {
  month: MonthKey;
  summaries: DaySummary[];
  today: DayKey;
  activeDate?: DayKey;
  closeHref?: string;
  monthHref: (m: MonthKey) => string;
}) {
  const byDate = new Map(summaries.map((s) => [s.date, s]));
  const weeks = monthGrid(month);
  const thisMonth = toMonthKey(today);

  // 不允许翻到未来的月份：那里不会有记录
  const canGoNext = month < thisMonth;

  return (
    <div className="animate-rise">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="label-caps text-ink-faint">{formatMonthLong(month)}</h2>

        <div className="flex items-center gap-1">
          <Link
            href={monthHref(addMonths(month, -1))}
            aria-label="上一个月"
            className="flex size-11 items-center justify-center rounded-soft text-ink-muted
              transition-colors duration-[var(--duration-quick)]
              hover:bg-paper-raised hover:text-ink"
          >
            ‹
          </Link>

          {canGoNext ? (
            <Link
              href={monthHref(addMonths(month, 1))}
              aria-label="下一个月"
              className="flex size-11 items-center justify-center rounded-soft text-ink-muted
                transition-colors duration-[var(--duration-quick)]
                hover:bg-paper-raised hover:text-ink"
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

          {closeHref && (
            <Link
              href={closeHref}
              className="ml-2 flex min-h-11 items-center px-2 text-small text-ink-muted
                transition-colors hover:text-ink"
            >
              收起
            </Link>
          )}
        </div>
      </div>

      {/* 日历本质是表格数据，用 table 让屏幕阅读器拿到正确结构 */}
      <table className="mt-4 w-full max-w-sm border-separate border-spacing-y-1">
        <caption className="sr-only">
          {formatMonthLong(month)}，点击有记录的日子查看那一天
        </caption>
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((w) => (
              <th
                key={w}
                scope="col"
                className="pb-1 text-center text-label font-medium text-ink-faint"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((date, di) => {
                if (!date) return <td key={di} />;

                const s = byDate.get(date);
                const hasRecords = Boolean(
                  s && (s.momentCount > 0 || s.mood || s.hasFocus),
                );
                const isToday = date === today;
                const isActive = date === activeDate;
                const future = isFutureDay(date, today);
                const dayNum = Number(date.slice(8, 10));

                const dot = s?.mood && MOOD_LABELS[s.mood]
                  ? MOOD_LABELS[s.mood].color
                  : hasRecords
                    ? "bg-ink-faint"
                    : null;

                const inner = (
                  <>
                    <span className="font-mono text-small tabular-nums">
                      {dayNum}
                    </span>
                    {/* 点的位置始终占位，避免有点/无点的行高抖动 */}
                    <span className="mt-1 flex h-1.5 items-center justify-center">
                      {dot && (
                        <span
                          className={`size-1.5 rounded-full ${dot}`}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </>
                );

                const base =
                  "flex size-11 flex-col items-center justify-center rounded-soft " +
                  "transition-colors duration-[var(--duration-quick)]";

                return (
                  <td key={di} className="p-0 text-center align-middle">
                    {hasRecords && !future ? (
                      <Link
                        href={`/days/${date}`}
                        aria-label={`${dayNum} 日，${s!.momentCount} 条记录${
                          s?.mood ? `，心情 ${MOOD_LABELS[s.mood].zh}` : ""
                        }`}
                        aria-current={isActive ? "page" : undefined}
                        className={`${base} mx-auto cursor-pointer ${
                          isActive
                            ? "bg-brand text-on-brand"
                            : isToday
                              ? "text-ink ring-1 ring-brand hover:bg-brand-soft"
                              : "text-ink hover:bg-paper-raised"
                        }`}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <span
                        className={`${base} mx-auto ${
                          isToday
                            ? "text-ink ring-1 ring-brand"
                            : future
                              ? // 未来日期整体降透明度而不是换更浅的字色：
                                // ink-hint 只有 2.4:1，日期数字是信息不能用它
                                "text-ink-faint opacity-45"
                              : "text-ink-faint"
                        }`}
                      >
                        {inner}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
