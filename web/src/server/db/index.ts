import 'server-only';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type DB = NodePgDatabase<typeof schema>;

// Dùng node-postgres (pg) với Supabase "Transaction pooler" (cổng 6543). Không dùng thư viện `postgres`:
// nó gửi dồn nhiều truy vấn trên một kết nối (pipelining) và bị treo qua pooler này.
// Tạo bảng + dữ liệu mẫu: `npm run db:setup` (tự chạy trước `npm run build`).
/** Supabase: mã hóa đường truyền (không kiểm chứng chứng chỉ — Supabase dùng CA riêng). */
const sslFor = (url: string) => (/localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false });

function open(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Thiếu biến môi trường DATABASE_URL (chuỗi kết nối Supabase)');
  const client = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 20_000, ssl: sslFor(url) });
  return drizzle({ client, schema });
}

// Giữ một kết nối qua các lần hot-reload khi chạy dev.
const g = globalThis as unknown as { __ccmtDb?: DB };
export const db: DB = g.__ccmtDb ?? (g.__ccmtDb = open());
export { schema };
