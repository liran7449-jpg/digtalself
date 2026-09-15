import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { goals } from "@/db/schema";
import type { Goal } from "@/domain/models";
import { GOAL_TRANSITIONS, assertTransition } from "@/domain/transitions";
import type { GoalStatus } from "@/domain/enums";
import type { GoalRepository } from "../types";
import { firstOrThrow, newId, now } from "./helpers";

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

export const sqliteGoalRepo: GoalRepository = {
  async list(status) {
    const rows = await db
      .select()
      .from(goals)
      .where(status ? eq(goals.status, status) : undefined)
      .orderBy(desc(goals.updatedAt));
    return rows.map(toGoal);
  },

  async listActive() {
    return this.list("active");
  },

  async find(id) {
    const rows = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
    return rows[0] ? toGoal(rows[0]) : null;
  },

  async create(input) {
    const rows = await db
      .insert(goals)
      .values({ ...input, id: newId(), status: "draft" })
      .returning();
    return toGoal(rows[0]);
  },

  async update(id, patch) {
    const rows = await db
      .update(goals)
      .set({ ...patch })
      .where(eq(goals.id, id))
      .returning();
    return toGoal(firstOrThrow(rows, "Goal", id));
  },

  async setStatus(id, status: GoalStatus) {
    const current = await this.find(id);
    if (!current) throw new Error(`Goal 不存在: ${id}`);
    assertTransition("Goal", GOAL_TRANSITIONS, current.status, status);

    const rows = await db
      .update(goals)
      .set({ status })
      .where(eq(goals.id, id))
      .returning();
    return toGoal(firstOrThrow(rows, "Goal", id));
  },

  async remove(id) {
    await db.delete(goals).where(eq(goals.id, id));
  },
};
