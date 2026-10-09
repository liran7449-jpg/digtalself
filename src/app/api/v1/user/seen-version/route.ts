/**
 * PATCH /api/v1/user/seen-version
 * 标记用户已看过当前版本的更新公告
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  version: z.string().min(1).max(20),
});

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid version format" },
        { status: 400 },
      );
    }

    await db
      .update(users)
      .set({ lastSeenVersion: parsed.data.version })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/v1/user/seen-version] Error:", error);
    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 },
    );
  }
}
