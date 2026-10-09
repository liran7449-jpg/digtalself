/**
 * Photos 照片墙
 *
 * 展示所有带图片的 Moment，瀑布流布局
 * 性能优化：懒加载、虚拟滚动、缩略图
 */

import { Suspense } from "react";
import { getRepo } from "@/repositories";
import { PhotoWall } from "./PhotoWall";

export const metadata = {
  title: "照片墙",
};

async function loadPhotos() {
  const repo = await getRepo();

  // 查询所有带图片的 Moments
  const photos = await repo.moments.listPhotos();

  return photos;
}

export default async function PhotosPage() {
  const photos = await loadPhotos();

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-display font-bold text-ink">照片墙</h1>
          <p className="mt-2 text-body text-ink-muted">
            {photos.length} 张照片 · 记录生活的每一刻
          </p>
        </header>

        <Suspense fallback={<div className="text-center text-ink-muted">加载中...</div>}>
          <PhotoWall photos={photos} />
        </Suspense>
      </div>
    </div>
  );
}
