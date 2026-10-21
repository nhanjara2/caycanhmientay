import 'server-only';
import { sql } from 'drizzle-orm';
import { vnDay, type VitalName } from '@/lib/monitor';
import { db } from './db';

/**
 * Đọc số liệu giám sát SEO (mục 19 checklist SEO) cho tab "Theo dõi" ở /admin/seo và cho /api/giam-sat/tong-hop
 * (GitHub Actions gọi mỗi 6 giờ, lỗi thì gửi email). Ghi ở server/monitor-store.ts.
 */

type Row = Record<string, unknown>;
const rows = async <T extends Row>(q: ReturnType<typeof sql>) => (await db.execute<T>(q)).rows;
const daysAgo = (n: number) => vnDay(new Date(Date.now() - n * 86_400_000));

export type NotFoundRow = { path: string; hits: number; botHits: number; referrer: string; external: boolean; firstSeen: Date; lastSeen: Date; redirect: string | null };
export type ErrorRow = { kind: string; path: string; message: string; digest: string | null; hits: number; firstSeen: Date; lastSeen: Date };

/** Đường dẫn 404 có lượt trong `days` ngày qua, mới gặp gần đây trước; kèm chuyển hướng nếu đã thêm sau đó. */
export async function listNotFound(days = 30, limit = 100): Promise<NotFoundRow[]> {
  const r = await rows<{ path: string; hits: number; bot_hits: number; referrer: string; external: boolean; first_seen: Date; last_seen: Date; to_path: string | null }>(sql`
    SELECT n.path, n.hits, n.bot_hits, n.referrer, n.external, n.first_seen, n.last_seen, r.to_path
    FROM not_found_hits n LEFT JOIN redirects r ON r.from_path = n.path
    WHERE n.last_seen > now() - make_interval(days => ${days})
    ORDER BY (n.external OR n.bot_hits > 0) DESC, n.last_seen DESC LIMIT ${limit}`);
  return r.map((x) => ({ path: x.path, hits: Number(x.hits), botHits: Number(x.bot_hits), referrer: x.referrer, external: x.external, firstSeen: new Date(x.first_seen), lastSeen: new Date(x.last_seen), redirect: x.to_path }));
}

export async function listErrors(days = 14, limit = 100): Promise<ErrorRow[]> {
  const r = await rows<{ kind: string; path: string; message: string; digest: string | null; hits: number; first_seen: Date; last_seen: Date }>(sql`
    SELECT kind, path, message, digest, hits, first_seen, last_seen FROM error_events
    WHERE last_seen > now() - make_interval(days => ${days}) ORDER BY last_seen DESC LIMIT ${limit}`);
  return r.map((x) => ({ kind: x.kind, path: x.path, message: x.message, digest: x.digest, hits: Number(x.hits), firstSeen: new Date(x.first_seen), lastSeen: new Date(x.last_seen) }));
}

/** Lượt máy đọc trang theo máy × xác minh: hôm nay, 7 ngày, 28 ngày; và Googlebot thật theo nhóm trang (7 ngày) + theo ngày (14 ngày). */
export async function crawlStats() {
  const today = vnDay(), d7 = daysAgo(6), d28 = daysAgo(27), d14 = daysAgo(13);
  const [byBot, byGroup, byDay] = await Promise.all([
    rows<{ bot: string; verified: boolean; today: number; week: number; month: number }>(sql`
      SELECT bot, verified,
        COALESCE(sum(hits) FILTER (WHERE day = ${today}), 0)::int AS today,
        COALESCE(sum(hits) FILTER (WHERE day >= ${d7}), 0)::int AS week,
        COALESCE(sum(hits), 0)::int AS month
      FROM crawl_hits WHERE day >= ${d28} GROUP BY bot, verified ORDER BY month DESC`),
    rows<{ section: string; hits: number }>(sql`
      SELECT section, sum(hits)::int AS hits FROM crawl_hits WHERE bot = 'google' AND verified AND day >= ${d7} GROUP BY section ORDER BY hits DESC`),
    rows<{ day: string; hits: number }>(sql`
      SELECT day, sum(hits)::int AS hits FROM crawl_hits WHERE bot = 'google' AND verified AND day >= ${d14} GROUP BY day ORDER BY day`),
  ]);
  return { byBot, byGroup, byDay };
}

