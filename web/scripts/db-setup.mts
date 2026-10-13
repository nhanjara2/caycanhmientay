// Tạo / cập nhật bảng (migration trong ./drizzle) rồi nạp dữ liệu mẫu nếu database còn trống.
// Chạy: npm run db:setup (tự chạy trước `npm run build`, kể cả trên Vercel).
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from '../src/server/db/schema';
import { seedDiseaseImages, seedDiseasesIfEmpty, seedIfEmpty, seedPlantAttrs, seedPostsIfEmpty, seedWelcomeVoucher } from '../src/server/db/seed';

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
{ const n = await seedPlantAttrs(db); if (n) console.log(`[db] Đã gắn đặc điểm (bộ lọc) cho ${n} cây mẫu`); }
if (await seedDiseasesIfEmpty(db)) console.log('[db] Đã nạp bài bệnh cây mẫu');
{ const n = await seedDiseaseImages(db); if (n) console.log(`[db] Đã gắn ${n} ảnh minh họa triệu chứng bệnh cây`); }
if (await seedPostsIfEmpty(db)) console.log('[db] Đã nạp bài Góc chăm cây mẫu');
if (await seedWelcomeVoucher(db)) console.log('[db] Đã tạo mã quà tài khoản mới');
await client.end();
