-- 多用户改造：8 张核心表加 user_id，users 表加登录字段
--
-- ⚠️ 这个文件是手改过的，不是 drizzle-kit generate 的原始输出。
-- 原始输出有 3 处会直接执行失败，改动记在下面对应位置。
-- 重新 generate 会覆盖掉这些修正，改 schema 后要重新核对。

-- ============================================================
-- 1. users：加登录字段
-- ============================================================
-- 【手改 1】原始输出是 `ADD COLUMN "username" text NOT NULL`，没有默认值。
-- 库里已有一行（id='me'），加 NOT NULL 无默认值的列会违反约束直接失败。
-- 所以分三步：先可空 → 回填 → 再加 NOT NULL。
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- 回填：历史数据属于第一位用户，username 用 'ran'
-- （id='me' 是历史遗留的固定值，不适合作为登录名）
UPDATE "users" SET "username" = 'ran' WHERE "id" = 'me' AND "username" IS NULL;--> statement-breakpoint

-- 兜底：万一 users 表是空的（云端就曾经是 0 行），补出这一行，
-- 否则后面 8 张表的外键指向不存在的用户，全部失败。
INSERT INTO "users" ("id", "username", "name")
  SELECT 'me', 'ran', 'Ran'
  WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'me');--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint

-- ============================================================
-- 2. 8 张核心表加 user_id
-- ============================================================
-- DEFAULT 'me' 让现有行自动归属到第一位用户，不需要单独的回填语句。
-- 阶段 3 之后所有写入都会显式传 userId，这个默认值只为迁移存在。
ALTER TABLE "days" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "growth_evidences" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "moments" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_items" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "user_id" text DEFAULT 'me' NOT NULL;--> statement-breakpoint
-- media 已经有 user_id 列（早先加的），这里只补外键，见第 4 节

-- ============================================================
-- 3. days 主键：date → (user_id, date)
-- ============================================================
-- 【手改 2】原始输出把 ADD CONSTRAINT PRIMARY KEY 放在 ADD COLUMN
-- 之前，引用了还不存在的列，必然失败。这里调成正确顺序。
--
-- 【手改 3】原始输出把 DROP CONSTRAINT 注释掉了（drizzle-kit 拿不到
-- 主键名，让开发者自己查）。实际名字是 days_pkey，已确认。
-- 不删旧主键，ADD PRIMARY KEY 会报 "multiple primary keys"。

-- plan_items 的外键指向 days(date)，改主键前必须先解开
ALTER TABLE "plan_items" DROP CONSTRAINT "plan_items_date_days_date_fk";--> statement-breakpoint
ALTER TABLE "days" DROP CONSTRAINT "days_pkey";--> statement-breakpoint
ALTER TABLE "days" ADD CONSTRAINT "days_user_id_date_pk" PRIMARY KEY("user_id","date");--> statement-breakpoint

-- ============================================================
-- 4. 外键：全部指向 users(id)，删用户时级联清数据
-- ============================================================
ALTER TABLE "days" ADD CONSTRAINT "days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_evidences" ADD CONSTRAINT "growth_evidences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_user_date_fk" FOREIGN KEY ("user_id","date") REFERENCES "public"."days"("user_id","date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- ============================================================
-- 5. 索引：全部改成 user_id 前缀
-- ============================================================
-- 多用户下每个查询都先按用户过滤，userId 不在最左列的索引用不上。
DROP INDEX "insights_range_idx";--> statement-breakpoint
DROP INDEX "memories_status_idx";--> statement-breakpoint
DROP INDEX "moments_date_idx";--> statement-breakpoint
DROP INDEX "moments_occurred_at_idx";--> statement-breakpoint
DROP INDEX "plan_items_date_idx";--> statement-breakpoint
CREATE INDEX "goals_user_status_idx" ON "goals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "growth_evidences_user_idx" ON "growth_evidences" USING btree ("user_id","marked_at");--> statement-breakpoint
CREATE INDEX "insights_user_range_idx" ON "insights" USING btree ("user_id","type","range_end");--> statement-breakpoint
CREATE INDEX "media_user_idx" ON "media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memories_user_status_idx" ON "memories" USING btree ("user_id","status","importance");--> statement-breakpoint
CREATE INDEX "moments_user_date_idx" ON "moments" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "moments_user_occurred_idx" ON "moments" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "people_user_name_idx" ON "people" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "places_user_name_idx" ON "places" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "plan_items_user_date_idx" ON "plan_items" USING btree ("user_id","date","sort_order");--> statement-breakpoint
CREATE INDEX "topics_user_name_idx" ON "topics" USING btree ("user_id","name");