export type VitalCell = { hits: number; good: number; poor: number; avg: number };
/** Tốc độ máy khách thật trong `days` ngày: [nhóm trang | "*"][máy][chỉ số] → số lượt, % tốt / kém, trung bình. */
export async function vitalsStats(days = 28) {
  const r = await rows<{ section: string; device: string; metric: string; rating: string; hits: number; total: number }>(sql`
    SELECT section, device, metric, rating, sum(hits)::int AS hits, sum(total) AS total FROM web_vitals
    WHERE day >= ${daysAgo(days - 1)} GROUP BY section, device, metric, rating`);
  const out = new Map<string, Map<string, Map<VitalName, VitalCell>>>();
  const cell = (s: string, d: string, m: VitalName) => {
    if (!out.has(s)) out.set(s, new Map());
    const bySec = out.get(s)!;
    if (!bySec.has(d)) bySec.set(d, new Map());
    const byDev = bySec.get(d)!;
    if (!byDev.has(m)) byDev.set(m, { hits: 0, good: 0, poor: 0, avg: 0 });
    return byDev.get(m)!;
  };
  for (const x of r) {
    for (const s of [x.section, '*']) {
      const c = cell(s, x.device, x.metric as VitalName);
      const n = Number(x.hits);
      c.avg = (c.avg * c.hits + Number(x.total)) / (c.hits + n || 1);
      c.hits += n;
      if (x.rating === 'good') c.good += n;
      if (x.rating === 'poor') c.poor += n;
    }
  }
  return out;
}

/** Tóm tắt `hours` giờ qua cho công cụ giám sát (scripts/check-monitor.mts). */
export async function monitorHealth(hours = 6) {
  const [nf, nfNew, errs, crawl] = await Promise.all([
    rows<{ active: number; fresh: number; fresh_backlink: number; fresh_bot: number }>(sql`
      SELECT count(*) FILTER (WHERE last_seen > now() - make_interval(hours => ${hours}))::int AS active,
        count(*) FILTER (WHERE first_seen > now() - make_interval(hours => ${hours}))::int AS fresh,
        count(*) FILTER (WHERE first_seen > now() - make_interval(hours => ${hours}) AND external)::int AS fresh_backlink,
        count(*) FILTER (WHERE first_seen > now() - make_interval(hours => ${hours}) AND bot_hits > 0)::int AS fresh_bot
      FROM not_found_hits`),
    rows<{ path: string; hits: number; bot_hits: number; referrer: string; external: boolean }>(sql`
      SELECT n.path, n.hits, n.bot_hits, n.referrer, n.external FROM not_found_hits n
      WHERE n.first_seen > now() - make_interval(hours => ${hours}) AND NOT EXISTS (SELECT 1 FROM redirects r WHERE r.from_path = n.path)
      ORDER BY n.external DESC, n.bot_hits DESC, n.hits DESC LIMIT 20`),
    rows<{ kind: string; path: string; message: string; hits: number; fresh: boolean }>(sql`
      SELECT kind, path, message, hits, first_seen > now() - make_interval(hours => ${hours}) AS fresh FROM error_events
      WHERE last_seen > now() - make_interval(hours => ${hours}) ORDER BY hits DESC LIMIT 30`),
    rows<{ day: string; verified: boolean; hits: number }>(sql`
      SELECT day, verified, sum(hits)::int AS hits FROM crawl_hits WHERE bot = 'google' AND day >= ${daysAgo(7)} GROUP BY day, verified ORDER BY day`),
  ]);
  return {
    hours,
    notFound: { ...nf[0], newPaths: nfNew },
    errors: errs,
    googlebot: crawl,
  };
}

export type SearchRow = { q: string; hits: number; days: number; results: number; lastDay: string };

/** Từ khóa khách tìm trong `days` ngày qua, nhiều lượt trước; `results` = số sản phẩm tìm ra lần gần nhất (0 = shop chưa có). */
export async function topSearches(days = 30, limit = 50): Promise<SearchRow[]> {
  const r = await rows<{ q: string; hits: number; days: number; results: number; last_day: string }>(sql`
    SELECT q, sum(hits) AS hits, count(*) AS days, (array_agg(results ORDER BY day DESC))[1] AS results, max(day) AS last_day
    FROM search_queries WHERE day >= ${daysAgo(days - 1)}
    GROUP BY q ORDER BY sum(hits) DESC, max(day) DESC LIMIT ${limit}`);
  return r.map((x) => ({ q: x.q, hits: Number(x.hits), days: Number(x.days), results: Number(x.results), lastDay: x.last_day }));
}

/**
 * Từ khóa cho dải "Xu hướng tìm kiếm" ở đầu trang: tìm ra sản phẩm, được tìm ≥ 2 ngày khác nhau trong 30 ngày (một người
 * gõ đi gõ lại không thành xu hướng). Nhớ trong bộ nhớ 1 giờ để mỗi lượt xem trang không phải đọc database. Lỗi → [].
 */
const g = globalThis as unknown as { __ccmtTrending?: { at: number; list: string[] } };
export async function trendingSearches(limit = 16): Promise<string[]> {
  if (g.__ccmtTrending && Date.now() - g.__ccmtTrending.at < 3_600_000) return g.__ccmtTrending.list;
  let list: string[] = [];
  try {
    list = (await topSearches(30, 60)).filter((s) => s.results > 0 && s.days >= 2).slice(0, limit).map((s) => s.q);
  } catch { /* database lỗi: dùng danh sách chọn tay */ }
  g.__ccmtTrending = { at: Date.now(), list };
  return list;
}
