import 'server-only';
import { and, count, desc, eq, gte, inArray, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { normalize } from '@/lib/catalog';
import { suggestReviewReply } from '@/lib/reply-suggest';
import { warrantyCode } from '@/lib/warranty-labels';
import {
  MAX_REVIEW_PHOTOS, REVIEW_HOLD_STARS, REVIEW_MAX_CHARS, REVIEW_MIN_CHARS, REVIEW_REPLY_MAX_CHARS,
  reviewPhotoUrl, type ReviewView, type VoteKind,
} from '@/lib/reviews';
import type { SessionUser } from './auth';
import { mainImageOf } from './catalog';
import { db, schema } from './db';
import type { ReviewStatus } from './db/schema';
import { notifyEvent } from './notify';
import { reviewReward } from './vouchers';
import { saveImage, type SavedImage } from './uploads';

const {
  reviews: R, reviewPhotos: RP, reviewVotes: RV, questions: Q, questionVotes: QV, questionAnswers: QA, questionAnswerVotes: AV,
  users, products, orders, orderItems,
} = schema;

type Owner = Pick<SessionUser, 'id' | 'phone'>;

/** Giống ownedBy trong server/orders.ts — đơn đặt vãng lai cùng SĐT đã xác thực cũng tính là đã mua. */
const ownedBy = (u: Owner) => (u.phone ? or(eq(orders.userId, u.id), eq(orders.phone, u.phone)) : eq(orders.userId, u.id));

export async function hasPurchased(u: Owner, slug: string) {
  const [row] = await db.select({ id: orders.id }).from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(ownedBy(u), eq(orders.status, 'delivered'), eq(orderItems.productSlug, slug)))
    .limit(1);
  return Boolean(row);
}

export const displayName = (name: string | null) => name?.trim() || 'Khách hàng';

// ---- "Hữu ích" (đánh giá, câu hỏi, câu trả lời của khách) ----------------------------------------------------------

/** Số lượt "Hữu ích" của từng mục + các mục người xem đã bấm. */
export async function voteInfo(kind: VoteKind, ids: number[], viewerId: number | null) {
  const counts = new Map<number, number>();
  const mine = new Set<number>();
  if (!ids.length) return { counts, mine };
  const rows = kind === 'review'
    ? await db.select({ id: RV.reviewId, userId: RV.userId }).from(RV).where(inArray(RV.reviewId, ids))
    : kind === 'question'
      ? await db.select({ id: QV.questionId, userId: QV.userId }).from(QV).where(inArray(QV.questionId, ids))
      : await db.select({ id: AV.answerId, userId: AV.userId }).from(AV).where(inArray(AV.answerId, ids));
  for (const r of rows) {
    counts.set(r.id, (counts.get(r.id) ?? 0) + 1);
    if (r.userId === viewerId) mine.add(r.id);
  }
  return { counts, mine };
}

type VoteResult = { ok: true; helpful: number; voted: boolean } | { ok: false; error: string };

/**
 * Bấm / bỏ "Hữu ích". Chỉ cho mục khách khác đang thấy (đánh giá đã hiện, câu hỏi đã có người trả lời và không bị ẩn,
 * câu trả lời đã hiện dưới câu hỏi không bị ẩn), không tự bấm cho mục của mình.
 * addOnly: chỉ thêm, đã bấm rồi thì giữ nguyên (tự bấm tiếp sau khi đăng nhập — không được gỡ lượt khách đã bấm từ trước).
 */
