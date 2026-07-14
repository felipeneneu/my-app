CREATE TABLE `achievements` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`condition_type` text NOT NULL,
	`condition_value` integer NOT NULL,
	`xp_bonus` integer DEFAULT 100 NOT NULL,
	`icon` text,
	`unlocked_at` text
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`label` text DEFAULT 'Principal' NOT NULL,
	`cep` text,
	`street` text,
	`number` text,
	`neighborhood` text,
	`city` text,
	`state` text,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_addresses_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `client_contacts` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`type` text DEFAULT 'note' NOT NULL,
	`subject` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_client_contacts_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`os_id` text,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`method` text DEFAULT 'pix' NOT NULL,
	`note` text,
	`receipt_id` text,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_payments_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_payments_os_id_documents_id_fk` FOREIGN KEY (`os_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_payments_receipt_id_documents_id_fk` FOREIGN KEY (`receipt_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `personal_access_tokens` (
	`id` text PRIMARY KEY,
	`token` text NOT NULL UNIQUE,
	`name` text DEFAULT 'Mobile Access' NOT NULL,
	`last_used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_deliverables` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`url` text,
	`status` text DEFAULT 'online' NOT NULL,
	`type` text DEFAULT 'site' NOT NULL,
	`delivery_date` text,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `standard_fases` (
	`id` text PRIMARY KEY,
	`nome` text NOT NULL,
	`prazo_dias` integer DEFAULT 15 NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_schedule` (
	`id` text PRIMARY KEY,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`block_type` text DEFAULT 'work' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `document_type` text DEFAULT 'cpf';--> statement-breakpoint
ALTER TABLE `clients` ADD `cep` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `street` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `number` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `neighborhood` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `city` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `state` text;--> statement-breakpoint
ALTER TABLE `milestones` ADD `estimated_hours` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `total_hours` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `estimated_hours` integer;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `focus_blocks` text;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `streak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `multa_atraso_pct` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `juros_mora_pct_mes` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `valor_hora_tecnica` integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `multa_rescisao_pct` integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `prazo_entrega_material_dias` integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `foro_cidade` text DEFAULT 'São Paulo/SP' NOT NULL;