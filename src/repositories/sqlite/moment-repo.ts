import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { moments } from "@/db/schema";
import { toDayKey, type DayKey } from "@/domain/day-key";
import type { Moment, QuickCaptureInput } from "@/domain/models";
import { quickCaptureSchema } from "@/domain/models";
import type { MomentType } from "@/domain/enums";
import type { MomentRepository } from "../types";
import { firstOrThrow, newId } from "./helpers";

type Row = typeof moments.$inferSelect;

function toMoment(r: Row): Moment {
  return {
    id: r.id,
    date: r.date,
    type: r.type as Moment["type"],
    status: r.status as Moment["status"],
    content: r.content,
    mediaPaths: r.mediaPaths,
    occurredAt: r.occurredAt,
    mood: r.mood as Moment["mood"],
    tags: r.tags,
    place: r.place,
    goalId: r.goalId,
    importance: r.importance,
    isMemory: r.isMemory,
    whyItMatters: r.whyItMatters,
    aiSummary: r.aiSummary,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/**
 * Moment 是这个产品的核心记录（§1 列为用户真实资产）。
 * 每个方法都带 userId 过滤，包括 update / remove —— 只按 id 定位
 * 就意味着拿到别人的 id 能改能删。
 */
export function createMomentRepository(userId: string): MomentRepository {
  return {
    async capture(input: QuickCaptureInput, at = new Date()) {
      const parsed = quickCaptureSchema.parse(input);
      const rows = await db
        .insert(moments)
        .values({
          id: newId(),
          userId,
          // 归属哪一天走凌晨 4 点边界，不是自然日
          date: toDayKey(at),
          type: parsed.type,
          status: "saved",
          content: parsed.content,
          mediaPaths: parsed.mediaPaths,
          occurredAt: at,
        })
        .returning();
      return toMoment(rows[0]);
    },

    async listByDate(date: DayKey) {
      const rows = await db
        .select()
        .from(moments)
        .where(and(eq(moments.userId, userId), eq(moments.date, date)))
        .orderBy(desc(moments.occurredAt));
      return rows.map(toMoment);
    },

    async list(opts = {}) {
      const { limit = 50, offset = 0, type } = opts;
      const rows = await db
        .select()
        .from(moments)
        .where(
          type
            ? and(eq(moments.userId, userId), eq(moments.type, type as MomentType))
            : eq(moments.userId, userId),
        )
        .orderBy(desc(moments.occurredAt))
        .limit(limit)
        .offset(offset);
      return rows.map(toMoment);
    },

    async find(id) {
      const rows = await db
        .select()
        .from(moments)
        .where(and(eq(moments.id, id), eq(moments.userId, userId)))
        .limit(1);
      return rows[0] ? toMoment(rows[0]) : null;
    },

    /**
     * 更新。where 带 userId，改别人的 moment 会匹配 0 行，
     * firstOrThrow 抛 NotFoundError —— 对调用方来说和「不存在」一样，
     * 不泄露「这条记录存在但不属于你」这个信息。
     */
    async update(id, patch) {
      const rows = await db
        .update(moments)
        .set({ ...patch })
        .where(and(eq(moments.id, id), eq(moments.userId, userId)))
        .returning();
      return toMoment(firstOrThrow(rows, "Moment", id));
    },

    /**
     * 硬删除。PRD 第 31 节：用户可删除 Moment，不留残留。
     *
     * 删不到（不存在或不属于自己）时抛错，不静默成功 ——
     * 静默会掩盖调用方的 bug，也让「删别人的」看起来是成功的。
     */
    async remove(id) {
      const rows = await db
        .delete(moments)
        .where(and(eq(moments.id, id), eq(moments.userId, userId)))
        .returning({ id: moments.id });
      firstOrThrow(rows, "Moment", id);
    },

    async countByDate(date) {
      const rows = await db
        .select({ n: count() })
        .from(moments)
        .where(and(eq(moments.userId, userId), eq(moments.date, date)));
      return rows[0]?.n ?? 0;
    },
  };
}
