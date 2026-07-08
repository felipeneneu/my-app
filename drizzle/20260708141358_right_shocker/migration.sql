ALTER TABLE `leads` ADD `phone` text;
--> statement-breakpoint
ALTER TABLE `leads` ADD `pipeline_stage` text;
--> statement-breakpoint
ALTER TABLE `leads` ADD `notes` text;
--> statement-breakpoint
ALTER TABLE `leads` ADD `last_contact` text;
--> statement-breakpoint
ALTER TABLE `leads` ADD `contacts_count` integer DEFAULT 0 NOT NULL;
