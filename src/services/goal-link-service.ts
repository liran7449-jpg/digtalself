/**
 * GoalLinkService: 管理 Goal 与 Moment 的多对多关联。
 *
 * 注意：Moment 已有单对多的 goalId 字段（旧设计），
 * 现在新增 moment_goals 关联表支持多对多。
 * 两者暂时共存，未来可以迁移掉 goalId。
 */

import { repo } from "@/repositories";
import { db } from "@/db/client";
import { momentGoals, goals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Goal } from "@/domain/models";

export const GoalLinkService = {
  async linkToMoment(momentId: string, goalId: string): Promise<void> {
    const existing = await db
      .select()
      .from(momentGoals)
      .where(
        and(
          eq(momentGoals.momentId, momentId),
          eq(momentGoals.goalId, goalId),
        ),
      )
      .get();

    if (!existing) {
      await db.insert(momentGoals).values({ momentId, goalId }).run();
    }
  },

  async unlinkFromMoment(momentId: string, goalId: string): Promise<void> {
    await db
      .delete(momentGoals)
      .where(
        and(
          eq(momentGoals.momentId, momentId),
          eq(momentGoals.goalId, goalId),
        ),
      )
      .run();
  },

  async listByMoment(momentId: string): Promise<Goal[]> {
    const rows = await db
      .select({ goals })
      .from(momentGoals)
      .innerJoin(goals, eq(momentGoals.goalId, goals.id))
      .where(eq(momentGoals.momentId, momentId))
      .all();

    return rows.map((r) => r.goals as Goal);
  },
};
