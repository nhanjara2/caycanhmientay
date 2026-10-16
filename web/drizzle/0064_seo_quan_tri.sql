CREATE TABLE "redirects" (
	"from_path" text PRIMARY KEY NOT NULL,
	"to_path" text NOT NULL,
	"reason" text DEFAULT 'manual' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"action" text NOT NULL,
	"detail" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actor" text DEFAULT '' NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_overrides" (
	"path" text PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"canonical" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"image" text,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_audit" ADD CONSTRAINT "seo_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "redirects_to_idx" ON "redirects" USING btree ("to_path");--> statement-breakpoint
CREATE INDEX "seo_audit_created_idx" ON "seo_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seo_audit_path_idx" ON "seo_audit" USING btree ("path");--> statement-breakpoint
ALTER TABLE "seo_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "redirects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_audit" ENABLE ROW LEVEL SECURITY;