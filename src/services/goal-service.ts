/**
 * GoalService: Goal 的业务逻辑层
 *
 * 封装 goal-repo 和 goal-link-service，提供统一的 Goal 操作接口
 */

import type { GoalRepository } from "@/repositories/types";
import type { GoalStatus } from "@/domain/enums";
import type { Goal } from "@/domain/models";

export interface GoalWithStats extends Goal {
  evidenceCount: number;
  milestoneCount: number;
}

export class GoalService {
  constructor(
    private goalRepo: GoalRepository,
    private getMomentsByGoal: (goalId: string) => Promise<{ id: string }[]>,
    private getMilestonesByGoal: (goalId: string) => Promise<{ id: string }[]>,
  ) {}

  /**
   * 创建 Goal，极简流程：只需要 title
   * 创建后立即设为 active（不暴露 draft 给用户）
   */
  async create(title: string, description?: string): Promise<Goal> {
    const goal = await this.goalRepo.create({
      title,
      description: description || null,
      type: "personal",
      priority: 3,
      startDate: null,
      targetDate: null,
      completedDate: null,
      parentGoalId: null,
    });

    // draft → active
    return this.goalRepo.setStatus(goal.id, "active");
  }

  /**
   * 列出 Goals，可以按状态过滤
   */
  async list(status?: GoalStatus): Promise<Goal[]> {
    return this.goalRepo.list(status);
  }

  /**
   * 列出 Active Goals
   */
  async listActive(): Promise<Goal[]> {
    return this.goalRepo.listActive();
  }

  /**
   * 获取 Goal 详情，带 Evidence 和 Milestone 统计
   */
  async getWithStats(goalId: string): Promise<GoalWithStats | null> {
    const goal = await this.goalRepo.find(goalId);
    if (!goal) return null;

    const [moments, milestones] = await Promise.all([
      this.getMomentsByGoal(goalId),
      this.getMilestonesByGoal(goalId),
    ]);

    return {
      ...goal,
      evidenceCount: moments.length,
      milestoneCount: milestones.length,
    };
  }

  /**
   * 更新 Goal
   */
  async update(
    goalId: string,
    patch: {
      title?: string;
      description?: string | null;
      type?: string;
      priority?: number;
      targetDate?: string | null;
    },
  ): Promise<Goal> {
    return this.goalRepo.update(goalId, patch);
  }

  /**
   * 修改状态
   */
  async setStatus(goalId: string, status: GoalStatus): Promise<Goal> {
    return this.goalRepo.setStatus(goalId, status);
  }

  /**
   * 硬删除，用户主动要求的「删掉」。
   *
   * 外键保证不会连带删掉生活记录：moment_goals 级联删除（只是关联消失），
   * milestones 级联删除，plan_items.goalId / moments.goalId 置空。
   * Moment 本身一条都不动。
   *
   * PRD 说「Goal 不应因为暂停或放弃而消失」—— 那条路是「不再前往」（abandoned），
   * 它会留在轨迹里。删除是另一件事：用户明确不想让它存在，比如建错了。
   */
  async remove(goalId: string): Promise<void> {
    await this.goalRepo.remove(goalId);
  }
}
