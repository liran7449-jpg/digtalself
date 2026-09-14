/**
 * POST /api/auth/logout
 *
 * 登出：清除 Session
 */

import { NextResponse } from "next/server";
import { logout } from "@/lib/session";

export async function POST() {
  try {
    await logout();

    return NextResponse.json({
      success: true,
      message: "已登出",
    });
  } catch (error) {
    console.error("登出失败：", error);
    return NextResponse.json(
      { error: "登出失败" },
      { status: 500 }
    );
  }
}
