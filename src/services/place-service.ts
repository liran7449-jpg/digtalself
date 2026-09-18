/**
 * PlaceService: 管理 Place 与 Moment 的关联。
 *
 * 每个方法都收 userId：关联表（moment_places）没有 user_id 列，
 * 归属靠两端决定。写之前必须确认 moment 属于调用者。
 */

import { repoFor } from "@/repositories";
import { db } from "@/db/client";
import { momentPlaces } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Place } from "@/domain/models";

async function assertOwnsMoment(userId: string, momentId: string): Promise<void> {
  const moment = await repoFor(userId).moments.find(momentId);
  if (!moment) {
    throw new Error(`Moment 不存在或不属于当前用户: ${momentId}`);
  }
}

export const PlaceService = {
  async linkToMoment(
    userId: string,
    momentId: string,
    placeName: string,
  ): Promise<Place> {
    await assertOwnsMoment(userId, momentId);
    const place = await repoFor(userId).places.findOrCreate(placeName.trim());

    const existing = await db
      .select()
      .from(momentPlaces)
      .where(
        and(
          eq(momentPlaces.momentId, momentId),
          eq(momentPlaces.placeId, place.id),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      await db.insert(momentPlaces).values({ momentId, placeId: place.id });
    }

    return place;
  },

  async unlinkFromMoment(
    userId: string,
    momentId: string,
    placeId: string,
  ): Promise<void> {
    await assertOwnsMoment(userId, momentId);
    await db
      .delete(momentPlaces)
      .where(
        and(
          eq(momentPlaces.momentId, momentId),
          eq(momentPlaces.placeId, placeId),
        ),
      );
  },

  /** 走 repo 而不是自己 join —— repo 那份带 places.userId 过滤。 */
  async listByMoment(userId: string, momentId: string): Promise<Place[]> {
    return repoFor(userId).places.listByMoment(momentId);
  },

  async list(userId: string): Promise<Place[]> {
    return repoFor(userId).places.list();
  },
};
