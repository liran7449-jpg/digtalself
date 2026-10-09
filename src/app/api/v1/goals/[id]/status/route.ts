/**
 * PATCH /api/v1/goals/[id]/status
 * 修改 Goal 状态
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { repoFor } from "@/repositories";
import { GoalService } from "@/services/goal-service";
import { GOAL_STATUS_VALUES } from "@/domain/enums";

const statusSchema = z.object({
  status: z.enum(GOAL_STATUS_VALUES),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const repo = repoFor(userId);
    const service = new GoalService(
      repo.goals,
      async () => [],
      async () => [],
    );

    const goal = await service.setStatus(id, parsed.data.status);
    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error("[PATCH /api/v1/goals/:id/status] Error:", error);

    if (error.message?.includes("Invalid transition")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
