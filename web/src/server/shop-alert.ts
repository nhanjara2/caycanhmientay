import 'server-only';
import { eq } from 'drizzle-orm';
import { after } from 'next/server';
import { db, schema } from './db';
import { money } from '@/lib/format';
import { SITE_ORIGIN } from '@/lib/site';

const { orders: O, orderItems: OI, outboundMessages: OUT } = schema;

/**
 * Báo cho shop (không phải khách) khi có việc mới: đơn hàng, yêu cầu báo giá sỉ, đăng ký đối tác — để gọi khách kịp
 * trong 30 phút như trang đặt hàng hứa. Gửi sau khi đã trả lời khách (`after`), lỗi thì chỉ ghi nhật ký.
 *
 * Kênh (đặt biến môi trường trên Vercel, đặt kênh nào gửi kênh đó):
 * - Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (nhiều người: cách nhau bằng dấu phẩy).
 * - Email qua Resend: RESEND_API_KEY + SHOP_ALERT_EMAIL (nhiều email cách nhau bằng dấu phẩy; trống thì dùng ADMIN_EMAILS).
 *   Chưa xác minh tên miền trên Resend thì để trống EMAIL_FROM — gửi bằng onboarding@resend.dev, chỉ tới đúng email
 *   đã đăng ký tài khoản Resend.
 * Nhật ký ở /admin/mau-tin-nhan (tab Nhật ký gửi), dòng không có khách.
 */
export function alertShop(subject: string, lines: string[], href: string) {
  const run = () => sendAlert(subject, lines, href).catch((e) => console.error('[shop-alert]', e));
  try { after(run); } catch { void run(); }
}

const list = (name: string) => (process.env[name] ?? '').split(',').map((s) => s.trim()).filter(Boolean);

async function sendAlert(subject: string, lines: string[], href: string) {
  const link = `${SITE_ORIGIN}${href}`;
  const body = [...lines, '', link].join('\n');
  const log = (channel: 'telegram' | 'email', to: string, status: 'sent' | 'failed' | 'skipped', error?: string) =>
    db.insert(OUT).values({ userId: null, channel, to, subject, body, status, error: error ?? null });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = list('TELEGRAM_CHAT_ID');
  const key = process.env.RESEND_API_KEY;
  const emails = list('SHOP_ALERT_EMAIL').length ? list('SHOP_ALERT_EMAIL') : list('ADMIN_EMAILS');
  if (!(token && chats.length) && !key) {
    await log('telegram', 'shop', 'skipped', 'Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID hoặc RESEND_API_KEY');
    return;
  }

  if (token) for (const chat of chats) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: `${subject}\n\n${body}`, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) await log('telegram', chat, 'sent');
      else await log('telegram', chat, 'failed', `${res.status} ${(await res.text().catch(() => '')).slice(0, 180)}`);
    } catch (e) {
      await log('telegram', chat, 'failed', String(e).slice(0, 200));
    }
  }

  if (key && emails.length) {
    const from = process.env.EMAIL_FROM || 'Cây Cảnh Miền Tây <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ from, to: emails, subject, text: body }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) await log('email', emails.join(', '), 'sent');
      else await log('email', emails.join(', '), 'failed', `${res.status} ${(await res.text().catch(() => '')).slice(0, 180)}`);
    } catch (e) {
      await log('email', emails.join(', '), 'failed', String(e).slice(0, 200));
    }
  }
}

/** Đơn mới đặt trên web: tên, SĐT, nhận hàng, các món, tổng tiền. */
export async function alertNewOrder(code: string) {
  const [o] = await db.select().from(O).where(eq(O.code, code));
  if (!o) return;
  const items = await db.select({ name: OI.name, option: OI.label, qty: OI.qty }).from(OI).where(eq(OI.orderId, o.id));
  const shown = items.slice(0, 8).map((i) => `• ${i.name}${i.option ? ` (${i.option})` : ''} × ${i.qty}`);
  if (items.length > 8) shown.push(`• … và ${items.length - 8} món khác`);
  alertShop(`🌱 Đơn mới ${o.code} — ${money(o.total)}`, [
    `Khách: ${o.customerName} · ${o.phone}`,
    o.delivery === 'pickup' ? 'Nhận tại vườn' : `Giao tới: ${o.address ?? ''}`,
    ...shown,
    ...(o.note ? [`Ghi chú: ${o.note}`] : []),
  ], `/admin/don-hang/${o.code}`);
}
