import 'server-only';
import { and, count, desc, eq, gte, isNotNull, isNull, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { normalize } from '@/lib/catalog';
import {
  QUESTION_DAILY_LIMIT, QUESTION_MAX_CHARS, QUESTION_MIN_CHARS, REVIEW_REPLY_MAX_CHARS, type QuestionView,
} from '@/lib/reviews';
import type { SessionUser } from './auth';
import { mainImageOf } from './catalog';
import { db, schema } from './db';
import { notify } from './notify';
import { AD_FLAG, displayName, looksLikeAd, voteInfo, type ReviewFlag } from './reviews';

const { questions: Q, users, products } = schema;

type Result = { ok: true } | { ok: false; error: string };

// ---- Trang sản phẩm ---------------------------------------------------------------------------

/**
 * Hỏi đáp ở trang sản phẩm: câu hỏi đã có trả lời (không bị ẩn) + câu hỏi của chính người xem (đứng đầu).
 * Câu hỏi chưa trả lời chỉ người hỏi thấy.
 */
export async function productQuestions(slug: string, viewerId: number | null): Promise<QuestionView[]> {
  const shown = and(eq(Q.status, 'visible'), isNotNull(Q.answer));
  const rows = await db.select({ q: Q, name: users.name }).from(Q)
    .innerJoin(users, eq(users.id, Q.userId))
    .where(and(eq(Q.productSlug, slug), viewerId ? or(shown, eq(Q.userId, viewerId)) : shown))
    .orderBy(desc(Q.createdAt))
    .limit(300);
  const votes = await voteInfo('question', rows.map((x) => x.q.id), viewerId);
  const items = rows.map(({ q, name }): QuestionView => ({
    id: q.id, name: displayName(name), content: q.content, createdAt: q.createdAt.getTime(),
    // Câu hỏi bị ẩn: người hỏi vẫn thấy câu hỏi của mình nhưng không thấy trả lời
    answer: q.status === 'visible' ? q.answer : null, answeredAt: q.status === 'visible' ? q.answeredAt?.getTime() ?? null : null,
    mine: q.userId === viewerId, helpful: votes.counts.get(q.id) ?? 0, voted: votes.mine.has(q.id),
  }));
  return [...items.filter((i) => i.mine), ...items.filter((i) => !i.mine)];
}

export const AskSchema = z.object({
  slug: z.string().min(1).max(120),
  content: z.string().trim()
    .min(QUESTION_MIN_CHARS, `Câu hỏi cần ít nhất ${QUESTION_MIN_CHARS} ký tự`)
    .max(QUESTION_MAX_CHARS, `Tối đa ${QUESTION_MAX_CHARS} ký tự`),
});

export async function askQuestion(user: SessionUser, input: z.infer<typeof AskSchema>): Promise<Result> {
  const [p] = await db.select({ slug: products.slug }).from(products).where(and(eq(products.slug, input.slug), eq(products.active, true)));
  if (!p) return { ok: false, error: 'Sản phẩm không còn bán' };
  const since = new Date(Date.now() - 86_400_000);
  const [{ n }] = await db.select({ n: count() }).from(Q).where(and(eq(Q.userId, user.id), gte(Q.createdAt, since)));
  if (n >= QUESTION_DAILY_LIMIT) return { ok: false, error: 'Bạn đã gửi nhiều câu hỏi hôm nay. Vui lòng chat Zalo để được tư vấn nhanh hơn.' };
  await db.insert(Q).values({ productSlug: input.slug, userId: user.id, content: input.content });
  return { ok: true };
}

export async function deleteQuestion(userId: number, id: number) {
  const r = await db.delete(Q).where(and(eq(Q.id, id), eq(Q.userId, userId))).returning({ slug: Q.productSlug });
  return r[0]?.slug ?? null;
}

// ---- Admin ----------------------------------------------------------------------------------------

export const QUESTION_FILTERS = { 'chua-tra-loi': 'Chưa trả lời', 'da-tra-loi': 'Đã trả lời', 'da-an': 'Đã ẩn' } as const;
export type QuestionFilter = keyof typeof QUESTION_FILTERS;

const filterWhere = (f: QuestionFilter) =>
  f === 'da-an' ? eq(Q.status, 'hidden') : and(eq(Q.status, 'visible'), f === 'chua-tra-loi' ? isNull(Q.answer) : isNotNull(Q.answer));

export async function listQuestionsAdmin({ filter, q }: { filter: QuestionFilter; q?: string }) {
  const rows = await db.select({
    q: Q, customer: users.name, phone: sql<string | null>`coalesce(${users.phone}, ${users.contactPhone})`, email: users.email,
    productName: products.name, icon: products.icon, image: mainImageOf(products.slug),
  }).from(Q)
    .innerJoin(users, eq(users.id, Q.userId))
    .innerJoin(products, eq(products.slug, Q.productSlug))
    .where(filterWhere(filter))
    // Chưa trả lời: câu cũ nhất lên đầu (trả lời theo thứ tự hỏi); còn lại mới nhất trước
    .orderBy(filter === 'chua-tra-loi' ? Q.createdAt : desc(Q.createdAt))
    .limit(300);
  const needle = q ? normalize(q) : '';
  const found = needle
    ? rows.filter((x) => normalize(`${x.q.content} ${x.q.answer ?? ''} ${x.customer ?? ''} ${x.productName} ${x.phone ?? ''} ${x.email ?? ''}`).includes(needle))
    : rows;
  const votes = await voteInfo('question', found.map((x) => x.q.id), null);
  return found.map((x) => ({
    ...x.q,
    customer: displayName(x.customer), productName: x.productName, icon: x.icon, image: x.image,
    flags: (looksLikeAd(x.q.content) ? [AD_FLAG] : []) as ReviewFlag[],
    helpful: votes.counts.get(x.q.id) ?? 0,
  }));
}

export async function countQuestions() {
  const [r] = await db.select({
    unanswered: sql<number>`count(*) filter (where ${Q.status} = 'visible' and ${Q.answer} is null)`.mapWith(Number),
    answered: sql<number>`count(*) filter (where ${Q.status} = 'visible' and ${Q.answer} is not null)`.mapWith(Number),
    hidden: sql<number>`count(*) filter (where ${Q.status} = 'hidden')`.mapWith(Number),
  }).from(Q);
  return r;
}

export const AnswerSchema = z.object({
  id: z.number().int().positive(),
  action: z.enum(['answer', 'hide', 'show']),
  /** Trả lời công khai; chuỗi rỗng = xóa trả lời (câu hỏi quay về "Chưa trả lời"). */
  answer: z.string().trim().max(REVIEW_REPLY_MAX_CHARS, `Tối đa ${REVIEW_REPLY_MAX_CHARS} ký tự`),
});

/**
 * Trả lời / ẩn / hiện lại câu hỏi. Trả lời chỉ ghi lại khi nội dung đổi.
 * Lần đầu có trả lời (câu hỏi không bị ẩn) → báo khách qua chuông + Zalo/email (khách đang chờ câu trả lời).
 */
export async function answerQuestion(input: z.infer<typeof AnswerSchema>, actor: string): Promise<Result & { slug?: string }> {
  return db.transaction(async (tx) => {
    const [q] = await tx.select({ answer: Q.answer, slug: Q.productSlug, status: Q.status, userId: Q.userId })
      .from(Q).where(eq(Q.id, input.id)).for('update');
    if (!q) return { ok: false as const, error: 'Không tìm thấy câu hỏi' };
    if (input.action === 'answer' && !input.answer) return { ok: false as const, error: 'Nhập câu trả lời' };
    const now = new Date();
    const set: Partial<typeof Q.$inferInsert> = {};
    if ((q.answer ?? '') !== input.answer) Object.assign(set, input.answer ? { answer: input.answer, answerBy: actor, answeredAt: now } : { answer: null, answerBy: null, answeredAt: null });
    const status = input.action === 'hide' ? 'hidden' : input.action === 'show' ? 'visible' : q.status;
    if (status !== q.status) Object.assign(set, { status, moderatedBy: actor, moderatedAt: now });
    if (Object.keys(set).length) await tx.update(Q).set(set).where(eq(Q.id, input.id));

    if (!q.answer && input.answer && status === 'visible') {
      const [p] = await tx.select({ name: products.name }).from(products).where(eq(products.slug, q.slug));
      await notify(tx, q.userId, {
        kind: 'reply',
        text: `Shop đã trả lời câu hỏi của bạn về **${p?.name ?? 'sản phẩm'}**`,
        href: `/san-pham/${q.slug}#cau-hoi`,
        external: true,
      });
    }
    return { ok: true as const, slug: q.slug };
  });
}
