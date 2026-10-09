/**
 * GET /api/v1/goals/:goalId/evidence
 *
 * 获取某个目标的证据列表（关联的 Moments）
 * 用于客户端切换目标时动态加载
 */

import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { GoalLinkService } from "@/services/goal-link-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId } = await params;

  try {
    const evidence = await GoalLinkService.listEvidence(userId, goalId);
    return Response.json(evidence);
  } catch (error) {
    console.error("Failed to fetch evidence:", error);
    return Response.json(
      { error: "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}
