CREATE TABLE "purchase_receipt_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" integer NOT NULL,
	"product_slug" text NOT NULL,
	"option_idx" integer NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"unit" text NOT NULL,
	"store_id" integer NOT NULL,
	"qty" integer NOT NULL,
	"unit_cost" integer,
	"lot_code" text,
	"expiry" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "purchase_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"supplier_id" integer,
	"doc_no" text,
	"note" text,
	"source" text NOT NULL,
	"lines_hash" text,
	"file_name" text,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_receipts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_moves" ADD COLUMN "receipt_id" integer;--> statement-breakpoint
ALTER TABLE "purchase_receipt_lines" ADD CONSTRAINT "purchase_receipt_lines_receipt_id_purchase_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."purchase_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipt_lines" ADD CONSTRAINT "purchase_receipt_lines_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_lines_receipt_idx" ON "purchase_receipt_lines" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "purchase_lines_product_idx" ON "purchase_receipt_lines" USING btree ("product_slug","option_idx");--> statement-breakpoint
CREATE INDEX "purchase_receipts_hash_idx" ON "purchase_receipts" USING btree ("lines_hash");--> statement-breakpoint
CREATE INDEX "purchase_receipts_created_idx" ON "purchase_receipts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_name_idx" ON "suppliers" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_receipt_id_purchase_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."purchase_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_moves_receipt_idx" ON "stock_moves" USING btree ("receipt_id");--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "purchase_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "purchase_receipt_lines" ENABLE ROW LEVEL SECURITY;
