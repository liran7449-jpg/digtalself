/**
 * GET /api/health
 *
 * 健康检查接口，用于监控和部署验证
 */

import { NextResponse } from "next/server";
import { db } from "@/db/client";

export async function GET() {
  try {
    // 检查数据库连接
    const dbCheck = await checkDatabase();

    const response = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbCheck,
      storage: process.env.R2_ACCOUNT_ID ? "r2" : "local",
      auth: !!process.env.AUTH_PASSWORD_HASH,
      environment: process.env.NODE_ENV || "development",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<{ type: string; connected: boolean }> {
  try {
    // 简单查询测试连接 - 兼容 SQLite 和 PostgreSQL
    await db.execute("SELECT 1");

    return {
      type: process.env.DATABASE_URL ? "postgresql" : "sqlite",
      connected: true,
    };
  } catch (error) {
    return {
      type: process.env.DATABASE_URL ? "postgresql" : "sqlite",
      connected: false,
    };
  }
}
