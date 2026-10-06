import 'server-only';
import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { normalize } from '@/lib/catalog';
import { SIMILAR_MIN, similarity, suggestQuestionReply, termsOf, type AnsweredQA, type Suggestion } from '@/lib/reply-suggest';
import {
  ANSWER_DAILY_LIMIT, QUESTION_DAILY_LIMIT, QUESTION_MAX_CHARS, QUESTION_MIN_CHARS, REVIEW_REPLY_MAX_CHARS,
  type AnswerView, type QuestionView,
} from '@/lib/reviews';
import type { SessionUser } from './auth';
import { mainImageOf } from './catalog';
import { db, schema } from './db';
import type { ReviewStatus } from './db/schema';
import { notifyEvent } from './notify';
import { AD_FLAG, displayName, hasPurchased, looksLikeAd, voteInfo, type ReviewFlag } from './reviews';

const { questions: Q, questionAnswers: QA, faqs: F, users, products } = schema;

type Result = { ok: true } | { ok: false; error: string };
type Viewer = Pick<SessionUser, 'id' | 'phone'>;

const isStaffRole = (role: string) => role === 'staff' || role === 'admin';

// ---- Trang sản phẩm ---------------------------------------------------------------------------

/**
 * Hỏi đáp ở trang sản phẩm. Người xem thấy:
 * - câu hỏi đã có người trả lời (shop, hoặc khách khác — câu hỏi nghi quảng cáo thì phải chờ shop trả lời);
 * - câu hỏi của chính mình (đứng đầu, kể cả đang chờ / bị ẩn);
 * - nếu đã mua sản phẩm: cả câu hỏi chưa ai trả lời → mời chia sẻ kinh nghiệm.
 * Trả lời của khách: đã hiện + của chính người xem (mọi trạng thái, không báo đang chờ duyệt).
 */
export async function productQuestions(slug: string, viewer: Viewer | null): Promise<QuestionView[]> {
  const viewerId = viewer?.id ?? null;
  const [rows, bought] = await Promise.all([
    db.select({ q: Q, name: users.name }).from(Q)
      .innerJoin(users, eq(users.id, Q.userId))
      .where(and(eq(Q.productSlug, slug), viewerId ? or(eq(Q.status, 'visible'), eq(Q.userId, viewerId)) : eq(Q.status, 'visible')))
      .orderBy(desc(Q.createdAt))
      .limit(300),
    viewer ? hasPurchased(viewer, slug) : false,
  ]);
  const ids = rows.map((x) => x.q.id);
  const answerRows = ids.length
    ? await db.select({ a: QA, name: users.name, role: users.role }).from(QA)
      .innerJoin(users, eq(users.id, QA.userId))
      .where(and(inArray(QA.questionId, ids), viewerId ? or(eq(QA.status, 'published'), eq(QA.userId, viewerId)) : eq(QA.status, 'published')))
      .orderBy(asc(QA.createdAt))
    : [];
  const byQ = new Map<number, typeof answerRows>();
  for (const r of answerRows) byQ.set(r.a.questionId, [...(byQ.get(r.a.questionId) ?? []), r]);
  const ansVotes = await voteInfo('answer', answerRows.map((r) => r.a.id), viewerId);

  const items: QuestionView[] = [];
  for (const { q, name } of rows) {
    const mine = q.userId === viewerId;
    const hidden = q.status === 'hidden';
    const answers = (byQ.get(q.id) ?? []).filter((r) => !hidden || r.a.userId === viewerId);
    const othersAnswered = answers.some((r) => r.a.status === 'published');
    const clean = !looksLikeAd(q.content);
    const shown = mine || (!hidden && (q.answer || (clean && (othersAnswered || bought))));
    if (!shown) continue;
    items.push({
      id: q.id, name: displayName(name), content: q.content, createdAt: q.createdAt.getTime(),
      // Câu hỏi bị ẩn: người hỏi vẫn thấy câu hỏi của mình nhưng không thấy trả lời
      answer: hidden ? null : q.answer, answeredAt: hidden ? null : q.answeredAt?.getTime() ?? null,
      mine, helpful: 0, voted: false,
      // Câu trả lời nhiều người thấy hữu ích lên trước, cùng số lượt thì theo thứ tự thời gian
      answers: answers.map(({ a, name: n, role }): AnswerView => ({
        id: a.id, name: displayName(n), content: a.content, createdAt: a.createdAt.getTime(),
        verified: a.verified, staff: isStaffRole(role), mine: a.userId === viewerId,
        helpful: ansVotes.counts.get(a.id) ?? 0, voted: ansVotes.mine.has(a.id),
      })).sort((x, y) => y.helpful - x.helpful || x.createdAt - y.createdAt),
      open: !hidden,
      askBuyer: !mine && !q.answer && !answers.length,
    });
  }
  const votes = await voteInfo('question', items.map((i) => i.id), viewerId);
  for (const i of items) {
    i.helpful = votes.counts.get(i.id) ?? 0;
    i.voted = votes.mine.has(i.id);
  }
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

// ---- Khách trả lời nhau -------------------------------------------------------------------------

export const CustomerAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  content: z.string().trim()
    .min(QUESTION_MIN_CHARS, `Câu trả lời cần ít nhất ${QUESTION_MIN_CHARS} ký tự`)
    .max(QUESTION_MAX_CHARS, `Tối đa ${QUESTION_MAX_CHARS} ký tự`),
});

