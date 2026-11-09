// Schema database (PostgreSQL / Supabase qua Drizzle). Đổi schema xong chạy `npm run db:generate` để tạo migration.
import { sql } from 'drizzle-orm';
import type { BundlePart } from '../../lib/bundle';
import type { FengShui, SpecField } from '../../lib/catalog';
import type { BannerEn, ProductEn } from '../../lib/i18n-content';
import { CASH_KINDS } from '../../lib/cash-labels';
import type { Disease } from '../../lib/diseases';
import type { PostBlock } from '../../lib/posts';
import type { ProductAttrs } from '../../lib/product-filters';
import type { ProjectImage, ProjectMetric, ProjectQuote, ProjectRole } from '../../lib/projects';
import type { SavedPlan } from '../../lib/plant-advisor';
import { STAFF_ROLES } from '../../lib/permissions';
import { PARTNER_STATUSES, PARTNER_TYPES } from '../../lib/partners';
import type { SeoChange } from '../../lib/seo-cms';
import { SERVICE_STAGES, SERVICE_TYPES, SOURCES } from '../../lib/service-labels';
import type { VoucherScope } from '../../lib/voucher-scope';
import { boolean, customType, doublePrecision, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const createdAt = () => ts('created_at').notNull().defaultNow();
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => 'bytea' });

// ---- Tài khoản ------------------------------------------------------------------------------

export const ROLES = ['customer', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** Tài khoản định danh bằng SĐT đã xác thực (BRANDBOOK). */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  /** SĐT đã xác thực OTP; null với tài khoản chỉ đăng nhập Google. */
  phone: text('phone').unique(),
  /** SĐT liên hệ khách tự khai (không xác thực) — bắt buộc trước khi đặt hàng với tài khoản Google.
   *  Chỉ dùng để gọi/giao hàng; KHÔNG dùng để nhận đơn vãng lai cùng SĐT (việc đó chỉ theo `phone` đã xác thực). */
  contactPhone: text('contact_phone'),
  name: text('name'),
  email: text('email'),
  /** Tài khoản Google (claim `sub`). */
  googleSub: text('google_sub').unique(),
  /** Ảnh đại diện Google (https://*.googleusercontent.com), cập nhật mỗi lần đăng nhập Google; null = không có. */
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ROLES }).notNull().default('customer'),
  /** Vai trò của nhân viên (role = 'staff'): CSKH / Kho / Kỹ sư / Giao hàng — xem lib/permissions.ts. null = chưa gán (xem như CSKH). */
  staffRole: text('staff_role', { enum: STAFF_ROLES }),
  points: integer('points').notNull().default(0),
  /** Ghi chú nội bộ của shop về khách (admin Khách hàng) — khách không thấy. */
  notes: text('notes'),
  /** Đối tác sỉ (lib/partners.ts): khách tự đăng ký ở /doi-tac (status 'pending'), admin duyệt + đặt chiết khấu. null = khách thường. */
  partnerType: text('partner_type', { enum: PARTNER_TYPES }),
  partnerStatus: text('partner_status', { enum: PARTNER_STATUSES }),
  /** % chiết khấu riêng trên tiền hàng — chỉ áp dụng khi partner_status = 'approved'. */
  partnerDiscount: integer('partner_discount').notNull().default(0),
  /** Tên đơn vị, mã số thuế, khu vực hoạt động khách khai khi đăng ký đối tác. */
  company: text('company'),
  taxCode: text('tax_code'),
  partnerArea: text('partner_area'),
  partnerAt: ts('partner_at'),
  createdAt: createdAt(),
});

/** Mã OTP: chỉ lưu bản băm; giới hạn số lần nhập sai. */
export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  phone: text('phone').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: ts('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: ts('consumed_at'),
  createdAt: createdAt(),
}, (t) => [index('otp_phone_idx').on(t.phone, t.createdAt)]);

/** Phiên đăng nhập: cookie giữ token ngẫu nhiên, bảng giữ sha256(token) -> thu hồi được. */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: ts('expires_at').notNull(),
  createdAt: createdAt(),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

// ---- Sản phẩm -------------------------------------------------------------------------------

/**
 * Danh mục sản phẩm (menu trái, trang /danh-muc/<slug>), admin sửa ở /admin/danh-muc.
 * Slug không đổi sau khi tạo: sản phẩm và đường dẫn tham chiếu theo slug. `specs` = bộ thông số điền sẵn khi thêm sản phẩm.
 */
export const categories = pgTable('categories', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  sort: integer('sort').notNull().default(0),
  /** false = ẩn khỏi menu, trang chủ, chân trang (trang danh mục và sản phẩm vẫn mở được). */
  active: boolean('active').notNull().default(true),
  specs: jsonb('specs').$type<SpecField[]>().notNull().default(sql`'[]'::jsonb`),
  /** Tiêu đề / mô tả trên Google do admin tự viết; null = web tự tạo (lib/category-seo.ts). */
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  /** Bản tiếng Anh: { name } — null = tên tiếng Việt. */
  en: jsonb('en').$type<{ name: string }>(),
  /** Đoạn giới thiệu hiện cuối trang danh mục (trang 1, không lọc); null = không hiện. Đoạn cách nhau một dòng trống. */
  intro: text('intro'),
  createdAt: createdAt(),
});

/** Nhóm con trong danh mục (/danh-muc/<danh mục>/<nhóm con>). `specs` = thông số thêm, nối sau bộ của danh mục. */
export const subcategories = pgTable('subcategories', {
  categorySlug: text('category_slug').notNull().references(() => categories.slug, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  sort: integer('sort').notNull().default(0),
  active: boolean('active').notNull().default(true),
  specs: jsonb('specs').$type<SpecField[]>().notNull().default(sql`'[]'::jsonb`),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  /** Bản tiếng Anh: { name } — null = tên tiếng Việt. */
  en: jsonb('en').$type<{ name: string }>(),
  intro: text('intro'),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.categorySlug, t.slug] })]);

export const products = pgTable('products', {
  slug: text('slug').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  /** Tên chi tiết (SEO) cho <title>, H1, JSON-LD — null = tạo tự động theo công thức (lib/seo-name.ts). */
  seoName: text('seo_name'),
  category: text('category').notNull(),
  sub: text('sub').notNull(),
  /** Nhóm con phụ (cùng danh mục): sản phẩm hiện thêm ở các nhóm này, vd. Kim tiền vừa là cây văn phòng vừa là cây ban công. */
  extraSubs: jsonb('extra_subs').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  icon: text('icon').notNull(),
  origin: text('origin').notNull(),
  ship: text('ship', { enum: ['plant', 'supply'] }).notNull(),
  pesticide: boolean('pesticide').notNull().default(false),
  /** Không áp mã giảm giá / mã miễn phí giao: tiền của sản phẩm này không tính vào tiền hàng xét mã (vd. cây lớn giá đã chốt). */
  noVoucher: boolean('no_voucher').notNull().default(false),
  unit: text('unit').notNull(),
  spec: text('spec').notNull(),
  lead: text('lead').notNull(),
  specs: jsonb('specs').$type<[string, string][]>().notNull(),
  keywords: jsonb('keywords').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  rating: integer('rating_x10').notNull().default(0),
  reviews: integer('reviews').notNull().default(0),
  sold: integer('sold').notNull().default(0),
  flashSold: integer('flash_sold'),
  flashTotal: integer('flash_total'),
  active: boolean('active').notNull().default(true),
  /** Mã video YouTube (11 ký tự) hiện ở trang chi tiết — video để trên YouTube, web chỉ nhúng. */
  youtubeId: text('youtube_id'),
  /** Bài mô tả chi tiết (khối như bài viết: đoạn, ảnh link ngoài, bảng…), trống = chỉ có mô tả ngắn. */
  body: jsonb('body').$type<PostBlock[]>().notNull().default(sql`'[]'::jsonb`),
  /** Phong thủy: mệnh hợp, hợp tuổi, ý nghĩa, vị trí đặt. */
  fengshui: jsonb('fengshui').$type<FengShui>(),
  /** Đặc điểm cây cho bộ lọc: vị trí đặt, kích thước, màu (lib/product-filters.ts). null = chưa gắn. */
  attrs: jsonb('attrs').$type<ProductAttrs>(),
  /** Bản tiếng Anh (trang /en, lib/i18n.ts) — null = hiện tiếng Việt. Dịch bằng AI qua migration. */
  en: jsonb('en').$type<ProductEn>(),
  /** Lần cuối nội dung khách thấy thay đổi (tên, mô tả, thông số, quy cách / giá, ảnh) — lastmod của sitemap. Bật / tắt bán không tính. */
  updatedAt: ts('updated_at').notNull().defaultNow(),
  createdAt: createdAt(),
}, (t) => [index('products_cat_idx').on(t.category, t.sub)]);

