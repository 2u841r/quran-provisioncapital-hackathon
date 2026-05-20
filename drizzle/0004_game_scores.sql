CREATE TABLE IF NOT EXISTS "game_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_name" text NOT NULL,
	"user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
	"score" integer NOT NULL,
	"juz_start" integer NOT NULL,
	"juz_end" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "game_scores_game_id_idx" ON "game_scores" ("game_id");
--> statement-breakpoint
CREATE INDEX "game_scores_score_idx" ON "game_scores" ("game_id", "score" DESC);
