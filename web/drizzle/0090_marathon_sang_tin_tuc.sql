-- 11/11/2026 — chủ shop: bài giải chạy là tin sự kiện, chuyển từ "Workshop & Sự kiện" (Góc chăm cây) sang "Tin tức & Sự kiện" (/tin-tuc).
UPDATE "posts" SET "category" = 'tin-tuc', "updated_at" = now()
WHERE "slug" = 'sa-dec-flower-half-marathon-2026-lo-trinh' AND "category" <> 'tin-tuc';
