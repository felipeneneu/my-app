PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_documents` (
	`id` text PRIMARY KEY,
	`project_id` text,
	`type` text NOT NULL,
	`content_json` text NOT NULL,
	CONSTRAINT `fk_documents_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_documents`(`id`, `project_id`, `type`, `content_json`) SELECT `id`, `project_id`, `type`, `content_json` FROM `documents`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
ALTER TABLE `__new_documents` RENAME TO `documents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;