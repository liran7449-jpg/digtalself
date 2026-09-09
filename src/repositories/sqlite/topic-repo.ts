import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { topics, momentTopics } from "@/db/schema";
import type { Topic } from "@/domain/models";
import type { TopicRepository } from "../types";
import { newId } from "./helpers";

export function createTopicRepository(): TopicRepository {
  return {
    async findById(id: string): Promise<Topic | null> {
      const row = await db.select().from(topics).where(eq(topics.id, id)).get();
      return row ?? null;
    },

    async findByName(name: string): Promise<Topic | null> {
      const row = await db.select().from(topics).where(eq(topics.name, name)).get();
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

      await db.insert(topics).values(newTopic).run();
      return newTopic;
    },

    async list(): Promise<Topic[]> {
      return db.select().from(topics).orderBy(topics.name).all();
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
  };
}
