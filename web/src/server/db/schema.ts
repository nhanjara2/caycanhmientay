// Schema database (PostgreSQL / Supabase qua Drizzle). Đổi schema xong chạy `npm run db:generate` để tạo migration.
import { sql } from 'drizzle-orm';
import type { FengShui } from '../../lib/catalog';
import type { Disease } from '../../lib/diseases';
import type { ProductAttrs } from '../../lib/product-filters';
import { SERVICE_STAGES, SERVICE_TYPES, SOURCES } from '../../lib/service-labels';
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
  points: integer('points').notNull().default(0),
  /** Ghi chú nội bộ của shop về khách (admin Khách hàng) — khách không thấy. */
  notes: text('notes'),
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

export const products = pgTable('products', {
  slug: text('slug').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  sub: text('sub').notNull(),
  icon: text('icon').notNull(),
  origin: text('origin').notNull(),
  ship: text('ship', { enum: ['plant', 'supply'] }).notNull(),
  pesticide: boolean('pesticide').notNull().default(false),
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
  /** Phong thủy: mệnh hợp, hợp tuổi, ý nghĩa, vị trí đặt. */
  fengshui: jsonb('fengshui').$type<FengShui>(),
  /** Đặc điểm cây cho bộ lọc: vị trí đặt, kích thước, màu (lib/product-filters.ts). null = chưa gắn. */
  attrs: jsonb('attrs').$type<ProductAttrs>(),
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
  createdAt: createdAt(),
}, (t) => [index('product_images_slug_idx').on(t.productSlug, t.idx)]);

/** Quy cách bán (Chậu sứ / Chỉ cây, Chai 500ml / Thùng…) — giá tính theo từng quy cách. */
export const productOptions = pgTable('product_options', {
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  idx: integer('idx').notNull(),
  label: text('label').notNull(),
  price: integer('price').notNull(),
  oldPrice: integer('old_price'),
  stock: integer('stock').notNull().default(100),
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

// ---- Khuyến mãi ------------------------------------------------------------------------------

export const VOUCHER_DISCOUNT_TYPES = ['percent', 'amount'] as const;

/** Mã giảm giá khách tự nhập lúc thanh toán. Một đơn dùng tối đa một mã. */
export const vouchers = pgTable('vouchers', {
  id: serial('id').primaryKey(),
  /** Luôn lưu chữ hoa; không đổi sau khi tạo. */
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  discountType: text('discount_type', { enum: VOUCHER_DISCOUNT_TYPES }).notNull(),
  /** Phần trăm (1–100) hoặc số tiền (đ) tùy discountType. */
  discountValue: integer('discount_value').notNull(),
  /** Trần số tiền giảm — chỉ áp dụng khi discountType = percent. */
  maxDiscount: integer('max_discount'),
  minOrder: integer('min_order').notNull().default(0),
  /** null = không giới hạn tổng lượt dùng. */
  usageLimit: integer('usage_limit'),
  perCustomerLimit: integer('per_customer_limit').notNull().default(1),
  startsAt: ts('starts_at'),
  endsAt: ts('ends_at'),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

// ---- Đơn hàng -------------------------------------------------------------------------------

/** Tiến trình đơn theo OrderTimeline: Đặt hàng → Xác nhận → Chuẩn bị cây → Đang giao → Đã giao. */
export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_METHODS = ['cod', 'qr', 'momo', 'zalopay', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** sale = đơn khách đặt; warranty = đơn đổi cây / tặng vật tư 0đ do bảo hành tạo. */
export const ORDER_KINDS = ['sale', 'warranty'] as const;

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
  note: text('note'),
  paymentMethod: text('payment_method', { enum: PAYMENT_METHODS }).notNull(),
  paid: boolean('paid').notNull().default(false),
  original: integer('original').notNull(),
  subtotal: integer('subtotal').notNull(),
  plantShip: integer('plant_ship').notNull(),
  supplyShip: integer('supply_ship').notNull(),
  /** Chụp lại mã + số tiền giảm lúc đặt — không ràng buộc khóa ngoại, mã đổi/tắt sau đó không ảnh hưởng đơn cũ. */
  voucherCode: text('voucher_code'),
  voucherDiscount: integer('voucher_discount').notNull().default(0),
  total: integer('total').notNull(),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('orders_code_idx').on(t.code), index('orders_user_idx').on(t.userId), index('orders_status_idx').on(t.status)]);

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

export const STOCK_REASONS = ['import', 'adjust', 'order', 'cancel', 'transfer', 'warranty'] as const;

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
  createdAt: createdAt(),
}, (t) => [index('stock_lots_product_idx').on(t.productSlug, t.optionIdx), index('stock_lots_store_idx').on(t.storeId)]);

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
  createdAt: createdAt(),
}, (t) => [index('stock_moves_product_idx').on(t.productSlug, t.optionIdx)]);

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

export const MESSAGE_CHANNELS = ['zalo', 'email'] as const;
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

// ---- Yêu cầu dịch vụ (khảo sát, báo giá, thi công) --------------------------------------------

/**
 * Yêu cầu dịch vụ từ form Đặt lịch khảo sát (khách, không bắt buộc đăng nhập) hoặc nhân viên nhập tay (hotline, Zalo…).
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
