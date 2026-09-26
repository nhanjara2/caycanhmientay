# Cây Cảnh Miền Tây — ghi chú bàn giao

File này được Claude Code tự đọc ở đầu mỗi cuộc chat. **Cập nhật mục "Tiến độ" và "Việc tiếp theo" mỗi khi xong một phần.**
Trả lời người dùng bằng tiếng Việt. Người dùng không phải lập trình viên: giải thích ngắn, rõ, không thuật ngữ thừa.

## Dự án

Website bán cây cảnh, thuốc BVTV, phân bón, vật tư làm vườn + trang quản trị + app nhân viên.

- `design-system/` — nguồn thiết kế (148 component, `BRANDBOOK.md`, `tokens.json`, `components.css`). **Chỉ giao diện sáng.**
- `web/` — Next.js 16 (App Router, Turbopack) + TypeScript + React 19. Đọc `web/AGENTS.md`: Next 16 khác bản cũ (middleware → `proxy.ts`, không còn `export const dynamic`, dùng `await connection()`), tài liệu ở `web/node_modules/next/dist/docs/`.

## Chạy

```bash
cd web && npm install && npm run dev     # http://localhost:3000
npm run build                             # kiểm tra build production
npx tsc --noEmit                          # typecheck
```

- Đăng nhập khách: SĐT bất kỳ, khi chạy dev mã OTP hiện ngay trong hộp đăng nhập.
- Admin: `/admin`, đăng nhập bằng SĐT trong `ADMIN_PHONES` (file `web/.env.local`, hiện là `0909000001`).
- Database: **Supabase PostgreSQL** (project `fdsgvlmbqkksgibpcuwz`, vùng Mumbai ap-south-1), chuỗi kết nối `DATABASE_URL` trong `web/.env.local` (Transaction pooler cổng 6543). Máy dev và Vercel dùng **chung một database**. Xem dữ liệu: `npm run db:studio` hoặc bảng điều khiển Supabase.
- Tạo bảng + nạp 18 sản phẩm mẫu + 3 cửa hàng: `npm run db:setup` (`scripts/db-setup.mts`, tự chạy trong `prebuild` nên Vercel tự migrate mỗi lần deploy).
- Đổi schema (`web/src/server/db/schema.ts`) → `npm run db:generate` (tạo file trong `web/drizzle/`) → `npm run db:setup`. Bảng mới phải thêm `ALTER TABLE … ENABLE ROW LEVEL SECURITY` vào migration (khóa API công khai của Supabase).
- Driver: `pg` (node-postgres). **Không dùng thư viện `postgres`** — nó pipelining và treo qua Supabase pooler. Mọi truy vấn là async (`await`); ghi nhiều bước dùng `db.transaction(async (tx) => …)`, khóa dòng bằng `.for('update')` (tồn kho, đơn, bảo hành, sổ địa chỉ).
- Deploy: Vercel (tài khoản nhanjara3), repo GitHub `nhanjara-flora-global/caycanhmientay`, Root Directory `web`, vùng chạy `bom1` (`web/vercel.json`, cùng vùng database). Biến môi trường trên Vercel: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PHONES`, `OTP_DEMO=1` (chạy thử: hiện mã OTP trên màn hình — tắt khi bán thật), `SITE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Kiến trúc `web/src`

