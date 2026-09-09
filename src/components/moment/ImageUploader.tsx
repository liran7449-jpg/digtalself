/**
 * ImageUploader: 图片上传组件
 *
 * 功能：
 * - 点击上传 / 拖拽上传
 * - 预览已上传图片
 * - 删除图片
 * - 显示上传进度
 *
 * 符合规范第 5 条：私密内容不永久公开，通过 /api/v1/media/:id 访问
 */

"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Primitives";
import type { Media } from "@/domain/models";

interface ImageUploaderProps {
  momentId: string;
  existingImages: Media[];
  onUpload: (momentId: string, formData: FormData) => Promise<Media>;
  onDelete: (momentId: string, mediaId: string) => Promise<void>;
}

export function ImageUploader({
  momentId,
  existingImages,
  onUpload,
  onDelete,
}: ImageUploaderProps) {
  const [images, setImages] = useState<Media[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        return onUpload(momentId, formData);
      });
      const uploaded = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
      // 清空 input，允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (mediaId: string) => {
    startTransition(async () => {
      await onDelete(momentId, mediaId);
      setImages((prev) => prev.filter((img) => img.id !== mediaId));
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div>
      <Label>Images</Label>

      {/* 已上传图片预览 */}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-soft">
              <img
                src={`/api/v1/media/${img.id}`}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleDelete(img.id)}
                disabled={pending}
                className="absolute right-2 top-2 flex size-6 items-center justify-center
                  rounded-full bg-black/60 text-white opacity-0 transition-opacity
                  hover:bg-black/80 group-hover:opacity-100"
                aria-label="删除图片"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传区域 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mt-3 flex min-h-32 flex-col items-center justify-center rounded-card
          border-2 border-dashed transition-colors ${
            dragOver
              ? "border-brand bg-brand/5"
              : "border-line bg-paper-sunken hover:border-line-strong"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <p className="text-small text-ink-muted">上传中...</p>
        ) : (
          <>
            <p className="text-small text-ink-muted">
              拖拽图片到此处，或
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3"
            >
              选择图片
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
