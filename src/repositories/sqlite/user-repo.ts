import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { User } from "@/domain/models";
import type { UserRepository } from "../types";
import { firstOrThrow, now } from "./helpers";

/** 单用户产品，固定主键。 */
export const SELF_ID = "me";

type Row = typeof users.$inferSelect;

function toUser(r: Row): User {
  return {
    id: r.id,
    name: r.name,
    avatarUrl: r.avatarUrl,
    bio: r.bio,
    occupation: r.occupation,
    location: r.location,
    interests: r.interests,
    values: r.values,
    currentFocus: r.currentFocus,
    onboardedAt: r.onboardedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export const sqliteUserRepo: UserRepository = {
  async getOrCreate() {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, SELF_ID))
      .limit(1);
    if (existing[0]) return toUser(existing[0]);

    const rows = await db
      .insert(users)
      .values({ id: SELF_ID })
      .onConflictDoNothing()
      .returning();
    if (rows[0]) return toUser(rows[0]);

    const after = await db
      .select()
      .from(users)
      .where(eq(users.id, SELF_ID))
      .limit(1);
    return toUser(firstOrThrow(after, "User", SELF_ID));
  },

  async update(patch) {
    await this.getOrCreate();
    const rows = await db
      .update(users)
      .set({ ...patch, updatedAt: now() })
      .where(eq(users.id, SELF_ID))
      .returning();
    return toUser(firstOrThrow(rows, "User", SELF_ID));
  },
};
