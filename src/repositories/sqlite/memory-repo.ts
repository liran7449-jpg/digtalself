import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { memories } from "@/db/schema";
import type { Memory } from "@/domain/models";
import { MEMORY_TRANSITIONS, assertTransition } from "@/domain/transitions";
import type { MemoryStatus } from "@/domain/enums";
import type { MemoryRepository } from "../types";
import { firstOrThrow, newId } from "./helpers";

type Row = typeof memories.$inferSelect;

function toMemory(r: Row): Memory {
  return {
    id: r.id,
    content: r.content,
    category: "experience" as Memory["category"], // PostgreSQL schema 没有 category，默认值
    status: r.status as Memory["status"],
    sourceIds: r.sourceIds,
    confidence: r.confidence,
    importance: r.importance,
    userConfirmed: r.userConfirmed,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function createMemoryRepository(userId: string): MemoryRepository {
  /** 单条查询也要带 userId，否则状态流转能作用到别人的记忆上。 */
  async function findOne(id: string): Promise<Memory> {
    const rows = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, id), eq(memories.userId, userId)))
      .limit(1);
    return toMemory(firstOrThrow(rows, "Memory", id));
  }

  return {
    /** forgotten 不出现在用户视图里，但行还在，AI 侧要能查到。 */
    async listVisible(limit = 100) {
      const rows = await db
        .select()
        .from(memories)
        .where(
          and(eq(memories.userId, userId), inArray(memories.status, ["confirmed", "active"])),
        )
        .orderBy(desc(memories.importance), desc(memories.updatedAt))
        .limit(limit);
      return rows.map(toMemory);
    },

    async listByStatus(status: MemoryStatus) {
      const rows = await db
        .select()
        .from(memories)
        .where(and(eq(memories.userId, userId), eq(memories.status, status)))
        .orderBy(desc(memories.updatedAt));
      return rows.map(toMemory);
    },

    async findBySourceId(sourceId: string) {
      const rows = await db
        .select()
        .from(memories)
        .where(
          and(eq(memories.userId, userId), inArray(memories.status, ["confirmed", "active"])),
        );

      // sourceIds 是 JSON 数组，需要遍历查找
      const match = rows.find((r: Row) => r.sourceIds.includes(sourceId));
      return match ? toMemory(match) : null;
    },

    async create(input) {
      const rows = await db
        .insert(memories)
        .values({
          ...input,
          id: newId(),
          userId,
          // 如果 input 已有 userConfirmed=true，直接设为 confirmed；否则是 AI 推断的 candidate
          status: input.userConfirmed ? "confirmed" : "candidate",
        })
        .returning();
      return toMemory(rows[0]);
    },

    async confirm(id) {
      const current = await findOne(id);
      assertTransition("Memory", MEMORY_TRANSITIONS, current.status, "confirmed");
      const rows = await db
        .update(memories)
        .set({ status: "confirmed", userConfirmed: true })
        .where(and(eq(memories.id, id), eq(memories.userId, userId)))
        .returning();
      return toMemory(firstOrThrow(rows, "Memory", id));
    },

    /**
     * 软流转，不删行。AI 必须知道这条被用户否决过，
     * 否则下一轮会从同样的 Moment 重新推断出同一条记忆。
     */
    async forget(id) {
      const current = await findOne(id);
      assertTransition("Memory", MEMORY_TRANSITIONS, current.status, "forgotten");
      const rows = await db
        .update(memories)
        .set({ status: "forgotten" })
        .where(and(eq(memories.id, id), eq(memories.userId, userId)))
        .returning();
      return toMemory(firstOrThrow(rows, "Memory", id));
    },

    async updateContent(id, content) {
      const rows = await db
        .update(memories)
        .set({ content, userConfirmed: true })
        .where(and(eq(memories.id, id), eq(memories.userId, userId)))
        .returning();
      return toMemory(firstOrThrow(rows, "Memory", id));
    },
  };
}
