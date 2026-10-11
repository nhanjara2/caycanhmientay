'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireAccess, staffName } from '@/server/auth';
import {
  deleteExpense, deleteExpenseCategory, deleteRecurring, ExpenseCategorySchema, ExpenseSchema, RecurringSchema,
  removeExpensePhoto, saveExpense, saveExpenseCategory, saveRecurring, setExpensePhoto,
} from '@/server/expenses';
import { saveImage } from '@/server/uploads';

// Chi phí cửa hàng: chỉ Quản lý (khu "Chi phí & lãi lỗ"). Kiểm tra quyền trước, rồi mới kiểm tra đầu vào.

const FAIL = { ok: false as const, error: 'Dữ liệu chưa hợp lệ' };
const msg = (p: { error: z.ZodError }) => p.error.issues[0]?.message || FAIL.error;

function refresh() {
  revalidatePath('/admin/chi-phi');
  revalidatePath('/admin/thu-chi');
  revalidatePath('/admin/bao-cao');
}

export async function saveExpenseAction(input: unknown) {
  const staff = await requireAccess('expenses', 'full');
  const p = ExpenseSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: msg(p) };
  const r = await saveExpense(p.data, staffName(staff));
  if (r.ok) refresh();
  return r;
}

export async function deleteExpenseAction(id: unknown) {
  await requireAccess('expenses', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return FAIL;
  const r = await deleteExpense(p.data);
  if (r.ok) refresh();
  return r;
}

/** Tải ảnh hóa đơn cho một khoản chi (đã nén ở trình duyệt). FormData: expenseId, photo. */
export async function uploadExpensePhotoAction(fd: FormData) {
  await requireAccess('expenses', 'full');
  const id = z.coerce.number().int().positive().safeParse(fd.get('expenseId'));
  const f = fd.get('photo');
  if (!id.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  const r = await setExpensePhoto(id.data, img);
  if (r.ok) refresh();
  return r;
}

export async function removeExpensePhotoAction(expenseId: unknown) {
  await requireAccess('expenses', 'full');
  const p = z.number().int().positive().safeParse(expenseId);
  if (!p.success) return FAIL;
  await removeExpensePhoto(p.data);
  refresh();
  return { ok: true as const };
}

export async function saveExpenseCategoryAction(input: unknown) {
  await requireAccess('expenses', 'full');
  const p = ExpenseCategorySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: msg(p) };
  const r = await saveExpenseCategory(p.data);
  if (r.ok) refresh();
  return r;
}

export async function deleteExpenseCategoryAction(slug: unknown) {
  await requireAccess('expenses', 'full');
  const p = z.string().min(1).max(60).safeParse(slug);
  if (!p.success) return FAIL;
  const r = await deleteExpenseCategory(p.data);
  if (r.ok) refresh();
  return r;
}

export async function saveRecurringAction(input: unknown) {
  await requireAccess('expenses', 'full');
  const p = RecurringSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: msg(p) };
  const r = await saveRecurring(p.data);
  if (r.ok) refresh();
  return r;
}

export async function deleteRecurringAction(id: unknown) {
  await requireAccess('expenses', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return FAIL;
  const r = await deleteRecurring(p.data);
  if (r.ok) refresh();
  return r;
}
