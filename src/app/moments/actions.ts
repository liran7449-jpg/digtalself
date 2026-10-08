"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRepo } from "@/repositories";
import { MOMENT_TYPE_VALUES, MOOD_VALUES } from "@/domain/enums";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * 只包含编辑表单真正提供输入的字段。
 *
 * 曾经这里还有 place 和 isMemory —— 表单上没有对应输入框，
 * formData.get() 永远拿不到值，于是每次保存都写入 place=null、
 * isMemory=false，静默清掉已有数据（「值得记住」徽章会因为改一个
 * 错别字而消失）。不提供输入的字段就不该出现在 patch 里。
 *
 * isMemory 的正确入口是 markAsMemory / unmarkAsMemory ——
 * 那条路径同时维护 memories 表，这里单写标记位会让两边对不上。
 *
 * whyItMatters 同理：编辑页已去掉这个输入框，所以也不在 patch 里，
 * 已有的值原样保留（feed 卡片和日视图仍会展示）。
 */
const editSchema = z.object({
  content: z.string().trim().min(1, "内容不能为空").max(20000),
  type: z.enum(MOMENT_TYPE_VALUES),
  mood: z.enum(MOOD_VALUES).nullable(),
});

export async function updateMoment(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const repo = await getRepo();
  const parsed = editSchema.safeParse({
    content: formData.get("content"),
    type: (formData.get("type") as string) || "thought",
    mood: (formData.get("mood") as string) || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "输入不合法。",
    };
  }

  const existing = await repo.moments.find(id);
  if (!existing) return { ok: false, error: "这条记录已经不在了。" };

  await repo.moments.update(id, parsed.data);
  revalidatePath(`/moments/${id}`);
  revalidatePath("/moments");
  revalidatePath("/today");
  return { ok: true };
}

/** 硬删除后回列表页 —— 详情页的目标已经不存在了 */
export async function deleteMomentAndReturn(id: string): Promise<void> {
  const repo = await getRepo();
  await repo.moments.remove(id);
  revalidatePath("/moments");
  revalidatePath("/today");
  redirect("/moments");
}
