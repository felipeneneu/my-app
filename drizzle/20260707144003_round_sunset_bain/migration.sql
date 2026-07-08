CREATE TABLE `notifications` (
	`id` text PRIMARY KEY,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'low' NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_config` (
	`id` text PRIMARY KEY,
	`workspace_name` text DEFAULT 'Studio One' NOT NULL,
	`user_name` text DEFAULT 'Felipe Neneu' NOT NULL,
	`user_email` text DEFAULT '' NOT NULL,
	`user_role` text DEFAULT 'Autônomo · Pro' NOT NULL,
	`user_initials` text DEFAULT 'FN' NOT NULL,
	`business_alias` text DEFAULT 'Jordan Diaz' NOT NULL,
	`monthly_goal` integer DEFAULT 15000 NOT NULL
);