/** Ảnh sản phẩm (đã nén ở trình duyệt) lưu trong database; `idx` nhỏ nhất là ảnh đại diện. */
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  idx: integer('idx').notNull(),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  /** Mô tả ảnh (alt) do admin nhập; null = web tự dùng tên sản phẩm (`imageAlt` trong lib/catalog.ts). */
  alt: text('alt'),
  /** Ảnh của quy cách (`product_options.idx`, vd. hoa màu đỏ): khách chọn quy cách đó thì ảnh lớn đổi sang ảnh này. null = ảnh chung. */
  optionIdx: integer('option_idx'),
  createdAt: createdAt(),
}, (t) => [index('product_images_slug_idx').on(t.productSlug, t.idx)]);

/**
 * Quy cách bán (Chậu sứ / Chỉ cây, Chai 500ml / Thùng…) — giá tính theo từng quy cách.
 * Các mức giá (lib/pricing.ts): giá tại vườn `garden` → giá gốc `cost` (hai giá này chỉ admin thấy) → giá lẻ `price` (giá bán)
 * → combo 2 cây `combo2`; `oldPrice` = giá gạch ngang hiện cạnh giá lẻ. Giá sỉ công trình: liên hệ báo giá (không lưu).
 */
export const productOptions = pgTable('product_options', {
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  idx: integer('idx').notNull(),
  label: text('label').notNull(),
  price: integer('price').notNull(),
  oldPrice: integer('old_price'),
  /** Giá tại vườn (giá mua) — chỉ admin thấy, không gửi xuống trình duyệt của khách. */
  garden: integer('garden'),
  /** Giá gốc = giá tại vườn + 10% — chỉ admin thấy. */
  cost: integer('cost'),
  /** Giá cho 2 cây cùng quy cách (mỗi cặp trong giỏ). */
  combo2: integer('combo2'),
  /** Cây lớn / cồng kềnh: tính thêm phụ phí giao mỗi cây (Cài đặt giao hàng). */
  bulky: boolean('bulky').notNull().default(false),
  stock: integer('stock').notNull().default(100),
  /** Quy cách đã xóa: dòng giữ lại để số thứ tự `idx` không bao giờ dùng lại (đơn, kho, phiếu nhập, giỏ hàng, mã SKU-n tham chiếu theo idx). */
  deleted: boolean('deleted').notNull().default(false),
  /** Sản phẩm bộ: các quy cách thành phần (lib/bundle.ts). null = quy cách thường. Bộ không có tồn riêng — bán thì trừ kho từng món. */
  parts: jsonb('parts').$type<BundlePart[]>(),
}, (t) => [primaryKey({ columns: [t.productSlug, t.idx] })]);

// ---- Bệnh cây --------------------------------------------------------------------------------

/** Thư viện bệnh cây (/benh-cay). Danh sách nhỏ → lọc, tìm trong bộ nhớ (src/server/diseases.ts). */
export const diseases = pgTable('diseases', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  aliases: jsonb('aliases').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  cause: text('cause').$type<Disease['cause']>().notNull(),
  parts: jsonb('parts').$type<Disease['parts']>().notNull(),
  plants: jsonb('plants').$type<Disease['plants']>().notNull().default(sql`'[]'::jsonb`),
  severity: integer('severity').notNull().default(2),
  spread: text('spread').notNull().default(''),
  season: text('season').notNull().default(''),
  summary: text('summary').notNull(),
  symptoms: jsonb('symptoms').$type<Disease['symptoms']>().notNull(),
  confusions: jsonb('confusions').$type<Disease['confusions']>().notNull().default(sql`'[]'::jsonb`),
  steps: jsonb('steps').$type<Disease['steps']>().notNull(),
  prevention: jsonb('prevention').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  safety: text('safety').notNull().default(''),
  /** Slug sản phẩm xử lý (không ràng buộc khóa ngoại: sản phẩm ẩn/xóa thì chỉ không hiện). */
  products: jsonb('products').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  active: boolean('active').notNull().default(true),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  createdAt: createdAt(),
});

/** Ảnh minh họa triệu chứng của bài bệnh (công khai, phục vụ qua /api/disease-images/[file]). Xóa bài → xóa ảnh. */
export const diseaseImages = pgTable('disease_images', {
  id: serial('id').primaryKey(),
  diseaseSlug: text('disease_slug').notNull().references(() => diseases.slug, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  createdAt: createdAt(),
}, (t) => [index('disease_images_disease_idx').on(t.diseaseSlug)]);

// ---- Bài viết & video (Góc chăm cây, Truyền thông) --------------------------------------------

/**
 * Bài viết / video ngắn. Nội dung là danh sách khối (`body`, lib/posts.ts). Khách chỉ thấy bài
 * `status = 'published'` có `published_at` <= bây giờ (published_at ở tương lai = lên lịch).
 */
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  /** Sinh từ tiêu đề; sửa được tới khi bài đăng lần đầu, sau đó giữ nguyên để link cũ không chết. */
  slug: text('slug').notNull().unique(),
  kind: text('kind', { enum: ['article', 'video'] }).notNull().default('article'),
  /** Chuyên mục (CATEGORIES trong lib/posts.ts) — quyết định bài thuộc Góc chăm cây hay Truyền thông. */
  category: text('category').notNull(),
  title: text('title').notNull(),
  /** Đoạn dẫn: hiện dưới tiêu đề và trên thẻ bài. */
  excerpt: text('excerpt').notNull().default(''),
  body: jsonb('body').$type<PostBlock[]>().notNull().default(sql`'[]'::jsonb`),
  /** Tên file ảnh bìa trong post_images. */
  coverFile: text('cover_file'),
  youtubeId: text('youtube_id'),
  /** Mã video TikTok (dãy số trong link …/video/<mã>) — video loại "video" có youtube_id hoặc tiktok_id, không cả hai. */
  tiktokId: text('tiktok_id'),
  /** Video dọc (YouTube Shorts) → khung 9:16. */
  videoVertical: boolean('video_vertical').notNull().default(false),
  videoSeconds: integer('video_seconds'),
  readMinutes: integer('read_minutes').notNull().default(1),
  authorName: text('author_name').notNull().default(''),
  reviewerName: text('reviewer_name').notNull().default(''),
  reviewerTitle: text('reviewer_title').notNull().default(''),
  /** Slug bài bệnh trong thư viện /benh-cay (không ràng buộc khóa ngoại). */
  diseases: jsonb('diseases').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  seoDescription: text('seo_description').notNull().default(''),
  /** Ghim lên khối nổi bật đầu trang. */
  featured: boolean('featured').notNull().default(false),
  status: text('status', { enum: ['draft', 'review', 'published'] }).notNull().default('draft'),
  publishedAt: ts('published_at'),
  views: integer('views').notNull().default(0),
  helpfulYes: integer('helpful_yes').notNull().default(0),
  helpfulNo: integer('helpful_no').notNull().default(0),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  createdAt: createdAt(),
}, (t) => [index('posts_status_idx').on(t.status, t.publishedAt), index('posts_category_idx').on(t.category)]);

