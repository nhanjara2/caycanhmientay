-- 11/11/2026 — bài 0088 hẹn 14:00, chủ shop muốn hiện ngay.
UPDATE "posts" SET "published_at" = '2026-11-11 13:00:00+07'::timestamptz
WHERE "slug" = 'sa-dec-flower-half-marathon-2026-lo-trinh' AND "published_at" > '2026-11-11 13:00:00+07'::timestamptz;
