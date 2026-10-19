-- 19/10/2026 — chủ shop: thêm hoa hồng chậu C8 (miệng 18cm), giá vườn 17.000đ, 5 màu đỏ, hồng, vàng, trắng, cam.
-- Mỗi màu một quy cách của sản phẩm `hoa-hong` có sẵn (khách chọn màu, tồn tính riêng từng màu), nối sau quy cách cũ.
-- Giá theo công thức: gốc = vườn + 10% = 19.000đ, lẻ = gốc × 2 = 38.000đ, combo 2 cây = 68.000đ, giá gạch 47.000đ. Tồn 10 / màu ở kho mặc định.
CREATE TEMP TABLE "_m72" AS
SELECT c.label, (SELECT coalesce(max(idx), -1) FROM "product_options" WHERE product_slug = 'hoa-hong') + c.n AS idx
FROM (VALUES (1, 'Chậu C8 – Đỏ'), (2, 'Chậu C8 – Hồng'), (3, 'Chậu C8 – Vàng'), (4, 'Chậu C8 – Trắng'), (5, 'Chậu C8 – Cam')) AS c(n, label)
WHERE EXISTS (SELECT 1 FROM "products" WHERE slug = 'hoa-hong')
  AND NOT EXISTS (SELECT 1 FROM "product_options" WHERE product_slug = 'hoa-hong' AND label = c.label);--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "bulky", "stock")
SELECT 'hoa-hong', idx, label, 38000, 47000, 17000, 19000, 68000, false, 10 FROM "_m72";--> statement-breakpoint
WITH st AS (SELECT id FROM "stores" WHERE "active" ORDER BY is_default DESC, id LIMIT 1),
lots AS (
  INSERT INTO "stock_lots" ("store_id", "product_slug", "option_idx", "qty", "unit_cost")
  SELECT st.id, 'hoa-hong', m.idx, 10, 17000 FROM "_m72" m, st
  RETURNING id, store_id, option_idx
)
INSERT INTO "stock_moves" ("product_slug", "option_idx", "store_id", "lot_id", "delta", "after", "reason", "note", "actor")
SELECT 'hoa-hong', option_idx, store_id, id, 10, 10, 'import', 'Tồn đầu kỳ', 'Hệ thống' FROM lots;--> statement-breakpoint
-- Bộ lọc màu: thêm Vàng, Bạc / trắng (đỏ, hồng đã có).
UPDATE "products" SET
  "attrs" = jsonb_set(coalesce("attrs", '{}'::jsonb), '{mau}',
    (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements_text(coalesce("attrs"->'mau', '[]'::jsonb) || '["co-hoa","do-hong","vang","bac-trang"]'::jsonb) x)),
  "updated_at" = now()
WHERE "slug" = 'hoa-hong' AND EXISTS (SELECT 1 FROM "_m72");--> statement-breakpoint
DROP TABLE "_m72";
