/**
 * Moment 关联管理的 Server Actions。
 *
 * 每个 action 第一件事都是 requireUserId() —— Server Action 是公开
 * 端点，任何人都能构造请求打过来，不能假设调用它的是登录用户。
 * 拿到 userId 后所有数据访问都经过它，归属由服务端决定，
 * 不接受客户端传 userId。
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
import { repoFor } from "@/repositories";
import { requireUserId } from "@/lib/session";
import { db } from "@/db/client";
import { momentMedia } from "@/db/schema";

export async function linkPerson(momentId: string, personName: string) {
  const userId = await requireUserId();
  await PersonService.linkToMoment(userId, momentId, personName);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkPerson(momentId: string, personId: string) {
  const userId = await requireUserId();
  await PersonService.unlinkFromMoment(userId, momentId, personId);
  revalidatePath(`/moments/${momentId}`);
}

export async function linkPlace(momentId: string, placeName: string) {
  const userId = await requireUserId();
  await PlaceService.linkToMoment(userId, momentId, placeName);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkPlace(momentId: string, placeId: string) {
  const userId = await requireUserId();
  await PlaceService.unlinkFromMoment(userId, momentId, placeId);
  revalidatePath(`/moments/${momentId}`);
}

export async function linkTopic(momentId: string, topicName: string) {
  const userId = await requireUserId();
  await TopicService.linkToMoment(userId, momentId, topicName);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkTopic(momentId: string, topicId: string) {
  const userId = await requireUserId();
  await TopicService.unlinkFromMoment(userId, momentId, topicId);
  revalidatePath(`/moments/${momentId}`);
}

export async function linkGoal(momentId: string, goalId: string) {
  const userId = await requireUserId();
  await GoalLinkService.linkToMoment(userId, momentId, goalId);
  revalidatePath(`/moments/${momentId}`);
}

export async function unlinkGoal(momentId: string, goalId: string) {
  const userId = await requireUserId();
  await GoalLinkService.unlinkFromMoment(userId, momentId, goalId);
  revalidatePath(`/moments/${momentId}`);
}

export async function markAsMemory(momentId: string) {
  const userId = await requireUserId();
  // find 带 userId 过滤，别人的 moment 在这里就是「不存在」
  const moment = await repoFor(userId).moments.find(momentId);
  if (!moment) throw new Error("Moment not found");

  await MemoryService.markMomentAsMemory(userId, moment);
  revalidatePath(`/moments/${momentId}`);
}

export async function unmarkAsMemory(momentId: string) {
  const userId = await requireUserId();
  await MemoryService.unmarkMomentAsMemory(userId, momentId);
  revalidatePath(`/moments/${momentId}`);
}

export async function uploadImage(momentId: string, formData: FormData) {
  const userId = await requireUserId();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  /**
   * 先确认这条 moment 属于当前用户，再上传。
   * 顺序很重要：反过来的话，往别人的 moment 传图会先把文件写进存储，
   * 然后才失败，留下一个没人引用的孤儿文件。
   */
  const moment = await repoFor(userId).moments.find(momentId);
  if (!moment) throw new Error("Moment not found");

  const buffer = Buffer.from(await file.arrayBuffer());

  // 上传图片。userId 来自 session，不是硬编码的 'me'
  const media = await MediaService.uploadImage({
    userId,
    file: buffer,
    mimeType: file.type,
  });

  // 关联到 Moment
  await db.insert(momentMedia).values({ momentId, mediaId: media.id });

  revalidatePath(`/moments/${momentId}`);
  return media;
}

export async function deleteImage(momentId: string, mediaId: string) {
  const userId = await requireUserId();

  // 先确认 moment 归属，避免拿别人的 momentId 解关联
  const moment = await repoFor(userId).moments.find(momentId);
  if (!moment) throw new Error("Moment not found");

  // 取消关联
  await db
    .delete(momentMedia)
    .where(
      and(eq(momentMedia.momentId, momentId), eq(momentMedia.mediaId, mediaId)),
    );

  // 删除文件。不属于该用户时 repo 会抛错
  await MediaService.delete(userId, mediaId);

  revalidatePath(`/moments/${momentId}`);
}