/** Ảnh bìa + ảnh trong bài (công khai, phục vụ qua /api/post-images/[file]). Xóa bài → xóa ảnh. */
export const postImages = pgTable('post_images', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  createdAt: createdAt(),
}, (t) => [index('post_images_post_idx').on(t.postId)]);

/**
 * Dự án / công trình đã triển khai — hiện ở trang Đối tác sỉ (/doi-tac) khi `published`.
 * Chủ shop tự nhập ở /admin/du-an; tên / logo khách chỉ điền khi khách đồng ý công khai.
 */
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  /** Sinh từ tên dự án lúc tạo, không đổi (link /doi-tac/cong-trinh/<slug>). */
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  /** Loại công trình (PROJECT_TYPES trong lib/projects.ts). */
  type: text('type').notNull(),
  /** Phần việc shop đã làm (PROJECT_ROLES). */
  roles: jsonb('roles').$type<ProjectRole[]>().notNull().default(sql`'[]'::jsonb`),
  client: text('client').notNull().default(''),
  /** Tên file logo khách trong project_images (hiện ở dải "Đơn vị đã hợp tác"). */
  clientLogo: text('client_logo'),
  location: text('location').notNull().default(''),
  /** Năm thực hiện; null = chưa rõ (công trình nạp từ danh sách của chủ shop chưa ghi năm). */
  year: integer('year'),
  duration: text('duration').notNull().default(''),
  summary: text('summary').notNull().default(''),
  body: text('body').notNull().default(''),
  scope: jsonb('scope').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  plants: jsonb('plants').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  metrics: jsonb('metrics').$type<ProjectMetric[]>().notNull().default(sql`'[]'::jsonb`),
  quote: jsonb('quote').$type<ProjectQuote>(),
  /** Ảnh công trình theo thứ tự hiển thị, ảnh đầu = ảnh bìa. */
  images: jsonb('images').$type<ProjectImage[]>().notNull().default(sql`'[]'::jsonb`),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(false),
  updatedBy: text('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  createdAt: createdAt(),
}, (t) => [index('projects_published_idx').on(t.published, t.year)]);

/** Ảnh công trình + logo khách (công khai, /api/project-images/[file]). Xóa dự án → xóa ảnh. */
export const projectImages = pgTable('project_images', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  createdAt: createdAt(),
}, (t) => [index('project_images_project_idx').on(t.projectId)]);

// ---- Khuyến mãi ------------------------------------------------------------------------------

export const VOUCHER_DISCOUNT_TYPES = ['percent', 'amount'] as const;
/** 'discount' = giảm tiền hàng; 'ship' = giảm phí giao (miễn phí giao tối đa `discountValue` đồng). Mỗi đơn dùng tối đa một mã mỗi loại. */
export const VOUCHER_KINDS = ['discount', 'ship'] as const;

/** Mã giảm giá khách chọn / nhập lúc thanh toán. Một đơn dùng tối đa một mã giảm tiền hàng + một mã miễn phí giao. */
export const vouchers = pgTable('vouchers', {
  id: serial('id').primaryKey(),
  /** Luôn lưu chữ hoa; không đổi sau khi tạo. */
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  kind: text('kind', { enum: VOUCHER_KINDS }).notNull().default('discount'),
  discountType: text('discount_type', { enum: VOUCHER_DISCOUNT_TYPES }).notNull(),
  /** Phần trăm (1–100) hoặc số tiền (đ) tùy discountType. */
  discountValue: integer('discount_value').notNull(),
  /** Trần số tiền giảm — chỉ áp dụng khi discountType = percent. */
  maxDiscount: integer('max_discount'),
  minOrder: integer('min_order').notNull().default(0),
  /** null = không giới hạn tổng lượt dùng. */
  usageLimit: integer('usage_limit'),
  perCustomerLimit: integer('per_customer_limit').notNull().default(1),
  /** Phạm vi áp dụng (danh mục / nhóm con / sản phẩm, lib/voucher-scope.ts); null = mọi sản phẩm. */
  scope: jsonb('scope').$type<VoucherScope>(),
  startsAt: ts('starts_at'),
  endsAt: ts('ends_at'),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

// ---- Đơn hàng -------------------------------------------------------------------------------

/** Tiến trình đơn theo OrderTimeline: Đặt hàng → Xác nhận → Chuẩn bị cây → Đang giao → Đã giao. */
export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
/** `deposit` = đặt cọc: shop gọi / nhắn Zalo hướng dẫn chuyển khoản (cột là text, thêm giá trị không cần migration). */
export const PAYMENT_METHODS = ['cod', 'qr', 'momo', 'zalopay', 'card', 'deposit'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** sale = đơn khách đặt; warranty = đơn đổi cây / tặng vật tư 0đ do bảo hành tạo. */
export const ORDER_KINDS = ['sale', 'warranty'] as const;
export const ORDER_CHANNELS = ['web', 'pos'] as const;

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  kind: text('kind', { enum: ORDER_KINDS }).notNull().default('sale'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', { enum: ORDER_STATUSES }).notNull().default('pending'),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  delivery: text('delivery', { enum: ['ship', 'pickup'] }).notNull(),
  address: text('address'),
  slot: text('slot'),
  /** Ngày + khung giờ giao khách chọn (YYYY-MM-DD, mã khung ở cài đặt giao hàng); null với đơn cũ chỉ có chữ ở `slot`. */
  slotDate: text('slot_date'),
  slotKey: text('slot_key'),
  /** Chuyến giao đã xếp (admin Giao hàng) và thứ tự điểm dừng trong chuyến. */
  tripId: integer('trip_id').references(() => deliveryTrips.id, { onDelete: 'set null' }),
  tripPos: integer('trip_pos'),
  note: text('note'),
  /** Kênh bán: web = khách đặt trên website; pos = bán tại quầy (admin /admin/pos, đơn giao ngay, đã thu tiền). */
  channel: text('channel', { enum: ORDER_CHANNELS }).notNull().default('web'),
  /** Cửa hàng bán / xuất hàng (đơn POS); null với đơn web (xuất theo kho mặc định). */
  storeId: integer('store_id').references(() => stores.id),
  paymentMethod: text('payment_method', { enum: PAYMENT_METHODS }).notNull(),
  paid: boolean('paid').notNull().default(false),
  /** Lúc ghi nhận đã thu tiền (bán tại quầy: lúc bán; COD: lúc giao xong; online: lúc nhân viên bấm Đã nhận tiền) — sổ Thu chi xếp tiền bán hàng theo ngày này. */
  paidAt: ts('paid_at'),
  original: integer('original').notNull(),
  subtotal: integer('subtotal').notNull(),
  plantShip: integer('plant_ship').notNull(),
  supplyShip: integer('supply_ship').notNull(),
  /** Phí giao được miễn vì đủ mức miễn phí giao, chụp lại lúc đặt: phí giao gốc = plantShip + plantShipFree. Đơn đặt trước đó = 0 (chỉ còn số đã thu). */
  plantShipFree: integer('plant_ship_free').notNull().default(0),
  supplyShipFree: integer('supply_ship_free').notNull().default(0),
  /** Chụp lại mã + số tiền giảm lúc đặt — không ràng buộc khóa ngoại, mã đổi/tắt sau đó không ảnh hưởng đơn cũ. */
  voucherCode: text('voucher_code'),
  voucherDiscount: integer('voucher_discount').notNull().default(0),
  /** Mã miễn phí giao (vouchers.kind = 'ship') và số tiền phí giao được giảm — chụp lại lúc đặt. */
  shipVoucherCode: text('ship_voucher_code'),
  shipVoucherDiscount: integer('ship_voucher_discount').notNull().default(0),
  /** Chiết khấu đối tác sỉ chụp lại lúc đặt (tiền, không phải %). */
  partnerDiscount: integer('partner_discount').notNull().default(0),
  /** Tiền giảm do mua combo 2 cây (giá lẻ × 2 − giá combo, mỗi cặp cùng quy cách) — chụp lại lúc đặt. */
  comboDiscount: integer('combo_discount').notNull().default(0),
  total: integer('total').notNull(),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('orders_code_idx').on(t.code), index('orders_user_idx').on(t.userId), index('orders_status_idx').on(t.status), index('orders_slot_idx').on(t.slotDate, t.slotKey), index('orders_trip_idx').on(t.tripId)]);

// ---- Giao hàng: chuyến giao & cài đặt -------------------------------------------------------

export const VEHICLES = ['truck', 'bike'] as const;
export type Vehicle = (typeof VEHICLES)[number];

/**
 * Chuyến giao (admin Giao hàng): một xe + tài xế cho một khung giờ của một ngày; đơn xếp vào chuyến qua `orders.trip_id`.
 * `capacity` = tải tối đa tính bằng "điểm tải" (mỗi cây sống 1 điểm, mỗi món vật tư 0,25 điểm).
 */
export const deliveryTrips = pgTable('delivery_trips', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  slotKey: text('slot_key').notNull(),
  vehicle: text('vehicle', { enum: VEHICLES }).notNull(),
  name: text('name').notNull(),
  driverId: integer('driver_id').references(() => users.id, { onDelete: 'set null' }),
  helper: text('helper'),
  capacity: integer('capacity').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: createdAt(),
}, (t) => [index('delivery_trips_date_idx').on(t.date, t.slotKey), index('delivery_trips_driver_idx').on(t.driverId)]);

/** Cài đặt dạng khóa → JSON (hiện có 'shipping': phí giao, vùng giao, khung giờ — xem lib/shipping.ts). */
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

/** Dòng hàng chụp lại tên/giá lúc đặt — đổi giá sản phẩm sau đó không làm sai đơn cũ. */
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productSlug: text('product_slug').notNull(),
  optionIdx: integer('option_idx').notNull(),
  name: text('name').notNull(),
  label: text('label').notNull(),
  unit: text('unit').notNull(),
  icon: text('icon').notNull(),
  ship: text('ship', { enum: ['plant', 'supply'] }).notNull(),
  price: integer('price').notNull(),
  oldPrice: integer('old_price'),
  /** Tiền vốn mỗi đơn vị (= product_options.cost) chụp lúc đặt, null = quy cách chưa khai giá gốc. Chỉ admin thấy. Ghi bằng `snapshotItemCosts`. */
  cost: integer('cost'),
  qty: integer('qty').notNull(),
}, (t) => [index('order_items_order_idx').on(t.orderId)]);

