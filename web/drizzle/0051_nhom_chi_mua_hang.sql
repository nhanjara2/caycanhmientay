-- Nhóm chi "Mua cây – hàng hóa" (11/10/2026, chủ shop: "cần ghi phí đã chi trong web, ví dụ mua cây").
-- Trước đó sổ chi phí chỉ nhận khoản NGOÀI hàng nhập kho; tiền mua hàng phải đi qua phiếu nhập (chọn từng sản phẩm, số lượng, giá nhập).
-- Nay ghi thẳng tiền mua hàng vào sổ bằng nhóm này; báo cáo cộng nhóm này vào "Tiền mua hàng" cùng phiếu nhập (GOODS_EXPENSE_CATEGORY trong lib/expense-labels.ts).
-- sort = -1 để nhóm đứng đầu danh sách chọn.
INSERT INTO "expense_categories" ("slug", "name", "sort") VALUES ('mua-hang', 'Mua cây – hàng hóa', -1)
ON CONFLICT DO NOTHING;
