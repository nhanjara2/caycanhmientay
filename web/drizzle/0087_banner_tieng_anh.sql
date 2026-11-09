ALTER TABLE "home_banners" ADD COLUMN "en" jsonb;--> statement-breakpoint
-- Chữ tiếng Anh cho 9 banner dựng sẵn (migration 0083); chỉ ghi khi chưa có.
UPDATE "home_banners" b SET "en" = v.en::jsonb FROM (VALUES
  ('top', '/danh-muc', '{"title":"Cây Cảnh Miền Tây — a wide range of healthy plants at great prices, delivered across the Mekong Delta"}'),
  ('top', '/cay-tet', '{"title":"Lunar New Year (Tết) plants — apricot blossom, kumquat, peach and more"}'),
  ('top', '/benh-cay', '{"title":"Rainy season: prevent plant diseases early — look up problems by symptom"}'),
  ('top', '/he-thong-cua-hang', '{"title":"Cây Cảnh Miền Tây: ornamental and foliage plants — visit our stores and nursery"}'),
  ('hero', '/doi-tac#dang-ky', '{"title":"Plant supply for construction, landscaping and resellers — become a partner"}'),
  ('hero', '/tu-van-chon-cay', '{"title":"The right plant for every space: projects, landscapes, shops, cafés, offices — plant advisor"}'),
  ('hero', '/danh-muc/cay-canh/cay-de-ban', '{"title":"Affordable desk plants for students"}'),
  ('side', '/bao-gia-si', '{"title":"Send your list, get a wholesale quote","cta":"Request a quote"}'),
  ('side', '/benh-cay', '{"title":"Sick plant? Look it up by symptom","cta":"Diagnose plant problems"}')
) AS v(slot, href, en)
WHERE b."slot" = v.slot AND b."href" = v.href AND b."en" IS NULL AND b."image" LIKE '/images/banner/%';
