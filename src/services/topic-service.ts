/**
 * TopicService: 管理 Topic 与 Moment 的关联。
 */

import { repo } from "@/repositories";
import { db } from "@/db/client";
import { momentTopics, topics } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Topic } from "@/domain/models";

export const TopicService = {
  async linkToMoment(momentId: string, topicName: string): Promise<Topic> {
    const topic = await repo.topics.findOrCreate(topicName.trim());

    const existing = await db
      .select()
      .from(momentTopics)
      .where(
        and(
          eq(momentTopics.momentId, momentId),
          eq(momentTopics.topicId, topic.id),
        ),
      )
      .get();

    if (!existing) {
      await db.insert(momentTopics).values({ momentId, topicId: topic.id }).run();
    }

    return topic;
  },

  async unlinkFromMoment(momentId: string, topicId: string): Promise<void> {
    await db
      .delete(momentTopics)
      .where(
        and(
          eq(momentTopics.momentId, momentId),
          eq(momentTopics.topicId, topicId),
        ),
      )
      .run();
  },

  async listByMoment(momentId: string): Promise<Topic[]> {
    const rows = await db
      .select({ topics })
      .from(momentTopics)
      .innerJoin(topics, eq(momentTopics.topicId, topics.id))
      .where(eq(momentTopics.momentId, momentId))
      .all();

    return rows.map((r) => r.topics);
  },

  async list(): Promise<Topic[]> {
    return repo.topics.list();
  },
};
