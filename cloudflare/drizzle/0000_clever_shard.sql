CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt` integer NOT NULL,
	`lease_until` integer,
	`attempt_id` text,
	`last_error` text,
	`telegram_message_id` integer
);
--> statement-breakpoint
CREATE INDEX `idx_leads_pending` ON `leads` (`status`,`next_attempt`);--> statement-breakpoint
CREATE INDEX `idx_leads_expiry` ON `leads` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_leads_created` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `lead_limits` (
	`scope` text NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`scope`, `bucket`)
);
--> statement-breakpoint
CREATE INDEX `idx_lead_limits_expiry` ON `lead_limits` (`expires_at`);