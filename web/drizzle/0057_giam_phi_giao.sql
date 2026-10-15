ALTER TABLE "orders" ADD COLUMN "plant_ship_free" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "supply_ship_free" integer DEFAULT 0 NOT NULL;