export async function toggleVote(kind: VoteKind, id: number, userId: number, addOnly = false): Promise<VoteResult> {
  if (kind === 'review') {
    const [r] = await db.select({ userId: R.userId, status: R.status }).from(R).where(eq(R.id, id));
    if (!r || r.status !== 'published') return { ok: false, error: 'Không tìm thấy đánh giá' };
    if (r.userId === userId) return { ok: false, error: 'Không bình chọn cho đánh giá của chính bạn' };
    const ins = await db.insert(RV).values({ reviewId: id, userId }).onConflictDoNothing().returning({ id: RV.reviewId });
    if (!ins.length && !addOnly) await db.delete(RV).where(and(eq(RV.reviewId, id), eq(RV.userId, userId)));
    const [{ n }] = await db.select({ n: count() }).from(RV).where(eq(RV.reviewId, id));
    return { ok: true, helpful: n, voted: ins.length > 0 || addOnly };
  }
  if (kind === 'answer') {
    const [a] = await db.select({ userId: QA.userId, status: QA.status, qStatus: Q.status })
      .from(QA).innerJoin(Q, eq(Q.id, QA.questionId)).where(eq(QA.id, id));
    if (!a || a.status !== 'published' || a.qStatus !== 'visible') return { ok: false, error: 'Không tìm thấy câu trả lời' };
    if (a.userId === userId) return { ok: false, error: 'Không bình chọn cho câu trả lời của chính bạn' };
    const ins = await db.insert(AV).values({ answerId: id, userId }).onConflictDoNothing().returning({ id: AV.answerId });
    if (!ins.length && !addOnly) await db.delete(AV).where(and(eq(AV.answerId, id), eq(AV.userId, userId)));
    const [{ n }] = await db.select({ n: count() }).from(AV).where(eq(AV.answerId, id));
    return { ok: true, helpful: n, voted: ins.length > 0 || addOnly };
  }
  const [q] = await db.select({
    userId: Q.userId, status: Q.status, answer: Q.answer,
    // Câu hỏi hiện công khai: shop đã trả lời hoặc có khách khác trả lời
    replied: sql<boolean>`exists (select 1 from "question_answers" a where a.question_id = "questions"."id" and a.status = 'published')`,
  }).from(Q).where(eq(Q.id, id));
  if (!q || q.status !== 'visible' || !(q.answer || q.replied)) return { ok: false, error: 'Không tìm thấy câu hỏi' };
  if (q.userId === userId) return { ok: false, error: 'Không bình chọn cho câu hỏi của chính bạn' };
  const ins = await db.insert(QV).values({ questionId: id, userId }).onConflictDoNothing().returning({ id: QV.questionId });
  if (!ins.length && !addOnly) await db.delete(QV).where(and(eq(QV.questionId, id), eq(QV.userId, userId)));
  const [{ n }] = await db.select({ n: count() }).from(QV).where(eq(QV.questionId, id));
  return { ok: true, helpful: n, voted: ins.length > 0 || addOnly };
}

async function photosOf(ids: number[]) {
  const out = new Map<number, { file: string; url: string }[]>();
  if (!ids.length) return out;
  const rows = await db.select({ reviewId: RP.reviewId, file: RP.file }).from(RP).where(inArray(RP.reviewId, ids)).orderBy(RP.id);
  for (const r of rows) {
    const list = out.get(r.reviewId) ?? [];
    list.push({ file: r.file, url: reviewPhotoUrl(r.file) });
    out.set(r.reviewId, list);
  }
  return out;
}

// ---- Trang sản phẩm ---------------------------------------------------------------------------

/**
 * Đánh giá hiện ở trang sản phẩm: đánh giá đã hiện + đánh giá của chính người xem (mọi trạng thái, đứng đầu).
 * Không trả trạng thái về trình duyệt — người viết 1–2★ thấy đánh giá của mình như mọi đánh giá khác.
 */
export async function productReviews(slug: string, viewerId: number | null): Promise<ReviewView[]> {
  const visible = viewerId ? or(eq(R.status, 'published'), eq(R.userId, viewerId)) : eq(R.status, 'published');
  const rows = await db.select({ r: R, name: users.name }).from(R)
    .innerJoin(users, eq(users.id, R.userId))
    .where(and(eq(R.productSlug, slug), visible))
    .orderBy(desc(R.createdAt))
    .limit(300);
  const ids = rows.map((x) => x.r.id);
  const [photos, votes] = await Promise.all([photosOf(ids), voteInfo('review', ids, viewerId)]);
  const items = rows.map(({ r, name }): ReviewView => ({
    id: r.id, name: displayName(name), stars: r.stars, content: r.content, verified: r.verified,
    createdAt: r.createdAt.getTime(), photos: photos.get(r.id) ?? [],
    reply: r.reply, repliedAt: r.repliedAt?.getTime() ?? null, mine: r.userId === viewerId,
    helpful: votes.counts.get(r.id) ?? 0, voted: votes.mine.has(r.id),
  }));
  return [...items.filter((i) => i.mine), ...items.filter((i) => !i.mine)];
}

// ---- Khách viết / sửa / xóa ---------------------------------------------------------------------

