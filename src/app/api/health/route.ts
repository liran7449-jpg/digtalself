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

    const now = new Date();
    const response = {
      status: "healthy",
      timestamp: now.toISOString(),
      database: dbCheck,
      storage: process.env.R2_ACCOUNT_ID ? "r2" : "local",
      auth: !!process.env.AUTH_PASSWORD_HASH,
      environment: process.env.NODE_ENV || "development",
      /**
       * 时区诊断。TZ 没设时云平台默认 UTC，会导致问候语和日期切换错误。
       * localTime 是服务端实际用来算时间的时钟。
       */
      timezone: {
        tz: process.env.TZ || "(未设置，默认 UTC)",
        localTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        offsetHours: -now.getTimezoneOffset() / 60,
      },
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
    // 简单查询测试连接 - 使用 drizzle 的 sql 查询
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);

    return {
      type: process.env.DATABASE_URL ? "postgresql" : "sqlite",
      connected: true,
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      type: process.env.DATABASE_URL ? "postgresql" : "sqlite",
      connected: false,
    };
  }
}
