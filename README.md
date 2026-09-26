# Cây Cảnh Miền Tây

Nguồn của website bán cây cảnh, thuốc BVTV, phân bón và vật tư làm vườn.

Design system lấy về từ artifact **Cây Cảnh Miền Tây** (namespace `VuonXanh`). Giao diện **chỉ có tông sáng**.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| [design-system/BRANDBOOK.md](design-system/BRANDBOOK.md) | Sổ tay thương hiệu: nguyên tắc, giọng văn, bố cục từng trang, mobile, admin |
| [design-system/COMPONENTS.md](design-system/COMPONENTS.md) | Chỉ mục 148 component theo 22 nhóm (sinh tự động) |
| [design-system/tokens.json](design-system/tokens.json) | Nguồn của token: 20 màu, 10 kiểu chữ, spacing, radius, shadow |
| [design-system/tokens.css](design-system/tokens.css) | Sinh từ `tokens.json` — **không sửa tay** |
| [design-system/components.css](design-system/components.css) | 363 class `.vx-*` / `.ad-*` / `.m-*` dùng chung |
| `design-system/components/<Tên>/preview.html` | Markup mẫu (147 file) |
| `design-system/components/<Tên>/README.md` | Quy tắc dùng component đó (147 file) |

## Lệnh

```bash
node tools/build-tokens.mjs   # tokens.json  -> design-system/tokens.css
node tools/build-index.mjs    # components/* -> design-system/COMPONENTS.md
node tools/preview.mjs        # http://localhost:4321 — duyệt toàn bộ component
```

## Website (Next.js)

Mã nguồn web ở [web/](web/) — Next.js 16 (App Router) + TypeScript, dùng thẳng `tokens.css` và `components.css` của design system.

```bash
cd web
npm install
npm run dev        # http://localhost:3000 (tự chạy sync-ds trước)
npm run build      # build production
npm run gen-views  # sinh lại src/views từ preview.html sau khi sửa design system
```

### Trang

| Nhóm | Đường dẫn |
|---|---|
| Mua sắm | `/` · `/danh-muc/<nhóm>[/<nhóm con>]` · `/tim-kiem?q=` · `/san-pham/<slug>` · `/flash-sale` · `/cay-tet` |
| Giỏ hàng | `/gio-hang` → `/thanh-toan` → `/dat-hang-thanh-cong` |
| Tài khoản (cần đăng nhập SĐT + OTP) | `/tai-khoan` · `/tai-khoan/don-hang[/<mã>]` · `/so-dia-chi` · `/vuon-cua-toi` · `/lich-cham-cay` · `/yeu-thich` · `/bao-hanh` |
| Nội dung | `/goc-cham-cay[/<slug>]` · `/benh-cay[/<slug>]` · `/tin-tuc` · `/khuyen-mai` · `/chinh-sach/<slug>` · `/he-thong-cua-hang` |
| Dịch vụ | `/dich-vu` · `/dich-vu/cho-thue-cay-van-phong` · `/dich-vu/dat-lich-khao-sat` · `/doanh-nghiep` |
| Admin | `/admin` · `/admin/don-hang[/<mã>]` · `/pos` · `/giao-hang` · `/bao-hanh` · `/dich-vu` · `/khach-hang` · `/khuyen-mai` · `/san-pham` · `/kho` · `/nhap-hang` · `/noi-dung` · `/danh-gia` · `/mau-tin-nhan` · `/cai-dat-giao-hang` · `/phan-quyen` · `/bao-cao` |
| App nhân viên | `/nhan-vien/giao-hang` · `/nhan-vien/kho` |

### Cách tổ chức

- **Trang có tương tác** (trang chủ, danh mục, tìm kiếm, chi tiết sản phẩm, giỏ, thanh toán, đăng nhập, menu tài khoản, cookie) viết tay trong `src/app` và `src/components`, chạy với dữ liệu thật trong `src/lib`.
- **Các trang còn lại** là view sinh tự động: `scripts/gen-views.mjs` chuyển `design-system/components/<Tên>/preview.html` thành `src/views/<Tên>View.tsx`, thay phần chung bằng component (AccountSidebar, khung admin, thẻ sản phẩm thật…) và nối link theo `scripts/views.config.mjs`. **Không sửa tay `src/views`** — sửa preview hoặc config rồi chạy `npm run gen-views`.
- `scripts/sync-ds.mjs` chép CSS của design system vào `src/styles/ds/` (không commit) và sinh `responsive.css`: design system chỉ vẽ cho desktop, file này thu lưới nhiều cột thành 1–2 cột trên mobile.
- `src/app/globals.css` chỉ chứa phần riêng của web (header/sidebar dính, hộp thoại, các mốc mobile/tablet).