/**
 * Khách trả lời dưới câu hỏi mà mình đang thấy (xem productQuestions). Có SĐT / link → chờ nhân viên duyệt
 * (người viết vẫn thấy như đã đăng). Câu trả lời hiện ngay → báo chuông cho người hỏi.
 */
export async function answerAsCustomer(user: SessionUser, input: z.infer<typeof CustomerAnswerSchema>): Promise<Result & { slug?: string }> {
  const [q] = await db.select({ userId: Q.userId, slug: Q.productSlug, status: Q.status, answer: Q.answer, content: Q.content, productName: products.name })
    .from(Q).innerJoin(products, eq(products.slug, Q.productSlug)).where(eq(Q.id, input.questionId));
  if (!q || q.status !== 'visible') return { ok: false, error: 'Không tìm thấy câu hỏi' };

  const bought = await hasPurchased(user, q.slug);
  if (q.userId !== user.id && !q.answer) {
    // Câu hỏi chưa có shop trả lời: chỉ người đã mua, hoặc khi đã có khách khác trả lời công khai
    const [pub] = await db.select({ id: QA.id }).from(QA).where(and(eq(QA.questionId, input.questionId), eq(QA.status, 'published'))).limit(1);
    if (looksLikeAd(q.content) || (!pub && !bought)) return { ok: false, error: 'Không tìm thấy câu hỏi' };
  }
  const since = new Date(Date.now() - 86_400_000);
  const [{ n }] = await db.select({ n: count() }).from(QA).where(and(eq(QA.userId, user.id), gte(QA.createdAt, since)));
  if (n >= ANSWER_DAILY_LIMIT) return { ok: false, error: 'Bạn đã gửi nhiều câu trả lời hôm nay, vui lòng thử lại vào ngày mai.' };

  const status: ReviewStatus = looksLikeAd(input.content) ? 'pending' : 'published';
  await db.transaction(async (tx) => {
    await tx.insert(QA).values({ questionId: input.questionId, userId: user.id, content: input.content, status, verified: bought });
    if (status === 'published' && q.userId !== user.id) {
      await notifyEvent(tx, q.userId, 'question_peer_answer', {
        nguoi_tra_loi: isStaffRole(user.role) ? 'Nhân viên shop' : bought ? 'Một khách đã mua' : 'Một khách hàng', ten_san_pham: q.productName,
      }, `/san-pham/${q.slug}#cau-hoi`);
    }
  });
  return { ok: true, slug: q.slug };
}

export async function deleteAnswer(userId: number, id: number) {
  const [a] = await db.delete(QA).where(and(eq(QA.id, id), eq(QA.userId, userId))).returning({ questionId: QA.questionId });
  if (!a) return null;
  const [q] = await db.select({ slug: Q.productSlug }).from(Q).where(eq(Q.id, a.questionId));
  return q?.slug ?? null;
}

// ---- Admin ----------------------------------------------------------------------------------------

export const QUESTION_FILTERS = {
  'chua-tra-loi': 'Chưa trả lời', 'da-tra-loi': 'Đã trả lời', 'khach-tra-loi': 'Khách trả lời', 'da-an': 'Đã ẩn',
} as const;
export type QuestionFilter = keyof typeof QUESTION_FILTERS;

