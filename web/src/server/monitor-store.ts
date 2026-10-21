import { Pool } from 'pg';
import { cleanPath, errorKey, vnDay, type VitalName, type VitalRating } from '@/lib/monitor';

/**
 * Ghi số liệu giám sát SEO (mục 19 checklist SEO): lỗi máy chủ / trình duyệt, đường dẫn 404, lượt máy tìm kiếm, tốc độ thật.
 * Cố ý KHÔNG import 'server-only' và không dùng `db` của server/db: file này còn được gọi từ src/instrumentation.ts
 * (onRequestError — ngoài tầng React Server Components). Kết nối riêng, nhỏ (tối đa 2), SQL thô.
 * Mọi hàm nuốt lỗi: ghi giám sát hỏng (database chết) không bao giờ được làm hỏng trang của khách.
 */

const g = globalThis as unknown as { __ccmtMonitorPool?: Pool };
function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return (g.__ccmtMonitorPool ??= new Pool({
    connectionString: url, max: 2, idleTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  }));
}

async function run(sql: string, params: unknown[]) {
  try {
    return (await pool()?.query(sql, params))?.rowCount ?? 0;
  } catch (e) {
    console.error(JSON.stringify({ type: 'monitor_write_failed', message: e instanceof Error ? e.message : String(e) }));
    return 0;
  }
}

/** Trần số dòng mỗi bảng: quá thì chỉ cộng dồn dòng đã có (chặn spam làm phình bảng). */
const MAX_ERRORS = 2000;
const MAX_404 = 5000;

export async function recordError(e: { kind: string; path: string; message: string; digest?: string | null }) {
  const args = [e.kind, cleanPath(e.path), errorKey(e.message), e.digest?.slice(0, 100) ?? null];
  const n = await run(
    `UPDATE error_events SET hits = hits + 1, last_seen = now(), digest = COALESCE($4, digest) WHERE kind = $1 AND path = $2 AND message = $3`, args);
  if (n) return;
  await run(
    `INSERT INTO error_events (kind, path, message, digest) SELECT $1::text, $2::text, $3::text, $4::text WHERE (SELECT count(*) FROM error_events) < ${MAX_ERRORS}
     ON CONFLICT (kind, path, message) DO UPDATE SET hits = error_events.hits + 1, last_seen = now()`, args);
}

export async function record404(e: { path: string; referrer: string; external: boolean; bot: boolean }) {
  const args = [cleanPath(e.path), e.bot ? 1 : 0, e.referrer.slice(0, 300), e.external];
  const n = await run(
    `UPDATE not_found_hits SET hits = hits + 1, bot_hits = bot_hits + $2::int, last_seen = now(),
       referrer = CASE WHEN $3::text <> '' THEN $3::text ELSE referrer END, external = external OR $4::boolean WHERE path = $1`, args);
  if (n) return;
  await run(
    `INSERT INTO not_found_hits (path, hits, bot_hits, referrer, external) SELECT $1::text, 1, $2::int, $3::text, $4::boolean WHERE (SELECT count(*) FROM not_found_hits) < ${MAX_404}
     ON CONFLICT (path) DO UPDATE SET hits = not_found_hits.hits + 1, bot_hits = not_found_hits.bot_hits + $2, last_seen = now()`, args);
}

/** Mỗi ngày tối đa từng này từ khóa khác nhau (chặn spam); quá thì chỉ cộng dồn từ khóa đã có. */
const MAX_SEARCH_PER_DAY = 3000;

/** Một lượt tìm trong shop: `q` đã làm sạch ở trang tìm kiếm, ở đây chỉ chuyển chữ thường. */
export async function recordSearch(q: string, results: number) {
  const key = q.toLocaleLowerCase('vi').slice(0, 100);
  if (!key) return;
  const day = vnDay();
  const n = await run(`UPDATE search_queries SET hits = hits + 1, results = $3 WHERE day = $1 AND q = $2`, [day, key, results]);
  if (n) return;
  await run(
    `INSERT INTO search_queries (day, q, hits, results) SELECT $1::text, $2::text, 1, $3::int
     WHERE (SELECT count(*) FROM search_queries WHERE day = $1) < ${MAX_SEARCH_PER_DAY}
     ON CONFLICT (day, q) DO UPDATE SET hits = search_queries.hits + 1, results = $3`, [day, key, results]);
}

export async function recordCrawl(e: { bot: string; verified: boolean; group: string }) {
  await run(
    `INSERT INTO crawl_hits (day, bot, verified, section, hits) VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (day, bot, verified, section) DO UPDATE SET hits = crawl_hits.hits + 1`,
    [vnDay(), e.bot, e.verified, e.group]);
}

export async function recordVitals(rows: { group: string; device: string; metric: VitalName; rating: VitalRating; value: number }[]) {
  const day = vnDay();
  for (const r of rows) {
    await run(
      `INSERT INTO web_vitals (day, section, device, metric, rating, hits, total) VALUES ($1, $2, $3, $4, $5, 1, $6)
       ON CONFLICT (day, section, device, metric, rating) DO UPDATE SET hits = web_vitals.hits + 1, total = web_vitals.total + $6`,
      [day, r.group, r.device, r.metric, r.rating, r.value]);
  }
}

/** Dọn số liệu cũ: lỗi > 30 ngày, 404 > 90 ngày, lượt máy tìm kiếm / tốc độ > 120 ngày, từ khóa tìm kiếm > 1 năm. */
export async function pruneMonitor() {
  await run(`DELETE FROM error_events WHERE last_seen < now() - interval '30 days'`, []);
  await run(`DELETE FROM not_found_hits WHERE last_seen < now() - interval '90 days'`, []);
  await run(`DELETE FROM crawl_hits WHERE day < $1`, [vnDay(new Date(Date.now() - 120 * 86_400_000))]);
  await run(`DELETE FROM web_vitals WHERE day < $1`, [vnDay(new Date(Date.now() - 120 * 86_400_000))]);
  await run(`DELETE FROM search_queries WHERE day < $1`, [vnDay(new Date(Date.now() - 365 * 86_400_000))]);
}
