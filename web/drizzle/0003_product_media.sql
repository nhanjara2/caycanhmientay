CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_slug" text NOT NULL,
	"idx" integer NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_file_unique" UNIQUE("file")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "youtube_id" text;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_slug_products_slug_fk" FOREIGN KEY ("product_slug") REFERENCES "public"."products"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_images_slug_idx" ON "product_images" USING btree ("product_slug","idx");--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;