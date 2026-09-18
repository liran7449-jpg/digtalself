/**
 * Next.js Middleware - 认证保护
 *
 * 保护所有路由，未登录自动跳转到 /login
 */

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_for_security",
  cookieName: "digital_self_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * 白名单：不需要认证的路径。
   *
   * 加进来之前先想清楚未登录的人能从这个端点看到什么。
   * 曾经有个 /api/debug-env 在这里，无条件返回完整的
   * AUTH_PASSWORD_HASH，等于把密码哈希挂在公网上给人离线爆破。
   * /api/health 只返回布尔值和时区，真正会写存储的自检要求已登录。
   */
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/health",
    "/_next",
    "/favicon.ico",
  ];

  // 检查是否是公开路径
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 检查会话
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, SESSION_OPTIONS);

  // 未登录，跳转到登录页
  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录，允许访问
  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
