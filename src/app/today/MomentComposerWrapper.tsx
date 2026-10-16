/**
 * MomentComposerWrapper: 适配 MomentComposer 到 Server Action
 */

"use client";

import { MomentComposer } from "@/components/moment/MomentComposer";
import { createMomentWithMedia } from "./composer-actions";
import type { Goal } from "@/domain/models";

export function MomentComposerWrapper({ activeGoals }: { activeGoals: Goal[] }) {
  const handleSubmit = async (data: {
    content: string;
    images: File[];
    people: string[];
    places: string[];
    topics: string[];
    goalIds: string[];
  }) => {
    // 前端检查文件大小
    const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
    const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150MB

    for (const file of data.images) {
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      const typeName = isVideo ? "视频" : "图片";

      if (file.size > maxSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
        return {
          ok: false,
          error: `${typeName}过大（${fileSizeMB}MB），最大支持 ${maxSizeMB}MB`
        };
      }
    }

    const formData = new FormData();
    formData.append("content", data.content);
    formData.append("people", JSON.stringify(data.people));
    formData.append("places", JSON.stringify(data.places));
    formData.append("topics", JSON.stringify(data.topics));
    formData.append("goalIds", JSON.stringify(data.goalIds));

    // 添加所有图片/视频
    data.images.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });

    return await createMomentWithMedia(formData);
  };

  return <MomentComposer activeGoals={activeGoals} onSubmit={handleSubmit} />;
}
