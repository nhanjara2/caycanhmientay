// Chi phí cửa hàng — hằng số và hàm ngày/tháng dùng chung trình duyệt + server (không import gì của server).

/** Mỗi khoản chi tối đa 1 tỷ đồng (cột integer của Postgres chứa được ~2,1 tỷ). */
export const EXPENSE_MAX = 1_000_000_000;
export const MAX_EXPENSE_NOTE = 200;
export const MAX_EXPENSE_SUPPLIER = 80;
/** Nhóm hệ thống: nơi các khoản chi chưa biết xếp đâu — không xóa được. */
export const FALLBACK_EXPENSE_CATEGORY = 'khac';
/** Nhóm hệ thống: tiền mua cây / hàng về bán ghi thẳng vào sổ — báo cáo cộng vào "Tiền mua hàng" cùng phiếu nhập, không xóa được. */
export const GOODS_EXPENSE_CATEGORY = 'mua-hang';
/** Chi định kỳ chỉ cho ghi lùi tối đa chừng này tháng. */
export const RECURRING_BACKFILL_MONTHS = 36;

export const EXPENSE_RANGES = {
  'thang-nay': 'Tháng này',
  'thang-truoc': 'Tháng trước',
  '3-thang': '3 tháng qua',
  'nam-nay': 'Năm nay',
  'tat-ca': 'Tất cả',
} as const;
export type ExpenseRange = keyof typeof EXPENSE_RANGES;
export const isExpenseRange = (s: string | undefined): s is ExpenseRange => !!s && s in EXPENSE_RANGES;
export const DEFAULT_EXPENSE_RANGE: ExpenseRange = 'thang-nay';

export const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Ngày YYYY-MM-DD có thật (không phải 2026-02-31). */
export const isRealYmd = (s: string) => YMD_RE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/** "2026-10" + n tháng. */
export function addMonths(month: string, n: number) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** Tháng mới nhất mà ngày `day` của tháng đó đã tới (≤ hôm nay). Dùng để biết khoản định kỳ đã đến hạn tới tháng nào. */
export function lastDueMonth(day: number, today: string) {
  const m = today.slice(0, 7);
  return Number(today.slice(8, 10)) >= day ? m : addMonths(m, -1);
}

/** Khoảng ngày [from, to) của kỳ xem chi phí, theo ngày hôm nay (giờ Việt Nam). */
export function expenseRangeBounds(range: ExpenseRange, today: string): { from: string; to: string; prev: { from: string; to: string } | null } {
  const month = today.slice(0, 7);
  const first = (m: string) => `${m}-01`;
  switch (range) {
    case 'thang-nay': return { from: first(month), to: first(addMonths(month, 1)), prev: { from: first(addMonths(month, -1)), to: first(month) } };
    case 'thang-truoc': return { from: first(addMonths(month, -1)), to: first(month), prev: { from: first(addMonths(month, -2)), to: first(addMonths(month, -1)) } };
    case '3-thang': return { from: first(addMonths(month, -2)), to: first(addMonths(month, 1)), prev: { from: first(addMonths(month, -5)), to: first(addMonths(month, -2)) } };
    case 'nam-nay': {
      const y = Number(today.slice(0, 4));
      return { from: `${y}-01-01`, to: `${y + 1}-01-01`, prev: { from: `${y - 1}-01-01`, to: `${y}-01-01` } };
    }
    default: return { from: '2000-01-01', to: '2100-01-01', prev: null };
  }
}

/** Số tiền tóm gọn: 12,3 tr / 1,25 tỷ / 450.000đ. */
export const shortMoney = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e9) return `${sign}${(a / 1e9).toFixed(2).replace('.', ',')} tỷ`;
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(1).replace('.', ',')} tr`;
  return `${sign}${a.toLocaleString('vi-VN')}đ`;
};
