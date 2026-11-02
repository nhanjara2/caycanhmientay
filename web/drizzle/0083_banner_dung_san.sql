-- 01/11/2026 — chủ shop: "các banner hiện tại sao chưa thấy trong admin để chỉnh sửa, tải ảnh khác lên thì mất toàn bộ ảnh cũ".
-- 9 ảnh banner dựng sẵn của shop (file tĩnh public/images/banner/…) trước viết cứng trong trang chủ, chỉ hiện khi vị trí chưa có ảnh
-- nào trong bảng → admin không thấy, tải 1 ảnh vào vị trí nào là cả bộ ảnh dựng sẵn của vị trí đó biến mất (băng ảnh rộng đã mất 4 ảnh
-- khi chủ shop tải 2 ảnh). Chuyển cả 9 vào home_banners để sửa / tắt / đổi thứ tự / xóa như ảnh tự tải; ảnh vẫn là file tĩnh
-- (cột image ghi đường dẫn /images/banner/…, không chép vào home_banner_images).
--   * Đang bật, xếp SAU các ảnh chủ shop đã tải trong cùng vị trí. Không ghi người sửa.
--   * Ảnh "Mùa mưa" hẹn hết 30/11/2026 (trước tự đổi theo mùa; mùa khô từng dựng bằng ảnh bệnh cây + chữ — bỏ).
--   * Cột mới tone = màu lớp phủ sau chữ (ô "Cây bị bệnh?" là cam đỏ như cũ).
--   * Ô Flash sale (dựng từ sản phẩm đang flash sale) không có ảnh nên vẫn tự chèn trong code, không vào bảng.
--   * Chạy lại không nhập trùng (bỏ qua ảnh đã có trong bảng).
ALTER TABLE "home_banners" ADD COLUMN "tone" text DEFAULT 'green' NOT NULL;--> statement-breakpoint
INSERT INTO "home_banners" ("slot", "title", "subtitle", "cta", "href", "show_text", "tone", "image", "image_mobile",
  "bg_image", "bg_image_mobile", "bg_color", "ends_at", "sort")
SELECT v.slot, v.title, '', v.cta, v.href, v.show_text, v.tone, v.image, v.image_mobile,
  v.bg_image, v.bg_image_mobile, v.bg_color, v.ends_at::timestamptz,
  coalesce((SELECT max(b."sort") FROM "home_banners" b WHERE b."slot" = v.slot), -1) + v.ord
FROM (VALUES
  ('top', 1, $t$Cây Cảnh Miền Tây — đa dạng, tươi tốt, giá tốt, giao hàng miền Tây$t$, '', '/danh-muc', false, 'green',
    '/images/banner/ccmt-hero.webp', '/images/banner/ccmt-hero-mb.webp',
    '/images/banner/ccmt-hero-bg.webp', '/images/banner/ccmt-hero-bg-mb.webp', '#eaeffa', NULL),
  ('top', 2, $t$Vui Xuân Tết, rộn ràng vui xuân — xem mai, quất, đào và cây Tết$t$, '', '/cay-tet', false, 'green',
    '/images/banner/vui-xuan-tet.webp', '/images/banner/vui-xuan-tet-mb.webp', NULL, NULL, NULL, NULL),
  ('top', 3, $t$Mùa mưa: phòng bệnh sớm, không mất cả lô cây — tra bệnh theo triệu chứng, chọn đúng thuốc, đúng liều$t$, '', '/benh-cay', false, 'green',
    '/images/banner/mua-mua-phong-benh.webp', '/images/banner/mua-mua-phong-benh-mb.webp', NULL, NULL, NULL, '2026-11-30 23:59:59.999+07'),
  ('top', 4, $t$Cây Cảnh Miền Tây: cây cảnh, cây kiểng, hoa kiểng lá — xem hệ thống cửa hàng và vườn ươm$t$, '', '/he-thong-cua-hang', false, 'green',
    '/images/banner/cay-canh-mien-tay.webp', '/images/banner/cay-canh-mien-tay-mb.webp', NULL, NULL, NULL, NULL),
  ('hero', 1, $t$Nguồn cung cây cảnh cho công trình, cảnh quan, đại lý — đăng ký đối tác$t$, '', '/doi-tac#dang-ky', false, 'green',
    '/images/banner/nguon-cung-cay-canh.webp', NULL, NULL, NULL, NULL, NULL),
  ('hero', 2, $t$Chọn đúng cây cho từng không gian: công trình, cảnh quan, cửa hàng, quán cafe, văn phòng — tư vấn chọn cây$t$, '', '/tu-van-chon-cay', false, 'green',
    '/images/banner/chon-dung-cay.webp', NULL, NULL, NULL, NULL, NULL),
  ('hero', 3, $t$Học sinh – sinh viên tự tin trang trí: cây xinh giá rẻ, giảm đến 29% — xem cây để bàn$t$, '', '/danh-muc/cay-canh/cay-de-ban', false, 'green',
    '/images/banner/hoc-sinh-sinh-vien.webp', NULL, NULL, NULL, NULL, NULL),
  ('side', 1, $t$Gửi danh sách, nhận báo giá sỉ$t$, 'Gửi báo giá', '/bao-gia-si', true, 'green',
    '/images/banner/bao-gia-si.webp', NULL, NULL, NULL, NULL, NULL),
  ('side', 2, $t$Cây bị bệnh? Tra theo triệu chứng$t$, 'Bắt bệnh cho cây', '/benh-cay', true, 'sale',
    '/images/banner/tra-benh-cay.webp', NULL, NULL, NULL, NULL, NULL)
) AS v(slot, ord, title, cta, href, show_text, tone, image, image_mobile, bg_image, bg_image_mobile, bg_color, ends_at)
WHERE NOT EXISTS (SELECT 1 FROM "home_banners" b WHERE b."image" = v.image);
