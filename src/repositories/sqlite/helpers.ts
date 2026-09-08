import { ulid } from "ulid";

/** ULID：按生成时间字典序可排序，省一个 created_at 索引。 */
export function newId(): string {
  return ulid();
}

export function now(): Date {
  return new Date();
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} 不存在: ${id}`);
    this.name = "NotFoundError";
  }
}

/** Drizzle 的 returning() 返回数组，取第一行并断言存在。 */
export function firstOrThrow<T>(rows: T[], entity: string, id: string): T {
  const row = rows[0];
  if (!row) throw new NotFoundError(entity, id);
  return row;
}
