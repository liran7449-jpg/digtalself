/**
 * Drizzle schema。对应 src/domain/models.ts。
 *
 * 约定：
 * - 时间统一存 unix 毫秒整数，读出时转 Date（timestamp_ms mode）
 * - 数组和 media 路径存 JSON 文本，SQLite 没有原生数组类型
 * - Day 主键是 "YYYY-MM-DD" 字符串，不是自增 id
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const createdAt = integer("created_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`);

const updatedAt = integer("updated_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`);

/** MVP 是单用户产品，这张表只会有一行，id 固定为 'me'。 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  occupation: text("occupation"),
  location: text("location"),
  interests: text("interests", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  values: text("values", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  currentFocus: text("current_focus"),
  onboardedAt: integer("onboarded_at", { mode: "timestamp_ms" }),
  createdAt,
  updatedAt,
});

export const days = sqliteTable("days", {
  date: text("date").primaryKey(),
  status: text("status").notNull().default("not_started"),
  mood: text("mood"),
  focus: text("focus"),
  theme: text("theme"),
  /**
   * 晚上的心情。刻意不覆盖早上那个 mood ——
   * 两个一起看才能看出一天的走向。
   */
  eveningMood: text("evening_mood"),
  /** 「今天什么留在了心里」 */
  stayedWithYou: text("stayed_with_you"),
  /** 「学到了什么」 */
  learned: text("learned"),
  /** 提交反思的时刻。非空即表示已反思，UI 转为只读。 */
  reflectedAt: integer("reflected_at", { mode: "timestamp_ms" }),
  /**
   * 用户对「把没做完的带到今天」说过「不用」。
   * 必须落库：只存客户端状态的话，刷新后提示又会冒出来。
   */
  carryDismissed: integer("carry_dismissed", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt,
  updatedAt,
});

export const planItems = sqliteTable(
  "plan_items",
  {
    id: text("id").primaryKey(),
    date: text("date")
      .notNull()
      .references(() => days.date, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("work"),
    status: text("status").notNull().default("planned"),
    priority: text("priority").notNull().default("normal"),
    startAt: text("start_at"),
    durationMin: integer("duration_min"),
    fromAi: integer("from_ai", { mode: "boolean" }).notNull().default(false),
    /**
     * 顺延来源：指向前一天那条未完成的项。
     * 用复制而非改日期，否则昨天的 Day 视图会显示这件事从未存在过。
     * 不设外键：源项被删除后，顺延链的历史仍然成立。
     */
    carriedFromId: text("carried_from_id"),
    /** 被顺延过几次。摆在明面上，让用户自己决定是不是该放掉它。 */
    carryCount: integer("carry_count").notNull().default(0),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [index("plan_items_date_idx").on(t.date, t.sortOrder)],
);

export const moments = sqliteTable(
  "moments",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    status: text("status").notNull().default("saved"),
    content: text("content").notNull().default(""),
    mediaPaths: text("media_paths", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    mood: text("mood"),
    /** Moment 类型：thought / diary / photo / event / person / place / idea */
    type: text("type").notNull().default("thought"),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    place: text("place"),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    importance: integer("importance").notNull().default(3),
    /**
     * @deprecated 用 memories 表判断，不再用这个字段。
     * 保留是为了不破坏现有数据，但新代码不该再写入。
     */
    isMemory: integer("is_memory", { mode: "boolean" }).notNull().default(false),
    /** IA 第 17 节 Level 3：用户自己补的「为什么重要」，与 AI 生成的 aiSummary 分开存 */
    whyItMatters: text("why_it_matters"),
    aiSummary: text("ai_summary"),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("moments_date_idx").on(t.date, t.occurredAt),
    index("moments_occurred_idx").on(t.occurredAt),
  ],
);

export const goals = sqliteTable(
  "goals",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    why: text("why"),
    desiredIdentity: text("desired_identity"),
    outcome: text("outcome"),
    status: text("status").notNull().default("draft"),
    progress: real("progress").notNull().default(0),
    startDate: text("start_date"),
    targetDate: text("target_date"),
    createdAt,
    updatedAt,
  },
  (t) => [index("goals_status_idx").on(t.status)],
);

export const memories = sqliteTable(
  "memories",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    category: text("category").notNull(),
    status: text("status").notNull().default("candidate"),
    sourceIds: text("source_ids", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    confidence: real("confidence").notNull().default(0.5),
    importance: integer("importance").notNull().default(3),
    userConfirmed: integer("user_confirmed", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt,
    updatedAt,
  },
  (t) => [index("memories_status_idx").on(t.status, t.importance)],
);

export const insights = sqliteTable(
  "insights",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    evidenceIds: text("evidence_ids", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    confidence: real("confidence").notNull().default(0.5),
    rangeStart: text("range_start").notNull(),
    rangeEnd: text("range_end").notNull(),
    userFeedback: text("user_feedback").notNull().default("unrated"),
    createdAt,
  },
  (t) => [index("insights_range_idx").on(t.type, t.rangeEnd)],
);

/** People: 出现在 Moments 中的人 */
export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"), // 关于这个人的备注
  createdAt,
  updatedAt,
});

/** Places: 出现在 Moments 中的地点 */
export const places = sqliteTable("places", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt,
  updatedAt,
});

/** Topics: Moments 的主题标签 */
export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt,
  updatedAt,
});

/** Media: 照片、文件等媒体资源 */
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("me"),
  /** 存储路径：data/media/{userId}/{yyyy}/{MM}/{filename} */
  storageKey: text("storage_key").notNull(),
  /** MIME type */
  type: text("type").notNull(),
  /** 文件大小（字节） */
  size: integer("size").notNull(),
  /** 图片宽度（非图片为 null） */
  width: integer("width"),
  /** 图片高度（非图片为 null） */
  height: integer("height"),
  /** 缩略图路径（如果生成了） */
  thumbnailKey: text("thumbnail_key"),
  createdAt,
  updatedAt,
});

/**
 * Growth Evidence: 成长证据（预留表，UI 暂不实现）
 * 未来用于 Me 页面的 WHO I'M BECOMING 板块。
 */
export const growthEvidences = sqliteTable("growth_evidences", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  sourceType: text("source_type"), // 'moment' | 'goal' | ...
  sourceId: text("source_id"),
  markedAt: integer("marked_at", { mode: "timestamp_ms" }).notNull(),
  createdAt,
  updatedAt,
});

/** Moment ↔ Person 多对多 */
export const momentPeople = sqliteTable(
  "moment_people",
  {
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.momentId, t.personId] }),
  }),
);

/** Moment ↔ Place 多对多 */
export const momentPlaces = sqliteTable(
  "moment_places",
  {
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    placeId: text("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.momentId, t.placeId] }),
  }),
);

/** Moment ↔ Topic 多对多 */
export const momentTopics = sqliteTable(
  "moment_topics",
  {
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.momentId, t.topicId] }),
  }),
);

/** Moment ↔ Goal 多对多（goals 表已存在，只加关联表） */
export const momentGoals = sqliteTable(
  "moment_goals",
  {
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.momentId, t.goalId] }),
  }),
);

/** Moment ↔ Media 多对多（一个 Moment 可以有多张照片） */
export const momentMedia = sqliteTable(
  "moment_media",
  {
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    /** 在 Moment 中的排序 */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.momentId, t.mediaId] }),
  }),
);
