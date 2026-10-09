CREATE TABLE "home_banner_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "home_banner_images_file_unique" UNIQUE("file")
);
--> statement-breakpoint
CREATE TABLE "home_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"cta" text DEFAULT '' NOT NULL,
	"href" text DEFAULT '' NOT NULL,
	"show_text" boolean DEFAULT false NOT NULL,
	"image" text NOT NULL,
	"image_mobile" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "home_banners_slot_idx" ON "home_banners" USING btree ("slot","sort");--> statement-breakpoint
ALTER TABLE "home_banners" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "home_banner_images" ENABLE ROW LEVEL SECURITY;
