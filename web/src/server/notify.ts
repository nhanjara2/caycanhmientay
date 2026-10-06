import 'server-only';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { after } from 'next/server';
import { db, schema, type DB } from './db';
import type { NOTIFICATION_KINDS } from './db/schema';
import type { Tx } from './inventory';
import { renderText } from '@/lib/message-templates';
import { renderEvent } from './messages';

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
export async function notify(tx: Tx | DB, userId: number, n: Notice) {
  await tx.insert(N).values({ userId, kind: n.kind, text: n.text, href: n.href ?? null });
  if (!n.external) return;
  const run = () => sendExternal(userId, n).catch((e) => console.error('[notify]', e));
  try { after(run); } catch { void run(); }
}

/**
 * Thông báo theo sự kiện (mẫu tin nhắn ở admin /admin/mau-tin-nhan): nội dung = mẫu đã chỉnh hoặc mặc định + biến;
 * mẫu quyết định có hiện trong chuông (inApp) và có gửi thêm Zalo / email (external).
 */
export async function notifyEvent(tx: Tx | DB, userId: number, event: string, vars: Record<string, string | number | undefined>, href?: string) {
  const r = await renderEvent(event, vars);
  if (!r) return;
  if (r.text.includes('{ten_khach}') && vars.ten_khach === undefined) {
    const [u] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId));
    r.rendered = renderText(r.text, { ...vars, ten_khach: u?.name ?? 'bạn' });
  }
  if (r.inApp) await tx.insert(N).values({ userId, kind: r.def.kind, text: r.rendered, href: href ?? null });
  if (!r.external) return;
  const run = () => sendExternal(userId, { kind: r.def.kind, text: r.rendered, href, external: true }).catch((e) => console.error('[notify]', e));
  try { after(run); } catch { void run(); }
}

const plain = (t: string) => t.replace(/\*\*/g, '');
const siteUrl = () => process.env.SITE_URL ?? 'http://localhost:3000';

async function sendExternal(userId: number, n: Notice) {
  // Zalo gửi tới SĐT đã xác thực, không có thì SĐT khách tự khai (tài khoản Google).
  const [u] = await db.select({ phone: sql<string | null>`coalesce(${users.phone}, ${users.contactPhone})`, email: users.email, name: users.name })
    .from(users).where(eq(users.id, userId));
  if (!u) return;
  const subject = 'Cây Cảnh Miền Tây';
  const body = plain(n.text);
  const link = n.href ? `${siteUrl()}${n.href}` : siteUrl();
  const log = (channel: 'zalo' | 'email', to: string, status: 'sent' | 'failed' | 'skipped', error?: string) =>
    db.insert(OUT).values({ userId, channel, to, subject, body, status, error: error ?? null });

  // Zalo ZNS: cần template đã duyệt có 3 tham số customer_name, content, link.
  const token = process.env.ZALO_ZNS_ACCESS_TOKEN;
  const template = process.env.ZALO_ZNS_TEMPLATE_ID;
  if (!u.phone) {
    // Tài khoản Google chưa khai SĐT: không gửi được Zalo.
  } else if (!token || !template) await log('zalo', u.phone, 'skipped', 'Chưa cấu hình ZALO_ZNS_ACCESS_TOKEN / ZALO_ZNS_TEMPLATE_ID');
  else {
    const phone = u.phone;
    try {
      const res = await fetch('https://business.openapi.zalo.me/message/template', {
        method: 'POST',
        headers: { 'content-type': 'application/json', access_token: token },
        body: JSON.stringify({
          phone: phone.replace(/^0/, '84'), template_id: template, tracking_id: `n${Date.now()}`,
          template_data: { customer_name: u.name ?? 'Quý khách', content: body.slice(0, 200), link },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: number; message?: string };
      if (res.ok && !j.error) await log('zalo', phone, 'sent');
      else await log('zalo', phone, 'failed', `${res.status} ${j.error ?? ''} ${j.message ?? ''}`.trim());
    } catch (e) {
      await log('zalo', phone, 'failed', String(e).slice(0, 200));
    }
  }

  // Email qua Resend (https://resend.com) — chỉ khi khách đã khai báo email trong hồ sơ.
  if (!u.email) return;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) { await log('email', u.email, 'skipped', 'Chưa cấu hình RESEND_API_KEY / EMAIL_FROM'); return; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: u.email, subject: `${subject}: ${body.slice(0, 60)}`, text: `Chào ${u.name ?? 'bạn'},\n\n${body}\n\nXem chi tiết: ${link}\n\nCây Cảnh Miền Tây` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) await log('email', u.email, 'sent');
    else await log('email', u.email, 'failed', `${res.status} ${(await res.text().catch(() => '')).slice(0, 180)}`);
  } catch (e) {
    await log('email', u.email, 'failed', String(e).slice(0, 200));
  }
}

/** Chủ đơn: tài khoản đặt đơn, hoặc tài khoản có đúng SĐT đặt hàng (đặt vãng lai). */
export async function orderOwner(tx: Tx | DB, o: { userId: number | null; phone: string }) {
  return o.userId ?? (await tx.select({ id: users.id }).from(users).where(eq(users.phone, o.phone)))[0]?.id ?? null;
}

// ---- Đọc (NotificationCenter) ----------------------------------------------------------------

export const listNotifications = (userId: number, limit = 30) =>
  db.select().from(N).where(eq(N.userId, userId)).orderBy(desc(N.id)).limit(limit);

export const unreadCount = async (userId: number) =>
  (await db.select({ n: count() }).from(N).where(and(eq(N.userId, userId), isNull(N.readAt))))[0]?.n ?? 0;

export async function markRead(userId: number, id?: number) {
  await db.update(N).set({ readAt: new Date() })
    .where(and(eq(N.userId, userId), isNull(N.readAt), id ? eq(N.id, id) : undefined));
}

export const recentOutbound = (limit = 50) => db.select().from(OUT).orderBy(desc(OUT.id)).limit(limit);
