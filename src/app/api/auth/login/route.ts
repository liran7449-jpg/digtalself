/**
 * POST /api/auth/login
 *
 * 用户名 + 密码认证，凭据从数据库读（不再是环境变量）。
 * 这样用户能自己改密码，加人也不需要重新部署。
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { repo } from "@/repositories";
import { login } from "@/lib/session";

/**
 * 认证失败时的固定延迟。
 *
 * 两个作用：拖慢暴力破解，以及把「用户不存在」和「密码错误」的
 * 耗时拉平 —— 否则响应时间会泄露哪些用户名是真实存在的。
 * 同理，两种情况返回完全相同的错误文案。
 */
const FAILURE_DELAY_MS = 1000;

/**
 * 用户名不存在时也要跑一次 bcrypt，否则「立刻返回」本身就是
 * 「这个用户名不存在」的信号。拿一个固定的假哈希来消耗同样的时间。
 * 这是 bcrypt 对 "not-a-real-password" 的哈希，值本身无意义。
 */
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

async function reject() {
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
  return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    const creds = await repo.users.findCredentialsByUsername(username);

    // 不存在也走一遍哈希比对，保持耗时一致（见 DUMMY_HASH 注释）
    const hash = creds?.passwordHash ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hash);

    if (!creds || !creds.passwordHash || !isValid) {
      return reject();
    }

    await login(creds.id, { mustChangePassword: creds.mustChangePassword });

    return NextResponse.json({
      success: true,
      mustChangePassword: creds.mustChangePassword,
    });
  } catch (error) {
    console.error("登录失败：", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
