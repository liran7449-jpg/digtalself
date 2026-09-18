import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  days,
  goals,
  insights,
  memories,
  moments,
  planItems,
} from "@/db/schema";
import type { ExportRepository } from "../types";
import { sqliteUserRepo } from "./user-repo";

export const SCHEMA_VERSION = 1;

/**
 * 全量 JSON 导出。PRD 第 31 节把「用户可以看到全部数据」列为 P0 信任基础，
 * 从第一天就做，不等后面补。包含 forgotten 的 memory —— 用户有权看到全部。
 */
export function createExportRepository(userId: string): ExportRepository {
  return {
    /**
     * 每一条查询都带 userId —— 导出是最危险的路径，漏一个 where
     * 就是把所有人的日记打包交出去。
     */
    async exportAll() {
      const [user, dayRows, planRows, momentRows, goalRows, memRows, insRows] =
        await Promise.all([
          sqliteUserRepo.findById(userId),
          db.select().from(days).where(eq(days.userId, userId)).orderBy(asc(days.date)),
          db
            .select()
            .from(planItems)
            .where(eq(planItems.userId, userId))
            .orderBy(asc(planItems.date)),
          db
            .select()
            .from(moments)
            .where(eq(moments.userId, userId))
            .orderBy(asc(moments.occurredAt)),
          db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.createdAt)),
          db
            .select()
            .from(memories)
            .where(eq(memories.userId, userId))
            .orderBy(asc(memories.createdAt)),
          db
            .select()
            .from(insights)
            .where(eq(insights.userId, userId))
            .orderBy(asc(insights.createdAt)),
        ]);

      if (!user) {
        throw new Error(`导出失败：用户 ${userId} 不存在`);
      }

      return {
        exportedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        user,
        days: dayRows as never,
        planItems: planRows as never,
        moments: momentRows as never,
        goals: goalRows as never,
        memories: memRows as never,
        insights: insRows as never,
      };
    },
  };
}
