ALTER TABLE "expenses" ADD COLUMN "consign" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_receipt_lines" ADD COLUMN "grade" text;--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD COLUMN "consign" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD COLUMN "supplier_id" integer;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD COLUMN "unit_cost" integer;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD COLUMN "grade" text;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD COLUMN "consign" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_lots_supplier_idx" ON "stock_lots" USING btree ("supplier_id");--> statement-breakpoint
-- Lô đã nhập trước đây: lấy giá vườn + nhà cung cấp từ phiếu nhập đã tạo ra lô (lô cộng dồn nhiều phiếu thì lấy giá cao nhất).
UPDATE "stock_lots" l SET "unit_cost" = x.uc, "supplier_id" = x.sid
FROM (
  SELECT m.lot_id, max(rl.unit_cost) AS uc, max(r.supplier_id) AS sid
  FROM "stock_moves" m
  JOIN "purchase_receipts" r ON r.id = m.receipt_id
  JOIN "purchase_receipt_lines" rl ON rl.receipt_id = r.id AND rl.product_slug = m.product_slug AND rl.option_idx = m.option_idx
  WHERE m.reason = 'import' AND m.lot_id IS NOT NULL
  GROUP BY m.lot_id
) x
WHERE l.id = x.lot_id;--> statement-breakpoint
-- Chủ shop 16/10/2026: bỏ mã miễn phí giao, chỉ giữ mức miễn phí giao theo vùng ở Cài đặt giao hàng (tắt, không xóa — bật lại được ở /admin/khuyen-mai).
UPDATE "vouchers" SET "active" = false WHERE "kind" = 'ship' AND "code" LIKE 'FREESHIP%';
