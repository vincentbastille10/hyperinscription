CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_run_id` text NOT NULL,
	`city` text NOT NULL,
	`activities_json` text NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`found_count` integer DEFAULT 0 NOT NULL,
	`demo_count` integer DEFAULT 0 NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`clicked_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_run_idx` ON `campaigns` (`external_run_id`);--> statement-breakpoint
CREATE INDEX `campaigns_status_idx` ON `campaigns` (`status`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`organization` text NOT NULL,
	`email` text NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`plan` text DEFAULT 'monthly' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`config_json` text NOT NULL,
	`google_webhook_url` text,
	`stripe_customer_id` text,
	`stripe_session_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_slug_idx` ON `clients` (`slug`);--> statement-breakpoint
CREATE INDEX `clients_email_idx` ON `clients` (`email`);--> statement-breakpoint
CREATE TABLE `demos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`organization` text NOT NULL,
	`website_url` text,
	`recipient_email` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`activity` text,
	`city` text,
	`config_json` text NOT NULL,
	`google_webhook_url` text,
	`views` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demos_slug_idx` ON `demos` (`slug`);--> statement-breakpoint
CREATE INDEX `demos_email_idx` ON `demos` (`recipient_email`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`external_id` text,
	`payload_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_type_idx` ON `events` (`event_type`);--> statement-breakpoint
CREATE INDEX `events_created_idx` ON `events` (`created_at`);--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`campaign_run_id` text,
	`organization` text NOT NULL,
	`website_url` text,
	`email` text,
	`activity` text,
	`city` text,
	`locale` text DEFAULT 'fr' NOT NULL,
	`status` text DEFAULT 'found' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`signal` text,
	`demo_slug` text,
	`last_event_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prospects_external_idx` ON `prospects` (`external_id`);--> statement-breakpoint
CREATE INDEX `prospects_score_idx` ON `prospects` (`score`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_slug` text NOT NULL,
	`organization` text NOT NULL,
	`registrant_name` text NOT NULL,
	`registrant_email` text NOT NULL,
	`registrant_phone` text,
	`fields_json` text NOT NULL,
	`selections_json` text NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`email_delivered` integer DEFAULT false NOT NULL,
	`sheet_delivered` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `registrations_slug_idx` ON `registrations` (`source_slug`);--> statement-breakpoint
CREATE INDEX `registrations_created_idx` ON `registrations` (`created_at`);