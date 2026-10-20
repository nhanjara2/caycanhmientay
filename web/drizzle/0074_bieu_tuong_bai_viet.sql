-- 20/10/2026 — chủ shop: thêm biểu tượng cho các bài viết cũ dễ đọc hơn. Mỗi ý một biểu tượng cố định
-- (💧 nước, ☀️ nắng, 🪴 đất / chậu, 🌱 phân, 🐛 sâu bệnh, ✂️ cắt tỉa, ⚠️ lưu ý…). Chỉ thêm vào:
--   (1) đầu tiêu đề mục H2 theo từ khóa, (2) đầu đoạn văn / dòng liệt kê bắt đầu bằng nhãn đậm "**Nhãn:**".
-- Không đụng tiêu đề bài, đoạn dẫn, mô tả SEO. Chỗ đã có biểu tượng (ký tự đầu không phải chữ / số / "*") thì giữ nguyên
-- → chạy lại không thêm trùng. Mã neo mục lục bỏ ký tự lạ (headingId) nên link #mục cũ không đổi. Không đổi updated_at.
CREATE OR REPLACE FUNCTION pg_temp.ccmt_icon(t text, heading boolean) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN l ~ '^(câu hỏi|hỏi đáp)|hỏi thường gặp' THEN '❓'
    WHEN l ~ '^(lưu ý|cảnh báo|sai lầm|chú ý|không nên|tránh|an toàn)' THEN '⚠️'
    WHEN l ~ '^(bảng|tóm tắt)' THEN '📋'
    WHEN l ~ '^(bí quyết|mẹo|kinh nghiệm)' THEN '💡'
    WHEN l ~ '^(nguyên nhân|vì sao|tại sao)' THEN '🔎'
    WHEN l ~ '^(dấu hiệu|triệu chứng|nhận biết|kiểm tra|cách nhận)' THEN '🔍'
    WHEN l ~ '^(cách xử lý|xử lý|cách cứu|cứu|chữa|khắc phục|điều trị)' THEN '🛠️'
    WHEN l ~ '^(phòng|ngừa)' THEN '🛡️'
    WHEN l ~ '^(tưới|nước)' THEN '💧'
    WHEN l ~ '^độ ẩm' THEN '💦'
    WHEN l ~ '^(nhiệt độ|thời tiết)' THEN '🌡️'
    WHEN l ~ '^(ánh sáng|nắng|vị trí đặt|chỗ đặt)' THEN '☀️'
    WHEN l ~ '^(đất|giá thể|chậu|thay chậu|chọn chậu)' THEN '🪴'
    WHEN l ~ '^(phân bón|bón|phân hữu cơ|phân tan)' THEN '🌱'
    WHEN l ~ '^(sâu|bệnh|nhện|rệp)' THEN '🐛'
    WHEN l ~ '^(cắt tỉa|tỉa|cắt)' THEN '✂️'
    WHEN l ~ '^(nhân giống|giâm|gieo|ươm)' THEN '🌿'
    WHEN l ~ '^(phong thủy|ý nghĩa|hợp mệnh|mệnh)' THEN '🍀'
    WHEN l ~ '^(chọn|mua|nên mua)' THEN '🛒'
    WHEN heading AND l ~ '^(các bước|cách làm|hướng dẫn|quy trình|bước)' THEN '📝'
    WHEN heading AND l ~ '^(hiểu|giới thiệu|đặc điểm)' THEN '📖'
  END
  FROM (SELECT lower(regexp_replace(t, '^[0-9]+[.)]\s*', '')) AS l) x
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION pg_temp.ccmt_line(t text, heading boolean) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN t IS NULL OR t = '' OR left(t, 1) !~ '[[:alnum:]*"(“]' THEN t
    WHEN heading THEN coalesce(pg_temp.ccmt_icon(t, true) || ' ' || t, t)
    WHEN t ~ '^\*\*[^*]{1,40}:\*\*' THEN coalesce(pg_temp.ccmt_icon(substring(t from '^\*\*([^*]+):'), false) || ' ' || t, t)
    ELSE t
  END
$$;
--> statement-breakpoint
UPDATE "posts" p SET "body" = (
  SELECT jsonb_agg(
    CASE
      WHEN b->>'type' = 'h2' THEN jsonb_set(b, '{text}', to_jsonb(pg_temp.ccmt_line(b->>'text', true)))
      WHEN b->>'type' = 'p' THEN jsonb_set(b, '{text}', to_jsonb(pg_temp.ccmt_line(b->>'text', false)))
      WHEN b->>'type' = 'list' AND jsonb_typeof(b->'items') = 'array' THEN jsonb_set(b, '{items}',
        (SELECT jsonb_agg(to_jsonb(pg_temp.ccmt_line(it, false)) ORDER BY o) FROM jsonb_array_elements_text(b->'items') WITH ORDINALITY AS e(it, o)))
      ELSE b
    END ORDER BY n)
  FROM jsonb_array_elements(p."body") WITH ORDINALITY AS a(b, n))
WHERE jsonb_typeof(p."body") = 'array' AND jsonb_array_length(p."body") > 0;
