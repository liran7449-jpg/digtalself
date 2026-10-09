/**
 * createMomentWithMedia: 创建完整的 Moment（文字+图片+关联）
 */

"use server";

import { revalidatePath } from "next/cache";
import { toDayKey } from "@/domain/day-key";
import { repoFor } from "@/repositories";
import { requireUserId } from "@/lib/session";
import { MediaService } from "@/services/media-service";
import { PersonService } from "@/services/person-service";
import { PlaceService } from "@/services/place-service";
import { TopicService } from "@/services/topic-service";
import { GoalLinkService } from "@/services/goal-link-service";
import { db } from "@/db/client";
import { momentMedia } from "@/db/schema";

export async function createMomentWithMedia(formData: FormData) {
  const userId = await requireUserId();
  const repo = repoFor(userId);
  const content = formData.get("content") as string;
  const peopleJson = formData.get("people") as string;
  const placesJson = formData.get("places") as string;
  const topicsJson = formData.get("topics") as string;
  const goalIdsJson = formData.get("goalIds") as string;

  const people: string[] = peopleJson ? JSON.parse(peopleJson) : [];
  const places: string[] = placesJson ? JSON.parse(placesJson) : [];
  const topics: string[] = topicsJson ? JSON.parse(topicsJson) : [];
  const goalIds: string[] = goalIdsJson ? JSON.parse(goalIdsJson) : [];

  // 提取所有图片文件
  const imageFiles: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image_") && value instanceof File) {
      imageFiles.push(value);
    }
  }

  if (!content.trim() && imageFiles.length === 0) {
    return { ok: false, error: "请输入内容或添加图片" };
  }

  try {
    const today = toDayKey();
    const trimmedContent = content.trim();

    // 1. 创建 Moment
    const moment = await repo.moments.capture({
      content: trimmedContent || "", // 允许空字符串（只上传图片的情况）
      type: "thought", // 默认类型，后续可以 AI 推断
    }, new Date());

    // 2. 上传图片并关联
    if (imageFiles.length > 0) {
      await Promise.all(
        imageFiles.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const media = await MediaService.uploadImage({
            // 来自 session，不是硬编码的 'me'
            userId,
            file: buffer,
            mimeType: file.type,
          });

          // 关联到 Moment
          await db.insert(momentMedia).values({
            momentId: moment.id,
            mediaId: media.id,
          });
        })
      );
    }

    // 3. 关联人物
    for (const personName of people) {
      await PersonService.linkToMoment(userId, moment.id, personName);
    }

    // 4. 关联地点
    for (const placeName of places) {
      await PlaceService.linkToMoment(userId, moment.id, placeName);
    }

    // 5. 关联话题
    for (const topicName of topics) {
      await TopicService.linkToMoment(userId, moment.id, topicName);
    }

    // 6. 关联目标
    for (const goalId of goalIds) {
      await GoalLinkService.linkToMoment(userId, moment.id, goalId);
    }

    revalidatePath("/today");
    revalidatePath("/moments");
    revalidatePath(`/days/${today}`);

    return { ok: true };
  } catch (error) {
    console.error("Failed to create moment:", error);
    return { ok: false, error: "保存失败，请重试" };
  }
}
