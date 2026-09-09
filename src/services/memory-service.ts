/**
 * MemoryService: 管理 Memory 的创建与标记。
 *
 * 用户在 Moment Detail 点「Save as Memory」时，
 * 创建一条 Memory 记录，status='confirmed', userConfirmed=true。
 * 复用现有 memories 表，与 AI 推断的 Memory 统一管理。
 */

import { repo } from "@/repositories";
import type { Memory, Moment } from "@/domain/models";

export const MemoryService = {
  /**
   * 将 Moment 标记为 Memory。
   * 如果已标记过，返回现有 Memory；否则创建新的。
   */
  async markMomentAsMemory(moment: Moment): Promise<Memory> {
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
  async unmarkMomentAsMemory(momentId: string): Promise<void> {
    const memory = await repo.memories.findBySourceId(momentId);
    if (memory) {
      await repo.memories.forget(memory.id);
    }
  },

  /**
   * 检查 Moment 是否已标记为 Memory。
   */
  async isMomentMarkedAsMemory(momentId: string): Promise<boolean> {
    const memory = await repo.memories.findBySourceId(momentId);
    return memory !== null && memory.status === "confirmed";
  },
};
