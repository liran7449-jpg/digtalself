/**
 * POST /api/auth/login
 *
 * 简单密码认证：验证密码并设置 Session
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { login } from "@/lib/session";

// 从环境变量读取密码哈希
// 生成方法：node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "缺少密码" },
        { status: 400 }
      );
    }

    // 检查是否配置了密码
    if (!AUTH_PASSWORD_HASH) {
      console.error("❌ 错误：未配置 AUTH_PASSWORD_HASH 环境变量");
      return NextResponse.json(
        { error: "服务器配置错误" },
        { status: 500 }
      );
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, AUTH_PASSWORD_HASH);

    if (!isValid) {
      // 延迟返回，防止暴力破解
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }

    // 密码正确，设置会话
    // 单用户系统，固定 userId 为 'me'
    await login("me");

    return NextResponse.json({
      success: true,
      message: "登录成功",
    });
  } catch (error) {
    console.error("登录失败：", error);
    return NextResponse.json(
      { error: "登录失败" },
      { status: 500 }
    );
  }
}
