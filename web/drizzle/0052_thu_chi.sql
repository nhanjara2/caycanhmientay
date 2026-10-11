CREATE TABLE "cash_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"entry_on" text NOT NULL,
	"amount" integer NOT NULL,
	"note" text,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cost" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "cash_entries_on_idx" ON "cash_entries" USING btree ("entry_on");--> statement-breakpoint
ALTER TABLE "cash_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Sổ Thu chi (11/10/2026, chủ shop: "chưa thấy khoản thu và tiền vốn ở đâu, lập quy trình đầy đủ thu chi").
-- Đơn đã thu tiền từ trước: lấy lần cập nhật cuối của đơn làm ngày thu (bán tại quầy = lúc bán, COD = lúc giao xong, online = lúc bấm Đã nhận tiền).
UPDATE "orders" SET "paid_at" = "updated_at" WHERE "paid" AND "paid_at" IS NULL;--> statement-breakpoint
-- Dòng hàng của đơn cũ: lấy giá gốc hiện tại của quy cách làm tiền vốn (trước đây đơn không chụp lại giá gốc).
UPDATE "order_items" oi SET "cost" = po."cost"
FROM "product_options" po
WHERE po."product_slug" = oi."product_slug" AND po."idx" = oi."option_idx" AND oi."cost" IS NULL AND po."cost" IS NOT NULL;
