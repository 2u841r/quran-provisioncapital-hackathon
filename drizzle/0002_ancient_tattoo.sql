CREATE TABLE "reading_goal" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"daily_target" integer,
	"range_start" text,
	"range_end" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_goal_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "reading_goal" ADD CONSTRAINT "reading_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;