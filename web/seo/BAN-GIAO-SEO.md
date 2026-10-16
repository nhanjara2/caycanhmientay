# Bàn giao SEO — caycanhmientay.com

Tài liệu cho người làm SEO / vận hành nội dung (mục 21 checklist `design-system/file out/seoweb.txt`). Cập nhật 16/10/2026.
Chi tiết kỹ thuật của từng phần nằm trong `CLAUDE.md` ở thư mục gốc, các mục "SEO — …".

- Tên miền chuẩn duy nhất: **https://www.caycanhmientay.com** (`SITE_ORIGIN` trong `web/src/lib/site.ts`).
- Web một ngôn ngữ (tiếng Việt), một thị trường (Việt Nam) — không có hreflang.
- Mọi trang khách dựng ở máy chủ (server component): nội dung, title, canonical, JSON-LD có sẵn trong HTML, không chờ JavaScript.

---

## 1. Route và template

| Đường dẫn | Template | Index? | Ghi chú |
|---|---|---|---|
| `/` | Trang chủ | Có | Organization + WebSite JSON-LD, h1 ẩn (banner là ảnh) |
| `/danh-muc` | Tất cả sản phẩm | Có | CollectionPage + ItemList |
| `/danh-muc/<danh-mục>`, `/danh-muc/<danh-mục>/<nhóm-con>` | Danh mục | Có khi có hàng | Trống → noindex, follow. Lọc / sắp xếp → noindex, follow + canonical về trang gốc. `?trang=n` canonical tự trỏ |
| `/san-pham/<slug>` | Sản phẩm | Có | Product (một Offer), FAQPage, BreadcrumbList. Hết hàng vẫn index, ghi "Hết hàng" |
| `/benh-cay` | Thư viện bệnh cây | Có | Lọc / tìm → noindex, follow |
| `/benh-cay/<slug>` | Bài bệnh cây | Có | Article |
| `/goc-cham-cay`, `/goc-cham-cay?chuyen-muc=…` | Danh sách bài | Có khi có bài | `?the=`, `?loai=video` → noindex |
| `/goc-cham-cay/<slug>` | Bài viết / video | Có (đã đăng) | BlogPosting / VideoObject |
| `/tin-tuc`, `/tin-tuc/<slug>` | Truyền thông | Có khi có bài | NewsArticle |
| `/video` | Video ngắn | Có khi có video | `?v=<slug>` canonical về bài video |
| `/doi-tac` | Đối tác sỉ | Có | |
| `/doi-tac/cong-trinh/<slug>` | Công trình | Có khi có nội dung | Chỉ có tên → noindex, follow |
| `/chinh-sach/<slug>` (16 trang) | Chính sách / giới thiệu | Có | `/chinh-sach` trơn là 404 |
| `/he-thong-cua-hang` | Cửa hàng | Có | GardenStore |
| `/bao-gia-si`, `/tu-van-chon-cay`, `/khuyen-mai` | Trang tĩnh | Có | |
| `/flash-sale`, `/cay-tet` | Giao diện mẫu (dữ liệu giả) | **Không** | Làm thật thì bỏ dòng robots trong trang |
| `/tim-kiem` | Tìm kiếm nội bộ | **Không** | Chặn trong robots.txt |
| `/gio-hang`, `/thanh-toan`, `/dat-hang-thanh-cong`, `/tai-khoan/*` | Riêng tư | **Không** | noindex + chặn robots.txt |
| `/admin/*`, `/nhan-vien/*` | Quản trị | **Không** | Cần đăng nhập |
| `/sitemap.xml`, `/sitemaps/<loại>.xml`, `/robots.txt`, `/manifest.webmanifest` | Máy đọc | — | |
| `/api/<loại>-images/<slug>-<mã>.jpg` | Ảnh công khai | Có | `?w=` bản thu nhỏ WebP |

