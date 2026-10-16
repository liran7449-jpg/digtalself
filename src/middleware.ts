/**
 * Next.js Middleware - 认证保护
 *
 * 保护所有路由，未登录自动跳转到 /login。
 * 同时负责刷新 session 的 lastSeenAt（空闲超时的滑动窗口）。
 *
 * 配置从 lib/session-options.ts 取，和 lib/session.ts 共用同一份。
 * 这个文件不能 import next/headers —— middleware 跑 edge runtime。
 */

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import {
  getSessionOptions,
  IDLE_TIMEOUT_MS,
  type SessionData,
} from "@/lib/session-options";

/**
 * 白名单：不需要认证的路径。
 *
 * 加进来之前先想清楚未登录的人能从这个端点看到什么。
 * 曾经有个 /api/debug-env 在这里，无条件返回完整的
 * AUTH_PASSWORD_HASH，等于把密码哈希挂在公网上给人离线爆破。
 * /api/health 只返回布尔值和时区，真正会写存储的自检要求已登录。
 */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

/** 已登录但必须改密码时，只允许访问这些路径。 */
const PASSWORD_CHANGE_PATHS = ["/change-password", "/api/auth/change-password", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(),
  );

  const idle =
    typeof session.lastSeenAt !== "number" ||
    Date.now() - session.lastSeenAt >= IDLE_TIMEOUT_MS;

  if (!session.isLoggedIn || idle) {
    // 超时的会话要清掉，否则 cookie 一直带着无效数据
    if (session.isLoggedIn) session.destroy();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /**
   * 拿临时密码登录的用户，除了改密码页哪都不能去。
   * 放在 middleware 而不是每个页面里判断 —— 漏一个页面就等于没有这条规则。
   */
  if (session.mustChangePassword && !PASSWORD_CHANGE_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  /**
   * 滑动窗口：每次请求都把 lastSeenAt 推到现在，
   * 所以「12 小时」是「12 小时没有任何活动」，不是「登录后 12 小时」。
   */
  session.lastSeenAt = Date.now();
  await session.save();

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Server Actions (处理大文件上传，有自己的 bodySizeLimit)
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico).*)",
  ],
};
