import { lookup, reverse } from 'node:dns/promises';
import { botHostOk, verifiableBot } from '@/lib/monitor';

/**
 * Xác minh Googlebot / Bingbot thật theo cách Google hướng dẫn: tra ngược DNS địa chỉ IP → tên máy phải thuộc
 * googlebot.com / google.com (Bing: search.msn.com) → tra xuôi tên đó phải ra đúng IP. Ai cũng giả được User-Agent
 * "Googlebot", không giả được DNS. Nhớ kết quả theo IP trong bộ nhớ (tối đa 1000 IP, 6 giờ); quá 1,5 giây coi như chưa xác minh.
 */
const memo = new Map<string, { ok: boolean; at: number }>();
const TTL = 6 * 3_600_000;

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

export async function verifyBotIp(bot: string, ip: string | null | undefined): Promise<boolean> {
  if (!ip || !verifiableBot(bot)) return false;
  const key = `${bot} ${ip}`;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.ok;
  let ok = false;
  try {
    const hosts = await withTimeout(reverse(ip), 1500);
    for (const host of hosts) {
      if (!botHostOk(bot, host)) continue;
      const addrs = await withTimeout(lookup(host, { all: true }), 1500);
      if (addrs.some((a) => a.address === ip)) { ok = true; break; }
    }
  } catch { /* không tra được = chưa xác minh */ }
  if (memo.size > 1000) memo.clear();
  memo.set(key, { ok, at: Date.now() });
  return ok;
}

/** IP khách từ header của Vercel / proxy (địa chỉ đầu tiên của x-forwarded-for). */
export const clientIp = (h: { get(name: string): string | null }) =>
  h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
