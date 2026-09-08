"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { repo } from "@/repositories";
import { MOMENT_TYPE_VALUES, MOOD_VALUES } from "@/domain/enums";

export type ActionResult = { ok: true } | { ok: false; error: string };

const editSchema = z.object({
  content: z.string().trim().min(1, "内容不能为空").max(20000),
  type: z.enum(MOMENT_TYPE_VALUES),
  mood: z.enum(MOOD_VALUES).nullable(),
  place: z.string().trim().max(160).nullable(),
  whyItMatters: z.string().trim().max(4000).nullable(),
  isMemory: z.boolean(),
});

export async function updateMoment(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = editSchema.safeParse({
    content: formData.get("content"),
    type: (formData.get("type") as string) || "thought",
    mood: (formData.get("mood") as string) || null,
    place: ((formData.get("place") as string) || "").trim() || null,
    whyItMatters:
      ((formData.get("whyItMatters") as string) || "").trim() || null,
    isMemory: formData.get("isMemory") === "on",
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
  await repo.moments.remove(id);
  revalidatePath("/moments");
  revalidatePath("/today");
  redirect("/moments");
}
