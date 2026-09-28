import 'server-only';
import { and, count, desc, eq, gte, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import type { SessionUser } from './auth';
import { isPhone, normalizePhone } from './auth';
import { db, schema } from './db';
import { saveImage, type SavedImage } from './uploads';
import {
  BUDGETS, CALLBACK_HOURS, QUOTE_STALE_DAYS, SERVICE_INFO, SERVICE_STAGES, SERVICE_TYPES, SLOT_CAPACITY, SLOT_TIMES, SOURCES, SPACES,
  STAGE_LABEL, STYLES, SUNS, fmtSlot, serviceCode, shortMoney, slotDates, todayVN, type SlotTime,
} from '@/lib/service-labels';
import { fmtDate, fmtDateTime } from '@/lib/order-labels';
import { money } from '@/lib/format';

const { serviceRequests: S, serviceRequestPhotos: SP, serviceRequestEvents: SE, users } = schema;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Chống spam form công khai: tối đa 3 yêu cầu / SĐT / 24 giờ, 30 yêu cầu web / giờ toàn hệ thống. */
const MAX_PER_PHONE_DAY = 3;
const MAX_WEB_PER_HOUR = 30;
export const MAX_SERVICE_PHOTOS = 3;
/** Cột Hoàn thành / Thua chỉ hiện yêu cầu trong 60 ngày gần nhất. */
const CLOSED_DAYS = 60;

type Ok<T = object> = { ok: true } & T;
type Err = { ok: false; error: string };

// ---- Khách gửi form ---------------------------------------------------------------------------

const phone = z.string().trim().refine(isPhone, 'Số điện thoại chưa đúng').transform(normalizePhone);

export const ServiceInputSchema = z.object({
  service: z.enum(SERVICE_TYPES, 'Chọn dịch vụ bạn cần'),
  space: z.enum(SPACES).optional(),
  area: z.coerce.number().int().min(1, 'Diện tích chưa đúng').max(100_000, 'Diện tích chưa đúng').optional(),
  sun: z.enum(SUNS).optional(),
  styles: z.array(z.enum(STYLES)).max(STYLES.length).default([]),
  budget: z.enum(BUDGETS).optional(),
  /** "2026-09-29|am" — bỏ trống = để kỹ sư gọi hẹn. */
  slot: z.string().regex(/^\d{4}-\d{2}-\d{2}\|(am|pm)$/).optional(),
  name: z.string().trim().min(2, 'Nhập họ tên').max(80),
  phone,
  address: z.string().trim().min(5, 'Nhập địa chỉ khảo sát').max(200),
  note: z.string().trim().max(1000).optional(),
});
export type ServiceInput = z.infer<typeof ServiceInputSchema>;

/** Số lịch đã đặt theo từng khung giờ (không tính yêu cầu đã thua). Key "YYYY-MM-DD|am". */
export async function slotUsage(dates: string[]) {
  const rows = await db.select({ d: S.slotDate, t: S.slotTime, n: count() }).from(S)
    .where(and(inArray(S.slotDate, dates), ne(S.stage, 'lost')))
    .groupBy(S.slotDate, S.slotTime);
  return Object.fromEntries(rows.map((r) => [`${r.d}|${r.t}`, r.n])) as Record<string, number>;
}

/** Các khung giờ khảo sát cho form: ngày mai trở đi, đánh dấu khung đã kín. */
export async function surveySlots() {
  const dates = slotDates();
  const used = await slotUsage(dates);
  return dates.flatMap((d) => (Object.keys(SLOT_TIMES) as SlotTime[]).map((t) => ({
    key: `${d}|${t}`, date: d, time: t, full: (used[`${d}|${t}`] ?? 0) >= SLOT_CAPACITY,
  })));
}
export type SurveySlot = Awaited<ReturnType<typeof surveySlots>>[number];

export async function createServiceRequest(input: ServiceInput, files: File[], user: SessionUser | null): Promise<Ok<{ code: string }> | Err> {
  if (files.length > MAX_SERVICE_PHOTOS) return { ok: false, error: `Tối đa ${MAX_SERVICE_PHOTOS} ảnh` };

  const since = new Date(Date.now() - DAY);
  const [{ n: byPhone }] = await db.select({ n: count() }).from(S).where(and(eq(S.phone, input.phone), gte(S.createdAt, since)));
  if (byPhone >= MAX_PER_PHONE_DAY) return { ok: false, error: 'Số điện thoại này đã gửi nhiều yêu cầu hôm nay. Kỹ sư sẽ gọi lại cho bạn sớm.' };
  const [{ n: recent }] = await db.select({ n: count() }).from(S).where(and(eq(S.source, 'web'), gte(S.createdAt, new Date(Date.now() - HOUR))));
  if (recent >= MAX_WEB_PER_HOUR) return { ok: false, error: 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau ít phút hoặc gọi hotline.' };

  let slot: { date: string; time: SlotTime } | null = null;
  if (input.slot) {
    const [date, time] = input.slot.split('|') as [string, SlotTime];
    if (!slotDates().includes(date)) return { ok: false, error: 'Lịch khảo sát này không còn chọn được, vui lòng chọn lại' };
    slot = { date, time };
  }

  const saved: SavedImage[] = [];
  for (const f of files) {
    const r = await saveImage(f);
    if ('error' in r) return { ok: false, error: r.error };
    saved.push(r);
  }

  try {
    const id = await db.transaction(async (tx) => {
      if (slot) {
        // Khóa theo khung giờ để 2 người đặt cùng lúc không vượt số kỹ sư
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`service-slot:${slot.date}|${slot.time}`}))`);
        const [{ n }] = await tx.select({ n: count() }).from(S)
          .where(and(eq(S.slotDate, slot.date), eq(S.slotTime, slot.time), ne(S.stage, 'lost')));
        if (n >= SLOT_CAPACITY) throw new SlotFull();
      }
      const [row] = await tx.insert(S).values({
        service: input.service, space: input.space ?? null, area: input.area ?? null, sun: input.sun ?? null,
        styles: input.styles, budget: input.budget ?? null, slotDate: slot?.date ?? null, slotTime: slot?.time ?? null,
        name: input.name, phone: input.phone, address: input.address, note: input.note || null,
        userId: user?.id ?? null, source: 'web',
      }).returning({ id: S.id });
      if (saved.length) await tx.insert(SP).values(saved.map((s) => ({ requestId: row.id, file: s.file, mime: s.mime, data: s.data })));
      await tx.insert(SE).values({
        requestId: row.id, kind: 'created', actor: input.name,
        text: `Khách gửi yêu cầu trên web${slot ? ` · muốn khảo sát ${fmtSlot(slot.date, slot.time)}` : ' · chờ gọi hẹn lịch'}${saved.length ? ` · ${saved.length} ảnh` : ''}`,
      });
      return row.id;
    });
    return { ok: true, code: serviceCode(id) };
  } catch (e) {
    if (e instanceof SlotFull) return { ok: false, error: 'Khung giờ này vừa kín lịch, vui lòng chọn khung khác' };
    throw e;
  }
}
class SlotFull extends Error {}

// ---- Nhân viên nhập tay (hotline, Zalo…) ------------------------------------------------------

export const StaffCreateSchema = z.object({
  service: z.enum(SERVICE_TYPES, 'Chọn dịch vụ'),
  source: z.enum(SOURCES).exclude(['web']),
  name: z.string().trim().min(2, 'Nhập tên khách').max(80),
  phone,
  address: z.string().trim().min(3, 'Nhập địa chỉ').max(200),
  budget: z.enum(BUDGETS).optional(),
  area: z.number().int().min(1).max(100_000).optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function createByStaff(input: z.infer<typeof StaffCreateSchema>, staff: SessionUser, actor: string) {
  const id = await db.transaction(async (tx) => {
    const now = new Date();
    const [row] = await tx.insert(S).values({
      service: input.service, source: input.source, name: input.name, phone: input.phone, address: input.address,
      budget: input.budget ?? null, area: input.area ?? null, note: input.note || null,
      // Khách tự liên hệ nên coi như đã nói chuyện; người nhập là người phụ trách
      contactedAt: now, assigneeId: staff.id,
    }).returning({ id: S.id });
    await tx.insert(SE).values({ requestId: row.id, kind: 'created', actor, text: `Nhân viên tạo yêu cầu (nguồn: ${input.source})` });
    return row.id;
  });
  return { ok: true as const, id };
}

// ---- Đọc cho admin ----------------------------------------------------------------------------

const assigneeName = sql<string | null>`(select coalesce(u.name, u.phone, u.email) from users u where u.id = ${S.assigneeId})`;

/** Nhân viên / admin để chọn người phụ trách. */
export const staffOptions = () =>
  db.select({ id: users.id, name: sql<string>`coalesce(${users.name}, ${users.phone}, ${users.email}, 'Nhân viên')` })
    .from(users).where(inArray(users.role, ['staff', 'admin'])).orderBy(users.name);

export type BoardFilter = { service?: (typeof SERVICE_TYPES)[number]; assignee?: number; lost?: boolean };

/** Thẻ Kanban: dòng chữ mốc thời gian + cờ quá hạn tính sẵn ở server. */
function cardMeta(r: typeof S.$inferSelect, now: number): { when: string; late: boolean } {
  const ago = (d: Date) => {
    const m = Math.max(0, Math.round((now - d.getTime()) / 60_000));
    return m < 60 ? `${m} phút` : m < 60 * 24 ? `${Math.floor(m / 60)} giờ` : `${Math.floor(m / 1440)} ngày`;
  };
  switch (r.stage) {
    case 'new': {
      if (r.contactedAt) return { when: `Đã gọi · ${ago(r.contactedAt)} trước`, late: false };
      const left = r.createdAt.getTime() + CALLBACK_HOURS * HOUR - now;
      return left > 0
        ? { when: `Gọi trong ${Math.max(1, Math.ceil(left / 60_000))} phút`, late: false }
        : { when: `Chưa gọi · quá ${ago(new Date(r.createdAt.getTime() + CALLBACK_HOURS * HOUR))}`, late: true };
    }
    case 'scheduled':
      if (r.surveyAt) return { when: `KS ${fmtDateTime(r.surveyAt).split(', ').reverse().join(' · ')}`, late: r.surveyAt.getTime() < now - DAY };
      return { when: r.slotDate ? `Khách chọn ${fmtSlot(r.slotDate, r.slotTime ?? 'am')}` : 'Chưa chốt giờ', late: !r.slotDate };
    case 'quoted': {
      const at = r.quotedAt ?? r.stageAt;
      const days = Math.floor((now - at.getTime()) / DAY);
      return { when: days < 1 ? 'Gửi hôm nay' : days === 1 ? 'Gửi hôm qua' : `Gửi ${days} ngày trước`, late: days >= QUOTE_STALE_DAYS };
    }
    case 'in_progress':
      return { when: `Bắt đầu ${fmtDate(r.stageAt).slice(0, 5)}`, late: false };
    case 'done':
      return { when: `Xong ${fmtDate(r.stageAt).slice(0, 5)}`, late: false };
    case 'lost':
      return { when: r.lostReason ?? 'Thua', late: false };
  }
}

export async function serviceBoard(f: BoardFilter) {
  const closedSince = new Date(Date.now() - CLOSED_DAYS * DAY);
  const rows = await db.select({ r: S, assignee: assigneeName, photos: sql<number>`(select count(*)::int from service_request_photos p where p.request_id = ${S.id})` })
    .from(S)
    .where(and(
      f.service ? eq(S.service, f.service) : undefined,
      f.assignee ? eq(S.assigneeId, f.assignee) : undefined,
      f.lost ? undefined : ne(S.stage, 'lost'),
      or(inArray(S.stage, ['new', 'scheduled', 'quoted', 'in_progress']), gte(S.stageAt, closedSince)),
    ))
    .orderBy(desc(S.createdAt))
    .limit(500);
  const now = Date.now();
  return rows.map(({ r, assignee, photos }) => {
    const need = [
      r.space ?? SERVICE_INFO[r.service].label,
      r.area ? `${r.area}m²` : null,
      r.address.split(',').map((s) => s.trim()).filter(Boolean).at(-1) ?? null,
    ].filter(Boolean).join(' · ');
    return {
      id: r.id, code: serviceCode(r.id), stage: r.stage, name: r.name, service: SERVICE_INFO[r.service].label, need,
      value: r.value != null ? shortMoney(r.value) : r.budget ?? '', assignee, photos, ...cardMeta(r, now),
    };
  });
}
export type BoardCard = Awaited<ReturnType<typeof serviceBoard>>[number];

/** 4 chỉ số đầu trang: yêu cầu tháng này, tỉ lệ chốt, giá trị hợp đồng, quá hạn gọi lại. */
export async function serviceKpis() {
  const ym = todayVN().slice(0, 7);
  const [y, m] = ym.split('-').map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const month = sql<string>`to_char(${S.createdAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM')`;
  const [r] = await db.select({
    thisMonth: sql<number>`count(*) filter (where ${month} = ${ym})::int`,
    lastMonth: sql<number>`count(*) filter (where ${month} = ${prev})::int`,
    quoted: sql<number>`count(*) filter (where ${S.quotedAt} is not null or ${S.stage} in ('quoted','in_progress','done'))::int`,
    won: sql<number>`count(*) filter (where ${S.stage} in ('in_progress','done'))::int`,
    wonValue: sql<number>`coalesce(sum(${S.value}) filter (where ${S.stage} in ('in_progress','done')), 0)::bigint`,
    runningValue: sql<number>`coalesce(sum(${S.value}) filter (where ${S.stage} = 'in_progress'), 0)::bigint`,
    overdue: sql<number>`count(*) filter (where ${S.stage} = 'new' and ${S.contactedAt} is null and ${S.createdAt} < now() - make_interval(hours => ${CALLBACK_HOURS}))::int`,
  }).from(S);
  return {
    thisMonth: r.thisMonth, diff: r.thisMonth - r.lastMonth,
    closeRate: r.quoted ? Math.round((r.won / r.quoted) * 100) : null,
    wonValue: Number(r.wonValue), runningValue: Number(r.runningValue), overdue: r.overdue,
  };
}

/** Số trên menu trái: yêu cầu mới chưa gọi lại. */
export async function countNewServiceRequests() {
  const [{ n }] = await db.select({ n: count() }).from(S).where(and(eq(S.stage, 'new'), isNull(S.contactedAt)));
  return n;
}

export async function getServiceRequest(id: number) {
  const [row] = await db.select({ r: S, assignee: assigneeName, account: users.name, accountId: users.id }).from(S)
    .leftJoin(users, eq(users.id, S.userId)).where(eq(S.id, id));
  if (!row) return undefined;
  const [photos, events] = await Promise.all([
    db.select({ file: SP.file }).from(SP).where(eq(SP.requestId, id)).orderBy(SP.id),
    db.select().from(SE).where(eq(SE.requestId, id)).orderBy(desc(SE.id)),
  ]);
  return { ...row, code: serviceCode(id), photos: photos.map((p) => p.file), events };
}
export type ServiceRequestFull = NonNullable<Awaited<ReturnType<typeof getServiceRequest>>>;

// ---- Nhân viên xử lý --------------------------------------------------------------------------

/** "2026-09-29T09:00" (giờ Việt Nam, từ ô datetime-local) → Date. */
const vnDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Giờ khảo sát chưa đúng').transform((s) => new Date(`${s}:00+07:00`));

export const UpdateSchema = z.object({
  id: z.number().int().positive(),
  stage: z.enum(SERVICE_STAGES).optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  surveyAt: vnDateTime.nullable().optional(),
  value: z.number().int().min(0).max(100_000_000_000).nullable().optional(),
  lostReason: z.string().trim().max(300).optional(),
}).refine((v) => v.stage !== 'lost' || (v.lostReason && v.lostReason.length >= 5), { message: 'Ghi lý do thua (ít nhất 5 ký tự)', path: ['lostReason'] });
export type ServiceUpdate = z.infer<typeof UpdateSchema>;

export async function updateServiceRequest(input: ServiceUpdate, actor: string): Promise<Ok | Err> {
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(S).where(eq(S.id, input.id)).for('update');
    if (!cur) return { ok: false as const, error: 'Không tìm thấy yêu cầu' };
    const set: Partial<typeof S.$inferInsert> = {};
    const log: { kind: 'stage' | 'update'; text: string }[] = [];
    const now = new Date();

    if (input.stage && input.stage !== cur.stage) {
      set.stage = input.stage;
      set.stageAt = now;
      log.push({ kind: 'stage', text: `${STAGE_LABEL[cur.stage]} → ${STAGE_LABEL[input.stage]}${input.stage === 'lost' ? ` · Lý do: ${input.lostReason}` : ''}` });
      if (input.stage === 'lost') set.lostReason = input.lostReason;
      else if (cur.stage === 'lost') set.lostReason = null;
      // Đã qua bước Mới thì chắc chắn đã liên hệ khách
      if (input.stage !== 'new' && !cur.contactedAt) set.contactedAt = now;
      if (input.stage === 'quoted' && !cur.quotedAt) set.quotedAt = now;
      // Hẹn khảo sát: mặc định theo khung khách đã chọn nếu chưa chốt giờ
      if (input.stage === 'scheduled' && !cur.surveyAt && input.surveyAt === undefined && cur.slotDate) {
        set.surveyAt = new Date(`${cur.slotDate}T${cur.slotTime === 'pm' ? '14' : '09'}:00:00+07:00`);
      }
    }
    if (input.assigneeId !== undefined && input.assigneeId !== cur.assigneeId) {
      let who = 'bỏ trống';
      if (input.assigneeId) {
        const [u] = await tx.select({ name: sql<string>`coalesce(${users.name}, ${users.phone}, ${users.email})`, role: users.role }).from(users).where(eq(users.id, input.assigneeId));
        if (!u || u.role === 'customer') return { ok: false as const, error: 'Người phụ trách phải là nhân viên' };
        who = u.name;
      }
      set.assigneeId = input.assigneeId;
      log.push({ kind: 'update', text: `Người phụ trách: ${who}` });
    }
    if (input.surveyAt !== undefined && (input.surveyAt?.getTime() ?? null) !== (cur.surveyAt?.getTime() ?? null)) {
      set.surveyAt = input.surveyAt;
      log.push({ kind: 'update', text: input.surveyAt ? `Hẹn khảo sát ${fmtDateTime(input.surveyAt)}` : 'Bỏ lịch khảo sát' });
    }
    if (input.value !== undefined && input.value !== cur.value) {
      set.value = input.value;
      log.push({ kind: 'update', text: input.value != null ? `Giá trị báo giá / hợp đồng: ${money(input.value)}` : 'Bỏ giá trị báo giá' });
      if (input.value != null && !cur.quotedAt && (set.stage ?? cur.stage) !== 'new') set.quotedAt = now;
    }
    if (!log.length) return { ok: true as const };
    await tx.update(S).set(set).where(eq(S.id, cur.id));
    await tx.insert(SE).values(log.map((l) => ({ requestId: cur.id, kind: l.kind, text: l.text, actor })));
    return { ok: true as const };
  });
}

export const NoteSchema = z.object({
  id: z.number().int().positive(),
  kind: z.enum(['call', 'note']),
  text: z.string().trim().max(1000),
}).refine((v) => v.kind === 'call' || v.text.length >= 2, { message: 'Nhập nội dung ghi chú', path: ['text'] });

/** Ghi nhận cuộc gọi (lần đầu → hết quá hạn gọi lại) hoặc ghi chú nội bộ. */
export async function addServiceNote(input: z.infer<typeof NoteSchema>, actor: string): Promise<Ok | Err> {
  return db.transaction(async (tx) => {
    const [cur] = await tx.select({ id: S.id, contactedAt: S.contactedAt }).from(S).where(eq(S.id, input.id)).for('update');
    if (!cur) return { ok: false as const, error: 'Không tìm thấy yêu cầu' };
    if (input.kind === 'call' && !cur.contactedAt) await tx.update(S).set({ contactedAt: new Date() }).where(eq(S.id, cur.id));
    await tx.insert(SE).values({ requestId: cur.id, kind: input.kind, actor, text: input.text || 'Đã gọi cho khách' });
    return { ok: true as const };
  });
}

// ---- Ảnh ------------------------------------------------------------------------------------

/** Ảnh hiện trạng: nhân viên, hoặc chính tài khoản đã gửi yêu cầu. */
export async function readServicePhoto(file: string) {
  const [row] = await db.select({ data: SP.data, mime: SP.mime, owner: S.userId }).from(SP)
    .innerJoin(S, eq(S.id, SP.requestId)).where(eq(SP.file, file));
  return row ?? null;
}
