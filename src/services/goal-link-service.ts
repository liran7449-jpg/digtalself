/**
 * GoalLinkService: 管理 Goal 与 Moment 的多对多关联。
 *
 * 注意：Moment 已有单对多的 goalId 字段（旧设计），
 * 现在新增 moment_goals 关联表支持多对多。
 * 两者暂时共存，未来可以迁移掉 goalId。
 *
 * moment_goals 两端都要校验：momentId 和 goalId 必须都属于调用者。
 * 只校验一端就能把自己的 moment 挂到别人的 goal 上（或反过来），
 * 之后从任一端读关联都会跨界。
 */

import { repoFor } from "@/repositories";
import { db } from "@/db/client";
import { momentGoals, goals, moments } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import type { Goal } from "@/domain/models";

/** Goal 详情右栏需要的 Moment 摘要。只取展示用的列，不搬整行。 */
export type GoalEvidence = {
  id: string;
  content: string;
  date: string;
  occurredAt: Date;
  mediaPaths: string[];
};

/** 两端都必须属于这个用户。 */
async function assertOwnsBoth(
  userId: string,
  momentId: string,
  goalId: string,
): Promise<void> {
  const repo = repoFor(userId);
  const [moment, goal] = await Promise.all([
    repo.moments.find(momentId),
    repo.goals.find(goalId),
  ]);
  if (!moment) throw new Error(`Moment 不存在或不属于当前用户: ${momentId}`);
  if (!goal) throw new Error(`Goal 不存在或不属于当前用户: ${goalId}`);
}

export const GoalLinkService = {
  async linkToMoment(userId: string, momentId: string, goalId: string): Promise<void> {
    await assertOwnsBoth(userId, momentId, goalId);

    const existing = await db
      .select()
      .from(momentGoals)
      .where(
        and(eq(momentGoals.momentId, momentId), eq(momentGoals.goalId, goalId)),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      await db.insert(momentGoals).values({ momentId, goalId });
    }
  },

  async unlinkFromMoment(
    userId: string,
    momentId: string,
    goalId: string,
  ): Promise<void> {
    await assertOwnsBoth(userId, momentId, goalId);
    await db
      .delete(momentGoals)
      .where(
        and(eq(momentGoals.momentId, momentId), eq(momentGoals.goalId, goalId)),
      );
  },

  /** join 上带 goals.userId —— 不依赖调用方传的 momentId 是否干净。 */
  async listByMoment(userId: string, momentId: string): Promise<Goal[]> {
    const rows = await db
      .select({ goals })
      .from(momentGoals)
      .innerJoin(goals, eq(momentGoals.goalId, goals.id))
      .where(and(eq(momentGoals.momentId, momentId), eq(goals.userId, userId)));

    return rows.map((r) => r.goals as Goal);
  },

  /** 按 Goal 反查关联的 Moments */
  async listByGoal(userId: string, goalId: string): Promise<string[]> {
    const rows = await db
      .select({ momentId: momentGoals.momentId })
      .from(momentGoals)
      .innerJoin(goals, eq(momentGoals.goalId, goals.id))
      .where(and(eq(momentGoals.goalId, goalId), eq(goals.userId, userId)));

    return rows.map((r) => r.momentId);
  },

  /**
   * 所有目标的证据数，一次 group by。
   * 左栏每个目标都要显示数量，逐个查就是 N+1。
   */
  async countByGoals(userId: string): Promise<Map<string, number>> {
    const rows = await db
      .select({ goalId: momentGoals.goalId, n: count() })
      .from(momentGoals)
      .innerJoin(goals, eq(momentGoals.goalId, goals.id))
      .where(eq(goals.userId, userId))
      .groupBy(momentGoals.goalId);

    return new Map(rows.map((r) => [r.goalId, Number(r.n)]));
  },

  /**
   * 某个目标关联的 Moment 摘要，最新在前。
   * 两端都按 userId 过滤：goal 属于自己，moment 也属于自己。
   */
  async listEvidence(userId: string, goalId: string): Promise<GoalEvidence[]> {
    return db
      .select({
        id: moments.id,
        content: moments.content,
        date: moments.date,
        occurredAt: moments.occurredAt,
        mediaPaths: moments.mediaPaths,
      })
      .from(momentGoals)
      .innerJoin(goals, eq(momentGoals.goalId, goals.id))
      .innerJoin(moments, eq(momentGoals.momentId, moments.id))
      .where(
        and(
          eq(momentGoals.goalId, goalId),
          eq(goals.userId, userId),
          eq(moments.userId, userId),
        ),
      )
      .orderBy(desc(moments.occurredAt));
  },
};
