import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import type { SessionUser } from './auth';
import { mainImageOf } from './catalog';
import { db, schema } from './db';
import { WARRANTY_RESOLUTIONS, WARRANTY_STATUSES } from './db/schema';
import { applyStock, type Tx } from './inventory';
import { notifyEvent } from './notify';
import { newOrderCode } from './orders';
import { saveImage, type SavedImage } from './uploads';
import { normalize } from '@/lib/catalog';
import { SYMPTOMS, WARRANTY_DAYS, WARRANTY_RESOLUTION_LABEL, warrantyCode } from '@/lib/warranty-labels';

const { orders, orderItems, orderEvents, warrantyRequests: W, warrantyPhotos: WP, users, reviews, reviewPhotos } = schema;

const DAY = 86_400_000;
export { SYMPTOMS, WARRANTY_DAYS, warrantyCode };


type Owner = Pick<SessionUser, 'id' | 'phone'>;
const ownedBy = (u: Owner) => (u.phone ? or(eq(orders.userId, u.id), eq(orders.phone, u.phone)) : eq(orders.userId, u.id));

/**
 * Cây sống trong đơn đã giao của khách (lọc theo sản phẩm nếu có): số ngày bảo hành còn lại (≤ 0 = hết hạn)
 * và yêu cầu bảo hành đang mở / đã duyệt của từng cây (nếu có).
 */
async function plantItems(u: Owner, slug?: string) {
  const rows = await db.select({
    itemId: orderItems.id, name: orderItems.name, label: orderItems.label, icon: orderItems.icon, image: mainImageOf(orderItems.productSlug), price: orderItems.price,
    orderId: orders.id, code: orders.code, updatedAt: orders.updatedAt,
  })
    .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(ownedBy(u), eq(orders.status, 'delivered'), eq(orderItems.ship, 'plant'), slug ? eq(orderItems.productSlug, slug) : undefined))
    .orderBy(desc(orders.id));
  if (!rows.length) return [];

  const delivered = new Map(
    (await db.select({ orderId: orderEvents.orderId, at: orderEvents.createdAt }).from(orderEvents)
      .where(and(inArray(orderEvents.orderId, rows.map((r) => r.orderId)), eq(orderEvents.status, 'delivered'))))
      .map((e) => [e.orderId, e.at.getTime()]),
  );
  const taken = new Map(
    (await db.select({ itemId: W.orderItemId, id: W.id }).from(W).where(and(inArray(W.orderItemId, rows.map((r) => r.itemId)), ne(W.status, 'rejected'))))
      .map((r) => [r.itemId, r.id]),
  );
  return rows.map((r) => {
    const at = delivered.get(r.orderId) ?? r.updatedAt.getTime();
    const open = taken.get(r.itemId);
    return { ...r, deliveredAt: at, daysLeft: WARRANTY_DAYS - Math.floor((Date.now() - at) / DAY), openId: open ?? null, openCode: open ? warrantyCode(open) : null };
  });
}

/** Cây sống trong đơn đã giao, còn hạn bảo hành, chưa có yêu cầu đang mở / đã duyệt. */
export async function eligibleItems(u: Owner) {
  return (await plantItems(u)).filter((r) => r.daysLeft > 0 && !r.openCode);
}
export type EligibleItem = Awaited<ReturnType<typeof eligibleItems>>[number];

export const WarrantyInputSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  symptoms: z.array(z.enum(SYMPTOMS)).min(1, 'Chọn ít nhất một triệu chứng').max(SYMPTOMS.length),
  description: z.string().trim().max(1000).optional(),
  placement: z.string().trim().max(120).optional(),
  watering: z.string().trim().max(120).optional(),
});

export async function createWarranty(u: Owner, input: z.infer<typeof WarrantyInputSchema>, files: File[]) {
  const item = (await eligibleItems(u)).find((i) => i.itemId === input.orderItemId);
  if (!item) return { ok: false as const, error: 'Cây này không còn trong hạn bảo hành hoặc đã có yêu cầu' };
  if (files.length < 1) return { ok: false as const, error: 'Cần ít nhất 1 ảnh cây' };
  if (files.length > 3) return { ok: false as const, error: 'Tối đa 3 ảnh' };

  const saved: SavedImage[] = [];
  for (const f of files) {
    const r = await saveImage(f);
    if ('error' in r) return { ok: false as const, error: r.error };
    saved.push(r);
  }
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(W).values({
      orderId: item.orderId, orderItemId: item.itemId, userId: u.id, symptoms: input.symptoms,
      description: input.description || null, placement: input.placement || null, watering: input.watering || null,
    }).returning({ id: W.id });
    await tx.insert(WP).values(saved.map((s) => ({ requestId: row.id, file: s.file, mime: s.mime, data: s.data })));
    return row.id;
  });
  return { ok: true as const, code: warrantyCode(id) };
}

