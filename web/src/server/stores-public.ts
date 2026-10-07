import 'server-only';
import { and, asc, desc, eq, or } from 'drizzle-orm';
import { STORE_SERVICE_KEYS, type PublicStore } from '@/lib/stores';
import { db, schema } from './db';

const { stores } = schema;

/** Cửa hàng hiện trên trang khách Hệ thống cửa hàng: bật "Hiện trên web" và đang hoạt động (đối tác không có kho nên không cần "hoạt động"). */
export async function listPublicStores(): Promise<PublicStore[]> {
  const rows = await db.select().from(stores)
    .where(and(eq(stores.isPublic, true), or(eq(stores.active, true), eq(stores.kind, 'partner'))))
    .orderBy(desc(stores.isDefault), asc(stores.id));
  return rows.map((s) => ({
    id: s.id, code: s.code, name: s.name, address: s.address, lat: s.lat, lng: s.lng,
    phone: s.phone, contactName: s.contactName, open24h: s.open24h, openFrom: s.openFrom, openTo: s.openTo,
    services: STORE_SERVICE_KEYS.filter((k) => s.services.includes(k)),
    kind: s.kind, note: s.note,
  }));
}
