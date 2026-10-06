ALTER TABLE "orders" ADD COLUMN "channel" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "store_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;