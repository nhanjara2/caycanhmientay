import { timingSafeEqual } from 'node:crypto';
import { monitorHealth } from '@/server/monitor';

/**
 * Tóm tắt giám sát SEO cho scripts/check-monitor.mts (GitHub Actions "Giám sát web", mỗi 6 giờ).
 * Cần biến môi trường SEO_MONITOR_TOKEN (Vercel) = secret cùng tên trên GitHub; gửi `Authorization: Bearer <token>`. Chưa đặt → 404.
 */
export async function GET(req: Request) {
  const token = process.env.SEO_MONITOR_TOKEN;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token || given.length !== token.length || !timingSafeEqual(Buffer.from(given), Buffer.from(token))) return new Response(null, { status: 404 });
  const hours = Math.min(72, Math.max(1, Number(new URL(req.url).searchParams.get('gio')) || 6));
  return Response.json(await monitorHealth(hours), { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}
