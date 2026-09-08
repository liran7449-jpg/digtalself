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
  energy: text("energy"),
  focus: text("focus"),
  theme: text("theme"),
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
    type: text("type").notNull().default("thought"),
    status: text("status").notNull().default("saved"),
    content: text("content").notNull().default(""),
    mediaPaths: text("media_paths", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    mood: text("mood"),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    place: text("place"),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    importance: integer("importance").notNull().default(3),
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
