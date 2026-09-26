import 'server-only';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { after } from 'next/server';
import { db, schema, type DB } from './db';
import type { NOTIFICATION_KINDS } from './db/schema';
import type { Tx } from './inventory';

const { notifications: N, outboundMessages: OUT, users } = schema;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type Notice = {
  kind: NotificationKind;
  /** Nội dung ngắn, **phần in đậm** đặt giữa hai dấu sao. */
  text: string;
  href?: string;
  /** Gửi thêm qua Zalo ZNS / email (tốn phí ZNS) — chỉ bật cho tin quan trọng. */
  external?: boolean;
};

/**
 * Tạo thông báo trong tài khoản khách (ghi cùng transaction nếu truyền tx).
 * Tin gửi ra ngoài chạy sau khi phản hồi xong (next/server `after`), không làm chậm thao tác của nhân viên.
 */
export function notify(tx: Tx | DB, userId: number, n: Notice) {
  tx.insert(N).values({ userId, kind: n.kind, text: n.text, href: n.href ?? null }).run();
  if (!n.external) return;
  const run = () => sendExternal(userId, n).catch((e) => console.error('[notify]', e));
  try { after(run); } catch { void run(); }
}

const plain = (t: string) => t.replace(/\*\*/g, '');
const siteUrl = () => process.env.SITE_URL ?? 'http://localhost:3000';

async function sendExternal(userId: number, n: Notice) {
  const u = db.select({ phone: users.phone, email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).get();
  if (!u) return;
  const subject = 'Cây Cảnh Miền Tây';
  const body = plain(n.text);
  const link = n.href ? `${siteUrl()}${n.href}` : siteUrl();
  const log = (channel: 'zalo' | 'email', to: string, status: 'sent' | 'failed' | 'skipped', error?: string) =>
    db.insert(OUT).values({ userId, channel, to, subject, body, status, error: error ?? null }).run();

  // Zalo ZNS: cần template đã duyệt có 3 tham số customer_name, content, link.
  const token = process.env.ZALO_ZNS_ACCESS_TOKEN;
  const template = process.env.ZALO_ZNS_TEMPLATE_ID;
  if (!token || !template) log('zalo', u.phone, 'skipped', 'Chưa cấu hình ZALO_ZNS_ACCESS_TOKEN / ZALO_ZNS_TEMPLATE_ID');
  else {
    try {
      const res = await fetch('https://business.openapi.zalo.me/message/template', {
        method: 'POST',
        headers: { 'content-type': 'application/json', access_token: token },
        body: JSON.stringify({
          phone: u.phone.replace(/^0/, '84'), template_id: template, tracking_id: `n${Date.now()}`,
          template_data: { customer_name: u.name ?? 'Quý khách', content: body.slice(0, 200), link },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: number; message?: string };
      if (res.ok && !j.error) log('zalo', u.phone, 'sent');
      else log('zalo', u.phone, 'failed', `${res.status} ${j.error ?? ''} ${j.message ?? ''}`.trim());
    } catch (e) {
      log('zalo', u.phone, 'failed', String(e).slice(0, 200));
    }
  }

  // Email qua Resend (https://resend.com) — chỉ khi khách đã khai báo email trong hồ sơ.
  if (!u.email) return;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) { log('email', u.email, 'skipped', 'Chưa cấu hình RESEND_API_KEY / EMAIL_FROM'); return; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: u.email, subject: `${subject}: ${body.slice(0, 60)}`, text: `Chào ${u.name ?? 'bạn'},\n\n${body}\n\nXem chi tiết: ${link}\n\nCây Cảnh Miền Tây` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) log('email', u.email, 'sent');
    else log('email', u.email, 'failed', `${res.status} ${(await res.text().catch(() => '')).slice(0, 180)}`);
  } catch (e) {
    log('email', u.email, 'failed', String(e).slice(0, 200));
  }
}

/** Chủ đơn: tài khoản đặt đơn, hoặc tài khoản có đúng SĐT đặt hàng (đặt vãng lai). */
export function orderOwner(tx: Tx | DB, o: { userId: number | null; phone: string }) {
  return o.userId ?? tx.select({ id: users.id }).from(users).where(eq(users.phone, o.phone)).get()?.id ?? null;
}

// ---- Đọc (NotificationCenter) ----------------------------------------------------------------

export const listNotifications = (userId: number, limit = 30) =>
  db.select().from(N).where(eq(N.userId, userId)).orderBy(desc(N.id)).limit(limit).all();

export const unreadCount = (userId: number) =>
  db.select({ n: sql<number>`count(*)` }).from(N).where(and(eq(N.userId, userId), isNull(N.readAt))).get()?.n ?? 0;

export function markRead(userId: number, id?: number) {
  db.update(N).set({ readAt: new Date() })
    .where(and(eq(N.userId, userId), isNull(N.readAt), id ? eq(N.id, id) : undefined)).run();
}

export const recentOutbound = (limit = 50) => db.select().from(OUT).orderBy(desc(OUT.id)).limit(limit).all();
