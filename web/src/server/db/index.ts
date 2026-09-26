import 'server-only';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as schema from './schema';
import { seedIfEmpty } from './seed';

export type DB = BetterSQLite3Database<typeof schema>;

const FILE = process.env.DATABASE_FILE ?? join(process.cwd(), 'data/app.db');

function open(): DB {
  mkdirSync(dirname(FILE), { recursive: true });
  const sqlite = new Database(FILE);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle({ client: sqlite, schema });
  migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });
  seedIfEmpty(db);
  return db;
}

// Giữ một kết nối qua các lần hot-reload khi chạy dev.
const g = globalThis as unknown as { __ccmtDb?: DB };
export const db: DB = g.__ccmtDb ?? (g.__ccmtDb = open());
export { schema };
