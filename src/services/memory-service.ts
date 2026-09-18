/**
 * MemoryService: 管理 Memory 的创建与标记。
 *
 * 用户在 Moment Detail 点「Save as Memory」时，
 * 创建一条 Memory 记录，status='confirmed', userConfirmed=true。
 * 复用现有 memories 表，与 AI 推断的 Memory 统一管理。
 */

import { repoFor } from "@/repositories";
import type { Memory, Moment } from "@/domain/models";

export const MemoryService = {
  /**
   * 将 Moment 标记为 Memory。
   * 如果已标记过，返回现有 Memory；否则创建新的。
   */
  async markMomentAsMemory(userId: string, moment: Moment): Promise<Memory> {
    const repo = repoFor(userId);

    // 确认这条 moment 真的属于调用者 —— 入参是完整对象，
    // 里面没有 userId，不查一次就等于信任调用方
    const owned = await repo.moments.find(moment.id);
    if (!owned) {
      throw new Error(`Moment 不存在或不属于当前用户: ${moment.id}`);
    }

    // 检查是否已经标记过
    const existing = await repo.memories.findBySourceId(moment.id);
    if (existing) return existing;

    // 创建新 Memory
    return repo.memories.create({
      content: moment.content,
      category: "experience", // 用户手动标记的默认为 experience
      sourceIds: [moment.id],
      confidence: 1.0, // 用户手动标记，confidence 为 1
      importance: moment.importance,
      userConfirmed: true,
    });
  },

  /**
   * 取消 Moment 的 Memory 标记。
   * 调用 memories.forget() 软删除（状态改为 forgotten，不删行）。
   */
  async unmarkMomentAsMemory(userId: string, momentId: string): Promise<void> {
    const repo = repoFor(userId);
    // findBySourceId 已带 userId 过滤，别人的记忆在这里就是 null
    const memory = await repo.memories.findBySourceId(momentId);
    if (memory) {
      await repo.memories.forget(memory.id);
    }
  },

  /**
   * 检查 Moment 是否已标记为 Memory。
   */
  async isMomentMarkedAsMemory(userId: string, momentId: string): Promise<boolean> {
    const memory = await repoFor(userId).memories.findBySourceId(momentId);
    return memory !== null && memory.status === "confirmed";
  },
};
