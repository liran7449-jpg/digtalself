PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_moment_goals` (
	`moment_id` text NOT NULL,
	`goal_id` text NOT NULL,
	PRIMARY KEY(`moment_id`, `goal_id`),
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_moment_goals`("moment_id", "goal_id") SELECT "moment_id", "goal_id" FROM `moment_goals`;--> statement-breakpoint
DROP TABLE `moment_goals`;--> statement-breakpoint
ALTER TABLE `__new_moment_goals` RENAME TO `moment_goals`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_moment_media` (
	`moment_id` text NOT NULL,
	`media_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`moment_id`, `media_id`),
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_moment_media`("moment_id", "media_id", "sort_order") SELECT "moment_id", "media_id", "sort_order" FROM `moment_media`;--> statement-breakpoint
DROP TABLE `moment_media`;--> statement-breakpoint
ALTER TABLE `__new_moment_media` RENAME TO `moment_media`;--> statement-breakpoint
CREATE TABLE `__new_moment_people` (
	`moment_id` text NOT NULL,
	`person_id` text NOT NULL,
	PRIMARY KEY(`moment_id`, `person_id`),
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_moment_people`("moment_id", "person_id") SELECT "moment_id", "person_id" FROM `moment_people`;--> statement-breakpoint
DROP TABLE `moment_people`;--> statement-breakpoint
ALTER TABLE `__new_moment_people` RENAME TO `moment_people`;--> statement-breakpoint
CREATE TABLE `__new_moment_places` (
	`moment_id` text NOT NULL,
	`place_id` text NOT NULL,
	PRIMARY KEY(`moment_id`, `place_id`),
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_moment_places`("moment_id", "place_id") SELECT "moment_id", "place_id" FROM `moment_places`;--> statement-breakpoint
DROP TABLE `moment_places`;--> statement-breakpoint
ALTER TABLE `__new_moment_places` RENAME TO `moment_places`;--> statement-breakpoint
CREATE TABLE `__new_moment_topics` (
	`moment_id` text NOT NULL,
	`topic_id` text NOT NULL,
	PRIMARY KEY(`moment_id`, `topic_id`),
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_moment_topics`("moment_id", "topic_id") SELECT "moment_id", "topic_id" FROM `moment_topics`;--> statement-breakpoint
DROP TABLE `moment_topics`;--> statement-breakpoint
ALTER TABLE `__new_moment_topics` RENAME TO `moment_topics`;--> statement-breakpoint
ALTER TABLE `days` DROP COLUMN `energy`;