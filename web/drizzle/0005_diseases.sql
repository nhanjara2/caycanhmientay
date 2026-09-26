CREATE TABLE "diseases" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cause" text NOT NULL,
	"parts" jsonb NOT NULL,
	"plants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"severity" integer DEFAULT 2 NOT NULL,
	"spread" text DEFAULT '' NOT NULL,
	"season" text DEFAULT '' NOT NULL,
	"summary" text NOT NULL,
	"symptoms" jsonb NOT NULL,
	"confusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"prevention" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safety" text DEFAULT '' NOT NULL,
	"products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diseases" ENABLE ROW LEVEL SECURITY;