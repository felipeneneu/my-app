CREATE TABLE `business_expenses` (
	`id` text PRIMARY KEY,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`project_id` text,
	CONSTRAINT `fk_business_expenses_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `daily_quests` (
	`id` text PRIMARY KEY,
	`description` text NOT NULL,
	`progress_current` integer DEFAULT 0 NOT NULL,
	`progress_target` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`content_json` text NOT NULL,
	CONSTRAINT `fk_documents_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `hunter_status` (
	`id` text PRIMARY KEY,
	`level` integer DEFAULT 1 NOT NULL,
	`current_xp` integer DEFAULT 0 NOT NULL,
	`max_xp` integer DEFAULT 100 NOT NULL,
	`gold_balance` integer DEFAULT 0 NOT NULL,
	`hunter_rank` text NOT NULL,
	`strength` integer DEFAULT 10 NOT NULL,
	`intelligence` integer DEFAULT 10 NOT NULL,
	`wisdom` integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY,
	`business_name` text NOT NULL,
	`email` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`client_name` text NOT NULL,
	`price` integer NOT NULL,
	`status` text NOT NULL,
	`client_morale` integer,
	`start_date` text NOT NULL
);
