/**
 * 枚举与状态机。
 * 来源：PRD 第 5 节 Core Data Objects、IA 第 42 节 State Machine。
 * 状态流转在这里声明成数据，业务代码只调 canTransition，不自己判断。
 */

// ---------- My State ----------
export const MOOD_VALUES = ["great", "good", "okay", "low", "heavy"] as const;
export type Mood = (typeof MOOD_VALUES)[number];

export const ENERGY_VALUES = ["low", "medium", "high"] as const;
export type Energy = (typeof ENERGY_VALUES)[number];

// ---------- Day ----------
export const DAY_STATUS_VALUES = [
  "not_started",
  "started",
  "in_progress",
  "ready_to_reflect",
  "reflected",
] as const;
export type DayStatus = (typeof DAY_STATUS_VALUES)[number];

// ---------- Plan Item（Today Timeline 上的一条） ----------
export const PLAN_STATUS_VALUES = [
  "planned",
  "in_progress",
  "completed",
  "skipped",
] as const;
export type PlanStatus = (typeof PLAN_STATUS_VALUES)[number];

export const PLAN_KIND_VALUES = ["focus", "work", "life", "rest"] as const;
export type PlanKind = (typeof PLAN_KIND_VALUES)[number];

/**
 * 优先级。normal 是默认档，UI 上不渲染任何标记 ——
 * 只有偏离常态的才需要被看见，全都挂徽标就成了噪音。
 */
export const PLAN_PRIORITY_VALUES = ["high", "normal", "low"] as const;
export type PlanPriority = (typeof PLAN_PRIORITY_VALUES)[number];

// ---------- Moment ----------
export const MOMENT_TYPE_VALUES = [
  "diary",
  "thought",
  "photo",
  "event",
  "achievement",
  "feeling",
  "trip",
  "conversation",
  "other",
] as const;
export type MomentType = (typeof MOMENT_TYPE_VALUES)[number];

export const MOMENT_STATUS_VALUES = [
  "draft",
  "saved",
  "enriched",
  "linked",
] as const;
export type MomentStatus = (typeof MOMENT_STATUS_VALUES)[number];

// ---------- Goal ----------
export const GOAL_STATUS_VALUES = [
  "draft",
  "active",
  "paused",
  "completed",
  "abandoned",
] as const;
export type GoalStatus = (typeof GOAL_STATUS_VALUES)[number];

// ---------- Memory ----------
export const MEMORY_STATUS_VALUES = [
  "candidate",
  "confirmed",
  "active",
  "forgotten",
] as const;
export type MemoryStatus = (typeof MEMORY_STATUS_VALUES)[number];

export const MEMORY_CATEGORY_VALUES = [
  "identity",
  "preference",
  "goal",
  "person",
  "experience",
  "belief",
  "interest",
  "pattern",
  "important_event",
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORY_VALUES)[number];

// ---------- Insight ----------
export const INSIGHT_TYPE_VALUES = [
  "daily",
  "weekly",
  "growth",
  "pattern",
  "goal",
  "relationship",
  "emotional",
] as const;
export type InsightType = (typeof INSIGHT_TYPE_VALUES)[number];

export const INSIGHT_FEEDBACK_VALUES = ["accurate", "off", "unrated"] as const;
export type InsightFeedback = (typeof INSIGHT_FEEDBACK_VALUES)[number];
