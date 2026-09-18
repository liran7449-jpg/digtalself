import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { goals } from "@/db/schema";
import type { Goal } from "@/domain/models";
import { GOAL_TRANSITIONS, assertTransition } from "@/domain/transitions";
import type { GoalStatus } from "@/domain/enums";
import type { GoalRepository } from "../types";
import { firstOrThrow, newId } from "./helpers";

type Row = typeof goals.$inferSelect;

function toGoal(r: Row): Goal {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status as Goal["status"],
    type: r.type,
    priority: r.priority,
    startDate: r.startDate,
    targetDate: r.targetDate,
    completedDate: r.completedDate,
    parentGoalId: r.parentGoalId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function createGoalRepository(userId: string): GoalRepository {
  return {
    async list(status) {
      const rows = await db
        .select()
        .from(goals)
        .where(status ? and(eq(goals.userId, userId), eq(goals.status, status)) : eq(goals.userId, userId))
        .orderBy(desc(goals.updatedAt));
      return rows.map(toGoal);
    },

    async listActive() {
      return this.list("active");
    },

    async find(id) {
      const rows = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .limit(1);
      return rows[0] ? toGoal(rows[0]) : null;
    },

    async create(input) {
      const rows = await db
        .insert(goals)
        .values({ ...input, id: newId(), userId, status: "draft" })
        .returning();
      return toGoal(rows[0]);
    },

    async update(id, patch) {
      const rows = await db
        .update(goals)
        .set({ ...patch })
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning();
      return toGoal(firstOrThrow(rows, "Goal", id));
    },

    async setStatus(id, status: GoalStatus) {
      // find 已经带 userId，别人的 goal 在这里就变成「不存在」
      const current = await this.find(id);
      if (!current) throw new Error(`Goal 不存在: ${id}`);
      assertTransition("Goal", GOAL_TRANSITIONS, current.status, status);

      const rows = await db
        .update(goals)
        .set({ status })
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning();
      return toGoal(firstOrThrow(rows, "Goal", id));
    },

    /** 删不到就抛错，不静默成功 —— 静默会掩盖调用方的 bug。 */
    async remove(id) {
      const rows = await db
        .delete(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning({ id: goals.id });
      firstOrThrow(rows, "Goal", id);
    },
  };
}
