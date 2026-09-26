// Schema database (PostgreSQL / Supabase qua Drizzle). Đổi schema xong chạy `npm run db:generate` để tạo migration.
import { sql } from 'drizzle-orm';
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
  phone: text('phone').notNull().unique(),
  name: text('name'),
  email: text('email'),
  role: text('role', { enum: ROLES }).notNull().default('customer'),
  points: integer('points').notNull().default(0),
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
  createdAt: createdAt(),
}, (t) => [index('products_cat_idx').on(t.category, t.sub)]);

/** Quy cách bán (Chậu sứ / Chỉ cây, Chai 500ml / Thùng…) — giá tính theo từng quy cách. */
export const productOptions = pgTable('product_options', {
  productSlug: text('product_slug').notNull().references(() => products.slug, { onDelete: 'cascade' }),
  idx: integer('idx').notNull(),
  label: text('label').notNull(),
  price: integer('price').notNull(),
  oldPrice: integer('old_price'),
  stock: integer('stock').notNull().default(100),
}, (t) => [primaryKey({ columns: [t.productSlug, t.idx] })]);

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
  createdAt: createdAt(),
}, (t) => [index('warranty_user_idx').on(t.userId), index('warranty_status_idx').on(t.status)]);

/** Ảnh khách gửi: lưu ngay trong database (cột data), chỉ chủ yêu cầu và nhân viên xem được. */
export const warrantyPhotos = pgTable('warranty_photos', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => warrantyRequests.id, { onDelete: 'cascade' }),
  file: text('file').notNull().unique(),
  mime: text('mime').notNull(),
  data: bytea('data'),
  createdAt: createdAt(),
});

// ---- Thông báo -------------------------------------------------------------------------------

export const NOTIFICATION_KINDS = ['order', 'warranty', 'care', 'promo'] as const;

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
