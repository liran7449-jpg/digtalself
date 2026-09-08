CREATE TABLE `days` (
	`date` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`mood` text,
	`energy` text,
	`focus` text,
	`theme` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`why` text,
	`desired_identity` text,
	`outcome` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`start_date` text,
	`target_date` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `goals_status_idx` ON `goals` (`status`);--> statement-breakpoint
CREATE TABLE `insights` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`evidence_ids` text DEFAULT '[]' NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`range_start` text NOT NULL,
	`range_end` text NOT NULL,
	`user_feedback` text DEFAULT 'unrated' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `insights_range_idx` ON `insights` (`type`,`range_end`);--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`source_ids` text DEFAULT '[]' NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`importance` integer DEFAULT 3 NOT NULL,
	`user_confirmed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `memories_status_idx` ON `memories` (`status`,`importance`);--> statement-breakpoint
CREATE TABLE `moments` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'thought' NOT NULL,
	`status` text DEFAULT 'saved' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`media_paths` text DEFAULT '[]' NOT NULL,
	`occurred_at` integer NOT NULL,
	`mood` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`place` text,
	`goal_id` text,
	`importance` integer DEFAULT 3 NOT NULL,
	`is_memory` integer DEFAULT false NOT NULL,
	`ai_summary` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `moments_date_idx` ON `moments` (`date`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `moments_occurred_idx` ON `moments` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'work' NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`start_at` text,
	`duration_min` integer,
	`from_ai` integer DEFAULT false NOT NULL,
	`goal_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`date`) REFERENCES `days`(`date`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `plan_items_date_idx` ON `plan_items` (`date`,`sort_order`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`avatar_url` text,
	`bio` text,
	`occupation` text,
	`location` text,
	`interests` text DEFAULT '[]' NOT NULL,
	`values` text DEFAULT '[]' NOT NULL,
	`current_focus` text,
	`onboarded_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