// ---- Nhân viên tạo thay khách từ đánh giá xấu (admin Hỏi đáp & đánh giá) ---------------------------

/** Đoán triệu chứng từ nội dung đánh giá (đã bỏ dấu) để chọn sẵn — nhân viên sửa lại được. */
const SYMPTOM_HINTS: [(typeof SYMPTOMS)[number], RegExp][] = [
  ['Lá vàng', /\b(vang la|la vang|ua vang|bi vang)\b/],
  ['Lá mềm, rũ', /\b(heo|ru|ru la|mem la|la mem|xiu)\b/],
  ['Đốm nâu', /\b(dom|chay la|chay mep|kho mep)\b/],
  ['Rụng lá', /\b(rung la|la rung|rung)\b/],
  ['Thối gốc', /\b(thoi re|thoi goc|thoi than|bi thoi|thoi nhun)\b/],
  ['Có sâu, rệp', /\b(con sau|bi sau|sau an|rep|bo tri|nhen do|bi nam|nam trang)\b/],
  ['Dập, gãy khi nhận', /\b(dap|gay|gay canh|vo chau|nut chau|be canh)\b/],
];

/** Thông tin để nhân viên tạo yêu cầu bảo hành từ một đánh giá: cây của khách trong đơn đã giao, triệu chứng gợi ý, số ảnh. */
export async function reviewWarrantyOptions(reviewId: number) {
  const [r] = await db.select({
    userId: reviews.userId, slug: reviews.productSlug, stars: reviews.stars, content: reviews.content,
    phone: users.phone, customer: users.name,
  }).from(reviews).innerJoin(users, eq(users.id, reviews.userId)).where(eq(reviews.id, reviewId));
  if (!r) return null;
  const [items, photos, existing] = await Promise.all([
    plantItems({ id: r.userId, phone: r.phone }, r.slug),
    db.select({ id: reviewPhotos.id }).from(reviewPhotos).where(eq(reviewPhotos.reviewId, reviewId)),
    db.select({ id: W.id }).from(W).where(eq(W.reviewId, reviewId)).orderBy(desc(W.id)).limit(1),
  ]);
  const text = ` ${normalize(r.content)} `;
  return {
    userId: r.userId,
    items: items.map((i) => ({ itemId: i.itemId, name: i.name, label: i.label, code: i.code, deliveredAt: i.deliveredAt, daysLeft: i.daysLeft, openId: i.openId, openCode: i.openCode })),
    symptoms: SYMPTOM_HINTS.filter(([, re]) => re.test(text)).map(([s]) => s),
    description: `Tạo từ đánh giá ${r.stars}★ của khách: “${r.content}”`.slice(0, 1000),
    photos: photos.length,
    existing: existing[0] ? { id: existing[0].id, code: warrantyCode(existing[0].id) } : null,
  };
}
export type ReviewWarrantyOptions = NonNullable<Awaited<ReturnType<typeof reviewWarrantyOptions>>>;

export const ReviewWarrantySchema = z.object({
  reviewId: z.number().int().positive(),
  orderItemId: z.number().int().positive(),
  symptoms: z.array(z.enum(SYMPTOMS)).min(1, 'Chọn ít nhất một triệu chứng').max(SYMPTOMS.length),
  description: z.string().trim().max(1000),
});

/**
 * Nhân viên tạo yêu cầu bảo hành thay khách từ đánh giá xấu: cây phải là cây sống cùng sản phẩm trong đơn đã giao của
 * người viết đánh giá, chưa có yêu cầu đang mở. Cho phép cả khi đã quá 7 ngày (nhân viên quyết định ngoại lệ).
 * Ảnh trong đánh giá được chép sang yêu cầu bảo hành; khách nhận thông báo chuông.
 */
