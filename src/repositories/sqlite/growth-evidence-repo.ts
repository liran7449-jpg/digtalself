import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { growthEvidences } from "@/db/schema";
import type { GrowthEvidence } from "@/domain/models";
import type { GrowthEvidenceRepository } from "../types";
import { newId } from "./helpers";

export function createGrowthEvidenceRepository(): GrowthEvidenceRepository {
  return {
    async findById(id: string): Promise<GrowthEvidence | null> {
      const row = await db
        .select()
        .from(growthEvidences)
        .where(eq(growthEvidences.id, id))
        .get();
      return row ?? null;
    },

    async list(): Promise<GrowthEvidence[]> {
      return db
        .select()
        .from(growthEvidences)
        .orderBy(growthEvidences.markedAt)
        .all();
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

      await db.insert(growthEvidences).values(evidence).run();
      return evidence;
    },
  };
}
