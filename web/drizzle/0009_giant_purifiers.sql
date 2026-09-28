CREATE TABLE "garden_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" integer NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "garden_photos_file_unique" UNIQUE("file")
);
--> statement-breakpoint
CREATE TABLE "garden_plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"order_item_id" integer NOT NULL,
	"planted_at" timestamp with time zone NOT NULL,
	"nickname" text,
	"location" text,
	"status" text DEFAULT 'healthy' NOT NULL,
	"last_watered_at" timestamp with time zone,
	"last_fertilized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "garden_plants_order_item_id_unique" UNIQUE("order_item_id")
);
--> statement-breakpoint
ALTER TABLE "garden_photos" ADD CONSTRAINT "garden_photos_plant_id_garden_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."garden_plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garden_plants" ADD CONSTRAINT "garden_plants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garden_plants" ADD CONSTRAINT "garden_plants_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "garden_photos_plant_idx" ON "garden_photos" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "garden_plants_user_idx" ON "garden_plants" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "garden_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "garden_plants" ENABLE ROW LEVEL SECURITY;