Thêm trang khách công khai mới: có `alternates.canonical`, `description` riêng, bọc `withSeo(withShare(...))`, dùng `<Breadcrumb>`, thêm vào `STATIC_PAGES` (hoặc một nhóm) trong `web/src/server/sitemap.ts`.

## 2. Loại trang được / không được index

**Được index**: trang chủ, danh mục và nhóm con có hàng, sản phẩm đang bán (kể cả tạm hết hàng), bài bệnh cây đang hiện, bài viết / video đã đăng, danh sách bài có bài, công trình có nội dung, chính sách, trang tĩnh giới thiệu.

**Không index**:
- noindex, follow (Google vẫn đi theo link): danh mục / danh sách trống, trang đang lọc / sắp xếp / thẻ chủ đề, công trình chỉ có tên, `/flash-sale`, `/cay-tet`, trang admin đặt tay "Ẩn khỏi Google".
- noindex + chặn robots.txt: giỏ, thanh toán, đặt hàng thành công, tài khoản, tìm kiếm, admin, app nhân viên.
- noindex bằng header `X-Robots-Tag`: mọi trang trên `*.vercel.app`, link xem trước `?xem-truoc=1`, ảnh riêng tư.
- 404: nội dung ẩn / nháp / lên lịch / đã xóa (có chuyển hướng thì 308).

Luật trong code: `listingRobots`, `contentState` / `contentRobots`, `applySeoOverride` (`web/src/lib/seo-rules.ts`).

## 3. Quy tắc title và meta description

| Loại trang | Title | Description |
|---|---|---|
| Sản phẩm | Tên chi tiết (SEO) — ô admin, trống thì tự ghép (`lib/seo-name.ts`) | Mô tả ngắn, cắt ≤ 170 ký tự |
| Danh mục / nhóm con | Ô "Hiện trên Google" ở admin, trống = tên | Ô admin, trống = câu tự tạo từ sản phẩm đang bán |
| Bài viết | Tiêu đề bài (+ "| Cây Cảnh Miền Tây" nếu ≤ 45 ký tự); tiêu đề SEO riêng ở khung SEO | Mô tả SEO → đoạn dẫn → đoạn đầu bài |
| Bệnh cây, công trình | Tên (+ đuôi loại trang) | Tóm tắt → câu tự ghép |
| Danh sách trang 2, 3… | thêm "· Trang n" | thêm "Trang n." |
| Mọi trang | Ô đặt tay ở khung "Google & chia sẻ (SEO)" / `/admin/seo` luôn thắng | |

Giới hạn: title 15–70, description 50–170 (chỉ cảnh báo). Không hai trang chung title / description. og:title / og:description luôn bằng title / description (không đặt riêng).

## 4. Quy tắc canonical

- URL tuyệt đối https trên tên miền chính, tự trỏ chính trang; một canonical, trong `<head>`.
- Tham số theo dõi (`utm_*`, `fbclid`, `gclid`, `zarsrc`…) không đổi canonical.
- Lọc / sắp xếp / thẻ → canonical về trang gốc. Phân trang `?trang=n` → tự trỏ; `trang=1` hoặc quá số trang → chuyển về trang đúng.
- Mỗi sản phẩm một URL; quy cách chọn trên trang, không có URL biến thể.
- Canonical đặt tay ở admin: chỉ Quản lý; không cho trỏ trang chủ, trang không mở được, trang noindex, trang lại trỏ đi tiếp.

## 5. Quy tắc URL và chuyển hướng

- Slug: chữ thường không dấu, số, nối "-" (`slugify` trong `lib/slug.ts`); trùng thì thêm `-2`, `-3`.
- Đường dẫn viết hoa / có dấu / dấu cách / `_` / tham số lặp → **308 một bước** về URL chuẩn (`src/proxy.ts`).
- Sản phẩm, bệnh cây, danh mục **không đổi slug**. Bài đã đăng và công trình đổi được ở khung SEO → tự tạo 308 + sửa link trong bài viết.
- Chuyển hướng tay (`/admin/seo` → tab Chuyển hướng): chỉ cho đường dẫn nội dung (`/san-pham/`, `/danh-muc/`, `/goc-cham-cay/`, `/tin-tuc/`, `/benh-cay/`, `/doi-tac/cong-trinh/`), chỉ có tác dụng khi trang cũ đã mất nội dung; luôn lưu đích cuối, chặn vòng lặp. Đường dẫn ngoài các tiền tố này: thêm vào `redirects()` trong `web/next.config.ts` (`permanent: true`).
- Không dồn trang đã xóa về trang chủ. Không có trang thay thế → để 404.