export async function createWarrantyFromReview(input: z.infer<typeof ReviewWarrantySchema>, actor: string) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select({ userId: reviews.userId, slug: reviews.productSlug, phone: users.phone })
      .from(reviews).innerJoin(users, eq(users.id, reviews.userId)).where(eq(reviews.id, input.reviewId));
    if (!r) return { ok: false as const, error: 'Không tìm thấy đánh giá' };
    // Khóa dòng hàng: hai nhân viên bấm cùng lúc không tạo hai yêu cầu cho một cây
    const [item] = await tx.select({ id: orderItems.id, orderId: orders.id, name: orderItems.name })
      .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(
        eq(orderItems.id, input.orderItemId), ownedBy({ id: r.userId, phone: r.phone }), eq(orders.status, 'delivered'),
        eq(orderItems.ship, 'plant'), eq(orderItems.productSlug, r.slug),
      ))
      .for('update', { of: orderItems });
    if (!item) return { ok: false as const, error: 'Cây này không thuộc đơn đã giao của khách' };
    const [open] = await tx.select({ id: W.id }).from(W).where(and(eq(W.orderItemId, item.id), ne(W.status, 'rejected')));
    if (open) return { ok: false as const, error: `Cây này đã có yêu cầu bảo hành ${warrantyCode(open.id)}` };

    const [row] = await tx.insert(W).values({
      orderId: item.orderId, orderItemId: item.id, userId: r.userId, symptoms: input.symptoms,
      description: input.description || null, createdBy: actor, reviewId: input.reviewId,
    }).returning({ id: W.id });
    const photos = await tx.select({ file: reviewPhotos.file, mime: reviewPhotos.mime, data: reviewPhotos.data })
      .from(reviewPhotos).where(eq(reviewPhotos.reviewId, input.reviewId)).orderBy(reviewPhotos.id);
    const copies = photos.filter((p) => p.data).map((p) => ({
      requestId: row.id, file: `${randomBytes(16).toString('hex')}.${p.file.split('.').pop()}`, mime: p.mime, data: p.data,
    }));
    if (copies.length) await tx.insert(WP).values(copies);

    const code = warrantyCode(row.id);
    await notifyEvent(tx, r.userId, 'warranty_from_review', { ma_bh: code, ten_cay: item.name }, '/tai-khoan/bao-hanh');
    return { ok: true as const, id: row.id, code };
  });
}

// ---- Đọc -------------------------------------------------------------------------------------

function base() {
  return db.select({
    w: W, itemName: orderItems.name, itemLabel: orderItems.label, itemIcon: orderItems.icon, itemImage: mainImageOf(orderItems.productSlug), itemPrice: orderItems.price, itemQty: orderItems.qty,
    orderCode: orders.code, customer: users.name, customerPhone: sql<string | null>`coalesce(${users.phone}, ${users.contactPhone})`, paymentMethod: orders.paymentMethod,
    replacementCode: sql<string | null>`(select code from orders r where r.id = ${W.replacementOrderId})`,
    reviewStars: sql<number | null>`(select stars from reviews rv where rv.id = ${W.reviewId})`,
    reviewSlug: sql<string | null>`(select product_slug from reviews rv where rv.id = ${W.reviewId})`,
  })
    .from(W)
    .innerJoin(orderItems, eq(orderItems.id, W.orderItemId))
    .innerJoin(orders, eq(orders.id, W.orderId))
    .innerJoin(users, eq(users.id, W.userId));
}

async function withPhotos<T extends { w: { id: number } }>(rows: T[]) {
  if (!rows.length) return [];
  const photos = await db.select({ requestId: WP.requestId, file: WP.file }).from(WP).where(inArray(WP.requestId, rows.map((r) => r.w.id))).orderBy(WP.id);
  return rows.map((r) => ({ ...r, code: warrantyCode(r.w.id), photos: photos.filter((p) => p.requestId === r.w.id).map((p) => p.file) }));
}

export const listWarrantyForUser = async (userId: number) => withPhotos(await base().where(eq(W.userId, userId)).orderBy(desc(W.id)));

export async function listWarranty(status?: (typeof WARRANTY_STATUSES)[number]) {
  return withPhotos(await base().where(status ? eq(W.status, status) : undefined).orderBy(desc(W.id)).limit(100));
}

