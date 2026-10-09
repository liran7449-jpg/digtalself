/**
 * MomentComposer: 完整的 Moment 创建组件
 *
 * 支持一次性记录：
 * - 文字内容
 * - 图片（多图上传）
 * - 人物（自动补全）
 * - 地点（自动补全）
 * - 话题（标签）
 *
 * 对标：微信朋友圈、Instagram 发布体验
 * 符合优化需求 V1.0 第 2.1 节：Moment 作为完整记录单元
 */

"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Primitives";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import type { Goal } from "@/domain/models";

interface MomentComposerProps {
  activeGoals?: Goal[];
  onSubmit: (data: {
    content: string;
    images: File[];
    people: string[];
    places: string[];
    topics: string[];
    goalIds: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
}

export function MomentComposer({ activeGoals = [], onSubmit }: MomentComposerProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [goalIds, setGoalIds] = useState<string[]>([]);

  const [addingPerson, setAddingPerson] = useState(false);
  const [addingPlace, setAddingPlace] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [selectingGoals, setSelectingGoals] = useState(false);

  const [personInput, setPersonInput] = useState("");
  const [placeInput, setPlaceInput] = useState("");
  const [topicInput, setTopicInput] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // 图片预览相关
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openImagePreview = (index: number) => {
    // 生成预览 URL
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const closeImagePreview = () => {
    // 清理 URL
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setPreviewOpen(false);
  };

  const addPerson = () => {
    const name = personInput.trim();
    if (name && !people.includes(name)) {
      setPeople((prev) => [...prev, name]);
    }
    setPersonInput("");
    setAddingPerson(false);
  };

  const addPlace = () => {
    const name = placeInput.trim();
    if (name && !places.includes(name)) {
      setPlaces((prev) => [...prev, name]);
    }
    setPlaceInput("");
    setAddingPlace(false);
  };

  const addTopic = () => {
    const name = topicInput.trim();
    if (name && !topics.includes(name)) {
      setTopics((prev) => [...prev, name]);
    }
    setTopicInput("");
    setAddingTopic(false);
  };

  const reset = () => {
    setContent("");
    setImages([]);
    setPeople([]);
    setPlaces([]);
    setTopics([]);
    setGoalIds([]);
    setError(null);
  };

  const handleSubmit = () => {
    const text = content.trim();

    // 必须有文字或图片
    if (!text && images.length === 0) {
      setError("请输入内容或添加图片");
      contentRef.current?.focus();
      return;
    }

    setError(null);

    startTransition(async () => {
      const res = await onSubmit({
        content: text,
        images,
        people,
        places,
        topics,
        goalIds,
      });

      if (res.ok) {
        reset();
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2200);
      } else {
        setError(res.error || "保存失败");
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor="capture-input">Capture</Label>
        {justSaved && (
          <span className="label-caps text-brand" role="status">
            已记下
          </span>
        )}
      </div>

      {/* 文字输入 */}
      <textarea
        id="capture-input"
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={20000}
        placeholder="现在在想什么？"
        className="mt-3.5 block w-full resize-y rounded-card border border-line bg-paper-sunken
          px-5 py-4 text-body leading-relaxed text-ink transition-colors
          duration-[var(--duration-quick)] hover:border-line-strong
          focus:border-brand focus:outline-none"
      />

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((file, i) => (
            <div key={i} className="group relative aspect-square">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="h-full w-full cursor-pointer rounded-soft object-cover transition-opacity hover:opacity-80"
                onClick={() => openImagePreview(i)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                className="absolute right-1 top-1 flex size-5 items-center justify-center
                  rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity
                  hover:bg-black/80 group-hover:opacity-100"
                aria-label="删除图片"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 元数据标签 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {people.map((p) => (
          <span
            key={p}
            className="flex items-center gap-1.5 rounded-full bg-paper-sunken px-2.5 py-1
              text-small text-ink"
          >
            <span>👤 {p}</span>
            <button
              onClick={() => setPeople((prev) => prev.filter((x) => x !== p))}
              className="text-ink-faint hover:text-danger"
              aria-label={`移除 ${p}`}
            >
              ×
            </button>
          </span>
        ))}

        {places.map((p) => (
          <span
            key={p}
            className="flex items-center gap-1.5 rounded-full bg-paper-sunken px-2.5 py-1
              text-small text-ink"
          >
            <span>📍 {p}</span>
            <button
              onClick={() => setPlaces((prev) => prev.filter((x) => x !== p))}
              className="text-ink-faint hover:text-danger"
              aria-label={`移除 ${p}`}
            >
              ×
            </button>
          </span>
        ))}

        {topics.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1.5 rounded-full bg-paper-sunken px-2.5 py-1
              text-small text-ink"
          >
            <span># {t}</span>
            <button
              onClick={() => setTopics((prev) => prev.filter((x) => x !== t))}
              className="text-ink-faint hover:text-danger"
              aria-label={`移除 ${t}`}
            >
              ×
            </button>
          </span>
        ))}

        {goalIds.map((id) => {
          const goal = activeGoals.find((g) => g.id === id);
          return goal ? (
            <span
              key={id}
              className="flex items-center gap-1.5 rounded-full bg-paper-sunken px-2.5 py-1
                text-small text-ink"
            >
              <span>🎯 {goal.title}</span>
              <button
                onClick={() => setGoalIds((prev) => prev.filter((x) => x !== id))}
                className="text-ink-faint hover:text-danger"
                aria-label={`移除目标 ${goal.title}`}
              >
                ×
              </button>
            </span>
          ) : null;
        })}
      </div>

      {error && (
        <p role="alert" className="mt-2.5 text-small text-danger">
          {error}
        </p>
      )}

      {/* 操作按钮 */}
      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={handleSubmit} disabled={pending}>
          {pending ? "保存中…" : "记下"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageSelect(e.target.files)}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-small text-ink-soft hover:text-brand
            transition-colors"
        >
          📷 图片
        </button>

        {addingPerson ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={personInput}
              onChange={(e) => setPersonInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
              placeholder="人名"
              autoFocus
              className="w-24 rounded-soft border border-line bg-paper-sunken px-2 py-1
                text-small text-ink focus:border-brand focus:outline-none"
            />
            <button onClick={addPerson} className="text-small text-brand">
              ✓
            </button>
            <button
              onClick={() => setAddingPerson(false)}
              className="text-small text-ink-faint"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingPerson(true)}
            className="flex items-center gap-1.5 text-small text-ink-soft hover:text-brand
              transition-colors"
          >
            👤 人物
          </button>
        )}

        {addingPlace ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlace()}
              placeholder="地点"
              autoFocus
              className="w-24 rounded-soft border border-line bg-paper-sunken px-2 py-1
                text-small text-ink focus:border-brand focus:outline-none"
            />
            <button onClick={addPlace} className="text-small text-brand">
              ✓
            </button>
            <button
              onClick={() => setAddingPlace(false)}
              className="text-small text-ink-faint"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingPlace(true)}
            className="flex items-center gap-1.5 text-small text-ink-soft hover:text-brand
              transition-colors"
          >
            📍 地点
          </button>
        )}

        {addingTopic ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              placeholder="话题"
              autoFocus
              className="w-24 rounded-soft border border-line bg-paper-sunken px-2 py-1
                text-small text-ink focus:border-brand focus:outline-none"
            />
            <button onClick={addTopic} className="text-small text-brand">
              ✓
            </button>
            <button
              onClick={() => setAddingTopic(false)}
              className="text-small text-ink-faint"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingTopic(true)}
            className="flex items-center gap-1.5 text-small text-ink-soft hover:text-brand
              transition-colors"
          >
            # 话题
          </button>
        )}

        {/* Goal 选择 */}
        {activeGoals.length > 0 && (
          selectingGoals ? (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const id = e.target.value;
                  if (id && !goalIds.includes(id)) {
                    setGoalIds((prev) => [...prev, id]);
                  }
                  e.target.value = "";
                }}
                className="rounded-soft border border-line bg-paper-sunken px-2 py-1
                  text-small text-ink focus:border-brand focus:outline-none"
              >
                <option value="">选择目标...</option>
                {activeGoals.filter((g) => !goalIds.includes(g.id)).map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSelectingGoals(false)}
                className="text-small text-ink-faint"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSelectingGoals(true)}
              className="flex items-center gap-1.5 text-small text-ink-soft hover:text-brand
                transition-colors"
            >
              🎯 目标
            </button>
          )
        )}

        <span className="text-small text-ink-muted">⌘ + Enter 快速保存</span>
      </div>

      {/* 图片预览 Lightbox */}
      {previewOpen && (
        <ImageLightbox
          images={previewUrls}
          initialIndex={previewIndex}
          onClose={closeImagePreview}
        />
      )}
    </section>
  );
}
