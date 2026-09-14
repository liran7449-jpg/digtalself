/**
 * Session 管理
 *
 * 使用 iron-session 提供安全的 Cookie-based 会话管理
 */

import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  isLoggedIn: boolean;
}

const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_for_security",
  cookieName: "digital_self_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: "/",
  },
};

/**
 * 获取当前会话
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

/**
 * 获取当前登录用户 ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session.isLoggedIn ? (session.userId ?? null) : null;
}

/**
 * 检查是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}

/**
 * 登录：设置会话
 */
export async function login(userId: string): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  session.isLoggedIn = true;
  await session.save();
}

/**
 * 登出：清除会话
 */
export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