// Ghi rõ "bảng"."cột": truy vấn con một bảng của Drizzle bỏ tên bảng.
const HAS_ANSWERS = sql`exists (select 1 from "question_answers" a where a.question_id = "questions"."id")`;
const HAS_PENDING = sql`exists (select 1 from "question_answers" a where a.question_id = "questions"."id" and a.status = 'pending')`;
const LAST_ANSWER = sql`(select max(a.created_at) from "question_answers" a where a.question_id = "questions"."id")`;

const filterWhere = (f: QuestionFilter) =>
  f === 'da-an' ? eq(Q.status, 'hidden')
    : f === 'khach-tra-loi' ? HAS_ANSWERS
      : and(eq(Q.status, 'visible'), f === 'chua-tra-loi' ? isNull(Q.answer) : isNotNull(Q.answer));

const filterOrder = (f: QuestionFilter) =>
  // Chưa trả lời: câu cũ nhất lên đầu (trả lời theo thứ tự hỏi); Khách trả lời: có câu chờ duyệt lên đầu
  f === 'chua-tra-loi' ? [asc(Q.createdAt)] : f === 'khach-tra-loi' ? [desc(HAS_PENDING), sql`${LAST_ANSWER} desc`] : [desc(Q.createdAt)];

export type AdminAnswer = {
  id: number; customer: string; userId: number; content: string; status: ReviewStatus;
  verified: boolean; staff: boolean; createdAt: number; moderatedBy: string | null; flags: ReviewFlag[]; helpful: number;
};

/** Kho câu đã trả lời (để gợi ý + đếm câu hỏi lặp lại): câu hỏi đã trả lời + FAQ đang bật. */
async function knowledgeBase() {
  const [qs, fs] = await Promise.all([
    db.select({ id: Q.id, slug: Q.productSlug, content: Q.content, answer: Q.answer, status: Q.status })
      .from(Q).orderBy(desc(Q.createdAt)).limit(1000),
    db.select({ slug: F.productSlug, question: F.question, answer: F.answer }).from(F).where(eq(F.active, true)),
  ]);
  const all = qs.map((q) => ({ ...q, terms: termsOf(q.content) }));
  const answered = [
    ...all.filter((q) => q.answer && q.status === 'visible').map((q) => ({ id: q.id, slug: q.slug, question: q.content, answer: q.answer!, terms: q.terms })),
    ...fs.map((f) => ({ id: 0, slug: f.slug, question: f.question, answer: f.answer, terms: termsOf(f.question) })),
  ];
  return { all, answered };
}

export async function listQuestionsAdmin({ filter, q }: { filter: QuestionFilter; q?: string }) {
  const rows = await db.select({
    q: Q, customer: users.name, phone: sql<string | null>`coalesce(${users.phone}, ${users.contactPhone})`, email: users.email,
    productName: products.name, icon: products.icon, image: mainImageOf(products.slug),
    ship: products.ship, pesticide: products.pesticide, specs: products.specs,
  }).from(Q)
    .innerJoin(users, eq(users.id, Q.userId))
    .innerJoin(products, eq(products.slug, Q.productSlug))
    .where(filterWhere(filter))
    .orderBy(...filterOrder(filter))
    .limit(300);
  const needle = q ? normalize(q) : '';
  const found = needle
    ? rows.filter((x) => normalize(`${x.q.content} ${x.q.answer ?? ''} ${x.customer ?? ''} ${x.productName} ${x.phone ?? ''} ${x.email ?? ''}`).includes(needle))
    : rows;
  const ids = found.map((x) => x.q.id);
  const [votes, answerRows, faqRows, kb] = await Promise.all([
    voteInfo('question', ids, null),
    ids.length
      ? db.select({ a: QA, name: users.name, role: users.role }).from(QA).innerJoin(users, eq(users.id, QA.userId))
        .where(inArray(QA.questionId, ids)).orderBy(asc(QA.createdAt))
      : [],
    ids.length ? db.select({ id: F.id, questionId: F.questionId }).from(F).where(inArray(F.questionId, ids)) : [],
    knowledgeBase(),
  ]);
  const answers = new Map<number, AdminAnswer[]>();
  const ansVotes = await voteInfo('answer', answerRows.map((r) => r.a.id), null);
  for (const { a, name, role } of answerRows) {
    answers.set(a.questionId, [...(answers.get(a.questionId) ?? []), {
      id: a.id, customer: displayName(name), userId: a.userId, content: a.content, status: a.status, verified: a.verified,
      staff: isStaffRole(role), createdAt: a.createdAt.getTime(), moderatedBy: a.moderatedBy,
      flags: looksLikeAd(a.content) ? [AD_FLAG] : [],
      helpful: ansVotes.counts.get(a.id) ?? 0,
    }]);
  }
  const faqOf = new Map(faqRows.map((f) => [f.questionId!, f.id]));

  return found.map((x) => {
    const terms = termsOf(x.q.content);
    // Được hỏi lại: số câu hỏi khác (mọi sản phẩm) gần giống câu này → nên đưa lên FAQ
    const repeats = kb.all.filter((o) => o.id !== x.q.id && o.status === 'visible' && similarity(terms, o.terms) >= SIMILAR_MIN).length;
    let suggestion: Suggestion | null = null;
    if (!x.q.answer && x.q.status === 'visible') {
      const pool: AnsweredQA[] = kb.answered.filter((a) => a.id !== x.q.id).map((a) => ({ ...a, sameProduct: a.slug === x.q.productSlug }));
      suggestion = suggestQuestionReply(
        { content: x.q.content, customer: displayName(x.customer) },
        { name: x.productName, ship: x.ship, pesticide: x.pesticide, specs: x.specs },
        pool,
      );
    }
    return {
      ...x.q,
      customer: displayName(x.customer), productName: x.productName, icon: x.icon, image: x.image, ship: x.ship,
      flags: (looksLikeAd(x.q.content) ? [AD_FLAG] : []) as ReviewFlag[],
      helpful: votes.counts.get(x.q.id) ?? 0,
      answers: answers.get(x.q.id) ?? [],
      faqId: faqOf.get(x.q.id) ?? null,
      repeats,
      suggestion,
    };
  });
}

