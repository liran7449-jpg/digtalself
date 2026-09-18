/**
 * TopicService: 管理 Topic 与 Moment 的关联。
 *
 * 每个方法都收 userId：关联表（moment_topics）没有 user_id 列，
 * 归属靠两端决定。写之前必须确认 moment 属于调用者。
 */

import { repoFor } from "@/repositories";
import { db } from "@/db/client";
import { momentTopics } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Topic } from "@/domain/models";

async function assertOwnsMoment(userId: string, momentId: string): Promise<void> {
  const moment = await repoFor(userId).moments.find(momentId);
  if (!moment) {
    throw new Error(`Moment 不存在或不属于当前用户: ${momentId}`);
  }
}

export const TopicService = {
  async linkToMoment(
    userId: string,
    momentId: string,
    topicName: string,
  ): Promise<Topic> {
    await assertOwnsMoment(userId, momentId);
    const topic = await repoFor(userId).topics.findOrCreate(topicName.trim());

    const existing = await db
      .select()
      .from(momentTopics)
      .where(
        and(
          eq(momentTopics.momentId, momentId),
          eq(momentTopics.topicId, topic.id),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      await db.insert(momentTopics).values({ momentId, topicId: topic.id });
    }

    return topic;
  },

  async unlinkFromMoment(
    userId: string,
    momentId: string,
    topicId: string,
  ): Promise<void> {
    await assertOwnsMoment(userId, momentId);
    await db
      .delete(momentTopics)
      .where(
        and(
          eq(momentTopics.momentId, momentId),
          eq(momentTopics.topicId, topicId),
        ),
      );
  },

  /** 走 repo 而不是自己 join —— repo 那份带 topics.userId 过滤。 */
  async listByMoment(userId: string, momentId: string): Promise<Topic[]> {
    return repoFor(userId).topics.listByMoment(momentId);
  },

  async list(userId: string): Promise<Topic[]> {
    return repoFor(userId).topics.list();
  },
};
