import { botOf } from '@/lib/monitor';
import { SITE_ORIGIN } from '@/lib/site';
import { record404 } from '@/server/monitor-store';

/**
 * Trang 404 vừa hiện ở trình duyệt (components/NotFoundBeacon.tsx) → ghi đường dẫn hỏng + trang dẫn tới. Công khai nên
 * chỉ nhận yêu cầu cùng web; bảng có trần số dòng (server/monitor-store.ts). Máy tìm kiếm chỉ được đếm khi nó chạy JS
 * (Googlebot có chạy).
 */
export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return new Response(null, { status: 204 });
  const body = await req.json().catch(() => null) as { path?: unknown; referrer?: unknown } | null;
  const path = body?.path;
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 500) return new Response(null, { status: 400 });
  const ref = typeof body?.referrer === 'string' ? body.referrer.slice(0, 300) : '';
  const host = (() => { try { return new URL(ref).host; } catch { return ''; } })();
  const own = !host || host === new URL(SITE_ORIGIN).host || host === req.headers.get('host');
  await record404({ path, referrer: ref, external: !own, bot: !!botOf(req.headers.get('user-agent')) });
  return new Response(null, { status: 204 });
}
