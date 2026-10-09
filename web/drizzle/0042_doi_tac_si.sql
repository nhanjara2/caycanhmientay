ALTER TABLE "orders" ADD COLUMN "partner_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "need_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_type" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tax_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_area" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_at" timestamp with time zone;