## 6. robots.txt

Sinh từ `web/src/app/robots.ts`: cho phép tất cả; chặn `/admin`, `/nhan-vien`, `/api/` (trừ 6 loại ảnh công khai), `/tai-khoan`, `/gio-hang`, `/thanh-toan`, `/dat-hang-thanh-cong`, `/tim-kiem`; không chặn `/_next`, `/images`; dòng `Sitemap:` trỏ `https://www.caycanhmientay.com/sitemap.xml`. Cùng nội dung cho mọi tên miền.

## 7. Cấu trúc sitemap

`/sitemap.xml` = file chỉ mục → `/sitemaps/trang.xml`, `san-pham.xml`, `benh-cay.xml`, `bai-viet.xml`, `cong-trinh.xml` (quá 10.000 URL thì `san-pham-2.xml`…). Có ảnh (`image:image`) và video (`video:video`). lastmod = ngày sửa thật, trang không có ngày thật thì bỏ trống. Chỉ chứa trang được index + canonical tự trỏ. CDN giữ 10 phút. Code: `web/src/server/sitemap.ts`, `web/src/lib/sitemap-xml.ts`.

## 8. Structured data (JSON-LD)

| Trang | Schema |
|---|---|
| Trang chủ | Organization, WebSite |
| Sản phẩm | Product (Offer, shippingDetails, hasMerchantReturnPolicy, AggregateRating + Review khi có đánh giá thật), FAQPage |
| Danh mục, `/danh-muc` | CollectionPage + ItemList |
| Bài Góc chăm cây / Truyền thông / video | BlogPosting / NewsArticle / VideoObject |
| Bài bệnh cây | Article |
| Hệ thống cửa hàng | GardenStore (cửa hàng của shop đang hiện) |
| Mọi trang có breadcrumb | BreadcrumbList |

Không dùng: HowTo, QAPage, ProductGroup, SearchAction, hreflang. Một chỗ dựng: `web/src/lib/jsonld.ts` + `<JsonLd>`.

## 9. Component SEO dùng chung

| Component / hàm | Dùng để |
|---|---|
| `withShare` (`lib/seo.ts`) | og:url, ảnh chia sẻ, loại trang, ngày đăng / sửa |
| `withSeo` (`server/seo-cms.ts`) | Áp SEO đặt tay ở admin |
| `movedOrNotFound` | Thay `notFound()` ở trang nội dung: có chuyển hướng → 308, không → 404 |
| `listingRobots`, `contentRobots` (`lib/seo-rules.ts`) | robots theo trạng thái trang |
| `<Breadcrumb>` (`components/Blocks.tsx`) | Breadcrumb hiển thị + BreadcrumbList |
| `<JsonLd>` (`components/JsonLd.tsx`) | Chèn JSON-LD an toàn |
| `responsive()`, `thumbUrl()` (`lib/images.ts`) | Ảnh srcset / bản thu nhỏ có slug |
| `redirectIfNotCanonical` (`lib/url-params.ts`) | Chuẩn hóa phân trang / tham số |
| `src/proxy.ts` | Chuẩn hóa URL 308, noindex `*.vercel.app` / xem trước, ghi lượt bot |

## 10. Quản lý SEO trong CMS (admin)

