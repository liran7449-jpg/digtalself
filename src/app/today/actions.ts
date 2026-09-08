"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo } from "@/repositories";
import { toDayKey } from "@/domain/day-key";
import { morningSetupSchema, quickCaptureSchema } from "@/domain/models";
import {
  ENERGY_VALUES,
  MOOD_VALUES,
  PLAN_PRIORITY_VALUES,
  type PlanPriority,
  type PlanStatus,
} from "@/domain/enums";
import { InvalidTransitionError } from "@/domain/transitions";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Morning Setup 提交。三项都可为空 —— IA 第 6.1 节：绝不强制填写。 */
export async function submitMorningSetup(
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    mood: (formData.get("mood") as string) || null,
    energy: (formData.get("energy") as string) || null,
    focus: ((formData.get("focus") as string) || "").trim() || null,
  };

  const parsed = morningSetupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "输入不合法，请检查后重试。" };
  }

  const date = toDayKey();
  await repo.days.applyMorningSetup(date, parsed.data);

  // 新的一天真正开始的时刻，把上一次没做完的带过来。
  // 放这里而不是放页面渲染里：渲染是 GET，不该有副作用。
  // carryOverUnfinished 幂等，重复提交 Morning Setup 不会重复生成。
  await repo.plans.carryOverUnfinished(date);

  revalidatePath("/today");
  return { ok: true };
}

/** Quick Capture。PRD 第 10 节：最低摩擦，只有文字是必需的。 */
export async function captureMoment(formData: FormData): Promise<ActionResult> {
  const parsed = quickCaptureSchema.safeParse({
    content: formData.get("content"),
    type: (formData.get("type") as string) || "thought",
    mediaPaths: [],
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "内容不能为空。",
    };
  }

  await repo.moments.capture(parsed.data);
  revalidatePath("/today");
  return { ok: true };
}

export async function deleteMoment(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "缺少 id。" };
  // 硬删除，PRD 第 31 节隐私要求
  await repo.moments.remove(id);
  revalidatePath("/today");
  return { ok: true };
}

/** "HH:mm"；空串代表不定时 */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseTime(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return TIME_RE.test(s) ? s : null;
}

/** 非法或缺失时回落到 normal，不因为一个坏值就拒绝整次提交。 */
function parsePriority(raw: unknown): PlanPriority {
  const s = String(raw ?? "");
  return (PLAN_PRIORITY_VALUES as readonly string[]).includes(s)
    ? (s as PlanPriority)
    : "normal";
}

/* ---------------- 状态随时可改 ---------------- */

const stateFieldSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("mood"), value: z.enum(MOOD_VALUES).nullable() }),
  z.object({
    field: z.literal("energy"),
    value: z.enum(ENERGY_VALUES).nullable(),
  }),
  z.object({
    field: z.literal("focus"),
    value: z.string().trim().max(280).nullable(),
  }),
]);

/**
 * 单项更新 mood / energy / focus。
 * 不复用 submitMorningSetup —— 那个是整体覆盖，用它改 mood 会把 focus 清空。
 */
export async function updateDayState(
  field: "mood" | "energy" | "focus",
  value: string | null,
): Promise<ActionResult> {
  const parsed = stateFieldSchema.safeParse({
    field,
    value: value === "" ? null : value,
  });
  if (!parsed.success) return { ok: false, error: "这个值不合法。" };

  await repo.days.updateState(toDayKey(), {
    [parsed.data.field]: parsed.data.value,
  });
  revalidatePath("/today");
  return { ok: true };
}

/* ---------------- 计划项 ---------------- */

export async function setPlanStatus(
  id: string,
  status: PlanStatus,
): Promise<ActionResult> {
  try {
    await repo.plans.setStatus(id, status);
    revalidatePath("/today");
    return { ok: true };
  } catch (e) {
    if (e instanceof InvalidTransitionError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

export async function updatePlanItem(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return { ok: false, error: "标题不能为空。" };
  if (title.length > 200) return { ok: false, error: "标题太长了。" };

  await repo.plans.update(id, {
    title,
    startAt: parseTime(formData.get("startAt")),
    priority: parsePriority(formData.get("priority")),
  });
  revalidatePath("/today");
  return { ok: true };
}

/** 只改优先级，不动其他字段。行内切换用。 */
export async function setPlanPriority(
  id: string,
  priority: PlanPriority,
): Promise<ActionResult> {
  if (!PLAN_PRIORITY_VALUES.includes(priority)) {
    return { ok: false, error: "优先级不合法。" };
  }
  await repo.plans.update(id, { priority });
  revalidatePath("/today");
  return { ok: true };
}

export async function deletePlanItem(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "缺少 id。" };
  await repo.plans.remove(id);
  revalidatePath("/today");
  return { ok: true };
}

export async function addPlanItem(formData: FormData): Promise<ActionResult> {
  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return { ok: false, error: "写下要做的事。" };

  const date = toDayKey();
  await repo.days.ensure(date); // plan_items.date 外键指向 days
  await repo.plans.create({
    date,
    title,
    kind: "work",
    status: "planned",
    startAt: parseTime(formData.get("startAt")),
    priority: parsePriority(formData.get("priority")),
    durationMin: null,
    fromAi: false,
    goalId: null,
  });

  revalidatePath("/today");
  return { ok: true };
}

/**
 * 把最近一天未完成的项顺延过来。
 * 复制而非搬移 —— 源日期保留自己的记录，Day 视图的历史不能被改写。
 */
export async function carryOverToToday(): Promise<
  ActionResult & { count?: number }
> {
  const res = await repo.plans.carryOverUnfinished(toDayKey());
  revalidatePath("/today");
  return { ok: true, count: res.count };
}

export async function endMyDay(): Promise<ActionResult> {
  await repo.days.markReadyToReflect(toDayKey());
  revalidatePath("/today");
  return { ok: true };
}
