/**
 * 领域模型。PRD 第 5 节 Core Data Objects。
 * Zod schema 是运行时边界（表单输入、AI 输出）的唯一校验来源，
 * TS 类型从 schema 推导，不手写两份。
 */

import { z } from "zod";
import {
  DAY_STATUS_VALUES,
  ENERGY_VALUES,
  GOAL_STATUS_VALUES,
  INSIGHT_FEEDBACK_VALUES,
  INSIGHT_TYPE_VALUES,
  MEMORY_CATEGORY_VALUES,
  MEMORY_STATUS_VALUES,
  MOMENT_STATUS_VALUES,
  MOMENT_TYPE_VALUES,
  MOOD_VALUES,
  PLAN_KIND_VALUES,
  PLAN_PRIORITY_VALUES,
  PLAN_STATUS_VALUES,
} from "./enums";
import { isDayKey } from "./day-key";

const dayKey = z.string().refine(isDayKey, "必须是合法的 YYYY-MM-DD");
const id = z.string().min(1);
const ts = z.date();

// ---------------------------------------------------------------- User
export const userSchema = z.object({
  id,
  name: z.string().max(80).nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().max(2000).nullable(),
  occupation: z.string().max(120).nullable(),
  location: z.string().max(120).nullable(),
  interests: z.array(z.string().max(60)),
  values: z.array(z.string().max(60)),
  currentFocus: z.string().max(280).nullable(),
  onboardedAt: ts.nullable(),
  createdAt: ts,
  updatedAt: ts,
});
export type User = z.infer<typeof userSchema>;

// ---------------------------------------------------------------- Day
export const daySchema = z.object({
  date: dayKey,
  status: z.enum(DAY_STATUS_VALUES),
  mood: z.enum(MOOD_VALUES).nullable(),
  energy: z.enum(ENERGY_VALUES).nullable(),
  focus: z.string().max(280).nullable(),
  theme: z.string().max(120).nullable(),
  /** 晚上的心情，不覆盖早上那个 —— 两个一起看才有一天的走向 */
  eveningMood: z.enum(MOOD_VALUES).nullable(),
  stayedWithYou: z.string().max(2000).nullable(),
  learned: z.string().max(2000).nullable(),
  /** 非空即已反思。UI 据此转为只读。 */
  reflectedAt: ts.nullable(),
  /** 对「把没做完的带到今天」说过「不用」 */
  carryDismissed: z.boolean(),
  createdAt: ts,
  updatedAt: ts,
});
export type Day = z.infer<typeof daySchema>;

/** Morning Setup 三步的输入。全部可跳过 —— IA 第 6.1 节：绝不强制填写。 */
export const morningSetupSchema = z.object({
  mood: z.enum(MOOD_VALUES).nullable(),
  energy: z.enum(ENERGY_VALUES).nullable(),
  focus: z.string().trim().max(280).nullable(),
});

/**
 * 晚间反思提交。三项全可空 —— IA 第 21 节：每个问题都能跳过。
 * 上限给得比 focus 宽：这两栏是自由书写，可能写很长。
 */
export const eveningReflectionSchema = z.object({
  eveningMood: z.enum(MOOD_VALUES).nullable(),
  stayedWithYou: z.string().trim().max(2000).nullable(),
  learned: z.string().trim().max(2000).nullable(),
});
export type MorningSetupInput = z.infer<typeof morningSetupSchema>;

// ---------------------------------------------------------------- Plan Item
export const planItemSchema = z.object({
  id,
  date: dayKey,
  title: z.string().min(1).max(200),
  kind: z.enum(PLAN_KIND_VALUES),
  status: z.enum(PLAN_STATUS_VALUES),
  priority: z.enum(PLAN_PRIORITY_VALUES),
  /** "HH:mm"，null 表示不定时 */
  startAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "必须是 HH:mm")
    .nullable(),
  durationMin: z.number().int().positive().max(1440).nullable(),
  /** 来自 AI 建议而非用户自己写的 */
  fromAi: z.boolean(),
  /** 指向前一天那条未完成的项；顺延是复制，不是改日期 */
  carriedFromId: id.nullable(),
  /** 被顺延过几次 */
  carryCount: z.number().int().min(0),
  goalId: id.nullable(),
  sortOrder: z.number().int(),
  createdAt: ts,
  updatedAt: ts,
});
export type PlanItem = z.infer<typeof planItemSchema>;

