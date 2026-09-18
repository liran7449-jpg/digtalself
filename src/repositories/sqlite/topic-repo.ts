import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { topics, momentTopics } from "@/db/schema";
import type { Topic } from "@/domain/models";
import type { TopicRepository } from "../types";
import { newId } from "./helpers";

export function createTopicRepository(): TopicRepository {
  return {
    async findById(id: string): Promise<Topic | null> {
      const row = await db.select().from(topics).where(eq(topics.id, id)).then(rows => rows[0]);
      return row ?? null;
    },

    async findByName(name: string): Promise<Topic | null> {
      const row = await db.select().from(topics).where(eq(topics.name, name)).then(rows => rows[0]);
      return row ?? null;
    },

    async findOrCreate(name: string): Promise<Topic> {
      const existing = await this.findByName(name);
      if (existing) return existing;

      const newTopic: Topic = {
        id: newId(),
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(topics).values(newTopic);
      return newTopic;
    },

    async list(): Promise<Topic[]> {
      return db.select().from(topics).orderBy(topics.name);
    },

    async listByMoment(momentId: string): Promise<Topic[]> {
      const rows = await db
        .select({ topics })
        .from(momentTopics)
        .innerJoin(topics, eq(momentTopics.topicId, topics.id))
        .where(eq(momentTopics.momentId, momentId))
        ;

      return rows.map((r) => r.topics);
    },

    /**
     * 一次取回多条 Moment 的话题，按 momentId 分组。
     *
     * 列表页原本每条 Moment 单独查一次，34 条就是 34 次往返，
     * 而连接池只有 10 条连接、要排队。批量版压成 1 次。
     *
     * 按名称排序：原来的单条查询没有 ORDER BY，Postgres 返回顺序不保证稳定，
     * 同一条记录两次刷新可能标签顺序不同。这里定下来。
     */
    async listByMoments(momentIds: string[]): Promise<Map<string, Topic[]>> {
      const byMoment = new Map<string, Topic[]>();
      // 空数组会让 inArray 生成非法 SQL，直接短路
      if (momentIds.length === 0) return byMoment;

      const rows = await db
        .select({ momentId: momentTopics.momentId, topics })
        .from(momentTopics)
        .innerJoin(topics, eq(momentTopics.topicId, topics.id))
        .where(inArray(momentTopics.momentId, momentIds))
        .orderBy(topics.name);

      for (const r of rows) {
        const list = byMoment.get(r.momentId);
        if (list) list.push(r.topics);
        else byMoment.set(r.momentId, [r.topics]);
      }
      return byMoment;
    },
  };
}
