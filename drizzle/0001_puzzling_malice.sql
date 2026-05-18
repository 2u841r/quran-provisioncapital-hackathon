CREATE TABLE "bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"verse_key" text NOT NULL,
	"collection_name" text DEFAULT 'Favorites' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_user_verse_collection" UNIQUE("user_id","verse_key","collection_name")
);
--> statement-breakpoint
CREATE TABLE "reading_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"verse_key" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_history_user_verse" UNIQUE("user_id","verse_key")
);
--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookmark_userId_idx" ON "bookmark" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reading_history_userId_idx" ON "reading_history" USING btree ("user_id");