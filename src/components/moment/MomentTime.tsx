import { formatClock, isAfterMidnight, type DayKey } from "@/domain/day-key";

/**
 * Moment 的时间戳。
 *
 * 日界在凌晨 4 点，所以 00:30 写的记录归前一天。若不标注，列表里
 * 「00:30」会看起来排在当天最前，实际它是那天的最后一条。
 */
export function MomentTime({
  at,
  dayKey,
  className = "",
}: {
  at: Date;
  dayKey: DayKey;
  className?: string;
}) {
  const nextDay = isAfterMidnight(at, dayKey);
  const clock = formatClock(at);

  return (
    <span
      className={`font-mono text-small tabular-nums text-ink-muted ${className}`}
      title={nextDay ? `${clock}（次日凌晨，仍属这一天）` : undefined}
    >
      {nextDay && <span className="mr-1 text-ink-faint">次日</span>}
      {clock}
    </span>
  );
}