export const getWarranty = async (id: number) => (await withPhotos(await base().where(eq(W.id, id))))[0];
export type WarrantyFull = NonNullable<Awaited<ReturnType<typeof getWarranty>>>;

export async function countWarrantyByStatus() {
  const all = await db.select({ s: W.status }).from(W);
  return Object.fromEntries(WARRANTY_STATUSES.map((s) => [s, all.filter((r) => r.s === s).length])) as Record<(typeof WARRANTY_STATUSES)[number], number>;
}

// ---- Kỹ sư duyệt -----------------------------------------------------------------------------

/** Vật tư tặng kèm khi chọn "Hướng dẫn cứu cây". */
export const RESCUE_GIFT_SLUG = 'trichoderma-tri-nam-thoi-re';

export const DecideSchema = z.object({
  id: z.number().int().positive(),
  resolution: z.enum(WARRANTY_RESOLUTIONS),
  cause: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
  /** Số cây đổi / hoàn tiền (dòng hàng có thể nhiều cây). */
  qty: z.number().int().min(1).max(99).default(1),
  /** Hoàn tiền: số tiền; bỏ trống = giá cây × số lượng. */
  refundAmount: z.number().int().min(0).max(1_000_000_000).optional(),
  /** Cứu cây: có tặng vật tư không. */
  gift: z.boolean().default(true),
}).refine((v) => v.resolution !== 'reject' || (v.note && v.note.length >= 10), { message: 'Từ chối bắt buộc nêu lý do (ít nhất 10 ký tự)', path: ['note'] });

class DecideError extends Error {}

type OrderRow = typeof orders.$inferSelect;
type Line = { slug: string; idx: number; name: string; label: string; unit: string; icon: string; ship: 'plant' | 'supply'; oldPrice: number | null; qty: number };

/** Đơn 0đ do bảo hành tạo: giao lại cùng địa chỉ/khung giờ đơn gốc, đã xác nhận sẵn, trừ kho với lý do "warranty". */
async function createWarrantyOrder(tx: Tx, src: OrderRow, userId: number, lines: Line[], note: string, actor: string) {
  const code = await newOrderCode(tx);
  if (!code) throw new DecideError('Không tạo được mã đơn, vui lòng thử lại');
  const [order] = await tx.insert(orders).values({
    code, kind: 'warranty', userId, status: 'confirmed', customerName: src.customerName, phone: src.phone,
    delivery: src.delivery, address: src.address, slot: src.slot, note, paymentMethod: src.paymentMethod, paid: true,
    original: 0, subtotal: 0, plantShip: 0, supplyShip: 0, total: 0,
  }).returning({ id: orders.id });
  for (const l of lines) {
    await tx.insert(orderItems).values({
      orderId: order.id, productSlug: l.slug, optionIdx: l.idx, name: l.name, label: l.label, unit: l.unit,
      icon: l.icon, ship: l.ship, price: 0, oldPrice: l.oldPrice, qty: l.qty,
    });
    if (await applyStock(tx, l.slug, l.idx, -l.qty, 'warranty', actor, code) === null) {
      throw new DecideError(`Kho không đủ “${l.name} · ${l.label}” (cần ${l.qty}). Nhập thêm hàng hoặc chọn hướng xử lý khác.`);
    }
  }
  await tx.insert(orderEvents).values([
    { orderId: order.id, status: 'pending', actor, note },
    { orderId: order.id, status: 'confirmed', actor },
  ]);
  return { id: order.id, code };
}

