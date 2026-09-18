import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { people, momentPeople } from "@/db/schema";
import type { Person } from "@/domain/models";
import type { PersonRepository } from "../types";
import { newId } from "./helpers";

/**
 * userId 在工厂里绑定一次，每个方法内部自己带上过滤。
 *
 * 注意 findByName / findOrCreate：必须按 (userId, name) 查，不能只按 name。
 * 只按 name 的话，两个用户各有一个「妈妈」时会串成同一条记录，
 * 于是 A 给妈妈写的备注出现在 B 的联系人里。
 */
export function createPersonRepository(userId: string): PersonRepository {
  return {
    async findById(id: string): Promise<Person | null> {
      const row = await db
        .select()
        .from(people)
        .where(and(eq(people.id, id), eq(people.userId, userId)))
        .then((rows) => rows[0]);
      return row ?? null;
    },

    async findByName(name: string): Promise<Person | null> {
      const row = await db
        .select()
        .from(people)
        .where(and(eq(people.name, name), eq(people.userId, userId)))
        .then((rows) => rows[0]);
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

      await db.insert(people).values({ ...newPerson, userId });
      return newPerson;
    },

    async list(): Promise<Person[]> {
      return db.select().from(people).where(eq(people.userId, userId)).orderBy(people.name);
    },

    /**
     * 关联查询也要带 userId。
     *
     * 光按 momentId 过滤看起来够了（moment 已经是自己的），但那依赖
     * 「调用方传进来的 momentId 一定属于自己」这个前提。多一个
     * people.userId 条件成本是零，换来的是不依赖调用方的正确性。
     */
    async listByMoment(momentId: string): Promise<Person[]> {
      const rows = await db
        .select({ people })
        .from(momentPeople)
        .innerJoin(people, eq(momentPeople.personId, people.id))
        .where(and(eq(momentPeople.momentId, momentId), eq(people.userId, userId)));

      return rows.map((r) => r.people);
    },

    /**
     * 一次取回多条 Moment 的人物，按 momentId 分组。
     *
     * 列表页原本每条 Moment 单独查一次，34 条就是 34 次往返，
     * 而连接池只有 10 条连接、要排队。批量版压成 1 次。
     *
     * 按名称排序：原来的单条查询没有 ORDER BY，Postgres 返回顺序不保证稳定。
     */
    async listByMoments(momentIds: string[]): Promise<Map<string, Person[]>> {
      const byMoment = new Map<string, Person[]>();
      // 空数组会让 inArray 生成非法 SQL，直接短路
      if (momentIds.length === 0) return byMoment;

      const rows = await db
        .select({ momentId: momentPeople.momentId, people })
        .from(momentPeople)
        .innerJoin(people, eq(momentPeople.personId, people.id))
        .where(and(inArray(momentPeople.momentId, momentIds), eq(people.userId, userId)))
        .orderBy(people.name);

      for (const r of rows) {
        const list = byMoment.get(r.momentId);
        if (list) list.push(r.people);
        else byMoment.set(r.momentId, [r.people]);
      }
      return byMoment;
    },

    async update(
      id: string,
      patch: Partial<Pick<Person, "name" | "notes">>,
    ): Promise<Person> {
      await db
        .update(people)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(people.id, id), eq(people.userId, userId)));

      const updated = await this.findById(id);
      if (!updated) throw new Error(`Person ${id} not found after update`);
      return updated;
    },
  };
}
