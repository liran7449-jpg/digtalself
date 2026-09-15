import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { people, momentPeople } from "@/db/schema";
import type { Person } from "@/domain/models";
import type { PersonRepository } from "../types";
import { newId } from "./helpers";

export function createPersonRepository(): PersonRepository {
  return {
    async findById(id: string): Promise<Person | null> {
      const row = await db.select().from(people).where(eq(people.id, id)).then(rows => rows[0]);
      return row ?? null;
    },

    async findByName(name: string): Promise<Person | null> {
      const row = await db.select().from(people).where(eq(people.name, name)).then(rows => rows[0]);
      return row ?? null;
    },

    async findOrCreate(name: string): Promise<Person> {
      const existing = await this.findByName(name);
      if (existing) return existing;

      const newPerson: Person = {
        id: newId(),
        name: name.trim(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(people).values(newPerson);
      return newPerson;
    },

    async list(): Promise<Person[]> {
      return db.select().from(people).orderBy(people.name);
    },

    async listByMoment(momentId: string): Promise<Person[]> {
      const rows = await db
        .select({ people })
        .from(momentPeople)
        .innerJoin(people, eq(momentPeople.personId, people.id))
        .where(eq(momentPeople.momentId, momentId))
        ;

      return rows.map((r) => r.people);
    },

    async update(
      id: string,
      patch: Partial<Pick<Person, "name" | "notes">>,
    ): Promise<Person> {
      await db
        .update(people)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(people.id, id))
        ;

      const updated = await this.findById(id);
      if (!updated) throw new Error(`Person ${id} not found after update`);
      return updated;
    },
  };
}