/** Lịch sử đơn: mỗi lần đổi trạng thái ghi một dòng (ai, lúc nào, ghi chú). */
export const orderEvents = pgTable('order_events', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ORDER_STATUSES }).notNull(),
  note: text('note'),
  actor: text('actor').notNull(),
  createdAt: createdAt(),
}, (t) => [index('order_events_order_idx').on(t.orderId)]);

// ---- Sổ địa chỉ -----------------------------------------------------------------------------

export const ADDRESS_KINDS = ['home', 'office', 'site'] as const;
/** Điều kiện giao cây lớn (AddressModal). */
export const DELIVERY_CONDITIONS = ['truck', 'alley', 'elevator', 'stairs'] as const;

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  street: text('street').notNull(),
  /** Phường, Tỉnh/Thành theo địa giới hành chính mới. */
  area: text('area').notNull(),
  kind: text('kind', { enum: ADDRESS_KINDS }).notNull().default('home'),
  conditions: jsonb('conditions').$type<(typeof DELIVERY_CONDITIONS)[number][]>().notNull().default(sql`'[]'::jsonb`),
  /** Vị trí ghim trên bản đồ (MapPicker) — dùng kiểm tra vùng giao cây sống. */
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index('addresses_user_idx').on(t.userId)]);

// ---- Yêu thích -------------------------------------------------------------------------------

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('wishlists_user_product_idx').on(t.userId, t.productSlug), index('wishlists_user_idx').on(t.userId)]);

// ---- Đánh giá sản phẩm -----------------------------------------------------------------------

/** published = khách khác thấy; pending = chờ admin duyệt (1–2★); hidden = admin ẩn vì vi phạm. */
export const REVIEW_STATUSES = ['published', 'pending', 'hidden'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/**
 * Mỗi tài khoản 1 đánh giá / sản phẩm (sửa được). 3–5★ hiện ngay; 1–2★ chờ admin duyệt.
 * Người viết luôn thấy đánh giá của mình như đã đăng, không có nhãn trạng thái.
 * Số sao / số đánh giá ở trang sản phẩm tính từ bảng này (không dùng products.rating_x10 / products.reviews — số mẫu).
 */
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stars: integer('stars').notNull(),
  content: text('content').notNull(),
  /** Đã mua: có đơn đã giao chứa sản phẩm này (tính lúc viết/sửa) → nhãn "Đã mua hàng". */
  verified: boolean('verified').notNull().default(false),
  status: text('status', { enum: REVIEW_STATUSES }).notNull(),
  /** Trả lời công khai của shop. */
  reply: text('reply'),
  replyBy: text('reply_by'),
  repliedAt: ts('replied_at'),
  moderatedBy: text('moderated_by'),
  moderatedAt: ts('moderated_at'),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('reviews_user_product_idx').on(t.userId, t.productSlug),
  index('reviews_product_idx').on(t.productSlug, t.status),
  index('reviews_status_idx').on(t.status),
]);

/** Ảnh cây khách nhận được (tối đa 3/đánh giá) — lưu trong database như ảnh bảo hành. */
export const reviewPhotos = pgTable('review_photos', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data'),
  createdAt: createdAt(),
}, (t) => [index('review_photos_review_idx').on(t.reviewId)]);

/** Lượt bấm "Hữu ích" cho đánh giá — mỗi tài khoản 1 lượt / đánh giá (bấm lần nữa để bỏ). */
export const reviewVotes = pgTable('review_votes', {
  reviewId: integer('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.reviewId, t.userId] })]);

// ---- Hỏi đáp sản phẩm (QnA) -----------------------------------------------------------------

export const QUESTION_STATUSES = ['visible', 'hidden'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

/**
 * Câu hỏi của khách về sản phẩm; shop trả lời công khai (khách khác trả lời ở bảng question_answers).
 * Khách khác chỉ thấy câu hỏi đã có người trả lời; người đã mua sản phẩm thấy cả câu chưa ai trả lời;
 * người hỏi luôn thấy câu hỏi của mình (kèm "Đang chờ shop trả lời").
 * hidden = admin ẩn vì vi phạm / spam.
 */
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  status: text('status', { enum: QUESTION_STATUSES }).notNull().default('visible'),
  answer: text('answer'),
  answerBy: text('answer_by'),
  answeredAt: ts('answered_at'),
  moderatedBy: text('moderated_by'),
  moderatedAt: ts('moderated_at'),
  createdAt: createdAt(),
}, (t) => [
  index('questions_product_idx').on(t.productSlug),
  index('questions_user_idx').on(t.userId, t.createdAt),
  index('questions_status_idx').on(t.status),
]);

/** Lượt bấm "Hữu ích" cho câu hỏi. */
export const questionVotes = pgTable('question_votes', {
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.questionId, t.userId] })]);

