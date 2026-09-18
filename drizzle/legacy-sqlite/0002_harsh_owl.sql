ALTER TABLE `plan_items` ADD `priority` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `plan_items` ADD `carried_from_id` text;--> statement-breakpoint
ALTER TABLE `plan_items` ADD `carry_count` integer DEFAULT 0 NOT NULL;