| Thư mục | Nội dung |
|---|---|
| `app/(site)/(shop)` | Trang có SidebarMenu: trang chủ, danh mục, tìm kiếm |
| `app/(site)/(page)` | Trang khách không sidebar: sản phẩm, giỏ, thanh toán, tài khoản, nội dung… |
| `app/admin/(shell)` | Admin có menu trái (AdminShell); `requireStaff()` ở layout **và** từng trang/action |
| `app/admin/pos`, `app/admin/dang-nhap`, `app/nhan-vien` | Màn không có khung admin |
| `app/actions/*.ts` | Server actions (`'use server'` — chỉ export hàm async). Luôn kiểm tra quyền + Zod trong từng hàm |
| `server/` | Chỉ chạy trên server (`import 'server-only'`): `db/` (schema, kết nối, seed), `auth.ts`, `catalog.ts`, `orders.ts`, `inventory.ts`, `products-admin.ts`, `addresses.ts`, `warranty.ts`, `notify.ts`, `uploads.ts`, `stats.ts` |
| `app/api/uploads/[file]` | Phục vụ ảnh riêng tư (bảo hành) có kiểm tra quyền |
| `lib/` | Dùng chung client/server: `catalog.ts` (kiểu + danh mục), `pricing.ts` (tính tiền), `stock.ts` (lô/hạn dùng, vùng giao cây sống), `order-labels.ts`, `address-labels.ts`, `warranty-labels.ts`, `cart.tsx`, `auth.tsx` |
| `components/` | Component viết tay; `components/admin/`, `components/orders/` |
| `views/` | **Sinh tự động** từ `design-system/components/*/preview.html` bằng `npm run gen-views` (cấu hình `web/scripts/views.config.mjs`). Không sửa tay. Trang nào đã làm thật thì xóa khỏi config + xóa file view |
| `styles/ds/` | CSS chép từ design system bằng `npm run sync-ds` (không commit) + `responsive.css` sinh tự động cho mobile |

Quy tắc đã chốt:
- Giá, phí giao, tồn kho **luôn tính lại trên server** (`server/orders.ts`); giỏ hàng client chỉ là bản chụp để hiển thị.
- Tồn thật nằm ở bảng `stock_lots` (cửa hàng × quy cách × lô/hạn dùng); `product_options.stock` = tổng, cập nhật cùng lúc. Mọi thay đổi tồn đi qua `applyStock()` trong `server/inventory.ts` (ghi `stock_moves` kèm cửa hàng + lô). Xuất hàng: kho mặc định (Vườn Q7) trước, lô hết hạn sớm nhất trước, **không bán lô đã hết hạn**. Hủy đơn: `restoreOrderStock()` trả về đúng lô đã xuất.
- Hàng theo lô (bắt buộc Số lô + Hạn dùng khi nhập): thuốc BVTV, phân bón, hạt giống (`tracksLots` trong `lib/stock.ts`). Cảnh báo sắp hết hạn trước 60 ngày.
- Đơn `kind = 'warranty'` là đơn 0đ do bảo hành tạo — không tính doanh thu/điểm.
- Thông báo: `notify()` trong `server/notify.ts` ghi bảng `notifications` (chuông trên Header); tin quan trọng (`external: true`) gửi thêm Zalo ZNS / email sau khi phản hồi xong, mọi lần gửi ghi `outbound_messages` (chưa cấu hình → `skipped`).
- Cây sống chỉ giao trong 30 km quanh cửa hàng gần nhất (`PLANT_ZONE_KM`), kiểm tra khi địa chỉ đã ghim bản đồ; server chặn lúc đặt hàng.
- Bản đồ: **không dùng tên miền openstreetmap.org** (nhà mạng VNPT chặn). Đang dùng nền `tile.openstreetmap.de` + tìm địa chỉ Photon (`photon.komoot.io`); CARTO đã đòi API key.
- Tài khoản định danh bằng SĐT đã xác thực; đơn đặt vãng lai bằng đúng SĐT đó thuộc về tài khoản (`canViewOrder`).
- Đăng nhập Google (`/api/auth/google` → `/api/auth/google/callback`, OAuth + PKCE, code trong `server/auth.ts`): Google đã gắn (`users.google_sub`) → vào thẳng; chưa gắn → cookie ký `ccmt_google_link` + mở hộp đăng nhập `?google=gan-sdt`, xác thực OTP xong thì gắn Google vào tài khoản SĐT đó. Đang đăng nhập sẵn thì gắn luôn. **Không tự gắn theo email.** Thiếu `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` thì nút Google ẩn. Nút Zalo/Apple (chưa làm) đã gỡ khỏi hộp đăng nhập.
- Thuốc BVTV: bắt buộc Số đăng ký, Hoạt chất, Liều pha, Thời gian cách ly; giỏ có thuốc phải xác nhận an toàn.
- Đơn Flash sale không cho COD. Nhận tại vườn không tính phí giao.
- Server action nhận tối đa 7MB (`next.config.ts`) cho ảnh bảo hành — nhưng Vercel giới hạn thân request **4,5MB**. Ảnh bảo hành lưu trong cột `warranty_photos.data` (bytea), không ghi ổ đĩa.
- `.pos` trong `components.css` bị dùng trùng (khung POS và số tiền "Miễn phí") — đã vá ở `app/globals.css`.

