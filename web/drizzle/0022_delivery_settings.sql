CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"slot_key" text NOT NULL,
	"vehicle" text NOT NULL,
	"name" text NOT NULL,
	"driver_id" integer,
	"helper" text,
	"capacity" integer NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "slot_date" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "slot_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trip_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trip_pos" integer;--> statement-breakpoint
ALTER TABLE "delivery_trips" ADD CONSTRAINT "delivery_trips_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_trips_date_idx" ON "delivery_trips" USING btree ("date","slot_key");--> statement-breakpoint
CREATE INDEX "delivery_trips_driver_idx" ON "delivery_trips" USING btree ("driver_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_trip_id_delivery_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."delivery_trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_slot_idx" ON "orders" USING btree ("slot_date","slot_key");--> statement-breakpoint
CREATE INDEX "orders_trip_idx" ON "orders" USING btree ("trip_id");--> statement-breakpoint
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "delivery_trips" ENABLE ROW LEVEL SECURITY;