- Cuối trang sửa sản phẩm, bài viết, bệnh cây, công trình, danh mục: khung **"Google & chia sẻ (SEO)"** — tiêu đề, mô tả, ảnh chia sẻ (người sửa được nội dung đó); Ẩn khỏi Google, canonical (chỉ Quản lý). Lưu riêng, có xem trước kiểu Google + 5 lần sửa gần nhất.
- Danh mục / nhóm con: khung "Hiện trên Google" trong `/admin/danh-muc/<slug>`.
- **`/admin/seo`** (chỉ Quản lý): tab Trang, Cảnh báo, Chuyển hướng, Nhật ký, Theo dõi (404, lỗi, Googlebot, tốc độ thật); nút **Tải Excel kiểm tra SEO**.
- Ảnh sản phẩm: mục "Mô tả ảnh cho Google" (alt) dưới khung ảnh.

## 11. Đăng, sửa slug, xóa nội dung

- **Đăng**: bài viết Lưu nháp → (Gửi duyệt) → Đăng / Lên lịch. Nháp / lên lịch = 404 với khách, Xem trước `?xem-truoc=1` có noindex. Sitemap cập nhật ≤ 10 phút.
- **Sửa slug**: bài đã đăng / công trình → khung SEO, ô "Đổi đường dẫn" (tự 308 + đổi link trong bài khác). Bài chưa đăng sửa ở trình soạn. Sản phẩm / bệnh / danh mục không đổi slug.
- **Tạm hết hàng**: để Đang bán, tồn 0 (trang vẫn index, ghi "Hết hàng"). **Ngừng bán hẳn**: Ẩn / Xóa → 404, rời sitemap; có sản phẩm thay thế thì thêm chuyển hướng ở `/admin/seo` (tab gợi ý sẵn).
- Xóa bài / công trình: thêm chuyển hướng nếu có trang thay thế.

## 12. Xử lý 404 và chuyển hướng

1. `/admin/seo` → tab **Theo dõi**: danh sách đường dẫn 404 có lượt truy cập, trang dẫn tới, backlink, Googlebot.
2. Bấm **Chuyển hướng** → điền sẵn đường dẫn cũ, chọn trang mới tương đương → lưu (308).
3. Nhiều dòng một lần: tab Chuyển hướng → "Thêm nhiều chuyển hướng" (dán 2 cột từ Excel).
4. 404 không có trang tương đương: để nguyên (đừng chuyển về trang chủ).
5. Kiểm lại: `npm run seo:migration -- https://www.caycanhmientay.com seo/url-quan-trong.txt`.

## 13. Kiểm thử, báo cáo crawl audit, schema, Core Web Vitals

| Lệnh | Khi nào |
|---|---|
| `npm run test:seo`, `npm run test:jsonld` | Kiểm thử đơn vị — tự chạy trên GitHub mỗi lần push |
| `npm run seo:gate -- <web>` | Cổng SEO — tự chạy trên GitHub mỗi lần Vercel deploy xong |
| `npm run seo:all -- <web>` | **Toàn bộ** (crawl audit, HTML đã render, schema, mobile, a11y, Core Web Vitals) → báo cáo `seo/bao-cao/kiem-tra-<ngày>.md` |
| `npm run seo:all -- <web> --nhanh` | Như trên, bỏ 3 công cụ cần Chrome |
| Từng lệnh `seo:sitemap`, `seo:canonical`, `seo:metadata`, `seo:head`, `seo:html`, `seo:images`, `seo:schema`, `seo:params`, `seo:breadcrumb`, `seo:locale`, `seo:templates`, `seo:components`, `seo:ecommerce`, `seo:data`, `seo:migration`, `seo:security`, `seo:mobile`, `seo:a11y`, `seo:perf`, `seo:monitor` | Chạy riêng một phần |

**Báo cáo bàn giao**: chạy `npm run seo:all -- https://www.caycanhmientay.com` sau lần deploy cuối, đính kèm file trong `seo/bao-cao/`. Bản này chưa chạy (chủ shop tự chạy). Ngoài công cụ: Google Rich Results Test + validator.schema.org cho trang chủ, 1 sản phẩm, 1 bài, `/he-thong-cua-hang`; PageSpeed Insights bản điện thoại; Search Console → Trải nghiệm trang / Core Web Vitals (số thật của khách) và tab Theo dõi → Tốc độ thật ở `/admin/seo`.