### Backend

Server chạy ngay trong Next.js (server actions + route handlers), database **SQLite** qua **Drizzle ORM** (`web/data/app.db`, tự tạo và nạp 18 sản phẩm mẫu ở lần chạy đầu).

| Phần | Nơi | Ghi chú |
|---|---|---|
| Schema, migration | `src/server/db/schema.ts`, `drizzle/` | Đổi schema → `npm run db:generate`; migration tự chạy khi khởi động. Xem dữ liệu: `npm run db:studio` |
| Đăng nhập SĐT + OTP | `src/server/auth.ts` | OTP 6 số lưu dạng băm, hết hạn 5 phút, gửi lại sau 60 giây, tối đa 5 mã/giờ và 5 lần nhập sai. Phiên lưu trong database, cookie `httpOnly`. Khi chạy dev, mã OTP hiện ngay trong hộp đăng nhập và in ra log server |
| Sản phẩm | `src/server/catalog.ts` | Các trang đọc từ database mỗi request |
| Đặt hàng | `src/server/orders.ts` | Server tính lại giá, phí giao và tồn kho; chặn COD cho đơn Flash sale; bắt buộc xác nhận an toàn khi có thuốc BVTV |
| Đơn của khách | `/tai-khoan/don-hang` | Gồm cả đơn đặt vãng lai bằng đúng SĐT đã xác thực |
| Quản trị | `/admin` (đăng nhập tại `/admin/dang-nhap`) | Chỉ SĐT trong `ADMIN_PHONES`. Tổng quan, Đơn hàng, Sản phẩm, Kho, Bảo hành dùng dữ liệu thật |
| Sổ địa chỉ | `src/server/addresses.ts` | Thêm/sửa/xóa, mặc định; trang thanh toán chọn nhanh địa chỉ đã lưu |
| Kho | `src/server/inventory.ts` | Mọi thay đổi tồn đi qua `applyStock()` và được ghi lịch sử |
| Bảo hành cây | `src/server/warranty.ts`, `src/server/uploads.ts` | Ảnh lưu `data/uploads/`, chỉ chủ yêu cầu và nhân viên xem được |

Cấu hình trong `web/.env.local` (mẫu ở `web/.env.example`): `ADMIN_PHONES`, `AUTH_SECRET` (bắt buộc khi chạy production), `OTP_PROVIDER`. Xóa thư mục `web/data/` để làm lại database từ đầu.

### Còn thiếu

- **Gửi OTP thật** qua Zalo ZNS / SMS (`sendOtp` trong `src/server/auth.ts`). Production sẽ từ chối gửi mã cho đến khi cấu hình.
- **Cổng thanh toán** (VietQR, MoMo, ZaloPay, thẻ): đơn online đang ở trạng thái "Chờ thanh toán", cần webhook để đánh dấu đã trả.
- Các màn admin còn lại (khách hàng, khuyến mãi, giao hàng…), vườn của tôi, lịch chăm cây, yêu thích, bài viết, bệnh cây vẫn là giao diện mẫu từ design system. Chi tiết tiến độ: `CLAUDE.md`.
- SQLite hợp với một máy chủ; nếu chạy nhiều máy chủ, chuyển sang PostgreSQL (đổi driver Drizzle, giữ nguyên schema).

## Quy ước

- **Chỉ giao diện sáng.** `tokens.css` khai báo `color-scheme: light`; không làm theme tối.
- Chữ: **Be Vietnam Pro** (Google Fonts) 400/500/600/700. Nội dung 14px, giá 18px/700.
- Màu: `primary` cho mọi hành động mua và điều hướng · `sale` chỉ cho giảm giá · `sun` chỉ cho Flash sale.
- Mọi giá kèm đơn vị: "/ Chậu", "/ Chai", "/ Bao".
- Thuốc BVTV: bắt buộc số đăng ký, hoạt chất, liều pha, thời gian cách ly và hộp lưu ý an toàn.

Chi tiết xem [design-system/BRANDBOOK.md](design-system/BRANDBOOK.md).
