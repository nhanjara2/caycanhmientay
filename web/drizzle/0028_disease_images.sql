CREATE TABLE "disease_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"disease_slug" text NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disease_images_file_unique" UNIQUE("file")
);
--> statement-breakpoint
ALTER TABLE "disease_images" ADD CONSTRAINT "disease_images_disease_slug_diseases_slug_fk" FOREIGN KEY ("disease_slug") REFERENCES "public"."diseases"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "disease_images_disease_idx" ON "disease_images" USING btree ("disease_slug");--> statement-breakpoint
ALTER TABLE "disease_images" ENABLE ROW LEVEL SECURITY;