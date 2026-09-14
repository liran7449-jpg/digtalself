/**
 * PostgreSQL adapter for timestamp fields
 *
 * Drizzle-ORM 在 PostgreSQL 模式下有个 bug：
 * 即使传 Date 对象，它也会被序列化成数字，导致类型错误。
 *
 * 这个适配器在插入/更新前，将所有 Date 转为 ISO 字符串。
 */

const isPostgres = !!process.env.DATABASE_URL;

/**
 * 转换 Date 对象为 PostgreSQL 兼容的格式
 */
export function adaptTimestamp(date: Date): Date | string {
  if (!isPostgres) {
    return date;
  }
  // PostgreSQL 接受 ISO 8601 字符串
  return date.toISOString();
}

/**
 * 递归转换对象中的所有 Date 字段
 */
export function adaptTimestamps<T extends Record<string, any>>(obj: T): T {
  if (!isPostgres) {
    return obj;
  }

  const result = { ...obj };

  for (const key in result) {
    const value = result[key];
    if (value instanceof Date) {
      (result as any)[key] = value.toISOString();
    }
  }

  return result;
}
