ALTER TABLE "reading_goal" ADD COLUMN IF NOT EXISTS "period" text NOT NULL DEFAULT 'daily';
--> statement-breakpoint
ALTER TABLE "reading_goal" ADD COLUMN IF NOT EXISTS "daily_pages" integer;
--> statement-breakpoint
ALTER TABLE "reading_goal" ADD COLUMN IF NOT EXISTS "daily_seconds" integer;
--> statement-breakpoint
ALTER TABLE "reading_goal" ADD COLUMN IF NOT EXISTS "duration" integer;
--> statement-breakpoint
UPDATE "reading_goal" SET "daily_pages" = "daily_target" WHERE "type" = 'daily_verses';
--> statement-breakpoint
UPDATE "reading_goal" SET "type" = 'pages' WHERE "type" = 'daily_verses';
--> statement-breakpoint
ALTER TABLE "reading_goal" DROP COLUMN IF EXISTS "daily_target";
