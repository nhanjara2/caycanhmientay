CREATE TABLE "expense_categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_id" integer NOT NULL,
	"file" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_photos_expense_id_unique" UNIQUE("expense_id"),
	CONSTRAINT "expense_photos_file_unique" UNIQUE("file")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"spent_on" text NOT NULL,
	"category_slug" text NOT NULL,
	"amount" integer NOT NULL,
	"store_id" integer,
	"supplier_id" integer,
	"note" text,
	"recurring_id" integer,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_slug" text NOT NULL,
	"amount" integer NOT NULL,
	"store_id" integer,
	"supplier_id" integer,
	"note" text,
	"day_of_month" integer NOT NULL,
	"start_month" text NOT NULL,
	"end_month" text,
	"generated_through" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_photos" ADD CONSTRAINT "expense_photos_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_slug_expense_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."expense_categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_category_slug_expense_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."expense_categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_spent_idx" ON "expenses" USING btree ("spent_on");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_recurring_day_idx" ON "expenses" USING btree ("recurring_id","spent_on");--> statement-breakpoint
ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expense_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "expense_categories" ("slug", "name", "sort") VALUES
('mat-bang', 'Mặt bằng', 0),
('dien-nuoc', 'Điện – nước – internet', 1),
('nhan-cong', 'Nhân công', 2),
('van-chuyen', 'Vận chuyển – xăng xe', 3),
('bao-bi', 'Bao bì – đóng gói', 4),
('vat-tu-cham-soc', 'Vật tư chăm sóc vườn', 5),
('quang-cao', 'Quảng cáo', 6),
('dung-cu-sua-chua', 'Dụng cụ – sửa chữa', 7),
('khac', 'Khác', 8)
ON CONFLICT DO NOTHING;
