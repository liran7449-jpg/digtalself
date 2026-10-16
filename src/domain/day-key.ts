/**
 * DayKey = 本地日期字符串 "YYYY-MM-DD"，Day 表的主键。
 *
 * 用字符串而不用时间戳，是为了避开时区漂移：用户在哪个时区写的日记，
 * 那一天就该是那一天，不该因为换时区而变成前一天。
 *
 * 一天的边界在凌晨 4 点，不在 0 点。晚上 1 点写反思属于前一天，
 * 这对生活记录类产品比自然日更符合直觉。
 */

export const DAY_BOUNDARY_HOUR = 4;

export type DayKey = string; // "YYYY-MM-DD"

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(v: string): boolean {
  if (!DAY_KEY_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

function format(d: Date): DayKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 给定时刻属于哪个 DayKey。凌晨 4 点前算前一天。 */
export function toDayKey(at: Date = new Date()): DayKey {
  // 强制使用 Asia/Shanghai 时区（UTC+8）避免服务器时区不一致
  const chinaTime = new Date(at.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const shifted = new Date(chinaTime);
  shifted.setHours(shifted.getHours() - DAY_BOUNDARY_HOUR);
  return format(shifted);
}

export function addDays(key: DayKey, delta: number): DayKey {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return format(dt);
}

export function previousDay(key: DayKey): DayKey {
  return addDays(key, -1);
}

/** 用于 Header 显示，例如 "Thursday, September 7" */
export function formatDayLong(key: DayKey, locale = "en-US"): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * 相对今天的日期标题。Today / Yesterday 优先，其余用长格式。
 * 年份只在跨年时出现 —— 同一年里带年份是噪音。
 */
export function formatDayHeading(key: DayKey, today: DayKey): string {
  if (key === today) return "Today";
  if (key === previousDay(today)) return "Yesterday";

  const long = formatDayLong(key);
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return sameYear ? long : `${long}, ${key.slice(0, 4)}`;
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export function timeOfDay(at: Date = new Date()): TimeOfDay {
  const h = at.getHours();
  if (h >= DAY_BOUNDARY_HOUR && h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 23) return "evening";
  return "night";
}

/** PRD 第 6.3 节：克制的问候，不用「元气满满」那类语气。 */
export function greeting(at: Date = new Date()): string {
  switch (timeOfDay(at)) {
    case "morning":
      return "Good morning.";
    case "afternoon":
      return "Good afternoon.";
    case "evening":
      return "Good evening.";
    case "night":
      return "Still up.";
  }
}

/** "HH:mm"，Timeline 用 */
export function formatClock(at: Date): string {
  return `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
}

/** 不做凌晨偏移的自然日历日，仅用于和 DayKey 比对。 */
export function naturalDayKey(at: Date): DayKey {
  return format(at);
}

/**
 * 记录时刻是否落在所属 DayKey 的次日凌晨。
 *
 * 因为日界在凌晨 4 点，00:30 写的东西归前一天。
 * 列表里直接显示「00:30」会让它看起来排在当天最前面，
 * 实际上它是那一天的最后一条，所以要标出来。
 */
export function isAfterMidnight(at: Date, dayKey: DayKey): boolean {
  return naturalDayKey(at) !== dayKey;
}

/* ============================================================
   月份：日历用
   ============================================================ */

/** "YYYY-MM" */
export type MonthKey = string;

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

export function isMonthKey(v: string): boolean {
  if (!MONTH_KEY_RE.test(v)) return false;
  const m = Number(v.slice(5, 7));
  return m >= 1 && m <= 12;
}

export function toMonthKey(key: DayKey): MonthKey {
  return key.slice(0, 7);
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  // Date 会自动处理跨年，月份传 0 索引
  const dt = new Date(y, m - 1 + delta, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

/** 该月的首末日，用于范围查询。 */
export function monthBounds(month: MonthKey): { start: DayKey; end: DayKey } {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const lastDay = new Date(y, m, 0).getDate(); // 下个月第 0 天 = 本月最后一天
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** 例如 "September 2026" */
export function formatMonthLong(month: MonthKey, locale = "en-US"): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return new Date(y, m - 1, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

/**
 * 月历网格，周一起始。返回若干周，每周 7 格；
 * 落在本月之外的格子为 null，让日历只呈现本月。
 */
export function monthGrid(month: MonthKey): (DayKey | null)[][] {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const daysInMonth = new Date(y, m, 0).getDate();

  // getDay(): 0=周日。转成周一起始的 0..6
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7;

  const cells: (DayKey | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** 周一起始的星期缩写，与 monthGrid 对齐。 */
export const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export function isFutureDay(key: DayKey, today: DayKey): boolean {
  return key > today; // ISO 格式字典序即时间序
}
