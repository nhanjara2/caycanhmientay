import { BOTS, pageGroupOf } from '@/lib/monitor';
import { verifyBotIp } from '@/server/bot-verify';
import { monitorKeyOk } from '@/server/monitor-key';
import { pruneMonitor, recordCrawl } from '@/server/monitor-store';

/** Lượt máy tìm kiếm tải trang — chỉ src/proxy.ts gọi (khóa HMAC). Xác minh Googlebot / Bingbot bằng DNS rồi ghi (giám sát SEO mục 19). */
export async function POST(req: Request) {
  if (!monitorKeyOk(req.headers.get('x-monitor-key'))) return new Response(null, { status: 404 });
  const b = await req.json().catch(() => null) as { bot?: string; ip?: string; path?: string; query?: boolean } | null;
  if (!b || !BOTS.some((x) => x.key === b.bot) || typeof b.path !== 'string') return new Response(null, { status: 400 });
  const verified = await verifyBotIp(b.bot!, b.ip);
  await recordCrawl({ bot: b.bot!, verified, group: pageGroupOf(b.path, !!b.query) });
  if (Math.random() < 0.002) await pruneMonitor();
  return new Response(null, { status: 204 });
}
