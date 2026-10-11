import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { salesProfit } from './cashflow';
import { periodFinance } from './expenses';

// Báo cáo admin (/admin/bao-cao): mọi số liệu tính từ đơn hàng / bảo hành / hỏi đáp / đánh giá thật.
// Chỉ tính đơn bán (kind = 'sale', bỏ đơn 0đ do bảo hành tạo) chưa hủy — giống trang Tổng quan.

const DAY = 86_400_000;
const VN_OFFSET = 7 * 3600_000; // giờ Việt Nam UTC+7 (không có giờ mùa hè)
const TZ = 'Asia/Ho_Chi_Minh';

export const REPORT_RANGES = {
  '30-ngay': '30 ngày qua',
  'thang-nay': 'Tháng này',
  '3-thang': '3 tháng qua',
  '6-thang': '6 tháng qua',
  '12-thang': '12 tháng qua',
} as const;
export type ReportRange = keyof typeof REPORT_RANGES;
export const isReportRange = (s: string | undefined): s is ReportRange => !!s && s in REPORT_RANGES;
export const DEFAULT_RANGE: ReportRange = '6-thang';

const startOfTodayVN = () => Math.floor((Date.now() + VN_OFFSET) / DAY) * DAY - VN_OFFSET;
/** 0h ngày 1 của tháng hiện tại + `offset` tháng, theo giờ Việt Nam (ms UTC). */
const monthStartVN = (offset: number) => {
  const d = new Date(Date.now() + VN_OFFSET);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1) - VN_OFFSET;
};

/** Kỳ báo cáo [from, to) và kỳ liền trước có cùng số ngày (để so sánh). `to` = hết hôm nay. */
export function rangeBounds(range: ReportRange) {
  const to = startOfTodayVN() + DAY;
  const from = range === '30-ngay' ? startOfTodayVN() - 29 * DAY
    : monthStartVN(range === 'thang-nay' ? 0 : range === '3-thang' ? -2 : range === '6-thang' ? -5 : -11);
  return { from, to, prevFrom: from - (to - from), prevTo: from };
}

const at = (ms: number) => new Date(ms);
type Row = Record<string, unknown>;
const rows = async <T extends Row>(q: ReturnType<typeof sql>) => (await db.execute<T>(q)).rows;

const SALE = sql`o.kind = 'sale' and o.status <> 'cancelled'`;
/** Khóa khách = SĐT chỉ giữ chữ số (đơn vãng lai và đơn của tài khoản cùng số gộp làm một). Khách lẻ tại quầy không để SĐT → NULL, không tính là một khách. */
const CUSTOMER = sql`nullif(regexp_replace(o.phone, '[^0-9]', '', 'g'), '')`;

export type RevenuePoint = { key: string; label: string; revenue: number; before: number; orders: number };

