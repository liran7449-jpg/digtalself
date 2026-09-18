CREATE TABLE "days" (
	"date" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"mood" text,
	"focus" text,
	"theme" text,
	"evening_mood" text,
	"stayed_with_you" text,
	"learned" text,
	"reflected_at" timestamp with time zone,
	"carry_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"type" text DEFAULT 'personal' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"start_date" text,
	"target_date" text,
	"completed_date" text,
	"parent_goal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_evidences" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"source_type" text,
	"source_id" text,
	"marked_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"range_start" text NOT NULL,
	"range_end" text NOT NULL,
	"user_feedback" text DEFAULT 'unrated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'me' NOT NULL,
	"storage_key" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"thumbnail_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'candidate' NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"importance" integer DEFAULT 3 NOT NULL,
	"user_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moment_goals" (
	"moment_id" text NOT NULL,
	"goal_id" text NOT NULL,
	CONSTRAINT "moment_goals_moment_id_goal_id_pk" PRIMARY KEY("moment_id","goal_id")
);
--> statement-breakpoint
CREATE TABLE "moment_media" (
	"moment_id" text NOT NULL,
	"media_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "moment_media_moment_id_media_id_pk" PRIMARY KEY("moment_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "moment_people" (
	"moment_id" text NOT NULL,
	"person_id" text NOT NULL,
	CONSTRAINT "moment_people_moment_id_person_id_pk" PRIMARY KEY("moment_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "moment_places" (
	"moment_id" text NOT NULL,
	"place_id" text NOT NULL,
	CONSTRAINT "moment_places_moment_id_place_id_pk" PRIMARY KEY("moment_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "moment_topics" (
	"moment_id" text NOT NULL,
	"topic_id" text NOT NULL,
	CONSTRAINT "moment_topics_moment_id_topic_id_pk" PRIMARY KEY("moment_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "moments" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'saved' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"media_paths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"mood" text,
	"type" text DEFAULT 'thought' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"place" text,
	"goal_id" text,
	"importance" integer DEFAULT 3 NOT NULL,
	"is_memory" boolean DEFAULT false NOT NULL,
	"why_it_matters" text,
	"ai_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_items" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'work' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"start_at" text,
	"duration_min" integer,
	"from_ai" boolean DEFAULT false NOT NULL,
	"carried_from_id" text,
	"carry_count" integer DEFAULT 0 NOT NULL,
	"goal_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"avatar_url" text,
	"bio" text,
	"occupation" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "moment_goals" ADD CONSTRAINT "moment_goals_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_goals" ADD CONSTRAINT "moment_goals_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_media" ADD CONSTRAINT "moment_media_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_media" ADD CONSTRAINT "moment_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_people" ADD CONSTRAINT "moment_people_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_people" ADD CONSTRAINT "moment_people_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_places" ADD CONSTRAINT "moment_places_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_places" ADD CONSTRAINT "moment_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_topics" ADD CONSTRAINT "moment_topics_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_topics" ADD CONSTRAINT "moment_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_date_days_date_fk" FOREIGN KEY ("date") REFERENCES "public"."days"("date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insights_range_idx" ON "insights" USING btree ("type","range_end");--> statement-breakpoint
CREATE INDEX "memories_status_idx" ON "memories" USING btree ("status","importance");--> statement-breakpoint
CREATE INDEX "moments_date_idx" ON "moments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "moments_occurred_at_idx" ON "moments" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "plan_items_date_idx" ON "plan_items" USING btree ("date","sort_order");