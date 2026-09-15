/**
 * PersonService: 管理 Person 与 Moment 的关联。
 *
 * 跨模块调用时走 Service，不直接操作 Repository。
 * 符合规范第 2 条：模块通过接口交流。
 */

import { repo } from "@/repositories";
import { db } from "@/db/client";
import { momentPeople, people } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Person } from "@/domain/models";

export const PersonService = {
  /**
   * 查找或创建 Person，然后关联到 Moment。
   */
  async linkToMoment(momentId: string, personName: string): Promise<Person> {
    const person = await repo.people.findOrCreate(personName.trim());

    // 检查是否已关联
    const existing = await db
      .select()
      .from(momentPeople)
      .where(
        and(
          eq(momentPeople.momentId, momentId),
          eq(momentPeople.personId, person.id),
        ),
      )
      .then(rows => rows[0]);

    if (!existing) {
      await db.insert(momentPeople).values({ momentId, personId: person.id });
    }

    return person;
  },

  /**
   * 取消 Person 与 Moment 的关联。
   */
  async unlinkFromMoment(momentId: string, personId: string): Promise<void> {
    await db
      .delete(momentPeople)
      .where(
        and(
          eq(momentPeople.momentId, momentId),
          eq(momentPeople.personId, personId),
        ),
      )
      ;
  },

  /**
   * 获取 Moment 关联的所有 Person。
   */
  async listByMoment(momentId: string): Promise<Person[]> {
    const rows = await db
      .select({ people })
      .from(momentPeople)
      .innerJoin(people, eq(momentPeople.personId, people.id))
      .where(eq(momentPeople.momentId, momentId))
      ;

    return rows.map((r) => r.people);
  },

  /**
   * 列出所有 Person（供自动补全）。
   */
  async list(): Promise<Person[]> {
    return repo.people.list();
  },
};
