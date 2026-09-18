import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { User } from "@/domain/models";
import type { UserCredentials, UserRepository } from "../types";
import { firstOrThrow, newId } from "./helpers";

/**
 * 首位用户的 id。历史数据（迁移前的全部 moment / photo）都归属这个 id。
 *
 * 保留 'me' 这个字面值是为了不动已有的 57 条生产数据 —— 改成 ULID
 * 就要 UPDATE 全部 11 张表的 user_id，没有收益只有风险。
 * 新用户一律用 ULID。
 */
export const SELF_ID = "me";

/** bcrypt 轮数。10 是 2026 年的常规选择，登录约 100ms。 */
const BCRYPT_ROUNDS = 10;

type Row = typeof users.$inferSelect;

function toUser(r: Row): User {
  return {
    id: r.id,
    username: r.username,
    mustChangePassword: r.mustChangePassword,
    name: r.name,
    birthday: r.birthday,
    birthdayNote: r.birthdayNote,
    avatarUrl: r.avatarUrl,
    bio: r.bio,
    occupation: r.occupation,
    location: r.location,
    interests: [],
    values: [],
    currentFocus: null,
    onboardedAt: null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export const sqliteUserRepo: UserRepository = {
  async findById(id) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? toUser(rows[0]) : null;
  },

  async getOrCreate(id, username) {
    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existing[0]) return toUser(existing[0]);

    const rows = await db
      .insert(users)
      .values({ id, username })
      .onConflictDoNothing()
      .returning();
    if (rows[0]) return toUser(rows[0]);

    // 并发下 onConflictDoNothing 会返回空，再查一次
    const after = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return toUser(firstOrThrow(after, "User", id));
  },

  async update(id, patch) {
    const rows = await db
      .update(users)
      .set({ ...patch })
      .where(eq(users.id, id))
      .returning();
    return toUser(firstOrThrow(rows, "User", id));
  },

  // ---- 认证 ----

  /**
   * 按用户名取认证信息。
   *
   * 只 select 认证需要的 4 个列，不把整行捞出来 —— 减少哈希被顺手
   * 传进 UI 的机会。返回类型 UserCredentials 也和 User 是分开的。
   */
  async findCredentialsByUsername(username): Promise<UserCredentials | null> {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return rows[0] ?? null;
  },

  async create({ username, password, name, birthday, mustChangePassword = false }) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const rows = await db
      .insert(users)
      .values({
        id: newId(),
        username,
        passwordHash,
        mustChangePassword,
        name: name ?? null,
        birthday: birthday ?? null,
      })
      .returning();
    return toUser(firstOrThrow(rows, "User", username));
  },

  async setPassword(id, password) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    // 改完密码就不再是临时密码了，两件事必须一起提交
    await db
      .update(users)
      .set({ passwordHash, mustChangePassword: false })
      .where(eq(users.id, id));
  },

  async listAll() {
    const rows = await db.select().from(users).orderBy(asc(users.createdAt));
    return rows.map(toUser);
  },
};
