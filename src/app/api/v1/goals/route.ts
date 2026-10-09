/**
 * GET /api/v1/goals
 * 列出当前用户的 Goals，可选按状态过滤
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { repoFor } from "@/repositories";
import { GoalService } from "@/services/goal-service";
import { GoalLinkService } from "@/services/goal-link-service";
import type { GoalStatus } from "@/domain/enums";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as GoalStatus | null;

  const repo = repoFor(userId);
  const service = new GoalService(
    repo.goals,
    async (goalId) => {
      const momentIds = await GoalLinkService.listByGoal(userId, goalId);
      return momentIds.map((id) => ({ id }));
    },
    async () => [], // Milestone 查询留空，V1 只显示数量
  );

  try {
    const goals = status ? await service.list(status) : await service.list();
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("[GET /api/v1/goals] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 },
    );
  }
}
