CREATE TABLE `fixed_costs` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text DEFAULT 'Software' NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`attribute` text NOT NULL,
	`xp_reward` integer DEFAULT 50 NOT NULL,
	`gold_reward` integer DEFAULT 30 NOT NULL,
	`category` text DEFAULT 'Geral' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`label` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	CONSTRAINT `fk_milestones_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `revenues` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`label` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_revenues_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
