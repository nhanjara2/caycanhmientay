CREATE TABLE "crawl_hits" (
	"day" text NOT NULL,
	"bot" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"section" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "crawl_hits_day_bot_verified_section_pk" PRIMARY KEY("day","bot","verified","section")
);
--> statement-breakpoint
CREATE TABLE "error_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"path" text NOT NULL,
	"message" text NOT NULL,
	"digest" text,
	"hits" integer DEFAULT 1 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "not_found_hits" (
	"path" text PRIMARY KEY NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"bot_hits" integer DEFAULT 0 NOT NULL,
	"referrer" text DEFAULT '' NOT NULL,
	"external" boolean DEFAULT false NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_vitals" (
	"day" text NOT NULL,
	"section" text NOT NULL,
	"device" text NOT NULL,
	"metric" text NOT NULL,
	"rating" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"total" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "web_vitals_day_section_device_metric_rating_pk" PRIMARY KEY("day","section","device","metric","rating")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "error_events_key" ON "error_events" USING btree ("kind","path","message");--> statement-breakpoint
CREATE INDEX "error_events_last_idx" ON "error_events" USING btree ("last_seen");--> statement-breakpoint
CREATE INDEX "not_found_hits_last_idx" ON "not_found_hits" USING btree ("last_seen");--> statement-breakpoint
ALTER TABLE "crawl_hits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "not_found_hits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "error_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "web_vitals" ENABLE ROW LEVEL SECURITY;
