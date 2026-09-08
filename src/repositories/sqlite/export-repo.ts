import { asc } from "drizzle-orm";
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
export const sqliteExportRepo: ExportRepository = {
  async exportAll() {
    const [user, dayRows, planRows, momentRows, goalRows, memRows, insRows] =
      await Promise.all([
        sqliteUserRepo.getOrCreate(),
        db.select().from(days).orderBy(asc(days.date)),
        db.select().from(planItems).orderBy(asc(planItems.date)),
        db.select().from(moments).orderBy(asc(moments.occurredAt)),
        db.select().from(goals).orderBy(asc(goals.createdAt)),
        db.select().from(memories).orderBy(asc(memories.createdAt)),
        db.select().from(insights).orderBy(asc(insights.createdAt)),
      ]);

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
