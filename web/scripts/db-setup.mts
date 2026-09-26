// Tạo / cập nhật bảng (migration trong ./drizzle) rồi nạp dữ liệu mẫu nếu database còn trống.
// Chạy: npm run db:setup (tự chạy trước `npm run build`, kể cả trên Vercel).
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from '../src/server/db/schema';
import { seedIfEmpty } from '../src/server/db/seed';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Thiếu DATABASE_URL (chuỗi kết nối Supabase) — điền vào web/.env.local hoặc Environment Variables trên Vercel.');
  process.exit(1);
}
const client = new pg.Pool({ connectionString: url, max: 1, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
const db = drizzle({ client, schema });
await migrate(db, { migrationsFolder: 'drizzle' });
console.log('[db] Đã cập nhật bảng');
if (await seedIfEmpty(db)) console.log('[db] Đã nạp dữ liệu mẫu');
await client.end();
