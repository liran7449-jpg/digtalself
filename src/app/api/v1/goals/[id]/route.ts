/**
 * GET    /api/v1/goals/[id]  详情，带 Evidence 统计
 * PATCH  /api/v1/goals/[id]  编辑标题 / 描述
 * DELETE /api/v1/goals/[id]  硬删除（关联的 Moment 保留）
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { repoFor } from "@/repositories";
import { GoalService } from "@/services/goal-service";
import { GoalLinkService } from "@/services/goal-link-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = repoFor(userId);
  const service = new GoalService(
    repo.goals,
    async (goalId) => {
      const momentIds = await GoalLinkService.listByGoal(userId, goalId);
      return momentIds.map((id) => ({ id }));
    },
    async () => [], // Milestone V1 暂不实现
  );

  try {
    const goal = await service.getWithStats(id);
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json({ goal });
  } catch (error) {
    console.error("[GET /api/v1/goals/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 },
    );
  }
}

/**
 * 只允许改这两个字段。strict()：多余的键直接拒绝。
 *
 * 之前这里把 body 原样传给 repo.update，而 update 是 .set({ ...patch })，
 * 等于客户端能写任意列 —— 包括 status（绕过状态机）和 userId
 * （把自己的目标塞进别人账号）。
 */
const patchSchema = z
  .object({
    title: z.string().trim().min(1, "目标不能为空").max(200),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "输入不合法" },
      { status: 400 },
    );
  }

  try {
    const repo = repoFor(userId);
    // find 带 userId：别人的目标在这里就是「不存在」
    if (!(await repo.goals.find(id))) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const service = new GoalService(repo.goals, async () => [], async () => []);
    const goal = await service.update(id, parsed.data);
    return NextResponse.json({ goal });
  } catch (error) {
    console.error("[PATCH /api/v1/goals/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repo = repoFor(userId);
    if (!(await repo.goals.find(id))) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const service = new GoalService(repo.goals, async () => [], async () => []);
    await service.remove(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/v1/goals/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 },
    );
  }
}
