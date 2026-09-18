/**
 * POST /api/auth/change-password
 *
 * 改自己的密码。必须提供当前密码 —— 光有一个有效 session 不够：
 * 别人借用你没锁的电脑就能把密码改掉，把你自己锁在外面。
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userRepo } from "@/repositories";
import { clearMustChangePassword, getCurrentUserId } from "@/lib/session";

/** 最短密码长度。太短的密码让 bcrypt 也救不回来。 */
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "请填写当前密码和新密码" }, { status: 400 });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `新密码至少 ${MIN_PASSWORD_LENGTH} 位` },
        { status: 400 },
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "新密码不能和当前密码相同" }, { status: 400 });
    }

    // 用 session 里的 userId 反查用户名，再取凭据 —— 不接受前端传用户名，
    // 否则就能拿自己的 session 去改别人的密码
    const user = await userRepo.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    const creds = await userRepo.findCredentialsByUsername(user.username);
    if (!creds?.passwordHash) {
      return NextResponse.json({ error: "账号尚未设置密码" }, { status: 400 });
    }

    const ok = await bcrypt.compare(currentPassword, creds.passwordHash);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({ error: "当前密码错误" }, { status: 401 });
    }

    await userRepo.setPassword(userId, newPassword);

    // session 里的 mustChangePassword 也要清，否则 middleware 继续弹回改密页
    await clearMustChangePassword();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("改密码失败：", error);
    return NextResponse.json({ error: "改密码失败" }, { status: 500 });
  }
}