export const ReviewInputSchema = z.object({
  slug: z.string().min(1).max(120),
  stars: z.coerce.number().int().min(1, 'Chọn số sao').max(5),
  content: z.string().trim()
    .min(REVIEW_MIN_CHARS, `Viết ít nhất ${REVIEW_MIN_CHARS} ký tự`)
    .max(REVIEW_MAX_CHARS, `Tối đa ${REVIEW_MAX_CHARS} ký tự`),
  /** Ảnh cũ giữ lại (tên file) khi sửa đánh giá. */
  keep: z.array(z.string().max(64)).max(MAX_REVIEW_PHOTOS),
});
export type ReviewInput = z.infer<typeof ReviewInputSchema>;

type Result = { ok: true } | { ok: false; error: string };

/** Viết mới hoặc sửa đánh giá của mình (mỗi tài khoản 1 đánh giá / sản phẩm). */
export async function saveReview(user: SessionUser, input: ReviewInput, files: File[]): Promise<Result> {
  const [p] = await db.select({ slug: products.slug }).from(products).where(and(eq(products.slug, input.slug), eq(products.active, true)));
  if (!p) return { ok: false, error: 'Sản phẩm không còn bán' };

  const imgs: SavedImage[] = [];
  for (const f of files) {
    const img = await saveImage(f);
    if ('error' in img) return { ok: false, error: img.error };
    imgs.push(img);
  }
  const verified = await hasPurchased(user, input.slug);

  try {
    const r = await db.transaction(async (tx) => {
      const [old] = await tx.select({ id: R.id, status: R.status }).from(R)
        .where(and(eq(R.userId, user.id), eq(R.productSlug, input.slug))).for('update');

      const oldPhotos = old ? await tx.select({ id: RP.id, file: RP.file }).from(RP).where(eq(RP.reviewId, old.id)) : [];
      const keep = oldPhotos.filter((ph) => input.keep.includes(ph.file));
      if (keep.length + imgs.length > MAX_REVIEW_PHOTOS) return { ok: false as const, error: `Tối đa ${MAX_REVIEW_PHOTOS} ảnh` };

      // Đã bị ẩn vì vi phạm thì sửa vẫn ẩn; còn lại 1–2★ chờ duyệt, 3–5★ hiện ngay.
      const status: ReviewStatus = old?.status === 'hidden' ? 'hidden' : input.stars <= REVIEW_HOLD_STARS ? 'pending' : 'published';
      const values = { stars: input.stars, content: input.content, verified, status, updatedAt: new Date() };

      let id: number;
      if (old) {
        id = old.id;
        await tx.update(R).set(values).where(eq(R.id, id));
        const drop = oldPhotos.filter((ph) => !keep.includes(ph)).map((ph) => ph.id);
        if (drop.length) await tx.delete(RP).where(inArray(RP.id, drop));
      } else {
        [{ id }] = await tx.insert(R).values({ productSlug: input.slug, userId: user.id, ...values }).returning({ id: R.id });
      }
      if (imgs.length) await tx.insert(RP).values(imgs.map((img) => ({ reviewId: id, file: img.file, mime: img.mime, data: img.data })));
      return { ok: true as const, first: !old };
    });
    // Đánh giá đầu tiên cho sản phẩm đã mua → tặng mã quà đánh giá (chỉ lần đầu: tài khoản đúng 1 đánh giá "đã mua").
    if (r.ok && r.first && verified) {
      const [{ n }] = await db.select({ n: count() }).from(R).where(and(eq(R.userId, user.id), eq(R.verified, true)));
      const gift = n === 1 ? await reviewReward(user.id) : null;
      if (gift) {
        const [prod] = await db.select({ name: products.name }).from(products).where(eq(products.slug, input.slug));
        await notifyEvent(db, user.id, 'review_reward', { ten_san_pham: prod?.name ?? 'sản phẩm', ma_voucher: gift.code, noi_dung_qua: gift.text }, '/khuyen-mai');
      }
    }
    return r.ok ? { ok: true } : r;
  } catch (e) {
    // Bấm gửi 2 lần cùng lúc: lần sau vướng khóa duy nhất (user, sản phẩm).
    if ((e as { code?: string }).code === '23505' || (e as { cause?: { code?: string } }).cause?.code === '23505') {
      return { ok: false, error: 'Đánh giá đã được gửi, vui lòng tải lại trang' };
    }
    throw e;
  }
}