// ---------------------------------------------------------------- Moment
export const momentSchema = z.object({
  id,
  /** 归属哪一天，凌晨 4 点边界，便于 Today 查询 */
  date: dayKey,
  type: z.enum(MOMENT_TYPE_VALUES),
  status: z.enum(MOMENT_STATUS_VALUES),
  content: z.string().max(20000),
  mediaPaths: z.array(z.string()),
  occurredAt: ts,
  mood: z.enum(MOOD_VALUES).nullable(),
  tags: z.array(z.string().max(40)),
  place: z.string().max(160).nullable(),
  goalId: id.nullable(),
  importance: z.number().int().min(1).max(5),
  /** 用户主动标记为值得长期记住 */
  isMemory: z.boolean(),
  /** 用户自己写的「为什么重要」，与 AI 生成的 aiSummary 严格分开 */
  whyItMatters: z.string().max(4000).nullable(),
  aiSummary: z.string().max(1000).nullable(),
  createdAt: ts,
  updatedAt: ts,
});
export type Moment = z.infer<typeof momentSchema>;

/** Quick Capture 的输入。PRD 第 10 节：最低摩擦，只有文字是必需的。
 * 注：现在支持只上传图片，所以 content 可以为空字符串 */
export const quickCaptureSchema = z.object({
  content: z.string().trim().max(20000).default(""),
  type: z.enum(MOMENT_TYPE_VALUES).default("thought"),
  mediaPaths: z.array(z.string()).default([]),
});
export type QuickCaptureInput = z.input<typeof quickCaptureSchema>;

// ---------------------------------------------------------------- Goal
export const goalSchema = z.object({
  id,
  title: z.string().min(1).max(200),
  why: z.string().max(2000).nullable(),
  desiredIdentity: z.string().max(500).nullable(),
  outcome: z.string().max(1000).nullable(),
  status: z.enum(GOAL_STATUS_VALUES),
  progress: z.number().min(0).max(1),
  startDate: dayKey.nullable(),
  targetDate: dayKey.nullable(),
  createdAt: ts,
  updatedAt: ts,
});
export type Goal = z.infer<typeof goalSchema>;

// ---------------------------------------------------------------- Memory
export const memorySchema = z.object({
  id,
  content: z.string().min(1).max(2000),
  category: z.enum(MEMORY_CATEGORY_VALUES),
  status: z.enum(MEMORY_STATUS_VALUES),
  /** 支撑这条记忆的 Moment / Day / Goal id，用于 AI 给出证据链 */
  sourceIds: z.array(id),
  confidence: z.number().min(0).max(1),
  importance: z.number().int().min(1).max(5),
  userConfirmed: z.boolean(),
  createdAt: ts,
  updatedAt: ts,
});
export type Memory = z.infer<typeof memorySchema>;

// ---------------------------------------------------------------- Insight
export const insightSchema = z.object({
  id,
  type: z.enum(INSIGHT_TYPE_VALUES),
  title: z.string().max(200),
  content: z.string().max(4000),
  evidenceIds: z.array(id),
  confidence: z.number().min(0).max(1),
  rangeStart: dayKey,
  rangeEnd: dayKey,
  userFeedback: z.enum(INSIGHT_FEEDBACK_VALUES),
  createdAt: ts,
});
export type Insight = z.infer<typeof insightSchema>;

// ---------------------------------------------------------------- Person
export const personSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  notes: z.string().max(2000).nullable(),
  createdAt: ts,
  updatedAt: ts,
});
export type Person = z.infer<typeof personSchema>;

// ---------------------------------------------------------------- Place
export const placeSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  notes: z.string().max(2000).nullable(),
  createdAt: ts,
  updatedAt: ts,
});
export type Place = z.infer<typeof placeSchema>;

// ---------------------------------------------------------------- Topic
export const topicSchema = z.object({
  id,
  name: z.string().min(1).max(60),
  createdAt: ts,
  updatedAt: ts,
});
export type Topic = z.infer<typeof topicSchema>;

// ---------------------------------------------------------------- Media
export const mediaSchema = z.object({
  id,
  userId: z.string(),
  storageKey: z.string(),
  type: z.string(), // MIME type
  size: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  thumbnailKey: z.string().nullable(),
  createdAt: ts,
  updatedAt: ts,
});
export type Media = z.infer<typeof mediaSchema>;

// ---------------------------------------------------------------- Growth Evidence
export const growthEvidenceSchema = z.object({
  id,
  content: z.string().min(1).max(2000),
  sourceType: z.string().nullable(), // 'moment' | 'goal' | ...
  sourceId: id.nullable(),
  markedAt: ts,
  createdAt: ts,
  updatedAt: ts,
});
export type GrowthEvidence = z.infer<typeof growthEvidenceSchema>;
