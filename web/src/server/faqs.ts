import 'server-only';
import { and, asc, eq, isNull, max, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { normalize } from '@/lib/catalog';
import { FAQ_ANSWER_MAX_CHARS, FAQ_LIMIT, FAQ_QUESTION_MAX_CHARS, FAQ_SCOPES, type FaqScope } from '@/lib/reviews';
import { mainImageOf } from './catalog';
import { db, schema } from './db';
import type { Tx } from './inventory';

const { faqs: F, questions: Q, users, products } = schema;

type Result = { ok: true; id: number; slug: string | null } | { ok: false; error: string };

/** Nhóm của câu FAQ: cùng sản phẩm, hoặc cùng loại câu chung (thứ tự sắp xếp tính trong nhóm). */
const groupWhere = (productSlug: string | null, ship: 'plant' | 'supply' | null) =>
  productSlug ? eq(F.productSlug, productSlug) : and(isNull(F.productSlug), ship ? eq(F.ship, ship) : isNull(F.ship));

export const scopeOf = (f: { productSlug: string | null; ship: 'plant' | 'supply' | null }): FaqScope =>
  f.productSlug ? 'product' : f.ship ?? 'all';

/** Câu hỏi thường gặp ở trang sản phẩm: câu riêng của sản phẩm trước, rồi câu chung theo nhóm, tối đa FAQ_LIMIT câu. */
export async function productFaqs(p: { slug: string; ship: 'plant' | 'supply' }) {
  return db.select({ id: F.id, question: F.question, answer: F.answer }).from(F)
    .where(and(eq(F.active, true), or(eq(F.productSlug, p.slug), and(isNull(F.productSlug), or(isNull(F.ship), eq(F.ship, p.ship))))))
    .orderBy(sql`${F.productSlug} is null`, sql`${F.ship} is null`, asc(F.sort), asc(F.id))
    .limit(FAQ_LIMIT);
}

// ---- Admin ----------------------------------------------------------------------------------------

export const FAQ_FILTERS = { 'tat-ca': 'Tất cả', chung: 'Câu chung', 'san-pham': 'Theo sản phẩm' } as const;
export type FaqFilter = keyof typeof FAQ_FILTERS;

export async function listFaqsAdmin({ filter, q }: { filter: FaqFilter; q?: string }) {
  const rows = await db.select({
    f: F, productName: products.name, icon: products.icon, image: mainImageOf(products.slug),
    fromCustomer: users.name,
    // Câu chung đưa lên từ câu hỏi của khách: sản phẩm gốc (để đổi lại thành câu riêng)
    sourceProduct: sql<string | null>`(select p.name from "products" p where p.slug = "questions"."product_slug")`,
  }).from(F)
    .leftJoin(products, eq(products.slug, F.productSlug))
    .leftJoin(Q, eq(Q.id, F.questionId))
    .leftJoin(users, eq(users.id, Q.userId))
    .where(filter === 'chung' ? isNull(F.productSlug) : filter === 'san-pham' ? sql`${F.productSlug} is not null` : undefined)
    // Câu chung trước (Mọi sản phẩm → Cây sống → Vật tư), rồi theo tên sản phẩm; trong nhóm theo thứ tự hiển thị
    .orderBy(sql`${F.productSlug} is not null`, sql`coalesce(${F.ship}, '')`, products.name, asc(F.sort), asc(F.id))
    .limit(500);
  const needle = q ? normalize(q) : '';
  const found = needle ? rows.filter((x) => normalize(`${x.f.question} ${x.f.answer} ${x.productName ?? ''}`).includes(needle)) : rows;
  return found.map((x) => ({
    ...x.f, scope: scopeOf(x.f), productName: x.productName ?? x.sourceProduct, icon: x.icon ?? 'chat', image: x.image,
    fromCustomer: x.f.questionId ? (x.fromCustomer?.trim() || 'Khách hàng') : null,
  }));
}

export const FaqSchema = z.object({
  id: z.number().int().positive().optional(),
  /** Đưa câu hỏi của khách lên FAQ (chỉ khi tạo mới). */
  questionId: z.number().int().positive().optional(),
  scope: z.enum(Object.keys(FAQ_SCOPES) as [FaqScope, ...FaqScope[]]),
  question: z.string().trim().min(5, 'Nhập câu hỏi').max(FAQ_QUESTION_MAX_CHARS, `Câu hỏi tối đa ${FAQ_QUESTION_MAX_CHARS} ký tự`),
  answer: z.string().trim().min(5, 'Nhập câu trả lời').max(FAQ_ANSWER_MAX_CHARS, `Câu trả lời tối đa ${FAQ_ANSWER_MAX_CHARS} ký tự`),
  active: z.boolean(),
});

/** Tạo / sửa câu FAQ. Phạm vi "Chỉ sản phẩm này" cần sản phẩm: lấy từ câu hỏi gốc (tạo mới) hoặc giữ sản phẩm cũ (sửa). */
export async function saveFaq(input: z.infer<typeof FaqSchema>, actor: string): Promise<Result> {
  return db.transaction(async (tx) => {
    let productSlug: string | null = null;
    let questionId: number | null = null;
    if (input.id) {
      const [old] = await tx.select({ productSlug: F.productSlug, questionId: F.questionId }).from(F).where(eq(F.id, input.id)).for('update');
      if (!old) return { ok: false as const, error: 'Không tìm thấy câu hỏi thường gặp' };
      productSlug = old.productSlug;
      questionId = old.questionId;
      if (!productSlug && questionId) {
        const [q] = await tx.select({ slug: Q.productSlug }).from(Q).where(eq(Q.id, questionId));
        productSlug = q?.slug ?? null;
      }
    } else if (input.questionId) {
      const [q] = await tx.select({ slug: Q.productSlug, answer: Q.answer }).from(Q).where(eq(Q.id, input.questionId));
      if (!q) return { ok: false as const, error: 'Không tìm thấy câu hỏi' };
      if (!q.answer) return { ok: false as const, error: 'Trả lời câu hỏi trước khi đưa lên FAQ' };
      const [dup] = await tx.select({ id: F.id }).from(F).where(eq(F.questionId, input.questionId));
      if (dup) return { ok: false as const, error: 'Câu hỏi này đã có trong mục Câu hỏi thường gặp' };
      productSlug = q.slug;
      questionId = input.questionId;
    }
    if (input.scope === 'product' && !productSlug) return { ok: false as const, error: 'Câu hỏi chung không đổi được thành câu riêng của một sản phẩm' };

    const place = input.scope === 'product'
      ? { productSlug, ship: null }
      : { productSlug: null, ship: input.scope === 'all' ? null : input.scope };
    const values = { ...place, question: input.question, answer: input.answer, active: input.active, updatedAt: new Date() };

    if (input.id) {
      const [cur] = await tx.select({ productSlug: F.productSlug, ship: F.ship }).from(F).where(eq(F.id, input.id));
      const moved = cur.productSlug !== place.productSlug || cur.ship !== place.ship;
      // Đổi nhóm → xếp cuối nhóm mới
      const sort = moved ? await nextSort(tx, place.productSlug, place.ship) : undefined;
      await tx.update(F).set({ ...values, ...(sort === undefined ? {} : { sort }) }).where(eq(F.id, input.id));
      return { ok: true as const, id: input.id, slug: place.productSlug };
    }
    const sort = await nextSort(tx, place.productSlug, place.ship);
    const [{ id }] = await tx.insert(F).values({ ...values, sort, questionId, createdBy: actor }).returning({ id: F.id });
    return { ok: true as const, id, slug: place.productSlug };
  });
}

async function nextSort(tx: Tx, productSlug: string | null, ship: 'plant' | 'supply' | null) {
  const [{ top }] = await tx.select({ top: max(F.sort) }).from(F).where(groupWhere(productSlug, ship));
  return (top ?? 0) + 10;
}

/** Đổi thứ tự trong nhóm (lên / xuống 1 bậc). */
export async function moveFaq(id: number, dir: -1 | 1) {
  return db.transaction(async (tx) => {
    const [f] = await tx.select({ productSlug: F.productSlug, ship: F.ship }).from(F).where(eq(F.id, id));
    if (!f) return null;
    const group = await tx.select({ id: F.id }).from(F).where(groupWhere(f.productSlug, f.ship)).orderBy(asc(F.sort), asc(F.id)).for('update');
    const i = group.findIndex((g) => g.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= group.length) return { slug: f.productSlug };
    [group[i], group[j]] = [group[j], group[i]];
    for (const [k, g] of group.entries()) await tx.update(F).set({ sort: (k + 1) * 10 }).where(eq(F.id, g.id));
    return { slug: f.productSlug };
  });
}

export async function setFaqActive(id: number, active: boolean) {
  const [r] = await db.update(F).set({ active, updatedAt: new Date() }).where(eq(F.id, id)).returning({ slug: F.productSlug });
  return r ? { slug: r.slug } : null;
}

export async function deleteFaq(id: number) {
  const [r] = await db.delete(F).where(eq(F.id, id)).returning({ slug: F.productSlug });
  return r ? { slug: r.slug } : null;
}

export async function countFaqs() {
  const [r] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(F);
  return r.n;
}
