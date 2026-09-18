DROP INDEX `idx_leads_expiry`;--> statement-breakpoint
CREATE INDEX `idx_leads_expiry` ON `leads` (`expires_at`) WHERE "leads"."payload" IS NOT NULL;