export async function deleteReview(userId: number, slug: string) {
  const r = await db.delete(R).where(and(eq(R.userId, userId), eq(R.productSlug, slug))).returning({ id: R.id });
  return r.length > 0;
}

/** Ảnh đánh giá: ai được xem (xem route /api/review-photos). */
export async function reviewPhotoAccess(file: string) {
  const [row] = await db.select({ status: R.status, userId: R.userId, data: RP.data, mime: RP.mime }).from(RP)
    .innerJoin(R, eq(R.id, RP.reviewId)).where(eq(RP.file, file));
  return row ?? null;
}

// ---- Admin ----------------------------------------------------------------------------------------

export const REVIEW_TABS = { 'cho-duyet': 'pending', 'dang-hien': 'published', 'da-an': 'hidden' } as const satisfies Record<string, ReviewStatus>;
export type ReviewTab = keyof typeof REVIEW_TABS;

export type ReviewFlag = { label: string; tone: 'danger' | 'info' | 'warn' };

const AD_RE = /https?:\/\/|www\.|\.(com|vn|net)\b|zalo|facebook|fb\.|(?:\d[ .-]?){9,}/i;
const SHIP_RE = /\b(giao|ship|shipper|van chuyen|dong goi|dap|tre)\b/;

/** Có SĐT / link / nhắc Zalo-Facebook → nghi quảng cáo hoặc lộ thông tin cá nhân. */
export const AD_FLAG: ReviewFlag = { label: 'Nghi quảng cáo / có SĐT, link', tone: 'danger' };
export const looksLikeAd = (text: string) => AD_RE.test(text);

/** Nhãn tự động giúp nhân viên xử lý nhanh (AdminReviews). */
function flagsOf(r: { stars: number; verified: boolean; content: string; ship: 'plant' | 'supply' }): ReviewFlag[] {
  const out: ReviewFlag[] = [];
  const text = normalize(r.content);
  if (r.stars < 3) out.push({ label: 'Dưới 3 sao', tone: 'danger' });
  if (looksLikeAd(r.content)) out.push(AD_FLAG);
  if (!r.verified) out.push({ label: 'Chưa mua hàng', tone: 'warn' });
  if (r.ship === 'plant' && r.verified && r.stars <= 2) out.push({ label: 'Có thể cần bảo hành', tone: 'info' });
  if (SHIP_RE.test(text)) out.push({ label: 'Góp ý giao hàng', tone: 'info' });
  return out;
}

export async function listReviewsAdmin({ tab, stars, photo, q }: { tab: ReviewTab; stars?: number; photo?: boolean; q?: string }) {
  // Ghi rõ "bảng"."cột": truy vấn con một bảng của Drizzle bỏ tên bảng, "id" sẽ bị hiểu thành review_photos.id.
  const hasPhoto = sql`exists (select 1 from "review_photos" rp where rp.review_id = "reviews"."id")`;
  const rows = await db.select({
    r: R, customer: users.name, phone: sql<string | null>`coalesce(${users.phone}, ${users.contactPhone})`, email: users.email,
    productName: products.name, icon: products.icon, ship: products.ship, image: mainImageOf(products.slug),
    // Yêu cầu bảo hành nhân viên đã tạo thay khách từ đánh giá này (mới nhất)
    warrantyId: sql<number | null>`(select max(w.id) from "warranty_requests" w where w.review_id = "reviews"."id")`,
  }).from(R)
    .innerJoin(users, eq(users.id, R.userId))
    .innerJoin(products, eq(products.slug, R.productSlug))
    .where(and(eq(R.status, REVIEW_TABS[tab]), stars ? eq(R.stars, stars) : undefined, photo ? hasPhoto : undefined))
    .orderBy(desc(R.updatedAt))
    .limit(300);

  const needle = q ? normalize(q) : '';
  const found = needle
    ? rows.filter((x) => normalize(`${x.r.content} ${x.customer ?? ''} ${x.productName} ${x.phone ?? ''} ${x.email ?? ''}`).includes(needle))
    : rows;
  const ids = found.map((x) => x.r.id);
  const [photos, votes] = await Promise.all([photosOf(ids), voteInfo('review', ids, null)]);
  return found.map((x) => ({
    ...x.r,
    customer: displayName(x.customer), phone: x.phone, email: x.email,
    productName: x.productName, icon: x.icon, image: x.image,
    photos: (photos.get(x.r.id) ?? []).map((ph) => ph.url),
    flags: flagsOf({ ...x.r, ship: x.ship }),
    helpful: votes.counts.get(x.r.id) ?? 0,
    warranty: x.warrantyId ? { id: x.warrantyId, code: warrantyCode(x.warrantyId) } : null,
    // Nháp cho nhân viên sửa (chỉ khi chưa trả lời)
    suggestion: x.r.reply || x.r.status === 'hidden' ? null : suggestReviewReply({
      stars: x.r.stars, customer: displayName(x.customer), verified: x.r.verified, isPlant: x.ship === 'plant',
      shipping: SHIP_RE.test(normalize(x.r.content)), ad: looksLikeAd(x.r.content),
      warrantyCode: x.warrantyId ? warrantyCode(x.warrantyId) : null,
    }),
  }));
}

