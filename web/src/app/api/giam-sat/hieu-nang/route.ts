import { botOf, pageGroupOf, rateVital, VITALS, type VitalName } from '@/lib/monitor';
import { recordVitals } from '@/server/monitor-store';

/** Core Web Vitals đo trên máy khách thật (components/WebVitals.tsx gửi bằng sendBeacon). Mức tốt / kém tính lại ở đây. */
export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if ((site && site !== 'same-origin') || botOf(req.headers.get('user-agent'))) return new Response(null, { status: 204 });
  const body = await req.json().catch(() => null) as { path?: unknown; device?: unknown; metrics?: unknown } | null;
  if (!body || typeof body.path !== 'string' || !Array.isArray(body.metrics)) return new Response(null, { status: 400 });
  const device = body.device === 'mobile' ? 'mobile' : 'desktop';
  const group = pageGroupOf(body.path);
  const rows = (body.metrics.slice(0, 10) as { name?: unknown; value?: unknown }[]).flatMap((m) => {
    const name = m.name as VitalName;
    const value = Number(m.value);
    if (!(name in VITALS) || !Number.isFinite(value) || value < 0 || value > (name === 'CLS' ? 10 : 60_000)) return [];
    return [{ group, device, metric: name, rating: rateVital(name, value), value }];
  });
  if (rows.length) await recordVitals(rows);
  return new Response(null, { status: 204 });
}