export async function countQuestions() {
  const [[r], [a]] = await Promise.all([
    db.select({
      unanswered: sql<number>`count(*) filter (where ${Q.status} = 'visible' and ${Q.answer} is null)`.mapWith(Number),
      answered: sql<number>`count(*) filter (where ${Q.status} = 'visible' and ${Q.answer} is not null)`.mapWith(Number),
      hidden: sql<number>`count(*) filter (where ${Q.status} = 'hidden')`.mapWith(Number),
    }).from(Q),
    db.select({ pendingAnswers: count() }).from(QA).where(eq(QA.status, 'pending')),
  ]);
  return { ...r, pendingAnswers: a.pendingAnswers };
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
      await notifyEvent(tx, q.userId, 'question_answered', { ten_san_pham: p?.name ?? 'sản phẩm' }, `/san-pham/${q.slug}#cau-hoi`);
    }
    return { ok: true as const, slug: q.slug };
  });
}

export const ModerateAnswerSchema = z.object({ id: z.number().int().positive(), action: z.enum(['publish', 'hide']) });

/** Duyệt / ẩn câu trả lời của khách. Duyệt câu đang chờ → lúc này mới báo cho người hỏi. */
export async function moderateAnswer(input: z.infer<typeof ModerateAnswerSchema>, actor: string): Promise<Result & { slug?: string }> {
  return db.transaction(async (tx) => {
    const [a] = await tx.select({ status: QA.status, userId: QA.userId, questionId: QA.questionId, verified: QA.verified })
      .from(QA).where(eq(QA.id, input.id)).for('update');
    if (!a) return { ok: false as const, error: 'Không tìm thấy câu trả lời' };
    const [q] = await tx.select({ slug: Q.productSlug, userId: Q.userId, status: Q.status, productName: products.name })
      .from(Q).innerJoin(products, eq(products.slug, Q.productSlug)).where(eq(Q.id, a.questionId));
    const status: ReviewStatus = input.action === 'publish' ? 'published' : 'hidden';
    if (status !== a.status) await tx.update(QA).set({ status, moderatedBy: actor, moderatedAt: new Date() }).where(eq(QA.id, input.id));
    if (a.status === 'pending' && status === 'published' && q && q.status === 'visible' && q.userId !== a.userId) {
      await notifyEvent(tx, q.userId, 'question_peer_answer', {
        nguoi_tra_loi: a.verified ? 'Một khách đã mua' : 'Một khách hàng', ten_san_pham: q.productName,
      }, `/san-pham/${q.slug}#cau-hoi`);
    }
    return { ok: true as const, slug: q?.slug };
  });
}
