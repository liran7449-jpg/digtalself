import { MOOD_LABELS } from "@/domain/labels";
import type { Day } from "@/domain/models";

/**
 * 晚间反思的只读呈现。Today（提交后）和 Day 视图共用 ——
 * 两处各写一份迟早会分叉。
 *
 * 没有 "use client"：纯呈现，被客户端组件引入就打进客户端包，
 * 被服务端组件引入就留在服务端。
 */
export function ReflectionCard({
  day,
  /** Today 说「今天」，回看时说「这一天」 */
  heading,
  /** 只有当天收尾时才道晚安 */
  closing,
}: {
  day: Day;
  heading: string;
  closing?: string;
}) {
  const mood = day.eveningMood ? MOOD_LABELS[day.eveningMood] : null;
  const nothing = !mood && !day.stayedWithYou && !day.learned;

  return (
    <>
      <p className="label-caps text-ink-muted">{heading}</p>

      {nothing ? (
        // 三项全跳过也是一种回答，不该显示成空白或错误
        <p className="mt-4 measure text-body text-ink-muted">
          没有留下文字。这样也可以。
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {mood && (
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${mood.color}`}
              />
              <span className="text-body text-ink-soft">这一天{mood.zh}</span>
            </div>
          )}

          {day.stayedWithYou && (
            <div>
              <p className="label-caps text-ink-faint">留在心里的</p>
              <p className="mt-2 measure whitespace-pre-wrap text-body text-ink">
                {day.stayedWithYou}
              </p>
            </div>
          )}

          {day.learned && (
            <div>
              <p className="label-caps text-ink-faint">学到的</p>
              <p className="mt-2 measure whitespace-pre-wrap text-body text-ink">
                {day.learned}
              </p>
            </div>
          )}
        </div>
      )}

      {closing && (
        <p className="mt-8 text-small text-ink-muted">{closing}</p>
      )}
    </>
  );
}
