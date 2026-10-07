import 'server-only';
import { and, asc, desc, eq } from 'drizzle-orm';
import { STORE_SERVICE_KEYS, type PublicStore } from '@/lib/stores';
import { db, schema } from './db';

const { stores } = schema;

/** Cửa hàng hiện trên trang khách Hệ thống cửa hàng: đang hoạt động + bật "Hiện trên web". */
export async function listPublicStores(): Promise<PublicStore[]> {
  const rows = await db.select().from(stores)
    .where(and(eq(stores.active, true), eq(stores.isPublic, true)))
    .orderBy(desc(stores.isDefault), asc(stores.id));
  return rows.map((s) => ({
    id: s.id, code: s.code, name: s.name, address: s.address, lat: s.lat, lng: s.lng,
    phone: s.phone, contactName: s.contactName, open24h: s.open24h, openFrom: s.openFrom, openTo: s.openTo,
    services: STORE_SERVICE_KEYS.filter((k) => s.services.includes(k)),
  }));
}
