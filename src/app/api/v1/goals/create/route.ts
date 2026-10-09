/**
 * POST /api/v1/goals
 * 创建新 Goal
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { repoFor } from "@/repositories";
import { GoalService } from "@/services/goal-service";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const repo = repoFor(userId);
    const service = new GoalService(
      repo.goals,
      async () => [],
      async () => [],
    );

    const goal = await service.create(parsed.data.title, parsed.data.description);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/goals] Error:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 },
    );
  }
}
