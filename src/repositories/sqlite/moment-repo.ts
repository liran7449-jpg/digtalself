import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { moments } from "@/db/schema";
import { toDayKey, type DayKey } from "@/domain/day-key";
import type { Moment, QuickCaptureInput } from "@/domain/models";
import { quickCaptureSchema } from "@/domain/models";
import type { MomentType } from "@/domain/enums";
import type { MomentRepository } from "../types";
import { firstOrThrow, newId, now } from "./helpers";
import { adaptTimestamp } from "./pg-adapter";

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

export const sqliteMomentRepo: MomentRepository = {
  async capture(input: QuickCaptureInput, at = new Date()) {
    const parsed = quickCaptureSchema.parse(input);
    const rows = await db
      .insert(moments)
      .values({
        id: newId(),
        // 归属哪一天走凌晨 4 点边界，不是自然日
        date: toDayKey(at),
        type: parsed.type,
        status: "saved",
        content: parsed.content,
        mediaPaths: parsed.mediaPaths,
        occurredAt: adaptTimestamp(at) as any,
      })
      .returning();
    return toMoment(rows[0]);
  },

  async listByDate(date: DayKey) {
    const rows = await db
      .select()
      .from(moments)
      .where(eq(moments.date, date))
      .orderBy(desc(moments.occurredAt));
    return rows.map(toMoment);
  },

  async list(opts = {}) {
    const { limit = 50, offset = 0, type } = opts;
    const rows = await db
      .select()
      .from(moments)
      .where(type ? eq(moments.type, type as MomentType) : undefined)
      .orderBy(desc(moments.occurredAt))
      .limit(limit)
      .offset(offset);
    return rows.map(toMoment);
  },

  async find(id) {
    const rows = await db
      .select()
      .from(moments)
      .where(eq(moments.id, id))
      .limit(1);
    return rows[0] ? toMoment(rows[0]) : null;
  },

  async update(id, patch) {
    const rows = await db
      .update(moments)
      .set({ ...patch })
      .where(eq(moments.id, id))
      .returning();
    return toMoment(firstOrThrow(rows, "Moment", id));
  },

  /** 硬删除。PRD 第 31 节：用户可删除 Moment，不留残留。 */
  async remove(id) {
    await db.delete(moments).where(eq(moments.id, id));
  },

  async countByDate(date) {
    const rows = await db
      .select({ n: count() })
      .from(moments)
      .where(and(eq(moments.date, date)));
    return rows[0]?.n ?? 0;
  },
};