**Phân loại lỗi của cổng SEO**: CHẶN (robots chặn cả web, sitemap hỏng / rỗng / URL ngoài tên miền, trang chủ hoặc trang sitemap 5xx, cả loại trang noindex, ≥ 20% canonical trỏ staging, ≥ 50% metadata hỏng, cả loại trang mất nội dung chính, vòng lặp chuyển hướng) → bước GitHub đỏ + email; NGHIÊM TRỌNG (lỗi lẻ từng trang) và CẢNH BÁO (độ dài title, trang chậm) → chỉ ghi báo cáo (`GATE_STRICT=1` để coi nghiêm trọng là lỗi).

## 14. Quy trình deploy và rollback

1. Push lên nhánh `main` của `nhanjara-flora-global/caycanhmientay` → Vercel tự build (`prebuild` chạy migration database) và deploy.
2. GitHub Actions "Cổng SEO" chạy `seo:gate` với bản vừa deploy (+ URL quan trọng với production). Muốn Vercel chờ cổng rồi mới lên production: Vercel → Settings → **Deployment Checks** → thêm "Cổng SEO".
3. Sau deploy lớn: `npm run seo:all -- https://www.caycanhmientay.com`.
4. **Rollback**: Vercel → Deployments → chọn bản trước → **Instant Rollback** (đổi code ngay). Database không lùi theo (migration chỉ thêm cột / bảng nên code cũ vẫn chạy); dữ liệu hỏng thì khôi phục từ bản sao lưu đêm (GitHub Actions "Sao lưu database", cần secret `BACKUP_DATABASE_URL`).
5. Đổi cấu trúc lớn / tên miền: xem quy trình ở mục "SEO — redirect, đổi nội dung, migration website" trong `CLAUDE.md`.
6. Giám sát định kỳ: GitHub Actions "Giám sát web" mỗi 6 giờ (`seo:security`, URL quan trọng, `seo:monitor`).

## 15. Lỗi / việc SEO còn tồn đọng

- 22 tiêu đề sản phẩm dài 72–121 ký tự (Tên chi tiết SEO cố ý dài) — sửa ô Tên chi tiết nếu muốn gọn.
- Menu / chân trang link tới ~30 danh mục / nhóm con chưa có hàng (noindex) — cân nhắc ẩn danh mục trống khỏi menu.
- `/flash-sale`, `/cay-tet` vẫn là giao diện mẫu dữ liệu giả, noindex nhưng có link từ trang chủ.
- `/danh-muc` và `/danh-muc/cay-canh` gần trùng nội dung khi chỉ có một danh mục có hàng.
- Trang lọc vừa noindex vừa canonical về trang gốc (Google khuyên một trong hai).
- Nhiều sản phẩm chưa có ảnh thật → ảnh chia sẻ mặc định, không có ảnh trong sitemap.
- Chưa có: ảnh đại diện riêng cho danh mục, alt riêng ảnh bài viết, transcript video, AVIF, ảnh cửa hàng cho GardenStore, ngày đăng bài bệnh cây, schema trang công trình, đổi slug sản phẩm / bệnh cây, mã 410.
- Chưa tích hợp Search Console API; chưa có theo dõi uptime 5 phút (nên dùng UptimeRobot / Better Stack).
- Giá gạch ngang là giá chưa từng bán (rủi ro pháp lý khuyến mại) — không đưa vào schema.
- Chưa đặt secret `SEO_MONITOR_TOKEN` (Vercel + GitHub), `BACKUP_DATABASE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET` (nếu bật Deployment Protection).
- Việc ngoài code: gửi sitemap ở Search Console, kiểm Rich Results, Facebook Sharing Debugger, Kiểm tra URL trong Search Console.
