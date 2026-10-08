-- Phương án chọn cây khách gửi kèm yêu cầu khảo sát (trang /tu-van-chon-cay, 08/10/2026). Chỉ thêm cột, null = không có.
ALTER TABLE "service_requests" ADD COLUMN "plan" jsonb;