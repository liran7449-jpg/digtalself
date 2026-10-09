/**
 * PhotoWall: 瀑布流照片墙组件
 *
 * 特性：
 * - Masonry 瀑布流布局
 * - 图片懒加载
 * - 点击放大查看
 * - 显示拍摄日期和内容摘要
 */

"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

// 简单的日期格式化
function formatDay(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

export interface Photo {
  id: string;
  mediaId: string;
  momentId: string;
  content?: string;
  date: string;
  occurredAt: Date;
}

interface PhotoWallProps {
  photos: Photo[];
}

export function PhotoWall({ photos }: PhotoWallProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageUrls = photos.map(p => `/api/v1/media/${p.mediaId}`);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  if (photos.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-body text-ink-muted">还没有照片</p>
          <p className="mt-2 text-small text-ink-muted">
            在 Today 页面记录 Moment 时上传图片，它们会出现在这里
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 瀑布流网格 */}
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative mb-4 break-inside-avoid overflow-hidden rounded-soft
              bg-paper-raised transition-all duration-200 hover:shadow-soft"
          >
            {/* 图片 */}
            <button
              onClick={() => openLightbox(index)}
              className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <img
                src={`/api/v1/media/${photo.mediaId}`}
                alt={photo.content || ""}
                loading="lazy"
                className="w-full transition-transform duration-200 group-hover:scale-105"
              />
            </button>

            {/* 悬浮信息 */}
            <div
              className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t
                from-black/60 to-transparent p-3 opacity-0 transition-opacity
                duration-200 group-hover:opacity-100"
            >
              {photo.content && (
                <p className="mb-1 line-clamp-2 text-small text-white">
                  {photo.content}
                </p>
              )}
              <p className="text-xs text-white/80">{formatDay(photo.date)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 灯箱 */}
      <ImageLightbox
        images={imageUrls}
        initialIndex={currentIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
