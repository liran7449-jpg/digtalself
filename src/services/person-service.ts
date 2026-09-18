/**
 * PersonService: 管理 Person 与 Moment 的关联。
 *
 * 跨模块调用时走 Service，不直接操作 Repository。
 * 符合规范第 2 条：模块通过接口交流。
 *
 * 每个方法都收 userId：关联表（moment_people）本身没有 user_id 列，
 * 归属靠两端的 moment 和 person 决定。所以写之前必须确认这条 moment
 * 真的属于调用者，否则拿到别人的 momentId 就能往里塞关联。
 */

import { repoFor } from "@/repositories";
import { db } from "@/db/client";
import { momentPeople } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Person } from "@/domain/models";

/**
 * 确认 moment 属于这个用户，不属于就抛。
 *
 * repo.moments.find 已经带 userId 过滤，所以「别人的 moment」
 * 在这里表现为 null。
 */
async function assertOwnsMoment(userId: string, momentId: string): Promise<void> {
  const moment = await repoFor(userId).moments.find(momentId);
  if (!moment) {
    throw new Error(`Moment 不存在或不属于当前用户: ${momentId}`);
  }
}

export const PersonService = {
  /**
   * 查找或创建 Person，然后关联到 Moment。
   */
  async linkToMoment(
    userId: string,
    momentId: string,
    personName: string,
  ): Promise<Person> {
    await assertOwnsMoment(userId, momentId);
    const person = await repoFor(userId).people.findOrCreate(personName.trim());

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
      .then((rows) => rows[0]);

    if (!existing) {
      await db.insert(momentPeople).values({ momentId, personId: person.id });
    }

    return person;
  },

  /**
   * 取消 Person 与 Moment 的关联。
   */
  async unlinkFromMoment(
    userId: string,
    momentId: string,
    personId: string,
  ): Promise<void> {
    await assertOwnsMoment(userId, momentId);
    await db
      .delete(momentPeople)
      .where(
        and(
          eq(momentPeople.momentId, momentId),
          eq(momentPeople.personId, personId),
        ),
      );
  },

  /**
   * 获取 Moment 关联的所有 Person。
   *
   * 走 repo 而不是自己 join —— repo 那份带 people.userId 过滤。
   */
  async listByMoment(userId: string, momentId: string): Promise<Person[]> {
    return repoFor(userId).people.listByMoment(momentId);
  },

  /**
   * 列出所有 Person（供自动补全）。
   */
  async list(userId: string): Promise<Person[]> {
    return repoFor(userId).people.list();
  },
};