export async function decideWarranty(input: z.infer<typeof DecideSchema>, actor: string) {
  try {
    return await db.transaction(async (tx) => {
      // Khóa yêu cầu: hai kỹ sư duyệt cùng lúc không tạo hai đơn đổi.
      const [w] = await tx.select().from(W).where(eq(W.id, input.id)).for('update');
      if (!w) throw new DecideError('Không tìm thấy yêu cầu');
      if (w.status !== 'pending') throw new DecideError('Yêu cầu đã được xử lý');
      const [item] = await tx.select().from(orderItems).where(eq(orderItems.id, w.orderItemId));
      const [src] = await tx.select().from(orders).where(eq(orders.id, w.orderId));
      if (!item || !src) throw new DecideError('Không tìm thấy đơn gốc');
      if (input.qty > item.qty) throw new DecideError(`Đơn gốc chỉ có ${item.qty} cây`);
      const code = warrantyCode(w.id);

      let replacement: { id: number; code: string } | null = null;
      let refundAmount: number | null = null;

      if (input.resolution === 'replace') {
        replacement = await createWarrantyOrder(tx, src, w.userId, [{
          slug: item.productSlug, idx: item.optionIdx, name: item.name, label: item.label, unit: item.unit,
          icon: item.icon, ship: item.ship, oldPrice: item.price, qty: input.qty,
        }], `Đổi cây bảo hành ${code} (đơn gốc ${src.code})`, actor);
      }
      if (input.resolution === 'rescue' && input.gift) {
        const [p] = await tx.select().from(schema.products).where(eq(schema.products.slug, RESCUE_GIFT_SLUG));
        const [opt] = p ? await tx.select().from(schema.productOptions)
          .where(and(eq(schema.productOptions.productSlug, p.slug), eq(schema.productOptions.deleted, false))).orderBy(asc(schema.productOptions.idx)).limit(1) : [];
        if (!p || !opt) throw new DecideError('Không tìm thấy vật tư tặng (Trichoderma). Bỏ chọn “Tặng vật tư” để tiếp tục.');
        replacement = await createWarrantyOrder(tx, src, w.userId, [{
          slug: p.slug, idx: opt.idx, name: p.name, label: opt.label, unit: p.unit, icon: p.icon, ship: p.ship, oldPrice: opt.price, qty: 1,
        }], `Tặng vật tư cứu cây — bảo hành ${code} (đơn gốc ${src.code})`, actor);
      }
      if (input.resolution === 'refund') {
        const max = item.price * item.qty;
        refundAmount = Math.min(input.refundAmount ?? item.price * input.qty, max);
        if (refundAmount <= 0) throw new DecideError('Số tiền hoàn phải lớn hơn 0');
      }

      await tx.update(W).set({
        status: input.resolution === 'reject' ? 'rejected' : 'approved',
        resolution: input.resolution, cause: input.cause || null, engineerNote: input.note || null,
        decidedBy: actor, decidedAt: new Date(),
        replacementOrderId: replacement?.id ?? null,
        refundAmount, refundStatus: refundAmount ? 'pending' : null,
      }).where(eq(W.id, w.id));

      const tail = replacement ? ` — đơn giao ${replacement.code}` : refundAmount ? ` — hoàn ${refundAmount.toLocaleString('vi-VN')}đ` : '';
      await notifyEvent(tx, w.userId, 'warranty_decided', { ma_bh: code, huong_xu_ly: WARRANTY_RESOLUTION_LABEL[input.resolution], chi_tiet: tail }, '/tai-khoan/bao-hanh');
      return { ok: true as const, replacementCode: replacement?.code ?? null };
    });
  } catch (e) {
    if (e instanceof DecideError) return { ok: false as const, error: e.message };
    throw e;
  }
}

export const RefundSchema = z.object({
  id: z.number().int().positive(),
  ref: z.string().trim().min(3, 'Nhập mã giao dịch / ghi chú chuyển khoản').max(120),
});

/**
 * Kế toán xác nhận đã chuyển tiền hoàn cho khách (chưa có cổng thanh toán nên làm tay).
 * TODO: khi nối cổng (MoMo/ZaloPay/VNPay) gọi API hoàn tiền ở đây và lưu mã giao dịch trả về.
 */
export async function confirmRefund(input: z.infer<typeof RefundSchema>, actor: string) {
  return db.transaction(async (tx) => {
    const [w] = await tx.select().from(W).where(eq(W.id, input.id)).for('update');
    if (!w || w.resolution !== 'refund') return { ok: false as const, error: 'Không tìm thấy yêu cầu hoàn tiền' };
    if (w.refundStatus === 'done') return { ok: false as const, error: 'Yêu cầu đã hoàn tiền' };
    await tx.update(W).set({ refundStatus: 'done', refundRef: input.ref, refundedBy: actor, refundedAt: new Date() }).where(eq(W.id, w.id));
    await notifyEvent(tx, w.userId, 'warranty_refunded', { so_tien: `${(w.refundAmount ?? 0).toLocaleString('vi-VN')}đ`, ma_bh: warrantyCode(w.id) }, '/tai-khoan/bao-hanh');
    return { ok: true as const };
  });
}
