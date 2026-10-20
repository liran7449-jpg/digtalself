"use client";

import { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/Primitives";
import { MomentCard } from "@/components/moment/MomentCard";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { formatDayHeading, type DayKey, type MonthKey } from "@/domain/day-key";
import type { Moment, Media, Person, Place, Topic } from "@/domain/models";
import type { DaySummary } from "@/repositories/types";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

interface MomentWithRelations extends Moment {
  media?: Media[];
  people?: Person[];
  places?: Place[];
  topics?: Topic[];
}

interface MomentsTimelineProps {
  groups: { date: DayKey; items: MomentWithRelations[] }[];
  summaries: DaySummary[];
  today: DayKey;
  calMonth: MonthKey;
  keepShow: string;
  hasMore?: boolean;
  limit?: number;
}

export function MomentsTimeline({
  groups,
  summaries,
  today,
  calMonth,
  keepShow,
  hasMore = false,
  limit = 0,
}: MomentsTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<DayKey | null>(null);

  // 滚动位置恢复
  useScrollRestoration('moments');

  const handleDateClick = (dayKey: DayKey) => {
    setSelectedDate(dayKey);

    // 检查该日期是否在已加载的数据中
    const element = document.querySelector(`[data-date="${dayKey}"]`);

    if (element) {
      // 已加载，滚动到该日期
      // 计算目标位置，减去导航栏高度（约 64px）+ 额外间距（16px）
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    } else {
      // 未加载，滚动到底部让用户点"看更早的"
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-12 flex flex-col lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14">
      <div className="order-2 lg:order-1">
        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.date} data-date={g.date}>
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

          {hasMore && (
            <div className="mt-16 flex justify-start">
              <Link
                href={`/moments?show=${limit + 50}&cal=${calMonth}`}
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
      </div>

      <aside className="order-1 mb-14 lg:order-2 lg:mb-0 lg:sticky lg:top-10 lg:self-start">
        <MonthCalendar
          month={calMonth}
          summaries={summaries}
          today={today}
          selectedDate={selectedDate}
          onDateClick={handleDateClick}
          monthHref={(m) => `/moments?cal=${m}${keepShow}`}
        />
      </aside>
    </div>
  );
}
