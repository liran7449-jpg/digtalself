/**
 * Session 管理（服务端）。
 *
 * 配置在 session-options.ts，middleware 共用同一份 —— 不要在这里
 * 复制一份 cookieOptions，两边漂移过一次。
 */

import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  getSessionOptions,
  IDLE_TIMEOUT_MS,
  type SessionData,
} from "./session-options";

export type { SessionData };

/**
 * 获取当前会话。
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

/**
 * 会话是否有效：已登录 + 未空闲超时。
 *
 * 单独抽出来是因为 middleware 也要用同一套判断，
 * 两处分别实现必然漂移。
 */
export function isSessionValid(session: {
  isLoggedIn?: boolean;
  lastSeenAt?: number;
}): boolean {
  if (!session.isLoggedIn) return false;
  // 旧 session 没有 lastSeenAt，当作过期，让用户重新登录一次
  if (typeof session.lastSeenAt !== "number") return false;
  return Date.now() - session.lastSeenAt < IDLE_TIMEOUT_MS;
}

/**
 * 获取当前登录用户 ID。
 *
 * ⚠️ 这是数据隔离的根。返回 null 意味着未登录，调用方必须拒绝服务，
 * 绝不能 fallback 到某个默认用户 —— 那等于把别人的数据端出去。
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return isSessionValid(session) ? (session.userId ?? null) : null;
}

/**
 * 取当前用户 id，未登录直接抛错。
 *
 * 给 Server Component / Server Action 用：那些地方拿不到用户就没法
 * 继续，与其层层判空不如在入口炸掉。middleware 已经挡了未登录请求，
 * 走到这里还没有用户说明有 bug，不该静默处理。
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("未登录：requireUserId 拿不到用户。middleware 应该已经拦下这个请求。");
  }
  return userId;
}

/**
 * 检查是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return isSessionValid(session);
}

/**
 * 登录：设置会话
 */
export async function login(
  userId: string,
  opts: { mustChangePassword?: boolean } = {},
): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  session.isLoggedIn = true;
  session.lastSeenAt = Date.now();
  session.mustChangePassword = opts.mustChangePassword ?? false;
  await session.save();
}

/**
 * 改密码成功后清掉 mustChangePassword 标记。
 *
 * 必须重写 session，否则 middleware 会一直把用户弹回改密码页 ——
 * 那个判断读的是 session 而不是数据库（edge runtime 连不了库）。
 */
export async function clearMustChangePassword(): Promise<void> {
  const session = await getSession();
  session.mustChangePassword = false;
  session.lastSeenAt = Date.now();
  await session.save();
}

/**
 * 登出：清除会话
 */
export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
