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
    const formData = new FormData();
    formData.append("content", data.content);
    formData.append("people", JSON.stringify(data.people));
    formData.append("places", JSON.stringify(data.places));
    formData.append("topics", JSON.stringify(data.topics));
    formData.append("goalIds", JSON.stringify(data.goalIds));

    // 添加所有图片
    data.images.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });

    return await createMomentWithMedia(formData);
  };

  return <MomentComposer activeGoals={activeGoals} onSubmit={handleSubmit} />;
}
