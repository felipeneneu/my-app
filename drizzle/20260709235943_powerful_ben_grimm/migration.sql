CREATE TABLE `products` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`estimated_hours` integer DEFAULT 0 NOT NULL,
	`material_cost` integer DEFAULT 0 NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_default_discount` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_down_payment` integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_installments` integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_signature_name` text DEFAULT 'Felipe Neneu' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_signature_role` text DEFAULT 'Full-Stack Developer & Designer' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_signature_site` text DEFAULT 'www.felipeneneu.com.br' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_signature_email` text DEFAULT 'contato@felipeneneu.com.br' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_signature_city` text DEFAULT 'São Paulo / SP' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_config` ADD `proposal_intro_message` text DEFAULT 'ESTA PROPOSTA É DIVIDIDA EM 3 ETAPAS PRINCIPAIS: BRANDING, DESIGN DE INTERFACE (UI/UX) E DESENVOLVIMENTO TECNOLÓGICO.' NOT NULL;