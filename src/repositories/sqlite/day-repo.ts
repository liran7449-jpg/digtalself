import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { days, moments } from "@/db/schema";
import { monthBounds, type DayKey, type MonthKey } from "@/domain/day-key";
import type { Day, MorningSetupInput } from "@/domain/models";
import { morningSetupSchema } from "@/domain/models";
import { DAY_TRANSITIONS, canTransition } from "@/domain/transitions";
import type { DayStatus } from "@/domain/enums";
import type { DayRepository, DaySummary } from "../types";
import { firstOrThrow, now } from "./helpers";

type Row = typeof days.$inferSelect;

function toDay(r: Row): Day {
  return {
    date: r.date,
    status: r.status as Day["status"],
    mood: r.mood as Day["mood"],
    focus: r.focus,
    theme: r.theme,
    eveningMood: r.eveningMood as Day["eveningMood"],
    stayedWithYou: r.stayedWithYou,
    learned: r.learned,
    reflectedAt: r.reflectedAt,
    carryDismissed: r.carryDismissed,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

async function find(date: DayKey): Promise<Day | null> {
  const rows = await db.select().from(days).where(eq(days.date, date)).limit(1);
  return rows[0] ? toDay(rows[0]) : null;
}

async function ensure(date: DayKey): Promise<Day> {
  const existing = await find(date);
  if (existing) return existing;

  // 并发首次访问同一天时可能撞主键，撞了就读回来
  const rows = await db
    .insert(days)
    .values({ date, status: "not_started" })
    .onConflictDoNothing()
    .returning();

  if (rows[0]) return toDay(rows[0]);
  const after = await find(date);
  return firstOrThrow(after ? [after] : [], "Day", date);
}

/**
 * 状态只前进不后退。已经 reflected 的一天再改 mood 不该把状态拉回 started，
 * 所以这里用流转表判断，不合法就保持原状态。
 */
function advance(from: DayStatus, to: DayStatus): DayStatus {
  return canTransition(DAY_TRANSITIONS, from, to) ? to : from;
}

/**
 * 一路走到 reflected，中间的状态自动补齐。
 *
 * 状态机只允许逐跳前进，而用户可能从任何状态直接反思 ——
 * 比如早上没打开 app（not_started）晚上想记两句。少补一跳，
 * 就会出现 reflectedAt 已写、status 还停在 not_started 的矛盾状态。
 */
const TO_REFLECTED: readonly DayStatus[] = [
  "started",
  "ready_to_reflect",
  "reflected",
];

function toReflected(from: DayStatus): DayStatus {
  return TO_REFLECTED.reduce((s, next) => advance(s, next), from);
}

export const sqliteDayRepo: DayRepository = {
  find,
  ensure,

  async applyMorningSetup(date, input: MorningSetupInput) {
    const parsed = morningSetupSchema.parse(input);
    const day = await ensure(date);

    const rows = await db
      .update(days)
      .set({
        mood: parsed.mood,
        focus: parsed.focus,
        status: advance(day.status, "started"),
      })
      .where(eq(days.date, date))
      .returning();

    return toDay(firstOrThrow(rows, "Day", date));
  },

  /**
   * 部分更新。只写 patch 里出现的键：
   * 键不存在 = 不动，值为 null = 显式清空。
   * 直接展开整个 patch 会把未传的字段写成 undefined，Drizzle 会忽略，
   * 但显式传入的 null 必须能落库，所以要逐字段判断 `in`。
   */
  async updateState(date, patch) {
    const day = await ensure(date);

    const set: Partial<Row> = {};
    if ("mood" in patch) set.mood = patch.mood ?? null;
    if ("focus" in patch) set.focus = patch.focus ?? null;

    // 动手改状态说明这一天已经开始了
    set.status = advance(day.status, "started");

    const rows = await db
      .update(days)
      .set(set)
      .where(eq(days.date, date))
      .returning();
    return toDay(firstOrThrow(rows, "Day", date));
  },

  async markReadyToReflect(date) {
    const day = await ensure(date);
    const rows = await db
      .update(days)
      .set({
        status: advance(day.status, "ready_to_reflect"),
      })
      .where(eq(days.date, date))
      .returning();
    return toDay(firstOrThrow(rows, "Day", date));
  },

  async markReflected(date) {
    const day = await ensure(date);
    const rows = await db
      .update(days)
      .set({ status: toReflected(day.status) })
      .where(eq(days.date, date))
      .returning();
    return toDay(firstOrThrow(rows, "Day", date));
  },

  async saveReflection(date, input) {
    const day = await ensure(date);

    // 反思存的是那一刻的真实想法，不该被日后的自己修饰。
    // 约束放在这一层而不只是隐藏表单：并发提交或直接调用都会被挡住。
    if (day.reflectedAt !== null) {
      throw new Error(`Day ${date} 已经反思过了，不能重写。`);
    }

    const at = now();
    // 一次性提交，三项一起写。全部可空 —— 每个问题都能跳过。
    const rows = await db
      .update(days)
      .set({
        eveningMood: input.eveningMood ?? null,
        stayedWithYou: input.stayedWithYou?.trim() || null,
        learned: input.learned?.trim() || null,
        reflectedAt: at,
        status: toReflected(day.status),
      })
      .where(eq(days.date, date))
      .returning();
    return toDay(firstOrThrow(rows, "Day", date));
  },

  async dismissCarry(date) {
    await ensure(date);
    const rows = await db
      .update(days)
      .set({ carryDismissed: true })
      .where(eq(days.date, date))
      .returning();
    return toDay(firstOrThrow(rows, "Day", date));
  },

  async recent(limit) {
    const rows = await db
      .select()
      .from(days)
      .orderBy(desc(days.date))
      .limit(limit);
    return rows.map(toDay);
  },

  /**
   * 整月摘要。两个来源要合并：
   * - days 表：mood / focus / status
   * - moments 表：按天计数
   *
   * 必须合并而不能只查 days，因为 Quick Capture 不调 ensure()，
   * 存在「有记录但没有 Day 行」的日期，只查 days 会让这些天在日历上消失。
   */
  async listMonth(month: MonthKey): Promise<DaySummary[]> {
    const { start, end } = monthBounds(month);

    const [dayRows, momentCounts] = await Promise.all([
      db
        .select()
        .from(days)
        .where(and(gte(days.date, start), lte(days.date, end))),
      db
        .select({ date: moments.date, n: count() })
        .from(moments)
        .where(and(gte(moments.date, start), lte(moments.date, end)))
        .groupBy(moments.date),
    ]);

    const byDate = new Map<DayKey, DaySummary>();

    for (const r of dayRows) {
      byDate.set(r.date, {
        date: r.date,
        mood: r.mood as Day["mood"],
        status: r.status as Day["status"],
        momentCount: 0,
        hasFocus: Boolean(r.focus),
      });
    }

    for (const { date, n } of momentCounts) {
      const existing = byDate.get(date);
      if (existing) {
        existing.momentCount = n;
      } else {
        byDate.set(date, {
          date,
          mood: null,
          status: null,
          momentCount: n,
          hasFocus: false,
        });
      }
    }

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  },
};
