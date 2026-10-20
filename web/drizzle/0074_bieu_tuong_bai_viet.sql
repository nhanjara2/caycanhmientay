-- 20/10/2026 — chủ shop: thêm biểu tượng cho các bài viết cũ dễ đọc hơn (emoji hiện giống nhau mọi máy nhờ font Noto Color Emoji
-- ở app/layout.tsx). Mỗi ý một biểu tượng cố định (💧 nước, ☀️ nắng, 🪴 đất / chậu, 🌱 phân, 🐛 sâu bệnh, ✂️ cắt tỉa, ⚠️ lưu ý…). Thêm vào:
--   (1) đầu tiêu đề mục H2 / H3 theo từ khóa đầu câu, (2) đầu đoạn văn / dòng liệt kê bắt đầu bằng nhãn đậm "**Nhãn:**",
--   (3) dòng liệt kê không nhãn: theo từ khóa có trong dòng, (4) hộp lưu ý: ⚠️ (lưu ý / an toàn / thuốc) hoặc 💡,
--   (5) tiêu đề bài: 1 biểu tượng theo chuyên mục. Không đụng đoạn dẫn, mô tả SEO, bảng, chú thích ảnh. Chỗ đã có biểu tượng (ký tự đầu không phải chữ / số / "*") thì giữ nguyên
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
-- Dòng liệt kê không có nhãn: tìm từ khóa ở bất kỳ đâu trong dòng (thứ tự ưu tiên từ trên xuống), không khớp thì để nguyên.
CREATE OR REPLACE FUNCTION pg_temp.ccmt_item(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN t IS NULL OR t = '' OR left(t, 1) !~ '[[:alnum:]*"(“]' THEN t
    WHEN t ~ '^\*\*[^*]{1,40}:\*\*' THEN pg_temp.ccmt_line(t, false)
    ELSE coalesce((SELECT e FROM (VALUES
      (1, '(không nên|tránh|cẩn thận|độc|nguy hiểm|cảnh báo)', '⚠️'),
      (2, '(sâu|rệp|nhện đỏ|nấm|bệnh|thối)', '🐛'),
      (3, '(tưới|nước|úng)', '💧'),
      (4, '(nắng|ánh sáng|bóng râm)', '☀️'),
      (5, '(phân|bón)', '🌱'),
      (6, '(đất|giá thể|chậu)', '🪴'),
      (7, '(rễ)', '🌿'),
      (8, '(lá)', '🍃'),
      (9, '(cắt|tỉa)', '✂️'),
      (10, '(gió|nhiệt độ|nóng|lạnh)', '🌡️'),
      (11, '(mua|chọn)', '🛒')) AS k(o, re, e)
      WHERE replace(lower(t), 'mọng nước', '') ~ k.re ORDER BY o LIMIT 1) || ' ' || t, t)
  END
$$;
--> statement-breakpoint
UPDATE "posts" p SET "body" = (
  SELECT jsonb_agg(
    CASE
      -- Tiêu đề mục: theo từ khóa đầu câu; không khớp thì theo từ khóa trong câu như dòng liệt kê.
      WHEN b->>'type' IN ('h2', 'h3') THEN jsonb_set(b, '{text}', to_jsonb(CASE WHEN pg_temp.ccmt_line(b->>'text', true) = b->>'text'
        THEN pg_temp.ccmt_item(b->>'text') ELSE pg_temp.ccmt_line(b->>'text', true) END))
      WHEN b->>'type' = 'p' THEN jsonb_set(b, '{text}', to_jsonb(pg_temp.ccmt_line(b->>'text', false)))
      WHEN b->>'type' = 'list' AND jsonb_typeof(b->'items') = 'array' THEN jsonb_set(b, '{items}',
        (SELECT jsonb_agg(to_jsonb(pg_temp.ccmt_item(it)) ORDER BY o) FROM jsonb_array_elements_text(b->'items') WITH ORDINALITY AS e(it, o)))
      WHEN b->>'type' = 'note' AND coalesce(b->>'title', '') <> '' AND left(b->>'title', 1) ~ '[[:alnum:]*"(“]' THEN jsonb_set(b, '{title}',
        to_jsonb(CASE WHEN lower(b->>'title' || ' ' || coalesce(b->>'text', '')) ~ '(lưu ý|cảnh báo|an toàn|thuốc|độc|tránh)' THEN '⚠️ ' ELSE '💡 ' END || (b->>'title')))
      ELSE b
    END ORDER BY n)
  FROM jsonb_array_elements(p."body") WITH ORDINALITY AS a(b, n))
WHERE jsonb_typeof(p."body") = 'array' AND jsonb_array_length(p."body") > 0;
--> statement-breakpoint
-- Tiêu đề bài: 1 biểu tượng theo chuyên mục (bài đã có biểu tượng đầu tiêu đề thì giữ). Tiêu đề tối đa 150 ký tự.
UPDATE "posts" SET "title" = c.e || ' ' || "title"
FROM (VALUES ('cam-nang', '📗'), ('cham-soc', '🌿'), ('bat-benh', '🐛'), ('thuoc-phan-bon', '🧪'), ('rau-sach', '🥬'),
  ('phong-thuy', '🍀'), ('decor', '🏡'), ('theo-mua', '🌦️'), ('khuyen-mai', '🎁'), ('su-kien', '📅'), ('tin-tuc', '📰'),
  ('cong-dong', '🤝'), ('bao-chi', '🗞️'), ('tuyen-dung', '💼')) AS c(cat, e)
WHERE "posts"."category" = c.cat AND left("title", 1) ~ '[[:alnum:]"(“]' AND char_length("title") <= 145;
