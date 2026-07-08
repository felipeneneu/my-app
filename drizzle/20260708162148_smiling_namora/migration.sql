CREATE TABLE `briefing_notes` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_briefing_notes_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `company_info` (
	`id` text PRIMARY KEY,
	`trading_name` text DEFAULT '' NOT NULL,
	`legal_name` text DEFAULT '' NOT NULL,
	`document` text DEFAULT '' NOT NULL,
	`state_registration` text DEFAULT '',
	`cep` text DEFAULT '',
	`street` text DEFAULT '',
	`number` text DEFAULT '',
	`complement` text DEFAULT '',
	`neighborhood` text DEFAULT '',
	`city` text DEFAULT '',
	`state` text DEFAULT '',
	`phone` text DEFAULT '',
	`email` text DEFAULT '',
	`logo` text DEFAULT '',
	`bank_name` text DEFAULT '',
	`bank_agency` text DEFAULT '',
	`bank_account` text DEFAULT '',
	`pix_key` text DEFAULT '',
	`pix_key_type` text DEFAULT 'random' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_tokens` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`token` text NOT NULL UNIQUE,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_project_tokens_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