/**
 * Khách trả lời nhau dưới câu hỏi (câu trả lời chính thức của shop vẫn là questions.answer).
 * published = hiện ngay; pending = có SĐT/link (nghi quảng cáo) → chờ nhân viên duyệt; hidden = nhân viên ẩn.
 * Người viết luôn thấy câu trả lời của mình như đã đăng.
 */
export const questionAnswers = pgTable('question_answers', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  status: text('status', { enum: REVIEW_STATUSES }).notNull(),
  /** Người trả lời đã mua sản phẩm (đơn đã giao) lúc viết → nhãn "Đã mua hàng". */
  verified: boolean('verified').notNull().default(false),
  moderatedBy: text('moderated_by'),
  moderatedAt: ts('moderated_at'),
  createdAt: createdAt(),
}, (t) => [
  index('question_answers_question_idx').on(t.questionId),
  index('question_answers_user_idx').on(t.userId, t.createdAt),
  index('question_answers_status_idx').on(t.status),
]);

/** Lượt bấm "Hữu ích" cho câu trả lời của khách. */
export const questionAnswerVotes = pgTable('question_answer_votes', {
  answerId: integer('answer_id').notNull().references(() => questionAnswers.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.answerId, t.userId] })]);

// ---- Câu hỏi thường gặp (FAQ ở trang sản phẩm) ----------------------------------------------

/**
 * productSlug có giá trị = câu riêng của sản phẩm đó; null = câu chung cho nhóm `ship` (null = mọi sản phẩm).
 * Trang sản phẩm hiện câu riêng trước rồi câu chung, tối đa FAQ_LIMIT câu. questionId = câu hỏi của khách được đưa lên.
 */
export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  productSlug: text('product_slug').references(() => products.slug, { onDelete: 'cascade' }),
  ship: text('ship', { enum: ['plant', 'supply'] }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sort: integer('sort').notNull().default(0),
  active: boolean('active').notNull().default(true),
  questionId: integer('question_id').references(() => questions.id, { onDelete: 'set null' }),
  createdBy: text('created_by'),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('faqs_product_idx').on(t.productSlug, t.sort), index('faqs_question_idx').on(t.questionId)]);

// ---- Kho -------------------------------------------------------------------------------------

export const STOCK_REASONS = ['import', 'adjust', 'order', 'cancel', 'transfer', 'warranty', 'discard'] as const;

/** Cửa hàng / kho. Tọa độ dùng tính vùng giao cây sống. */
export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  /** Kho mặc định: nhận hàng nhập và xuất đơn online trước. */
  isDefault: boolean('is_default').notNull().default(false),
  active: boolean('active').notNull().default(true),
  // Phần hiển thị ở trang khách /he-thong-cua-hang (lib/stores.ts).
  /** Hiện trên trang Hệ thống cửa hàng. Cửa hàng cũ (mẫu) mặc định không hiện. */
  isPublic: boolean('is_public').notNull().default(false),
  /** 'store' = cửa hàng / vườn của shop (có kho, bán hàng). 'partner' = đối tác cung cấp chỉ hiện trên web: không có kho, luôn active = false nên Kho / POS / nhập hàng / vùng giao không thấy. */
  kind: text('kind', { enum: ['store', 'partner'] }).notNull().default('store'),
  /** Ghi chú ngắn hiện cho khách ở trang Hệ thống cửa hàng. */
  note: text('note'),
  phone: text('phone'),
  contactName: text('contact_name'),
  /** Mở cửa cả ngày; không thì dùng openFrom – openTo ("HH:MM", giờ Việt Nam, hằng ngày). Cả hai trống = chưa khai giờ. */
  open24h: boolean('open_24h').notNull().default(false),
  openFrom: text('open_from'),
  openTo: text('open_to'),
  /** Khóa trong STORE_SERVICES (lib/stores.ts): nursery, workshop, parking, clinic. */
  services: jsonb('services').$type<string[]>().notNull().default([]),
});

/**
 * Tồn thực tế nằm ở đây: mỗi dòng là một lô của một quy cách tại một cửa hàng.
 * Hàng không theo lô (cây, chậu…) có lotCode/expiry = null. product_options.stock = tổng các lô (cập nhật cùng lúc).
 */
export const stockLots = pgTable('stock_lots', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  productSlug: text('product_slug').notNull(),
  optionIdx: integer('option_idx').notNull(),
  lotCode: text('lot_code'),
  /** Hạn dùng dạng YYYY-MM-DD. */
  expiry: text('expiry'),
  qty: integer('qty').notNull().default(0),
  /** Nhà vườn cung cấp lô này (từ phiếu nhập). */
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  /** Giá vườn 1 đơn vị của lô (= giá nhập trên phiếu); giá vốn = giá vườn + 10% tiền xe. null = phiếu chưa ghi giá. */
  unitCost: integer('unit_cost'),
  /** Hạng chất lượng của nhà vườn cho lô này ('1' | '2' | '3' = Loại 1 / 2 / 3, lib/stock.ts). */
  grade: text('grade'),
  /** Hàng ký gửi: cây vẫn ở vườn nhà cung cấp, shop đăng bán và trả tiền nhà vườn theo số đã bán (đối soát ở /admin/doi-soat). */
  consign: boolean('consign').notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index('stock_lots_product_idx').on(t.productSlug, t.optionIdx), index('stock_lots_store_idx').on(t.storeId), index('stock_lots_supplier_idx').on(t.supplierId)]);

/** Mọi thay đổi tồn kho đều ghi một dòng: nhập hàng, kiểm kê, bán, hủy đơn, chuyển kho, bảo hành. */
export const stockMoves = pgTable('stock_moves', {
  id: serial('id').primaryKey(),
  productSlug: text('product_slug').notNull(),
  optionIdx: integer('option_idx').notNull(),
  storeId: integer('store_id'),
  lotId: integer('lot_id'),
  delta: integer('delta').notNull(),
  /** Tổng tồn (mọi cửa hàng) sau thay đổi. */
  after: integer('after').notNull(),
  reason: text('reason', { enum: STOCK_REASONS }).notNull(),
  note: text('note'),
  actor: text('actor').notNull(),
  /** Phiếu nhập tạo ra dòng này (reason = import từ trang Nhập hàng / hộp Nhập ở trang Kho); null với tồn đầu kỳ, bán, kiểm kê… */
  receiptId: integer('receipt_id').references(() => purchaseReceipts.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (t) => [index('stock_moves_product_idx').on(t.productSlug, t.optionIdx), index('stock_moves_receipt_idx').on(t.receiptId)]);

// ---- Phiếu nhập hàng -------------------------------------------------------------------------

/** Nhà cung cấp: tự tạo khi gõ tên mới trên phiếu nhập; tên không phân biệt hoa/thường. */
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('suppliers_name_idx').on(sql`lower(${t.name})`)]);

export const RECEIPT_SOURCES = ['excel', 'manual'] as const;

/**
 * Một lần nhập hàng = một phiếu (PN-00001…): một lần tải file Excel hoặc một lần nhập tay ở trang Kho.
 * Số lượng, tiền hàng, số dòng tính từ `purchase_receipt_lines`; tồn kho vẫn do `stock_lots` giữ.
 */
export const purchaseReceipts = pgTable('purchase_receipts', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  /** Số hóa đơn / chứng từ của nhà cung cấp. */
  docNo: text('doc_no'),
  note: text('note'),
  source: text('source', { enum: RECEIPT_SOURCES }).notNull(),
  /** SHA-256 của nội dung các dòng đã nhập (không phải của file) — phát hiện nhập lại đúng bộ dòng đó, kể cả khi file được lưu lại bằng Excel. */
  linesHash: text('lines_hash'),
  fileName: text('file_name'),
  /** Phiếu hàng ký gửi: chưa trả tiền lúc nhập (không tính vào "Tiền mua hàng") — trả theo số đã bán. */
  consign: boolean('consign').notNull().default(false),
  actor: text('actor').notNull(),
  createdAt: createdAt(),
}, (t) => [index('purchase_receipts_hash_idx').on(t.linesHash), index('purchase_receipts_created_idx').on(t.createdAt)]);

