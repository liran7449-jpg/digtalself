/**
 * GET /api/health
 *
 * 健康检查接口，用于监控和部署验证
 */

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { isCloudStorage, storage } from "@/lib/storage";
import { isAuthenticated } from "@/lib/session";

/**
 * 存储连通性自检：真写一个小文件、读回、再删掉。
 *
 * `storage: "cloud"` 只说明环境变量填了，不代表凭证真的能用 ——
 * 上传失败时这两者的区别就是全部线索。走一遍真实往返才有意义。
 *
 * 只在 ?probe=storage 且已登录时执行：/api/health 是公开路由，
 * 不设门槛的话任何人都能反复往桶里写东西。
 */
async function probeStorage() {
  const key = `_healthcheck/probe-${Date.now()}.txt`;
  try {
    await storage.upload(key, Buffer.from("ok"), "text/plain");
    const back = await storage.read(key);
    const roundTripped = back?.toString() === "ok";
    await storage.delete(key);
    return {
      ok: roundTripped,
      detail: roundTripped ? "写入/读回/删除均成功" : "读回内容不一致",
    };
  } catch (e) {
    // 上传失败的真实原因在这里，不要吞掉
    return { ok: false, detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export async function GET(request: Request) {
  try {
    // 检查数据库连接
    const dbCheck = await checkDatabase();

    // 存储自检要真写文件，所以要登录才能触发
    const wantProbe = new URL(request.url).searchParams.get("probe") === "storage";
    const storageProbe = wantProbe
      ? (await isAuthenticated())
        ? await probeStorage()
        : { ok: false, detail: "需要登录才能运行存储自检" }
      : undefined;

    const now = new Date();
    const response = {
      status: "healthy",
      timestamp: now.toISOString(),
      database: dbCheck,
      /**
       * "local" 在生产环境是危险信号：容器磁盘每次部署都清空，图片会全丢。
       * 部署后应确认这里是 cloud。
       */
      storage: isCloudStorage ? "cloud" : "local",
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
      ...(storageProbe && { storageProbe }),
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
