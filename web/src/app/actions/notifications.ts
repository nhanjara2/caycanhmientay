'use server';

import * as z from 'zod';
import { getCurrentUser } from '@/server/auth';
import { listNotifications, markRead, unreadCount } from '@/server/notify';

/** Thông báo của người đang đăng nhập (NotificationCenter). */
export async function notificationsAction() {
  const user = await getCurrentUser();
  if (!user) return { unread: 0, items: [] };
  return {
    unread: unreadCount(user.id),
    items: listNotifications(user.id).map((n) => ({ id: n.id, kind: n.kind, text: n.text, href: n.href, read: Boolean(n.readAt), at: n.createdAt.getTime() })),
  };
}

/** Đánh dấu đã đọc một thông báo (id) hoặc tất cả. */
export async function markNotificationsReadAction(id?: unknown) {
  const user = await getCurrentUser();
  const p = z.number().int().positive().optional().safeParse(id);
  if (!user || !p.success) return { ok: false as const };
  markRead(user.id, p.data);
  return { ok: true as const };
}