/** Dòng phiếu: chụp lại tên/quy cách/đơn vị lúc nhập (không khóa ngoại sản phẩm) nên xóa sản phẩm không làm mất sổ sách nhập hàng. */
export const purchaseReceiptLines = pgTable('purchase_receipt_lines', {
  id: serial('id').primaryKey(),
  receiptId: integer('receipt_id').notNull().references(() => purchaseReceipts.id, { onDelete: 'cascade' }),
  productSlug: text('product_slug').notNull(),
  optionIdx: integer('option_idx').notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  label: text('label').notNull(),
  unit: text('unit').notNull(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  qty: integer('qty').notNull(),
  /** Giá nhập 1 đơn vị (đồng); null = chưa ghi. */
  unitCost: integer('unit_cost'),
  /** Hạng chất lượng ('1' | '2' | '3'); null = không phân hạng. */
  grade: text('grade'),
  lotCode: text('lot_code'),
  expiry: text('expiry'),
  note: text('note'),
}, (t) => [index('purchase_lines_receipt_idx').on(t.receiptId), index('purchase_lines_product_idx').on(t.productSlug, t.optionIdx)]);

// ---- Chi phí ---------------------------------------------------------------------------------

/** Nhóm chi (Mặt bằng, Điện nước…): Quản lý tự thêm / đổi tên / ẩn. `khac` là nhóm hệ thống, không xóa được (lib/expense-labels.ts). */
export const expenseCategories = pgTable('expense_categories', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  sort: integer('sort').notNull().default(0),
  /** false = không chọn được cho khoản chi mới (khoản đã ghi vẫn giữ nhóm). */
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

/**
 * Khoản chi lặp hằng tháng (tiền thuê, lương…). Tự ghi thành khoản chi thật vào đúng ngày mỗi tháng — xem `materializeRecurring()` trong server/expenses.ts.
 * `generatedThrough` = tháng (YYYY-MM) cuối cùng đã ghi; xóa khoản chi đã sinh thì không bị sinh lại.
 */
export const recurringExpenses = pgTable('recurring_expenses', {
  id: serial('id').primaryKey(),
  categorySlug: text('category_slug').notNull().references(() => expenseCategories.slug),
  /** Đồng. */
  amount: integer('amount').notNull(),
  storeId: integer('store_id').references(() => stores.id),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  note: text('note'),
  /** Ngày trong tháng, 1–28 (tháng nào cũng có). */
  dayOfMonth: integer('day_of_month').notNull(),
  startMonth: text('start_month').notNull(),
  endMonth: text('end_month'),
  generatedThrough: text('generated_through'),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

/**
 * Khoản tiền ghi tay của sổ Thu chi (/admin/thu-chi) ngoài bán hàng và chi phí: thu khác, vốn chủ shop bỏ vào, vốn rút ra.
 * `entryOn` dạng YYYY-MM-DD theo giờ Việt Nam.
 */
export const cashEntries = pgTable('cash_entries', {
  id: serial('id').primaryKey(),
  kind: text('kind', { enum: CASH_KINDS }).notNull(),
  entryOn: text('entry_on').notNull(),
  /** Đồng. */
  amount: integer('amount').notNull(),
  note: text('note'),
  actor: text('actor').notNull(),
  createdAt: createdAt(),
}, (t) => [index('cash_entries_on_idx').on(t.entryOn)]);

/**
 * Sổ chi phí của cửa hàng: mọi khoản đã chi; tiền mua hàng ghi ở nhóm `mua-hang` (hoặc giá nhập trên phiếu nhập — chỉ một nơi).
 * `storeId` null = chi chung cho cả hệ thống. `spentOn` dạng YYYY-MM-DD theo giờ Việt Nam.
 */
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  spentOn: text('spent_on').notNull(),
  categorySlug: text('category_slug').notNull().references(() => expenseCategories.slug),
  /** Đồng. */
  amount: integer('amount').notNull(),
  storeId: integer('store_id').references(() => stores.id),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  note: text('note'),
  /** Khoản chi do chi phí định kỳ tự sinh. */
  recurringId: integer('recurring_id').references(() => recurringExpenses.id, { onDelete: 'set null' }),
  /** Tiền trả nhà vườn cho cây ký gửi đã bán (ghi ở trang Đối soát nhà vườn) — trừ vào công nợ ký gửi. */
  consign: boolean('consign').notNull().default(false),
  actor: text('actor').notNull(),
  createdAt: createdAt(),
}, (t) => [
  index('expenses_spent_idx').on(t.spentOn),
  index('expenses_category_idx').on(t.categorySlug),
  // mỗi khoản định kỳ chỉ có một khoản chi cho mỗi ngày: hai lượt sinh cùng lúc không tạo trùng (recurring_id null = nhập tay, không bị ràng buộc)
  uniqueIndex('expenses_recurring_day_idx').on(t.recurringId, t.spentOn),
]);

/** Ảnh hóa đơn của một khoản chi (tối đa 1): lưu trong database, chỉ nhân viên có quyền Chi phí xem được (/api/expense-photos/<file>). */
export const expensePhotos = pgTable('expense_photos', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id').notNull().unique().references(() => expenses.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  createdAt: createdAt(),
});

// ---- Bảo hành cây ----------------------------------------------------------------------------

export const WARRANTY_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const WARRANTY_RESOLUTIONS = ['replace', 'rescue', 'refund', 'reject'] as const;
export const REFUND_STATUSES = ['pending', 'done'] as const;

export const warrantyRequests = pgTable('warranty_requests', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  orderItemId: integer('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symptoms: jsonb('symptoms').$type<string[]>().notNull(),
  description: text('description'),
  placement: text('placement'),
  watering: text('watering'),
  status: text('status', { enum: WARRANTY_STATUSES }).notNull().default('pending'),
  resolution: text('resolution', { enum: WARRANTY_RESOLUTIONS }),
  cause: text('cause'),
  engineerNote: text('engineer_note'),
  decidedBy: text('decided_by'),
  decidedAt: ts('decided_at'),
  /** Đơn 0đ tạo khi duyệt: cây thay thế (replace) hoặc vật tư tặng (rescue). */
  replacementOrderId: integer('replacement_order_id').references(() => orders.id, { onDelete: 'set null' }),
  /** Hoàn tiền: ghi nhận số tiền, chờ kế toán chuyển rồi xác nhận kèm mã giao dịch. */
  refundAmount: integer('refund_amount'),
  refundStatus: text('refund_status', { enum: REFUND_STATUSES }),
  refundRef: text('refund_ref'),
  refundedBy: text('refunded_by'),
  refundedAt: ts('refunded_at'),
  /** Nhân viên tạo thay khách (null = khách tự gửi). */
  createdBy: text('created_by'),
  /** Tạo từ đánh giá xấu của khách (admin Hỏi đáp & đánh giá). */
  reviewId: integer('review_id').references(() => reviews.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (t) => [index('warranty_user_idx').on(t.userId), index('warranty_status_idx').on(t.status), index('warranty_review_idx').on(t.reviewId)]);

/** Ảnh khách gửi: lưu ngay trong database (cột data), chỉ chủ yêu cầu và nhân viên xem được. */
export const warrantyPhotos = pgTable('warranty_photos', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => warrantyRequests.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data'),
  createdAt: createdAt(),
});

// ---- Vườn của tôi -----------------------------------------------------------------------------

export const GARDEN_STATUSES = ['healthy', 'attention'] as const;

/** Một cây trong vườn khách = một dòng hàng cây sống của đơn đã giao. Tự tạo lần đầu khách mở trang Vườn của tôi. */
export const gardenPlants = pgTable('garden_plants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderItemId: integer('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }).unique(),
  /** Ngày cây về nhà (lấy từ lúc đơn chuyển trạng thái "Đã giao") — tính tuổi cây từ đây, không phải từ lúc đồng bộ. */
  plantedAt: ts('planted_at').notNull(),
  nickname: text('nickname'),
  location: text('location'),
  status: text('status', { enum: GARDEN_STATUSES }).notNull().default('healthy'),
  lastWateredAt: ts('last_watered_at'),
  lastFertilizedAt: ts('last_fertilized_at'),
  createdAt: createdAt(),
}, (t) => [index('garden_plants_user_idx').on(t.userId)]);

