/**
 * Mood / Energy 的展示标签。
 *
 * 放在领域层而不是组件里：这些常量服务端和客户端都要读，
 * 而从 "use client" 模块 import 常量到服务端组件时，数组过不了 RSC 边界
 * （只有导出的组件函数会被转成引用，其他值会变成 undefined）。
 */

import type { Energy, Mood, MomentType, PlanPriority } from "./enums";

export const MOOD_LABELS: Record<Mood, { label: string; zh: string; dot: string }> =
  {
    great: { label: "Great", zh: "很好", dot: "bg-mood-great" },
    good: { label: "Good", zh: "不错", dot: "bg-mood-good" },
    okay: { label: "Okay", zh: "还行", dot: "bg-mood-okay" },
    low: { label: "Low", zh: "低落", dot: "bg-mood-low" },
    heavy: { label: "Heavy", zh: "沉重", dot: "bg-mood-heavy" },
  };

export const ENERGY_LABELS: Record<Energy, { label: string; bars: 1 | 2 | 3 }> = {
  low: { label: "Low", bars: 1 },
  medium: { label: "Medium", bars: 2 },
  high: { label: "High", bars: 3 },
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
