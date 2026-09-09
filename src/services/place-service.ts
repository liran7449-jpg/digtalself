/**
 * PlaceService: 管理 Place 与 Moment 的关联。
 */

import { repo } from "@/repositories";
import { db } from "@/db/client";
import { momentPlaces, places } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Place } from "@/domain/models";

export const PlaceService = {
  async linkToMoment(momentId: string, placeName: string): Promise<Place> {
    const place = await repo.places.findOrCreate(placeName.trim());

    const existing = await db
      .select()
      .from(momentPlaces)
      .where(
        and(
          eq(momentPlaces.momentId, momentId),
          eq(momentPlaces.placeId, place.id),
        ),
      )
      .get();

    if (!existing) {
      await db.insert(momentPlaces).values({ momentId, placeId: place.id }).run();
    }

    return place;
  },

  async unlinkFromMoment(momentId: string, placeId: string): Promise<void> {
    await db
      .delete(momentPlaces)
      .where(
        and(
          eq(momentPlaces.momentId, momentId),
          eq(momentPlaces.placeId, placeId),
        ),
      )
      .run();
  },

  async listByMoment(momentId: string): Promise<Place[]> {
    const rows = await db
      .select({ places })
      .from(momentPlaces)
      .innerJoin(places, eq(momentPlaces.placeId, places.id))
      .where(eq(momentPlaces.momentId, momentId))
      .all();

    return rows.map((r) => r.places);
  },

  async list(): Promise<Place[]> {
    return repo.places.list();
  },
};