/** Ảnh khách tự cập nhật theo dõi cây lớn lên — ảnh mới nhất (id lớn nhất) là ảnh đại diện. */
export const gardenPhotos = pgTable('garden_photos', {
  id: serial('id').primaryKey(),
  plantId: integer('plant_id').notNull().references(() => gardenPlants.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data'),
  createdAt: createdAt(),
}, (t) => [index('garden_photos_plant_idx').on(t.plantId)]);

// ---- Thông báo -------------------------------------------------------------------------------

/** reply = shop trả lời đánh giá / câu hỏi của khách. */
export const NOTIFICATION_KINDS = ['order', 'warranty', 'care', 'promo', 'reply'] as const;

/** Thông báo trong app (NotificationCenter). text có thể chứa **đậm**. */
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: NOTIFICATION_KINDS }).notNull(),
  text: text('text').notNull(),
  href: text('href'),
  readAt: ts('read_at'),
  createdAt: createdAt(),
}, (t) => [index('notifications_user_idx').on(t.userId, t.id)]);

/**
 * Mẫu tin nhắn tự động (admin /admin/mau-tin-nhan): nội dung thông báo cho từng sự kiện (xem lib/message-templates.ts).
 * Chưa có dòng = dùng nội dung mặc định trong code. `text` có thể chứa {biến} và **chữ đậm**.
 */
export const messageTemplates = pgTable('message_templates', {
  key: text('key').primaryKey(),
  text: text('text').notNull(),
  /** Hiện trong chuông thông báo của khách. */
  inApp: boolean('in_app').notNull().default(true),
  /** Gửi thêm qua Zalo ZNS / email (mất phí ZNS). */
  external: boolean('external').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const MESSAGE_CHANNELS = ['zalo', 'email', 'telegram'] as const;
export const MESSAGE_STATUSES = ['sent', 'failed', 'skipped'] as const;

/** Nhật ký tin gửi ra ngoài (Zalo ZNS, email): gửi được, lỗi, hay bỏ qua vì chưa cấu hình. */
export const outboundMessages = pgTable('outbound_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  channel: text('channel', { enum: MESSAGE_CHANNELS }).notNull(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: MESSAGE_STATUSES }).notNull(),
  error: text('error'),
  createdAt: createdAt(),
}, (t) => [index('outbound_created_idx').on(t.createdAt)]);

// ---- Yêu cầu báo giá sỉ (trước 09/10/2026: yêu cầu dịch vụ khảo sát, thi công) ---------------------

/**
 * Yêu cầu báo giá sỉ từ form /bao-gia-si (khách, không bắt buộc đăng nhập) hoặc nhân viên nhập tay (hotline, Zalo…).
 * Đi qua các giai đoạn trên bảng Kanban admin: new → scheduled → quoted → in_progress → done (hoặc lost).
 */
export const serviceRequests = pgTable('service_requests', {
  id: serial('id').primaryKey(),
  service: text('service', { enum: SERVICE_TYPES }).notNull(),
  space: text('space'),
  /** Diện tích m²; với cây văn phòng có thể để trống. */
  area: integer('area'),
  sun: text('sun'),
  styles: jsonb('styles').$type<string[]>().notNull().default([]),
  budget: text('budget'),
  /** Lịch khảo sát khách chọn: ngày YYYY-MM-DD + buổi (am/pm). Null = để kỹ sư gọi hẹn. */
  slotDate: text('slot_date'),
  slotTime: text('slot_time', { enum: ['am', 'pm'] }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  note: text('note'),
  /** Yêu cầu báo giá sỉ: tên đơn vị + thời gian cần hàng (chữ khách chọn). */
  company: text('company'),
  needBy: text('need_by'),
  /** Phương án khách tự chọn ở trang Tư vấn chọn cây rồi gửi kèm (giá lúc khách xem, chỉ để tham khảo). Null = không có. */
  plan: jsonb('plan').$type<SavedPlan>(),
  /** Tài khoản gửi (nếu đang đăng nhập). */
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  source: text('source', { enum: SOURCES }).notNull().default('web'),
  stage: text('stage', { enum: SERVICE_STAGES }).notNull().default('new'),
  /** Lúc đổi sang giai đoạn hiện tại — tính "gửi báo giá N ngày trước", "xong ngày…". */
  stageAt: ts('stage_at').notNull().defaultNow(),
  /** Kỹ sư / nhân viên phụ trách. */
  assigneeId: integer('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  /** Lần đầu gọi lại cho khách — chưa có sau 2 giờ là quá hạn. */
  contactedAt: ts('contacted_at'),
  /** Lịch khảo sát đã chốt với khách. */
  surveyAt: ts('survey_at'),
  /** Giá trị báo giá / hợp đồng (đồng). */
  value: integer('value'),
  quotedAt: ts('quoted_at'),
  lostReason: text('lost_reason'),
  createdAt: createdAt(),
}, (t) => [
  index('service_requests_stage_idx').on(t.stage),
  index('service_requests_phone_idx').on(t.phone, t.createdAt),
  index('service_requests_slot_idx').on(t.slotDate, t.slotTime),
]);

/** Ảnh hiện trạng khách gửi — chỉ nhân viên (và chủ yêu cầu nếu có tài khoản) xem được. */
export const serviceRequestPhotos = pgTable('service_request_photos', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => serviceRequests.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data'),
  createdAt: createdAt(),
}, (t) => [index('service_request_photos_req_idx').on(t.requestId)]);

/** Lịch sử liên hệ / xử lý: gọi điện, ghi chú, đổi giai đoạn, đổi người phụ trách… */
export const serviceRequestEvents = pgTable('service_request_events', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => serviceRequests.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['created', 'call', 'note', 'stage', 'update'] }).notNull(),
  text: text('text').notNull(),
  actor: text('actor').notNull(),
  createdAt: createdAt(),
}, (t) => [index('service_request_events_req_idx').on(t.requestId, t.id)]);

// ---- Trang chủ ------------------------------------------------------------------------------

