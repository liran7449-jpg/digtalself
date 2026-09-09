/**
 * Moment 关联管理的 Server Actions。
 */

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { PersonService } from "@/services/person-service";
import { PlaceService } from "@/services/place-service";
import { TopicService } from "@/services/topic-service";
import { GoalLinkService } from "@/services/goal-link-service";
import { MemoryService } from "@/services/memory-service";
import { MediaService } from "@/services/media-service";
import { repo } from "@/repositories";
import { db } from "@/db/client";
import { momentMedia } from "@/db/schema";

export async function linkPerson(momentId: string, personName: string) {
  await PersonService.linkToMoment(momentId, personName);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkPerson(momentId: string, personId: string) {
  await PersonService.unlinkFromMoment(momentId, personId);
  revalidatePath(`/moments/${momentId}`);
}

export async function linkPlace(momentId: string, placeName: string) {
  await PlaceService.linkToMoment(momentId, placeName);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkPlace(momentId: string, placeId: string) {
  await PlaceService.unlinkFromMoment(momentId, placeId);
  revalidatePath(`/moments/${momentId}`);
}

export async function linkTopic(momentId: string, topicName: string) {
  await TopicService.linkToMoment(momentId, topicName);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkTopic(momentId: string, topicId: string) {
  await TopicService.unlinkFromMoment(momentId, topicId);
  revalidatePath(`/moments/${momentId}`);
}

export async function linkGoal(momentId: string, goalId: string) {
  await GoalLinkService.linkToMoment(momentId, goalId);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkGoal(momentId: string, goalId: string) {
  await GoalLinkService.unlinkFromMoment(momentId, goalId);
  revalidatePath(`/moments/${momentId}`);
}

export async function markAsMemory(momentId: string) {
  const moment = await repo.moments.find(momentId);
  if (!moment) throw new Error("Moment not found");

  await MemoryService.markMomentAsMemory(moment);
  revalidatePath(`/moments/${momentId}`);
}

export async function unmarkAsMemory(momentId: string) {
  await MemoryService.unmarkMomentAsMemory(momentId);
  revalidatePath(`/moments/${momentId}`);
}

export async function uploadImage(momentId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());

  // 上传图片
  const media = await MediaService.uploadImage({
    userId: "me", // TODO: 多用户时改为当前登录用户
    file: buffer,
    mimeType: file.type,
  });

  // 关联到 Moment
  await db.insert(momentMedia).values({ momentId, mediaId: media.id }).run();

  revalidatePath(`/moments/${momentId}`);
  return media;
}

export async function deleteImage(momentId: string, mediaId: string) {
  // 取消关联
  await db
    .delete(momentMedia)
    .where(
      and(
        eq(momentMedia.momentId, momentId),
        eq(momentMedia.mediaId, mediaId)
      )
    )
    .run();

  // 删除文件
  await MediaService.delete(mediaId);

  revalidatePath(`/moments/${momentId}`);
}
