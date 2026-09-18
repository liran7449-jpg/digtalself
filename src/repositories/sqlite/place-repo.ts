import { eq, inArray } from "drizzle-orm";
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

    /**
     * 一次取回多条 Moment 的地点，按 momentId 分组。
     *
     * 列表页原本每条 Moment 单独查一次，34 条就是 34 次往返，
     * 而连接池只有 10 条连接、要排队。批量版压成 1 次。
     *
     * 按名称排序：原来的单条查询没有 ORDER BY，Postgres 返回顺序不保证稳定。
     */
    async listByMoments(momentIds: string[]): Promise<Map<string, Place[]>> {
      const byMoment = new Map<string, Place[]>();
      // 空数组会让 inArray 生成非法 SQL，直接短路
      if (momentIds.length === 0) return byMoment;

      const rows = await db
        .select({ momentId: momentPlaces.momentId, places })
        .from(momentPlaces)
        .innerJoin(places, eq(momentPlaces.placeId, places.id))
        .where(inArray(momentPlaces.momentId, momentIds))
        .orderBy(places.name);

      for (const r of rows) {
        const list = byMoment.get(r.momentId);
        if (list) list.push(r.places);
        else byMoment.set(r.momentId, [r.places]);
      }
      return byMoment;
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
