import { and, asc, eq, gte, inArray, lt, max, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { days, planItems } from "@/db/schema";
import { addDays, type DayKey } from "@/domain/day-key";
import type { PlanItem } from "@/domain/models";
import { PLAN_TRANSITIONS, assertTransition } from "@/domain/transitions";
import type { PlanStatus } from "@/domain/enums";
import type { PlanRepository } from "../types";
import { firstOrThrow, newId, now } from "./helpers";

/**
 * 会被顺延的状态。
 * 不含 skipped —— 跳过是用户主动决定不做，顺延它等于否认那个决定。
 */
const UNFINISHED = ["planned", "in_progress"] as const;

type Row = typeof planItems.$inferSelect;

function toPlan(r: Row): PlanItem {
  return {
    id: r.id,
    date: r.date,
    title: r.title,
    kind: r.kind as PlanItem["kind"],
    status: r.status as PlanItem["status"],
    priority: r.priority as PlanItem["priority"],
    startAt: r.startAt,
    durationMin: r.durationMin,
    fromAi: r.fromAi,
    carriedFromId: r.carriedFromId,
    carryCount: r.carryCount,
    goalId: r.goalId,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** high → normal → low。SQLite 没有枚举序，用 CASE 映射成可排序的数字。 */
const priorityRank = sql`case ${planItems.priority}
  when 'high' then 0
  when 'normal' then 1
  else 2 end`;

const DEFAULT_LOOKBACK_DAYS = 7;

/**
 * 找出可以顺延到 date 的项。
 *
 * carryOverUnfinished 和 peekCarryable 共用这一份逻辑：
 * 入口显示的数量必须和实际会顺延的数量一致，两边各写一遍迟早会分叉。
 */
async function findCarryable(
  date: DayKey,
  lookbackDays: number,
): Promise<{ from: DayKey | null; pending: Row[] }> {
  const earliest = addDays(date, -lookbackDays);

  // 往回找最近一天有未完成项的日期。用户可能隔几天没打开，
  // 只看前一天会什么都找不到。
  const sourceRows = await db
    .select({ d: max(planItems.date) })
    .from(planItems)
    .where(
      and(
        lt(planItems.date, date),
        gte(planItems.date, earliest),
        inArray(planItems.status, UNFINISHED),
      ),
    );

  const from = sourceRows[0]?.d ?? null;
  if (!from) return { from: null, pending: [] };

  const [sources, existing] = await Promise.all([
    db
      .select()
      .from(planItems)
      .where(
        and(eq(planItems.date, from), inArray(planItems.status, UNFINISHED)),
      )
      .orderBy(priorityRank, asc(planItems.sortOrder)),
    // 幂等：已经从某条源项顺延过的，不再重复生成
    db
      .select({ id: planItems.carriedFromId })
      .from(planItems)
      .where(eq(planItems.date, date)),
  ]);

  const alreadyCarried = new Set(
    existing.map((r) => r.id).filter((id): id is string => Boolean(id)),
  );

  return { from, pending: sources.filter((s) => !alreadyCarried.has(s.id)) };
}

async function findRow(id: string): Promise<Row> {
  const rows = await db
    .select()
    .from(planItems)
    .where(eq(planItems.id, id))
    .limit(1);
  return firstOrThrow(rows, "PlanItem", id);
}

export const sqlitePlanRepo: PlanRepository = {
  async listByDate(date: DayKey) {
    const rows = await db
      .select()
      .from(planItems)
      .where(eq(planItems.date, date))
      // 1) SQLite 在 ASC 下把 NULL 排最前，会让「没写时间的杂事」浮到有时间的
      //    计划之上。先按 `start_at IS NULL`（非空得 0、空得 1）把不定时的推后。
      // 2) 有时间的按时间排 —— 优先级不能打乱它，09:30 的会必须留在 09:30。
      // 3) 优先级只在时间相同（含都不定时）时起作用，那才是「接下来做哪件」。
      .orderBy(
        sql`${planItems.startAt} is null`,
        asc(planItems.startAt),
        priorityRank,
        asc(planItems.sortOrder),
      );
    return rows.map(toPlan);
  },

  async create(input) {
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const rows = await db
        .select({ m: max(planItems.sortOrder) })
        .from(planItems)
        .where(eq(planItems.date, input.date));
      sortOrder = (rows[0]?.m ?? -1) + 1;
    }

    const rows = await db
      .insert(planItems)
      .values({ ...input, id: newId(), sortOrder })
      .returning();
    return toPlan(rows[0]);
  },

  async setStatus(id, status: PlanStatus) {
    const current = await findRow(id);
    // 非法流转直接抛，避免 UI 出现「已完成 → 已跳过」这类不该发生的组合
    assertTransition(
      "PlanItem",
      PLAN_TRANSITIONS,
      current.status as PlanStatus,
      status,
    );

    const rows = await db
      .update(planItems)
      .set({ status, updatedAt: now() })
      .where(eq(planItems.id, id))
      .returning();
    return toPlan(firstOrThrow(rows, "PlanItem", id));
  },

  async update(id, patch) {
    const rows = await db
      .update(planItems)
      .set({ ...patch, updatedAt: now() })
      .where(eq(planItems.id, id))
      .returning();
    return toPlan(firstOrThrow(rows, "PlanItem", id));
  },

  async remove(id) {
    await db.delete(planItems).where(eq(planItems.id, id));
  },

  async carryOverUnfinished(date, opts = {}) {
    const { from, pending } = await findCarryable(
      date,
      opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS,
    );
    if (!from || pending.length === 0) return { count: 0, from };

    // plan_items.date 外键指向 days，目标日必须先存在
    await db
      .insert(days)
      .values({ date, status: "not_started" })
      .onConflictDoNothing();

    const maxSort = await db
      .select({ m: max(planItems.sortOrder) })
      .from(planItems)
      .where(eq(planItems.date, date));

    let sortOrder = (maxSort[0]?.m ?? -1) + 1;
    const at = now();

    await db.insert(planItems).values(
      pending.map((s) => ({
        id: newId(),
        date,
        title: s.title,
        kind: s.kind,
        // 新的一天从头开始：源项的 in_progress 不带过来，
        // 否则会显示成「正在做」而其实今天还没动过。
        status: "planned" as const,
        priority: s.priority,
        // 时间不带过来：昨天的 09:30 对今天未必成立。
        // 落到不定时区，按优先级排序，你今天再决定什么时候做。
        startAt: null,
        durationMin: s.durationMin,
        fromAi: s.fromAi,
        carriedFromId: s.id,
        carryCount: s.carryCount + 1,
        goalId: s.goalId,
        sortOrder: sortOrder++,
        createdAt: at,
        updatedAt: at,
      })),
    );

    return { count: pending.length, from };
  },

  async peekCarryable(date, opts = {}) {
    const { from, pending } = await findCarryable(
      date,
      opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS,
    );
    return { count: pending.length, from };
  },
};
