/**
 * MomentCard: Feed 中的 Moment 卡片
 *
 * 支持：
 * - 文字内容
 * - 图片展示（1/2/3+ 张自适应布局）
 * - 人物/地点/话题标签
 * - 时间戳
 * - 点击图片全屏预览
 * - 点击内容进入详情页（View Mode）
 *
 * 符合优化需求 V1.0 第 3.2 节：Feed 状态设计
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { MomentTime } from "@/components/moment/MomentTime";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import type { Moment, Media, Person, Place, Topic } from "@/domain/models";

interface MomentCardProps {
  moment: Moment;
  media?: Media[];
  people?: Person[];
  places?: Place[];
  topics?: Topic[];
}

/**
 * 图片布局：
 * - 1 张：大图 aspect-[3/2]
 * - 2 张：双列 grid-cols-2
 * - 3 张：1 大 + 2 小
 * - 4+ 张：2x2 网格 + "+N" 标记
 */
function ImageGrid({
  images,
  onImageClick,
}: {
  images: Media[];
  onImageClick: (index: number) => void;
}) {
  if (images.length === 0) return null;

  const displayImages = images.slice(0, 4);
  const remaining = images.length - 4;

  if (images.length === 1) {
    return (
      <div className="mt-3 overflow-hidden rounded-card">
        <img
          src={`/api/v1/media/${images[0].id}`}
          alt=""
          onClick={(e) => {
            e.preventDefault();
            onImageClick(0);
          }}
          className="aspect-[3/2] w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <img
            key={img.id}
            src={`/api/v1/media/${img.id}`}
            alt=""
            onClick={(e) => {
              e.preventDefault();
              onImageClick(i);
            }}
            className="aspect-square w-full cursor-pointer rounded-soft object-cover transition-opacity hover:opacity-90"
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <img
          src={`/api/v1/media/${images[0].id}`}
          alt=""
          onClick={(e) => {
            e.preventDefault();
            onImageClick(0);
          }}
          className="col-span-2 aspect-[2/1] w-full cursor-pointer rounded-soft object-cover transition-opacity hover:opacity-90"
        />
        {images.slice(1).map((img, i) => (
          <img
            key={img.id}
            src={`/api/v1/media/${img.id}`}
            alt=""
            onClick={(e) => {
              e.preventDefault();
              onImageClick(i + 1);
            }}
            className="aspect-square w-full cursor-pointer rounded-soft object-cover transition-opacity hover:opacity-90"
          />
        ))}
      </div>
    );
  }

  // 4+ 张：2x2 网格
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {displayImages.map((img, i) => (
        <div
          key={img.id}
          className="relative aspect-square cursor-pointer overflow-hidden rounded-soft transition-opacity hover:opacity-90"
          onClick={(e) => {
            e.preventDefault();
            onImageClick(i);
          }}
        >
          <img
            src={`/api/v1/media/${img.id}`}
            alt=""
            className="h-full w-full object-cover"
          />
          {i === 3 && remaining > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-2xl font-medium text-white">+{remaining}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function MomentCard({
  moment,
  media = [],
  people = [],
  places = [],
  topics = [],
}: MomentCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  // 生成所有图片的 URL
  const imageUrls = media.map((img) => `/api/v1/media/${img.id}`);

  return (
    <div className="flex gap-5">
      <MomentTime
        at={moment.occurredAt}
        dayKey={moment.date}
        className="w-16 shrink-0 pt-0.5"
      />

      <div className="min-w-0 flex-1 border-l border-line pl-5">
        <Link
          href={`/moments/${moment.id}`}
          className="block transition-colors hover:text-brand"
        >
          {/* 文字内容 */}
          {moment.content && (
            <p className="measure whitespace-pre-wrap text-body text-ink">
              {moment.content}
            </p>
          )}
        </Link>

        {/* 图片（可点击预览） */}
        <ImageGrid images={media} onImageClick={handleImageClick} />

        {/* 元数据标签 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* 人物 */}
          {people.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-paper-sunken px-2 py-0.5 text-small text-ink"
            >
              👤 {p.name}
            </span>
          ))}

          {/* 地点 */}
          {places.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-paper-sunken px-2 py-0.5 text-small text-ink"
            >
              📍 {p.name}
            </span>
          ))}

          {/* 话题 */}
          {topics.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-paper-sunken px-2 py-0.5 text-small text-ink"
            >
              # {t.name}
            </span>
          ))}

          {/* Why it matters */}
          {moment.whyItMatters && (
            <span className="label-caps text-brand">有注解</span>
          )}

          {/* Memory 标记 */}
          {moment.isMemory && (
            <span className="label-caps text-accent">值得记住</span>
          )}
        </div>

        {/* 图片预览 Lightbox */}
        {previewOpen && (
          <ImageLightbox
            images={imageUrls}
            initialIndex={previewIndex}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
