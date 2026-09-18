import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { growthEvidences } from "@/db/schema";
import type { GrowthEvidence } from "@/domain/models";
import type { GrowthEvidenceRepository } from "../types";
import { newId } from "./helpers";

/**
 * userId 在工厂里绑定一次，每个方法内部自己带上过滤 ——
 * 调用方拿到的实例天生只能看到这个用户的数据。
 */
export function createGrowthEvidenceRepository(userId: string): GrowthEvidenceRepository {
  return {
    async findById(id: string): Promise<GrowthEvidence | null> {
      const row = await db
        .select()
        .from(growthEvidences)
        .where(and(eq(growthEvidences.id, id), eq(growthEvidences.userId, userId)))
        .then((rows) => rows[0]);
      return row ?? null;
    },

    async list(): Promise<GrowthEvidence[]> {
      return db
        .select()
        .from(growthEvidences)
        .where(eq(growthEvidences.userId, userId))
        .orderBy(growthEvidences.markedAt);
    },

    async create(
      input: Omit<GrowthEvidence, "id" | "createdAt" | "updatedAt">,
    ): Promise<GrowthEvidence> {
      const evidence: GrowthEvidence = {
        id: newId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(growthEvidences).values({ ...evidence, userId });
      return evidence;
    },
  };
}
