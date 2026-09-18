/**
 * Session 配置的唯一来源。
 *
 * 为什么单独一个文件：middleware 和 lib/session.ts 都需要这份配置，
 * 但 middleware 跑在 edge runtime，不能 import next/headers。
 * 配置抽在这里两边都能用，也避免了「改一处漏一处」——
 * 之前两个文件各写了一份 maxAge，改密码有效期时很容易只改一半。
 */

import type { SessionOptions } from "iron-session";

/**
 * Session 加密密钥。
 *
 * 没有 fallback 是故意的。之前这里有个硬编码的默认值，
 * 一旦生产环境忘配 SESSION_SECRET 就会静默使用那个公开在代码里的
 * 字符串，任何人都能伪造 session cookie 登进来。
 * 宁可启动就崩，也不要带着可伪造的会话跑在线上。
 */
function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET 未设置或短于 32 字符。\n" +
        "这是 session cookie 的加密密钥，缺失会导致会话可被伪造。\n" +
        "生成：node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return secret;
}

export interface SessionData {
  /** 登录用户的 id。多用户下这是数据隔离的依据，不能写死。 */
  userId: string;
  isLoggedIn: boolean;
  /**
   * 上次活动时间戳（毫秒）。用于空闲超时，见 IDLE_TIMEOUT_MS。
   * 旧 session 没有这个字段，判断时当作「已过期」处理。
   */
  lastSeenAt?: number;
  /**
   * 拿临时密码登录、还没改过密码。
   *
   * 存在 session 里而不是每次查库：middleware 在 edge runtime 跑，
   * 连不了数据库。登录时写入，改密码成功后重写 session 清掉。
   */
  mustChangePassword?: boolean;
}

export const SESSION_COOKIE_NAME = "digital_self_session";

export function getSessionOptions(): SessionOptions {
  return {
    password: requireSessionSecret(),
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      /**
       * 显式 undefined = 会话 cookie：不写 maxAge / expires，
       * 浏览器进程退出就丢弃。iron-session 9 见到显式 undefined
       * 会把 ttl 设为 0（见 iron-session/dist/index.js 的 getSessionConfig）。
       *
       * 之前是 30 天持久 cookie，所以「只要这个浏览器登录过就自动进去」。
       * 改成会话 cookie 后关掉浏览器就要重新输密码。
       *
       * ⚠️ 会话 cookie 不是可靠的登出：Chrome 的「继续浏览上次打开的
       * 网页」会恢复它，Mac 上点红叉不等于退出进程，手机切后台更不算。
       * 所以真正可靠的是显式登出按钮 + 下面的空闲超时，
       * 会话 cookie 只是兜底。
       */
      maxAge: undefined,
      path: "/",
    },
  };
}

/**
 * 空闲超时：多久没活动就要求重新登录。
 *
 * ttl=0 让 seal 本身永不过期，cookie 值被抄走就永久有效。
 * 这个超时补上那个洞，也提供「离开一会儿就掉线」的行为。
 */
export const IDLE_TIMEOUT_MS = 1000 * 60 * 60 * 12; // 12 小时
