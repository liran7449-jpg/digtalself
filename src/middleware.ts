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

  // 白名单：不需要认证的路径
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/debug-env",
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
