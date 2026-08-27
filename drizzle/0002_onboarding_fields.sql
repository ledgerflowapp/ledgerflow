ALTER TABLE "profiles" ADD COLUMN "onboarding_step" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "default_workspace_mode" text DEFAULT 'personal';