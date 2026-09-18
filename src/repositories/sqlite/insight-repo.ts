import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { insights } from "@/db/schema";
import type { DayKey } from "@/domain/day-key";
import type { Insight } from "@/domain/models";
import type { InsightRepository } from "../types";
import { firstOrThrow, newId } from "./helpers";

type Row = typeof insights.$inferSelect;

function toInsight(r: Row): Insight {
  return {
    id: r.id,
    type: r.type as Insight["type"],
    title: r.title,
    content: r.content,
    evidenceIds: r.evidenceIds,
    confidence: r.confidence,
    rangeStart: r.rangeStart,
    rangeEnd: r.rangeEnd,
    userFeedback: r.userFeedback as Insight["userFeedback"],
    createdAt: r.createdAt,
  };
}

export function createInsightRepository(userId: string): InsightRepository {
  return {
    /** 一天只有一条 daily insight，重复生成由调用方先查再决定。 */
    async findDaily(date: DayKey) {
      const rows = await db
        .select()
        .from(insights)
        .where(
          and(
            eq(insights.userId, userId),
            eq(insights.type, "daily"),
            eq(insights.rangeEnd, date),
          ),
        )
        .limit(1);
      return rows[0] ? toInsight(rows[0]) : null;
    },

    async create(input) {
      const rows = await db
        .insert(insights)
        .values({ ...input, id: newId(), userId })
        .returning();
      return toInsight(rows[0]);
    },

    async recent(limit) {
      const rows = await db
        .select()
        .from(insights)
        .where(eq(insights.userId, userId))
        .orderBy(desc(insights.createdAt))
        .limit(limit);
      return rows.map(toInsight);
    },

    async rate(id, feedback) {
      const rows = await db
        .update(insights)
        .set({ userFeedback: feedback })
        .where(and(eq(insights.id, id), eq(insights.userId, userId)))
        .returning();
      return toInsight(firstOrThrow(rows, "Insight", id));
    },
  };
}
