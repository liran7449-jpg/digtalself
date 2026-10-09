/**
 * /me —— Goals 的唯一入口（方案 A）。
 *
 * 左栏是目标，右栏是选中目标关联的真实事件。选中哪个目标由 ?goalId 决定，
 * 没带参数时默认选第一个 Active —— 进来就能看到证据，不用先点一下。
 */

import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { repoFor } from "@/repositories";
import { AppShell } from "@/components/layout/AppShell";
import { GoalLinkService } from "@/services/goal-link-service";
import { MeContent } from "./MeContent";

// 个人数据每次都要读最新的，不缓存
export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const repo = repoFor(userId);
  const [allGoals, counts, { goalId }] = await Promise.all([
    repo.goals.list(),
    // 一次 group by 拿到所有目标的证据数，不按目标逐个查
    GoalLinkService.countByGoals(userId),
    searchParams,
  ]);

  // draft 不对用户暴露（创建时会立刻转 active，残留的 draft 只可能来自失败的创建）
  const goals = allGoals
    .filter((g) => g.status !== "draft")
    .map((g) => ({ ...g, evidenceCount: counts.get(g.id) ?? 0 }));

  const selected =
    goals.find((g) => g.id === goalId) ??
    goals.find((g) => g.status === "active") ??
    goals[0] ??
    null;

  const evidence = selected
    ? await GoalLinkService.listEvidence(userId, selected.id)
    : [];

  return (
    <AppShell current="/me" width="wide">
      <MeContent
        goals={goals}
        selectedId={selected?.id ?? null}
        evidence={evidence}
      />
    </AppShell>
  );
}
