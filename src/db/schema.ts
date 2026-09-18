/**
 * Drizzle schema for PostgreSQL
 *
 * 与 schema.ts (SQLite) 保持相同的表结构，但使用 PostgreSQL 数据类型
 */

import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { mode: "date", withTimezone: true })
  .notNull()
  .default(sql`now()`);

const updatedAt = timestamp("updated_at", { mode: "date", withTimezone: true })
  .notNull()
  .default(sql`now()`)
  .$onUpdate(() => sql`now()`);

/**
 * 用户表。多用户支持：每个人一行，密码存这里而不是环境变量，
 * 这样用户能自己改密码，不需要重新部署。
 *
 * 首位用户 id 固定为 'me'（历史数据归属），后续用户用 ULID。
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  /**
   * 登录标识，唯一。跟显示名分开是有意的：
   * `name` 是给人看的，可以随时改、可以重名；username 是身份，
   * 拿它查库定位账号。两者混用会导致「改个昵称就登不进去」。
   *
   * 统一小写存储（建号脚本负责规范化），避免 Ran / ran 被当成两个人。
   */
  username: text("username").notNull().unique(),
  /** bcrypt 哈希。绝不存明文。 */
  passwordHash: text("password_hash"),
  /**
   * 首次登录强制改密码。
   * 管理员建号时给临时密码，用户首次登录后必须改掉，
   * 改完管理员就不知道对方密码了。
   */
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  occupation: text("occupation"),
  location: text("location"),
  createdAt,
  updatedAt,
});

/**
 * Day 表。主键从单 date 改为 (userId, date) 复合主键 ——
 * 两个用户可以有同一天的记录，各自独立。
 */
export const days = pgTable(
  "days",
  {
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    status: text("status").notNull().default("not_started"),
    mood: text("mood"),
    focus: text("focus"),
    theme: text("theme"),
    eveningMood: text("evening_mood"),
    stayedWithYou: text("stayed_with_you"),
    learned: text("learned"),
    reflectedAt: timestamp("reflected_at", { mode: "date", withTimezone: true }),
    carryDismissed: boolean("carry_dismissed").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
);

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    type: text("type").notNull().default("personal"),
    priority: integer("priority").notNull().default(3),
    startDate: text("start_date"),
    targetDate: text("target_date"),
    completedDate: text("completed_date"),
    parentGoalId: text("parent_goal_id"),
    createdAt,
    updatedAt,
  },
  (t) => [index("goals_user_status_idx").on(t.userId, t.status)],
);

export const planItems = pgTable(
  "plan_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("work"),
    status: text("status").notNull().default("planned"),
    priority: text("priority").notNull().default("normal"),
    startAt: text("start_at"),
    durationMin: integer("duration_min"),
    fromAi: boolean("from_ai").notNull().default(false),
    carriedFromId: text("carried_from_id"),
    carryCount: integer("carry_count").notNull().default(0),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("plan_items_user_date_idx").on(t.userId, t.date, t.sortOrder),
    // 复合外键：days 主键是 (userId, date)
    foreignKey({
      columns: [t.userId, t.date],
      foreignColumns: [days.userId, days.date],
      name: "plan_items_user_date_fk",
    }).onDelete("cascade"),
  ],
);

export const moments = pgTable(
  "moments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    status: text("status").notNull().default("saved"),
    content: text("content").notNull().default(""),
    mediaPaths: jsonb("media_paths").$type<string[]>().notNull().default([]),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true }).notNull(),
    mood: text("mood"),
    type: text("type").notNull().default("thought"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    place: text("place"),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    importance: integer("importance").notNull().default(3),
    isMemory: boolean("is_memory").notNull().default(false),
    whyItMatters: text("why_it_matters"),
    aiSummary: text("ai_summary"),
    createdAt,
    updatedAt,
  },
  (t) => [
    // 索引都带 userId 前缀：查询总是先按用户过滤
    index("moments_user_date_idx").on(t.userId, t.date),
    index("moments_user_occurred_idx").on(t.userId, t.occurredAt),
  ],
);

export const memories = pgTable(
  "memories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    content: text("content").notNull(),
    status: text("status").notNull().default("candidate"),
    sourceIds: jsonb("source_ids").$type<string[]>().notNull().default([]),
    confidence: real("confidence").notNull().default(0.5),
    importance: integer("importance").notNull().default(3),
    userConfirmed: boolean("user_confirmed").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [index("memories_user_status_idx").on(t.userId, t.status, t.importance)],
);

export const insights = pgTable(
  "insights",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().notNull().default([]),
    confidence: real("confidence").notNull().default(0.5),
    rangeStart: text("range_start").notNull(),
    rangeEnd: text("range_end").notNull(),
    userFeedback: text("user_feedback").notNull().default("unrated"),
    createdAt,
  },
  (t) => [index("insights_user_range_idx").on(t.userId, t.type, t.rangeEnd)],
);

export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (t) => [index("people_user_name_idx").on(t.userId, t.name)],
);

export const places = pgTable(
  "places",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (t) => [index("places_user_name_idx").on(t.userId, t.name)],
);

export const topics = pgTable(
  "topics",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("topics_user_name_idx").on(t.userId, t.name)],
);

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    type: text("type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    thumbnailKey: text("thumbnail_key"),
    createdAt,
    updatedAt,
  },
  (t) => [index("media_user_idx").on(t.userId)],
);

export const growthEvidences = pgTable(
  "growth_evidences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .default("me")
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    sourceType: text("source_type"),
    sourceId: text("source_id"),
    markedAt: timestamp("marked_at", { mode: "date", withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("growth_evidences_user_idx").on(t.userId, t.markedAt)],
);

/** Moment ↔ Person 多对多 */
export const momentPeople = pgTable(
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
export const momentPlaces = pgTable(
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
export const momentTopics = pgTable(
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

/** Moment ↔ Goal 多对多 */
export const momentGoals = pgTable(
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

/** Moment ↔ Media 多对多 */
export const momentMedia = pgTable(
  "moment_media",
  {
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.momentId, t.mediaId] }),
  }),
);
