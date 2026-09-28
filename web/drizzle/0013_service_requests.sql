CREATE TABLE "service_request_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_request_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_request_photos_file_unique" UNIQUE("file")
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" text NOT NULL,
	"space" text,
	"area" integer,
	"sun" text,
	"styles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"budget" text,
	"slot_date" text,
	"slot_time" text,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"note" text,
	"user_id" integer,
	"source" text DEFAULT 'web' NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"stage_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assignee_id" integer,
	"contacted_at" timestamp with time zone,
	"survey_at" timestamp with time zone,
	"value" integer,
	"quoted_at" timestamp with time zone,
	"lost_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_request_events" ADD CONSTRAINT "service_request_events_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_request_photos" ADD CONSTRAINT "service_request_photos_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_request_events_req_idx" ON "service_request_events" USING btree ("request_id","id");--> statement-breakpoint
CREATE INDEX "service_request_photos_req_idx" ON "service_request_photos" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "service_requests_stage_idx" ON "service_requests" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "service_requests_phone_idx" ON "service_requests" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "service_requests_slot_idx" ON "service_requests" USING btree ("slot_date","slot_time");--> statement-breakpoint
ALTER TABLE "service_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "service_request_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "service_request_events" ENABLE ROW LEVEL SECURITY;