## Tiến độ

**Xong (dữ liệu thật, đã kiểm thử bằng Playwright — desktop 1366px + mobile 390px, build production đạt):**
- Giao diện toàn bộ ~110 trang từ design system, responsive mobile/tablet.
- Sản phẩm/danh mục/tìm kiếm đọc từ DB; giỏ hàng; thanh toán → tạo đơn trên server (trừ kho, ghi `stock_moves`); trang đặt hàng thành công.
- Đăng nhập SĐT + OTP (băm, hết hạn 5 phút, gửi lại sau 60s, tối đa 5 mã/giờ, 5 lần sai), phiên trong DB + cookie httpOnly.
- Tài khoản: hồ sơ (tên, email), đơn hàng (tab, chi tiết, tiến trình, Mua lại, đếm ngày bảo hành), **sổ địa chỉ** (`/tai-khoan/so-dia-chi`: thêm/sửa/xóa, mặc định, điều kiện giao cây lớn) — trang thanh toán tự điền địa chỉ mặc định và cho chọn địa chỉ đã lưu.
- **Bảo hành cây** (`/tai-khoan/bao-hanh`): 3 bước chọn cây → tối đa 3 ảnh (nén ở trình duyệt ≤1600px) + triệu chứng → gửi. Chỉ cây sống của đơn đã giao, trong 7 ngày, mỗi cây 1 yêu cầu đang mở. Ảnh lưu trong database, phục vụ qua `/api/uploads/[file]` (chỉ chủ yêu cầu hoặc nhân viên; kiểm tra byte đầu file; chặn `../`).
- Admin (menu trái có số việc thật: đơn chờ xác nhận, bảo hành chờ duyệt, hàng dưới mức):
  - Tổng quan (số liệu thật), Đơn hàng (lọc, tìm, chi tiết, đổi trạng thái; hủy → trả kho; giao xong → cộng điểm).
  - **Sản phẩm** (`/admin/san-pham`, thêm `/admin/san-pham/moi`, sửa `/admin/san-pham/<slug>`): loại sản phẩm điền sẵn thông số; thuốc BVTV bắt buộc 4 thông số an toàn; không xóa quy cách cũ (đơn cũ tham chiếu theo thứ tự); bật/tắt bán ngay trong bảng. Chỉ role `admin` được sửa, `staff` chỉ xem.
  - Mức tồn tối thiểu `MIN_STOCK = 10` (tổng các cửa hàng) trong `server/inventory.ts`.
  - **Bảo hành** (`/admin/bao-hanh`, chi tiết `/admin/bao-hanh/<id>`): xem ảnh, chọn hướng xử lý. **Đổi cây mới** → tự tạo đơn 0đ (cùng địa chỉ/khung giờ, trừ kho, chọn số cây); **Cứu cây** → tự tạo đơn tặng Trichoderma 0đ (bỏ chọn được); **Hoàn tiền** → ghi số tiền "Chờ hoàn tiền", admin chuyển khoản tay rồi bấm "Xác nhận đã hoàn" kèm mã giao dịch; **Từ chối** bắt buộc lý do ≥10 ký tự. Khách thấy kết quả, link đơn đổi, trạng thái hoàn tiền.
  - **Kho nhiều cửa hàng + lô** (`/admin/kho`): 3 cửa hàng (Vườn Q7 mặc định, Nguyễn Văn Linh, Thảo Điền — tạo trong migration 0002, tọa độ ước lượng), lọc theo cửa hàng, cột tồn từng cửa hàng, hạn gần nhất, tab "Sắp / đã hết hạn". Hộp thoại: Nhập hàng (chọn cửa hàng, số lô, hạn dùng) / Kiểm kê từng lô / Chuyển kho (giữ số lô + hạn).
