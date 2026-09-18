/**
 * Repository 单一入口。
 *
 * 多用户下不再有全局 `repo` 单例 —— 每个 repository 实例都绑定一个
 * userId，实例本身只能看到那个用户的数据。这样「忘记过滤」的失败模式
 * 从「静默泄露别人的数据」变成「拿不到 repo 实例」，后者会立刻报错。
 *
 * 两个入口：
 * - getRepo()：给页面 / Server Action 用，从当前 session 取用户
 * - repoFor(userId)：给脚本、迁移工具、测试用，显式指定用户
 *
 * 换存储实现时只改这个文件。
 */

import type { Repositories } from "./types";
import { sqliteUserRepo } from "./sqlite/user-repo";
import { createDayRepository } from "./sqlite/day-repo";
import { createPlanRepository } from "./sqlite/plan-repo";
import { createMomentRepository } from "./sqlite/moment-repo";
import { createGoalRepository } from "./sqlite/goal-repo";
import { createMemoryRepository } from "./sqlite/memory-repo";
import { createInsightRepository } from "./sqlite/insight-repo";
import { createExportRepository } from "./sqlite/export-repo";
import { createPersonRepository } from "./sqlite/person-repo";
import { createPlaceRepository } from "./sqlite/place-repo";
import { createTopicRepository } from "./sqlite/topic-repo";
import { createMediaRepository } from "./sqlite/media-repo";
import { createGrowthEvidenceRepository } from "./sqlite/growth-evidence-repo";

/**
 * 用户表 repository，不绑定 userId。
 *
 * 认证流程要用它，而那时候还不知道用户是谁（正要按用户名查出来）。
 * 所以它是唯一不按 userId 过滤的 repository，方法都显式收 id 参数。
 * 只有 /api/auth/* 和管理脚本该直接 import 它。
 */
export const userRepo = sqliteUserRepo;

/**
 * 构造绑定到某个用户的 repository 集合。
 *
 * users 是唯一的例外：它不按 userId 过滤，因为登录时还不知道是谁
 * （要先按用户名查出来）。它的方法都显式收 id 参数。
 */
export function repoFor(userId: string): Repositories {
  if (!userId) {
    throw new Error("repoFor 需要 userId。空值意味着调用方没拿到登录用户，不能继续。");
  }
  return {
    users: sqliteUserRepo,
    days: createDayRepository(userId),
    plans: createPlanRepository(userId),
    moments: createMomentRepository(userId),
    goals: createGoalRepository(userId),
    memories: createMemoryRepository(userId),
    insights: createInsightRepository(userId),
    people: createPersonRepository(userId),
    places: createPlaceRepository(userId),
    topics: createTopicRepository(userId),
    media: createMediaRepository(userId),
    growthEvidences: createGrowthEvidenceRepository(userId),
    exports: createExportRepository(userId),
  };
}

/**
 * 取当前登录用户的 repository 集合。
 *
 * 未登录直接抛错，绝不 fallback 到某个默认用户 —— 那正是
 * 「把别人的数据端出去」的经典写法。middleware 已经挡了未登录请求，
 * 走到这里还没有用户说明有 bug。
 *
 * 只能在 Server Component / Server Action / Route Handler 里调用
 * （依赖 next/headers 读 cookie）。
 */
export async function getRepo(): Promise<Repositories> {
  const { requireUserId } = await import("@/lib/session");
  return repoFor(await requireUserId());
}

export type { Repositories } from "./types";
