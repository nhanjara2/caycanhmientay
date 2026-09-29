'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { MAX_REVIEW_PHOTOS } from '@/lib/reviews';
import { getCurrentUser, requireStaff, staffName } from '@/server/auth';
import {
  AnswerSchema, answerAsCustomer, answerQuestion, askQuestion, AskSchema, CustomerAnswerSchema, deleteAnswer, deleteQuestion,
  ModerateAnswerSchema, moderateAnswer,
} from '@/server/questions';
import { deleteReview, ModerateSchema, moderateReview, ReviewInputSchema, saveReview, toggleVote } from '@/server/reviews';

/** FormData: slug, stars, content, keep (tên ảnh cũ giữ lại, lặp), photos (ảnh mới đã nén, lặp). */
export async function saveReviewAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập để đánh giá' };
  const p = ReviewInputSchema.safeParse({
    slug: fd.get('slug'), stars: fd.get('stars'), content: fd.get('content'), keep: fd.getAll('keep'),
  });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const files = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_REVIEW_PHOTOS) return { ok: false as const, error: `Tối đa ${MAX_REVIEW_PHOTOS} ảnh` };
  const r = await saveReview(user, p.data, files);
  if (r.ok) {
    revalidatePath(`/san-pham/${p.data.slug}`);
    revalidatePath('/admin', 'layout');
  }
  return r;
}

export async function deleteReviewAction(slug: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.string().min(1).max(120).safeParse(slug);
  if (!p.success) return { ok: false as const, error: 'Sản phẩm không hợp lệ' };
  const ok = await deleteReview(user.id, p.data);
  if (ok) {
    revalidatePath(`/san-pham/${p.data}`);
    revalidatePath('/admin', 'layout');
  }
  return ok ? { ok: true as const } : { ok: false as const, error: 'Không tìm thấy đánh giá' };
}

/** Bấm / bỏ "Hữu ích" cho đánh giá hoặc câu hỏi. */
export async function toggleHelpfulAction(kind: unknown, id: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.object({ kind: z.enum(['review', 'question']), id: z.number().int().positive() }).safeParse({ kind, id });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  return toggleVote(p.data.kind, p.data.id, user.id);
}

export async function askQuestionAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập để đặt câu hỏi' };
  const p = AskSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await askQuestion(user, p.data);
  if (r.ok) {
    revalidatePath(`/san-pham/${p.data.slug}`);
    revalidatePath('/admin', 'layout');
  }
  return r;
}

export async function deleteQuestionAction(id: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const, error: 'Câu hỏi không hợp lệ' };
  const slug = await deleteQuestion(user.id, p.data);
  if (!slug) return { ok: false as const, error: 'Không tìm thấy câu hỏi' };
  revalidatePath(`/san-pham/${slug}`);
  revalidatePath('/admin', 'layout');
  return { ok: true as const };
}

/** Khách trả lời dưới câu hỏi của khách khác (hoặc bổ sung dưới câu hỏi của mình). */
export async function answerAsCustomerAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập để trả lời' };
  const p = CustomerAnswerSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await answerAsCustomer(user, p.data);
  if (r.ok) {
    if (r.slug) revalidatePath(`/san-pham/${r.slug}`);
    revalidatePath('/admin', 'layout');
  }
  return r.ok ? { ok: true as const } : r;
}

export async function deleteAnswerAction(id: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const, error: 'Câu trả lời không hợp lệ' };
  const slug = await deleteAnswer(user.id, p.data);
  if (!slug) return { ok: false as const, error: 'Không tìm thấy câu trả lời' };
  revalidatePath(`/san-pham/${slug}`);
  revalidatePath('/admin', 'layout');
  return { ok: true as const };
}

/** Nhân viên và admin đều được duyệt / ẩn câu trả lời của khách. */
export async function moderateAnswerAction(input: unknown) {
  const staff = await requireStaff();
  const p = ModerateAnswerSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await moderateAnswer(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    if (r.slug) revalidatePath(`/san-pham/${r.slug}`);
  }
  return r;
}

/** Nhân viên và admin đều được trả lời / ẩn câu hỏi. */
export async function answerQuestionAction(input: unknown) {
  const staff = await requireStaff();
  const p = AnswerSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await answerQuestion(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    if (r.slug) revalidatePath(`/san-pham/${r.slug}`);
  }
  return r;
}

/** Nhân viên và admin đều được duyệt / ẩn / trả lời (việc chăm sóc khách hằng ngày). */
export async function moderateReviewAction(input: unknown) {
  const staff = await requireStaff();
  const p = ModerateSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await moderateReview(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    if (r.slug) revalidatePath(`/san-pham/${r.slug}`);
  }
  return r;
}
