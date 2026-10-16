import { botOf } from '@/lib/monitor';
import { recordError } from '@/server/monitor-store';

/**
 * Lỗi script / hydration ở trình duyệt khách (src/instrumentation-client.ts gửi bằng sendBeacon). Công khai nên chỉ nhận
 * yêu cầu cùng web, không phải máy, tối đa 5 lỗi / lần, chữ đã cắt ngắn; bảng có trần số dòng (server/monitor-store.ts).
 */
export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if ((site && site !== 'same-origin') || botOf(req.headers.get('user-agent'))) return new Response(null, { status: 204 });
  const body = await req.json().catch(() => null) as { path?: unknown; errors?: unknown } | null;
  if (!body || typeof body.path !== 'string' || !Array.isArray(body.errors)) return new Response(null, { status: 400 });
  for (const e of body.errors.slice(0, 5) as { kind?: unknown; message?: unknown }[]) {
    if ((e.kind !== 'client' && e.kind !== 'hydration') || typeof e.message !== 'string') continue;
    await recordError({ kind: e.kind, path: body.path, message: e.message.slice(0, 500) });
  }
  return new Response(null, { status: 204 });
}
