-- Bộ thông số điền sẵn của danh mục "Cây cảnh": thêm Đất trồng, Nhiệt độ + độ ẩm, Bón phân, Mức độ dễ chăm, Tốc độ sinh trưởng,
-- Kích thước trưởng thành, Công dụng, Cách nhân giống, Tên khoa học, Sâu bệnh thường gặp, Phù hợp với ai.
-- Tất cả KHÔNG bắt buộc: sản phẩm đang có chưa có các thông số này, bắt buộc thì không lưu lại được. Dòng để trống không hiện trên web.
-- (1) Bộ cũ còn nguyên mặc định (chưa ai sửa ở /admin/danh-muc) → thay bằng bộ mới theo thứ tự đọc hợp lý.
UPDATE "categories" SET "specs" = '[{"name":"Chiều cao"},{"name":"Chậu"},{"name":"Ánh sáng"},{"name":"Tưới nước"},{"name":"Đất trồng"},{"name":"Nhiệt độ, độ ẩm"},{"name":"Bón phân"},{"name":"Mức độ dễ chăm"},{"name":"Tốc độ sinh trưởng"},{"name":"Kích thước trưởng thành"},{"name":"An toàn thú cưng"},{"name":"Công dụng"},{"name":"Cách nhân giống"},{"name":"Nguồn gốc"},{"name":"Tên khoa học"},{"name":"Sâu bệnh thường gặp"},{"name":"Phù hợp với ai"}]'::jsonb
WHERE "slug" = 'cay-canh'
  AND "specs" = '[{"name":"Chiều cao"},{"name":"Chậu"},{"name":"Ánh sáng"},{"name":"Tưới nước"},{"name":"Nguồn gốc"},{"name":"An toàn thú cưng"}]'::jsonb;--> statement-breakpoint
-- (2) Admin đã tự sửa bộ thông số → giữ nguyên bộ của họ, chỉ nối thêm các thông số còn thiếu (so tên không phân biệt hoa thường).
UPDATE "categories" c SET "specs" = c."specs" || coalesce((
  SELECT jsonb_agg(n.value ORDER BY n.ord)
  FROM jsonb_array_elements('[{"name":"Đất trồng"},{"name":"Nhiệt độ, độ ẩm"},{"name":"Bón phân"},{"name":"Mức độ dễ chăm"},{"name":"Tốc độ sinh trưởng"},{"name":"Kích thước trưởng thành"},{"name":"Công dụng"},{"name":"Cách nhân giống"},{"name":"Tên khoa học"},{"name":"Sâu bệnh thường gặp"},{"name":"Phù hợp với ai"}]'::jsonb) WITH ORDINALITY AS n(value, ord)
  WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(c."specs") o WHERE lower(o->>'name') = lower(n.value->>'name'))
), '[]'::jsonb)
WHERE c."slug" = 'cay-canh';