export async function buildReport(range: ReportRange) {
  const { from, to, prevFrom } = rangeBounds(range);
  const F = at(from), T = at(to), PF = at(prevFrom);
  const daily = range === '30-ngay' || range === 'thang-nay';

  const [kpi] = await rows<{
    revenue: number; orders: number; buyers: number; prev_revenue: number; prev_orders: number; prev_buyers: number;
    voucher_orders: number; voucher_discount: number;
  }>(sql`
    select
      coalesce(sum(o.total) filter (where o.created_at >= ${F}), 0)::float8 as revenue,
      (count(*) filter (where o.created_at >= ${F}))::int as orders,
      (count(distinct ${CUSTOMER}) filter (where o.created_at >= ${F}))::int as buyers,
      coalesce(sum(o.total) filter (where o.created_at < ${F}), 0)::float8 as prev_revenue,
      (count(*) filter (where o.created_at < ${F}))::int as prev_orders,
      (count(distinct ${CUSTOMER}) filter (where o.created_at < ${F}))::int as prev_buyers,
      (count(*) filter (where o.created_at >= ${F} and (o.voucher_code is not null or o.ship_voucher_code is not null)))::int as voucher_orders,
      coalesce(sum(o.voucher_discount + o.ship_voucher_discount) filter (where o.created_at >= ${F}), 0)::float8 as voucher_discount
    from orders o
    where ${SALE} and o.created_at >= ${PF} and o.created_at < ${T}`);

  // Khách quay lại = khách có đơn trong kỳ và đã từng mua trước đầu kỳ.
  const returning = async (a: number, b: number) => {
    const [r] = await rows<{ buyers: number; back: number }>(sql`
      select count(*)::int as buyers,
             (count(*) filter (where exists (
               select 1 from orders p
               where p.kind = 'sale' and p.status <> 'cancelled' and p.created_at < ${at(a)}
                 and regexp_replace(p.phone, '[^0-9]', '', 'g') = k.ckey
             )))::int as back
      from (select distinct ${CUSTOMER} as ckey from orders o where ${SALE} and o.created_at >= ${at(a)} and o.created_at < ${at(b)} and ${CUSTOMER} is not null) k`);
    return { buyers: r?.buyers ?? 0, back: r?.back ?? 0 };
  };
  const [ret, prevRet] = await Promise.all([returning(from, to), returning(prevFrom, from)]);

  // Doanh thu theo ngày (kỳ ≤ 1 tháng, so với kỳ trước) hoặc theo tháng (so với cùng tháng năm trước).
  let chart: RevenuePoint[];
  if (daily) {
    const r = await rows<{ k: string; revenue: number; n: number }>(sql`
      select to_char(o.created_at at time zone ${TZ}, 'YYYY-MM-DD') as k, sum(o.total)::float8 as revenue, count(*)::int as n
      from orders o where ${SALE} and o.created_at >= ${PF} and o.created_at < ${T} group by 1`);
    const by = new Map(r.map((x) => [x.k, x]));
    const dayKey = (ms: number) => new Date(ms + VN_OFFSET).toISOString().slice(0, 10);
    const days = Math.round((to - from) / DAY);
    chart = Array.from({ length: days }, (_, i) => {
      const cur = by.get(dayKey(from + i * DAY)), prev = by.get(dayKey(prevFrom + i * DAY));
      const d = new Date(from + i * DAY + VN_OFFSET);
      return { key: dayKey(from + i * DAY), label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, revenue: cur?.revenue ?? 0, before: prev?.revenue ?? 0, orders: cur?.n ?? 0 };
    });
  } else {
    const first = new Date(from + VN_OFFSET), now = new Date(Date.now() + VN_OFFSET);
    const months = (now.getUTCFullYear() - first.getUTCFullYear()) * 12 + now.getUTCMonth() - first.getUTCMonth() + 1;
    const startLastYear = Date.UTC(first.getUTCFullYear() - 1, first.getUTCMonth(), 1) - VN_OFFSET;
    const r = await rows<{ k: string; revenue: number; n: number }>(sql`
      select to_char(o.created_at at time zone ${TZ}, 'YYYY-MM') as k, sum(o.total)::float8 as revenue, count(*)::int as n
      from orders o where ${SALE} and o.created_at >= ${at(startLastYear)} and o.created_at < ${T} group by 1`);
    const by = new Map(r.map((x) => [x.k, x]));
    const mk = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;
    chart = Array.from({ length: months }, (_, i) => {
      const y = first.getUTCFullYear() + Math.floor((first.getUTCMonth() + i) / 12), m = (first.getUTCMonth() + i) % 12;
      const cur = by.get(mk(y, m)), prev = by.get(mk(y - 1, m));
      return { key: mk(y, m), label: `T${m + 1}`, revenue: cur?.revenue ?? 0, before: prev?.revenue ?? 0, orders: cur?.n ?? 0 };
    });
  }

  // Bảo hành: các yêu cầu thuộc đơn bán trong kỳ ÷ cây sống đã giao của các đơn đó (theo nhóm cây).
  const warrantyByGroup = await rows<{ category: string; sub: string; items: number; claims: number }>(sql`
    with plant as (
      select p.category, p.sub, count(*)::int as items
      from order_items oi
      join orders o on o.id = oi.order_id
      join products p on p.slug = oi.product_slug
      where oi.ship = 'plant' and o.kind = 'sale' and o.status = 'delivered' and o.created_at >= ${F} and o.created_at < ${T}
      group by 1, 2
    ), claims as (
      select p.category, p.sub, count(*)::int as n
      from warranty_requests wr
      join orders o on o.id = wr.order_id
      join order_items oi on oi.id = wr.order_item_id
      join products p on p.slug = oi.product_slug
      where o.kind = 'sale' and o.created_at >= ${F} and o.created_at < ${T}
      group by 1, 2
    )
    select plant.category, plant.sub, plant.items, coalesce(claims.n, 0)::int as claims
    from plant left join claims using (category, sub)
    order by plant.items desc`);

  const causes = await rows<{ cause: string; n: number }>(sql`
    select min(trim(wr.cause)) as cause, count(*)::int as n
    from warranty_requests wr join orders o on o.id = wr.order_id
    where o.kind = 'sale' and o.created_at >= ${F} and o.created_at < ${T} and wr.cause is not null and trim(wr.cause) <> ''
    group by lower(trim(wr.cause)) order by n desc, 1 limit 4`);

  const pay = await rows<{ method: string; n: number; revenue: number }>(sql`
    select o.payment_method as method, count(*)::int as n, sum(o.total)::float8 as revenue
    from orders o where ${SALE} and o.created_at >= ${F} and o.created_at < ${T} group by 1 order by n desc`);

  const channel = await rows<{ channel: string; n: number }>(sql`
    select o.channel, count(*)::int as n from orders o where ${SALE} and o.created_at >= ${F} and o.created_at < ${T} group by 1 order by n desc`);

  const delivery = await rows<{ delivery: string; n: number }>(sql`
    select o.delivery, count(*)::int as n from orders o where ${SALE} and o.created_at >= ${F} and o.created_at < ${T} group by 1`);

  // Bán kèm: trong các đơn có cây sống, bao nhiêu % đơn có thêm hàng vật tư thuộc từng danh mục.
  const [plantOrders] = await rows<{ n: number }>(sql`
    select count(distinct oi.order_id)::int as n from order_items oi join orders o on o.id = oi.order_id
    where ${SALE} and oi.ship = 'plant' and o.created_at >= ${F} and o.created_at < ${T}`);
  const withPlant = await rows<{ category: string; n: number }>(sql`
    select p.category, count(distinct oi.order_id)::int as n
    from order_items oi
    join orders o on o.id = oi.order_id
    join products p on p.slug = oi.product_slug
    where ${SALE} and oi.ship = 'supply' and o.created_at >= ${F} and o.created_at < ${T}
      and exists (select 1 from order_items x where x.order_id = oi.order_id and x.ship = 'plant')
    group by 1 order by n desc limit 4`);

  const top = await rows<{ slug: string; name: string; qty: number; revenue: number }>(sql`
    select oi.product_slug as slug, max(oi.name) as name, sum(oi.qty)::int as qty, sum(oi.price * oi.qty)::float8 as revenue
    from order_items oi join orders o on o.id = oi.order_id
    where ${SALE} and o.created_at >= ${F} and o.created_at < ${T}
    group by 1 order by revenue desc, qty desc limit 8`);

  const [qa] = await rows<{ total: number; answered: number; fast: number }>(sql`
    select count(*)::int as total,
           (count(*) filter (where answered_at is not null))::int as answered,
           (count(*) filter (where answered_at is not null and answered_at - created_at <= interval '2 hours'))::int as fast
    from questions where status = 'visible' and created_at >= ${F} and created_at < ${T}`);
  const [rv] = await rows<{ n: number; avg: number; pending: number }>(sql`
    select (count(*) filter (where status = 'published'))::int as n,
           coalesce(avg(stars) filter (where status = 'published'), 0)::float8 as avg,
           (count(*) filter (where status = 'pending'))::int as pending
    from reviews where created_at >= ${F} and created_at < ${T}`);

  // Lãi lỗ = doanh thu − tiền vốn hàng đã bán (order_items.cost) − chi phí khác (sổ chi phí) − hoàn tiền bảo hành, cùng kỳ; kỳ trước tính tương tự.
  // (Trước 11/10/2026 trừ tiền hàng NHẬP trong kỳ — nhập hàng để bán dần thì kỳ nhập bị lỗ ảo. Dòng tiền mua hàng nay xem ở /admin/thu-chi.)
  const [fin, prevFin, sp, prevSp] = await Promise.all([periodFinance(from, to), periodFinance(prevFrom, from), salesProfit(from, to), salesProfit(prevFrom, from)]);
  const revenue = kpi?.revenue ?? 0, prevRevenue = kpi?.prev_revenue ?? 0;

  const plantItems = warrantyByGroup.reduce((a, g) => a + g.items, 0);
  const claims = warrantyByGroup.reduce((a, g) => a + g.claims, 0);

  return {
    range, from, to, daily,
    revenue, prevRevenue,
    finance: {
      ...fin, cogs: sp.cogs, uncostedItems: sp.uncosted, refunds: sp.refunds, profit: revenue - sp.cogs - fin.expenses - sp.refunds,
      prev: { expenses: prevFin.expenses, cogs: prevSp.cogs, refunds: prevSp.refunds, profit: prevRevenue - prevSp.cogs - prevFin.expenses - prevSp.refunds },
    },
    orders: kpi?.orders ?? 0, prevOrders: kpi?.prev_orders ?? 0,
    buyers: kpi?.buyers ?? 0, prevBuyers: kpi?.prev_buyers ?? 0,
    voucherOrders: kpi?.voucher_orders ?? 0, voucherDiscount: kpi?.voucher_discount ?? 0,
    returning: { ...ret, prev: prevRet },
    chart,
    warranty: { plantItems, claims, groups: warrantyByGroup, causes },
    pay, delivery, channel,
    crossSell: { plantOrders: plantOrders?.n ?? 0, rows: withPlant },
    top,
    care: { questions: qa?.total ?? 0, answered: qa?.answered ?? 0, fast: qa?.fast ?? 0, reviews: rv?.n ?? 0, avgStars: rv?.avg ?? 0, pendingReviews: rv?.pending ?? 0 },
  };
}
export type Report = Awaited<ReturnType<typeof buildReport>>;

/** Đơn của kỳ báo cáo (cho sheet "Đơn hàng" khi xuất Excel). */
export async function ordersInRange(range: ReportRange, limit = 5000) {
  const { from, to } = rangeBounds(range);
  return rows<{
    code: string; created: string; customer: string; phone: string; status: string; method: string; paid: boolean;
    delivery: string; subtotal: number; ship: number; discount: number; voucher: string | null; total: number;
  }>(sql`
    select o.code, to_char(o.created_at at time zone ${TZ}, 'YYYY-MM-DD HH24:MI') as created, o.customer_name as customer, o.phone,
           o.status, o.payment_method as method, o.paid, o.delivery, o.subtotal::int, (o.plant_ship + o.supply_ship)::int as ship,
           (o.voucher_discount + o.ship_voucher_discount + o.partner_discount + o.combo_discount)::int as discount, concat_ws(' + ', o.voucher_code, o.ship_voucher_code) as voucher, o.total::int
    from orders o where o.kind = 'sale' and o.created_at >= ${at(from)} and o.created_at < ${at(to)}
    order by o.created_at desc limit ${limit}`);
}
