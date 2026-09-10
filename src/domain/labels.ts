/**
 * Mood 的展示标签。
 *
 * 放在领域层而不是组件里：这些常量服务端和客户端都要读，
 * 而从 "use client" 模块 import 常量到服务端组件时，数组过不了 RSC 边界
 * （只有导出的组件函数会被转成引用，其他值会变成 undefined）。
 */

import type { Mood, MomentType, PlanPriority } from "./enums";

/** 三色系统：好 / 一般 / 不好 */
export const MOOD_LABELS: Record<Mood, { label: string; zh: string; color: string }> =
  {
    good: { label: "Good", zh: "好", color: "bg-green-500" },
    okay: { label: "Okay", zh: "一般", color: "bg-yellow-500" },
    bad: { label: "Bad", zh: "不好", color: "bg-red-500" },
  };

/**
 * 优先级标签。
 *
 * 视觉上刻意单色：不引入红黄绿。三档里 normal 不渲染任何标记 ——
 * 只标偏离常态的，全都挂徽标就成了看板噪音（Product Bible 29.3）。
 */
export const PRIORITY_LABELS: Record<
  PlanPriority,
  { label: string; zh: string }
> = {
  high: { label: "High", zh: "要紧" },
  normal: { label: "Normal", zh: "普通" },
  low: { label: "Low", zh: "不急" },
};

/** Moment 类型的中文说明。PRD 5.3 的九种类型。 */
export const MOMENT_TYPE_LABELS: Record<MomentType, { label: string; zh: string }> =
  {
    diary: { label: "Diary", zh: "日记" },
    thought: { label: "Thought", zh: "想法" },
    photo: { label: "Photo", zh: "照片" },
    event: { label: "Event", zh: "事件" },
    achievement: { label: "Achievement", zh: "成就" },
    feeling: { label: "Feeling", zh: "感受" },
    trip: { label: "Trip", zh: "旅行" },
    conversation: { label: "Conversation", zh: "对话" },
    other: { label: "Other", zh: "其他" },
  };
