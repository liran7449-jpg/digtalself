import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { places, momentPlaces } from "@/db/schema";
import type { Place } from "@/domain/models";
import type { PlaceRepository } from "../types";
import { newId } from "./helpers";

export function createPlaceRepository(): PlaceRepository {
  return {
    async findById(id: string): Promise<Place | null> {
      const row = await db.select().from(places).where(eq(places.id, id)).then(rows => rows[0]);
      return row ?? null;
    },

    async findByName(name: string): Promise<Place | null> {
      const row = await db.select().from(places).where(eq(places.name, name)).then(rows => rows[0]);
      return row ?? null;
    },

    async findOrCreate(name: string): Promise<Place> {
      const existing = await this.findByName(name);
      if (existing) return existing;

      const newPlace: Place = {
        id: newId(),
        name: name.trim(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(places).values(newPlace);
      return newPlace;
    },

    async list(): Promise<Place[]> {
      return db.select().from(places).orderBy(places.name);
    },

    async listByMoment(momentId: string): Promise<Place[]> {
      const rows = await db
        .select({ places })
        .from(momentPlaces)
        .innerJoin(places, eq(momentPlaces.placeId, places.id))
        .where(eq(momentPlaces.momentId, momentId))
        ;

      return rows.map((r) => r.places);
    },

    async update(
      id: string,
      patch: Partial<Pick<Place, "name" | "notes">>,
    ): Promise<Place> {
      await db
        .update(places)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(places.id, id))
        ;

      const updated = await this.findById(id);
      if (!updated) throw new Error(`Place ${id} not found after update`);
      return updated;
    },
  };
}