- **Thông báo**: chuông trên Header (tab Đơn hàng/Bảo hành/Khuyến mãi, đánh dấu đã đọc) — khi đặt đơn, đổi trạng thái đơn, kết quả bảo hành, đã hoàn tiền.
- **Sổ địa chỉ có bản đồ** (MapPicker, Leaflet): tìm đường, kéo ghim, vị trí của tôi, tự điền địa chỉ, báo trong/ngoài vùng giao cây sống; thẻ địa chỉ có nhãn vùng giao; thanh toán cảnh báo + server chặn giao cây sống ngoài vùng.

**Còn dở / TODO trong phần đã làm:**
- Hoàn tiền vẫn làm tay (chưa có cổng thanh toán) — chỗ nối API ở `confirmRefund()` trong `server/warranty.ts`.
- Zalo ZNS / email đã có code nhưng **chưa cấu hình**: điền `ZALO_ZNS_ACCESS_TOKEN`, `ZALO_ZNS_TEMPLATE_ID` (template có tham số customer_name, content, link), `RESEND_API_KEY`, `EMAIL_FROM`, `SITE_URL` trong `web/.env.local` (mẫu ở `.env.example`). Chưa có trang admin xem nhật ký `outbound_messages` (xem bằng `npm run db:studio`); chưa có cài đặt khách chọn kênh nhận.
- Chưa có ảnh "cây trước khi giao" do shop chụp để so sánh (thiết kế AdminWarranty có ô này).
- Chưa có trang admin sửa cửa hàng (tên/địa chỉ/tọa độ) — đang sửa trong DB; ô "Đang xem: Tất cả cửa hàng" ở menu trái admin chưa nối; đơn online luôn xuất từ kho mặc định trước, chưa chọn kho theo địa chỉ khách.
- Bản đồ dùng máy chủ miễn phí (giới hạn lượng dùng, không đảm bảo hiển thị chủ quyền Hoàng Sa – Trường Sa theo quy định VN): khi chạy thật nên chuyển Goong / Vietmap (đặt `NEXT_PUBLIC_MAP_TILES`, thay 2 hàm geocode trong `components/MapPicker.tsx`). Tọa độ 3 cửa hàng là ước lượng — cần cập nhật đúng.

## Việc tiếp theo (chưa làm)

- Gửi OTP thật qua Zalo ZNS / SMS (`sendOtp` trong `server/auth.ts`) — cần tài khoản nhà cung cấp.
- Cổng thanh toán VietQR / MoMo / ZaloPay / thẻ + webhook đánh dấu đã trả.
- Còn là giao diện mẫu (view sinh tự động, dữ liệu giả): Vườn của tôi, Lịch chăm cây, Yêu thích, Góc chăm cây/bài viết, Bệnh cây, Tin tức; admin Khách hàng, Khuyến mãi, Giao hàng, Nhập hàng (phiếu nhập/NCC), Nội dung, Đánh giá, Phân quyền, Báo cáo, POS, Mẫu tin nhắn, Cài đặt giao hàng, Yêu cầu dịch vụ; app nhân viên.
- Gợi ý thứ tự tiếp: admin Khách hàng (dữ liệu có sẵn: users, orders, addresses) → Yêu thích (bảng mới) → Khuyến mãi/voucher → Vườn của tôi + Lịch chăm cây.
- Ảnh sản phẩm thật (hiện dùng icon).
- Nhiều máy chủ → chuyển SQLite sang PostgreSQL (giữ schema Drizzle).
- Đã chuyển SQLite → Supabase PostgreSQL (26/09/2026), kiểm thử lại toàn bộ luồng (đặt hàng, 2 đơn tranh tồn, hủy trả kho, trạng thái, điểm, bảo hành duyệt trùng, kho nhập/chuyển/kiểm kê, sổ địa chỉ, sản phẩm) + Playwright các trang khách/admin.
- Mật khẩu database đã lộ trong chat — nên đổi trong Supabase (Settings → Database) rồi sửa `DATABASE_URL` ở `.env.local` và Vercel.
- Admin Tổng quan chạy ~20 truy vấn lần lượt: nếu chậm thì gộp truy vấn trong `server/stats.ts`.
