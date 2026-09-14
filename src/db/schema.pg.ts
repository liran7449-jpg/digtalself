/**
 * Drizzle schema for PostgreSQL
 *
 * 与 schema.ts (SQLite) 保持相同的表结构，但使用 PostgreSQL 数据类型
 */

import { sql } from "drizzle-orm";
import {
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

/** MVP 是单用户产品，这张表只会有一行，id 固定为 'me'。 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  occupation: text("occupation"),
  location: text("location"),
  createdAt,
  updatedAt,
});

export const days = pgTable("days", {
  date: text("date").primaryKey(),
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
});

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
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
});

export const planItems = pgTable(
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
  (t) => [index("plan_items_date_idx").on(t.date, t.sortOrder)],
);

export const moments = pgTable(
  "moments",
  {
    id: text("id").primaryKey(),
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
    index("moments_date_idx").on(t.date),
    index("moments_occurred_at_idx").on(t.occurredAt),
  ],
);

export const memories = pgTable(
  "memories",
  {
    id: text("id").primaryKey(),
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
  (t) => [index("memories_status_idx").on(t.status, t.importance)],
);

export const insights = pgTable(
  "insights",
  {
    id: text("id").primaryKey(),
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
  (t) => [index("insights_range_idx").on(t.type, t.rangeEnd)],
);

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt,
  updatedAt,
});

export const places = pgTable("places", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt,
  updatedAt,
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt,
  updatedAt,
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("me"),
  storageKey: text("storage_key").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  thumbnailKey: text("thumbnail_key"),
  createdAt,
  updatedAt,
});

export const growthEvidences = pgTable("growth_evidences", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  markedAt: timestamp("marked_at", { mode: "date", withTimezone: true }).notNull(),
  createdAt,
  updatedAt,
});

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
