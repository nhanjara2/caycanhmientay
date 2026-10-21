CREATE TABLE "search_queries" (
	"day" text NOT NULL,
	"q" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"results" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "search_queries_day_q_pk" PRIMARY KEY("day","q")
);
--> statement-breakpoint
ALTER TABLE "search_queries" ENABLE ROW LEVEL SECURITY;