/** Banner trang chủ (ảnh lớn chạy vòng, ảnh nhỏ cạnh, nền sự kiện, dải sự kiện) — chủ shop tự tải ở /admin/trang-chu. */
export const homeBanners = pgTable('home_banners', {
  id: serial('id').primaryKey(),
  /** Vị trí (BANNER_SLOTS trong lib/home-banners.ts). */
  slot: text('slot').notNull(),
  /** Tiêu đề — làm chữ thay ảnh (alt) và chữ trên ảnh khi bật `show_text`. */
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  /** Chữ trên nút; trống = không có nút (cả ảnh vẫn bấm được nếu có link). */
  cta: text('cta').notNull().default(''),
  href: text('href').notNull().default(''),
  showText: boolean('show_text').notNull().default(false),
  /** Màu lớp phủ sau chữ khi bật `show_text` (BANNER_TONES). */
  tone: text('tone').notNull().default('green'),
  /** Chữ bản tiếng Anh (trang /en) — ô trống dùng chữ tiếng Việt. */
  en: jsonb('en').$type<BannerEn>(),
  /** Tên file trong home_banner_images, hoặc ảnh dựng sẵn của shop /images/banner/….webp (migration 0081). */
  image: text('image').notNull(),
  imageMobile: text('image_mobile'),
  /** Chỉ băng ảnh rộng trên cùng: nền phủ kín phía sau khi ảnh này đang hiện (đổi theo ảnh, kiểu Long Châu). */
  bgImage: text('bg_image'),
  bgImageMobile: text('bg_image_mobile'),
  /** Màu nền (#rrggbb) phía sau ảnh nền / thay ảnh nền. */
  bgColor: text('bg_color'),
  /** Hiện từ / đến (null = không giới hạn). */
  startsAt: ts('starts_at'),
  endsAt: ts('ends_at'),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  updatedBy: text('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  createdAt: createdAt(),
}, (t) => [index('home_banners_slot_idx').on(t.slot, t.sort)]);

/** Ảnh banner (công khai, /api/banner-images/[file]). Ảnh tải lên trước khi lưu banner nên không gắn khóa ngoại — ảnh không dùng tự dọn sau 1 ngày. */
export const homeBannerImages = pgTable('home_banner_images', {
  id: serial('id').primaryKey(),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  createdAt: createdAt(),
});

// ---- SEO quản trị (mục 14 checklist SEO, lib/seo-cms.ts + server/seo-cms.ts) ---------------

/**
 * SEO đặt tay cho một trang (khóa = đường dẫn không tham số, vd. "/san-pham/kim-tien"). Ô trống = web tự tạo như cũ.
 * Áp ở `withSeo()` khi dựng metadata; noindex / canonical khác chính nó thì trang tự rời sitemap.
 */
export const seoOverrides = pgTable('seo_overrides', {
  path: text('path').primaryKey(),
  title: text('title'),
  description: text('description'),
  /** Đường dẫn chuẩn khác chính trang (trong web). null = tự trỏ chính nó. */
  canonical: text('canonical'),
  noindex: boolean('noindex').notNull().default(false),
  /** Ảnh chia sẻ (og:image) — đường dẫn ảnh công khai trên web. */
  image: text('image'),
  updatedBy: text('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

/**
 * Chuyển hướng 308 cho trang đã đổi đường dẫn / đã gỡ. Chỉ dùng khi đường dẫn cũ KHÔNG còn nội dung (trang nội dung tra
 * bảng này thay cho 404) nên không bao giờ che trang đang hiện. Luôn trỏ thẳng đích cuối (không chuỗi, không vòng).
 */
export const redirects = pgTable('redirects', {
  fromPath: text('from_path').primaryKey(),
  toPath: text('to_path').notNull(),
  /** manual = admin tự thêm, slug = tự tạo khi đổi đường dẫn. */
  reason: text('reason', { enum: ['manual', 'slug'] }).notNull().default('manual'),
  note: text('note').notNull().default(''),
  hits: integer('hits').notNull().default(0),
  lastHitAt: ts('last_hit_at'),
  createdBy: text('created_by'),
  createdAt: createdAt(),
}, (t) => [index('redirects_to_idx').on(t.toPath)]);

/** Nhật ký thay đổi SEO quan trọng (sửa SEO trang, chuyển hướng, đổi đường dẫn, xóa trang). */
export const seoAudit = pgTable('seo_audit', {
  id: serial('id').primaryKey(),
  path: text('path').notNull(),
  action: text('action').notNull(),
  detail: jsonb('detail').$type<SeoChange[]>().notNull().default(sql`'[]'::jsonb`),
  actor: text('actor').notNull().default(''),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (t) => [index('seo_audit_created_idx').on(t.createdAt), index('seo_audit_path_idx').on(t.path)]);

// ---- Giám sát SEO (mục 19 checklist SEO, lib/monitor.ts + server/monitor*.ts) ---------------

/**
 * Lượt máy tìm kiếm / mạng xã hội tải trang, gom theo ngày (giờ VN) × máy × nhóm trang. `verified` = Googlebot / Bingbot
 * thật (tra ngược DNS địa chỉ IP); máy chỉ xưng tên trong User-Agent thì false. Nhóm trang có đuôi "?" = URL có tham số.
 */
export const crawlHits = pgTable('crawl_hits', {
  day: text('day').notNull(),
  bot: text('bot').notNull(),
  verified: boolean('verified').notNull().default(false),
  section: text('section').notNull(),
  hits: integer('hits').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.day, t.bot, t.verified, t.section] })]);

/** Đường dẫn trang khách trả 404 (trang không tồn tại), gom theo đường dẫn — để thêm chuyển hướng / sửa link hỏng. */
export const notFoundHits = pgTable('not_found_hits', {
  path: text('path').primaryKey(),
  hits: integer('hits').notNull().default(0),
  /** Lượt của máy tìm kiếm (Googlebot, Bingbot…) — kể cả máy chưa xác minh. */
  botHits: integer('bot_hits').notNull().default(0),
  /** Trang dẫn tới gần nhất (link hỏng nằm ở đâu); rỗng = gõ tay / không gửi. */
  referrer: text('referrer').notNull().default(''),
  /** Có trang của web khác dẫn tới (backlink hỏng). */
  external: boolean('external').notNull().default(false),
  firstSeen: ts('first_seen').notNull().defaultNow(),
  lastSeen: ts('last_seen').notNull().defaultNow(),
}, (t) => [index('not_found_hits_last_idx').on(t.lastSeen)]);

/** Lỗi máy chủ (dựng trang, API, server action) và lỗi trình duyệt (script, hydration), gom theo loại × trang × nội dung. */
export const errorEvents = pgTable('error_events', {
  id: serial('id').primaryKey(),
  /** ssr | api | action | proxy | client | hydration */
  kind: text('kind').notNull(),
  path: text('path').notNull(),
  message: text('message').notNull(),
  digest: text('digest'),
  hits: integer('hits').notNull().default(1),
  firstSeen: ts('first_seen').notNull().defaultNow(),
  lastSeen: ts('last_seen').notNull().defaultNow(),
}, (t) => [uniqueIndex('error_events_key').on(t.kind, t.path, t.message), index('error_events_last_idx').on(t.lastSeen)]);

/**
 * Chỉ số Core Web Vitals đo trên máy khách thật (RUM), gom theo ngày × nhóm trang × loại máy × chỉ số × mức (good |
 * needs-improvement | poor). Không lưu IP, cookie hay mã khách.
 */
export const webVitals = pgTable('web_vitals', {
  day: text('day').notNull(),
  section: text('section').notNull(),
  device: text('device').notNull(),
  metric: text('metric').notNull(),
  rating: text('rating').notNull(),
  hits: integer('hits').notNull().default(0),
  total: doublePrecision('total').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.day, t.section, t.device, t.metric, t.rating] })]);

/**
 * Khách tìm gì trong ô tìm kiếm (/tim-kiem), gom theo ngày × từ khóa (chữ thường, gộp khoảng trắng) — để biết khách cần
 * cây gì shop chưa bán, và để dải "Xu hướng tìm kiếm" dùng số thật. Không lưu IP / cookie / mã khách; máy tìm kiếm không tính.
 */
export const searchQueries = pgTable('search_queries', {
  day: text('day').notNull(),
  q: text('q').notNull(),
  hits: integer('hits').notNull().default(0),
  /** Số sản phẩm tìm ra ở lần tìm gần nhất (0 = shop chưa có hàng khớp). */
  results: integer('results').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.day, t.q] })]);
