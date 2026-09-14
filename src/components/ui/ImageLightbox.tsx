"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * ImageLightbox - 图片全屏预览组件
 *
 * 功能：
 * - 全屏黑色遮罩背景
 * - 图片居中显示
 * - 多图时显示左右切换箭头
 * - 右上角关闭按钮 (×)
 * - 底部显示当前位置 (2/5)
 * - 键盘支持：ESC 关闭、左右键切换
 * - 点击遮罩关闭
 */
export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只在点击遮罩时关闭，点击图片不关闭
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={handleBackdropClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white
          transition-colors hover:bg-black/70"
        aria-label="关闭预览"
      >
        <X className="size-6" />
      </button>

      {/* 图片计数器（多图时显示） */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full
            bg-black/50 px-3 py-1 font-mono text-sm text-white"
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 左箭头（多图时显示） */}
      {images.length > 1 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full
            bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          aria-label="上一张"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* 右箭头（多图时显示） */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full
            bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          aria-label="下一张"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* 图片 */}
      <img
        src={images[currentIndex]}
        alt={`预览图片 ${currentIndex + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />
    </div>
  );
}
