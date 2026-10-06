CREATE TABLE "message_templates" (
	"key" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"external" boolean NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;