export async function countReviewsByStatus() {
  const rows = await db.select({ status: R.status, n: count() }).from(R).groupBy(R.status);
  const out: Record<ReviewStatus, number> = { published: 0, pending: 0, hidden: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function reviewKpis() {
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const since7 = new Date(Date.now() - 7 * 86_400_000);
  const [pub] = await db.select({ n: count(), avg: sql<string | null>`avg(${R.stars})` }).from(R).where(eq(R.status, 'published'));
  const [recent] = await db.select({
    n: count(),
    replied: sql<number>`count(${R.reply})`.mapWith(Number),
    week: sql<number>`count(*) filter (where ${R.createdAt} >= ${since7})`.mapWith(Number),
  }).from(R).where(and(gte(R.createdAt, since30), inArray(R.status, ['published', 'pending'])));
  return {
    published: pub.n,
    avg: pub.avg ? Math.round(Number(pub.avg) * 10) / 10 : 0,
    recent: recent.n,
    week: recent.week,
    replyRate: recent.n ? Math.round((recent.replied / recent.n) * 100) : null,
  };
}

export const ModerateSchema = z.object({
  id: z.number().int().positive(),
  action: z.enum(['publish', 'hide', 'reply']),
  /** Trả lời công khai; chuỗi rỗng = xóa trả lời. */
  reply: z.string().trim().max(REVIEW_REPLY_MAX_CHARS, `Tối đa ${REVIEW_REPLY_MAX_CHARS} ký tự`),
});

/**
 * Duyệt / ẩn / trả lời. Trả lời chỉ ghi lại khi nội dung đổi (giữ nguyên người và giờ trả lời cũ).
 * Lần đầu shop trả lời một đánh giá đang hiện → báo cho khách (chuông thông báo; sửa trả lời sau đó không báo lại).
 */
export async function moderateReview(input: z.infer<typeof ModerateSchema>, actor: string): Promise<Result & { slug?: string }> {
  return db.transaction(async (tx) => {
    const [r] = await tx.select({ reply: R.reply, slug: R.productSlug, status: R.status, userId: R.userId })
      .from(R).where(eq(R.id, input.id)).for('update');
    if (!r) return { ok: false as const, error: 'Không tìm thấy đánh giá' };
    const now = new Date();
    const set: Partial<typeof R.$inferInsert> = {};
    if ((r.reply ?? '') !== input.reply) Object.assign(set, input.reply ? { reply: input.reply, replyBy: actor, repliedAt: now } : { reply: null, replyBy: null, repliedAt: null });
    const status: ReviewStatus = input.action === 'publish' ? 'published' : input.action === 'hide' ? 'hidden' : r.status;
    if (input.action !== 'reply') Object.assign(set, { status, moderatedBy: actor, moderatedAt: now });
    if (Object.keys(set).length) await tx.update(R).set(set).where(eq(R.id, input.id));

    if (!r.reply && input.reply && status === 'published') {
      const [p] = await tx.select({ name: products.name }).from(products).where(eq(products.slug, r.slug));
      await notifyEvent(tx, r.userId, 'review_replied', { ten_san_pham: p?.name ?? 'sản phẩm' }, `/san-pham/${r.slug}#danh-gia`);
    }
    return { ok: true as const, slug: r.slug };
  });
}
