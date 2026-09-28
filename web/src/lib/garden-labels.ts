// Vườn của tôi / Lịch chăm cây — nhãn và cách tính hạn chăm, dùng chung client/server.
// Lịch chăm đơn giản hóa: khoảng cách cố định theo ngày, không theo mẫu từng loài hay thời tiết (xem CLAUDE.md phần Còn dở).

const DAY = 86_400_000;
export const WATER_INTERVAL_DAYS = 3;
export const FERTILIZE_INTERVAL_DAYS = 21;

export const GARDEN_STATUS_LABEL = { healthy: 'Khỏe', attention: 'Cần chú ý' } as const;
export type GardenStatus = keyof typeof GARDEN_STATUS_LABEL;

export type DueInfo = { due: Date; overdue: boolean; daysLeft: number };

/** Chưa từng làm (last = null) thì coi như đến hạn ngay — tạo việc đầu tiên khi cây vào vườn. */
export function nextDue(last: Date | null, intervalDays: number, now = Date.now()): DueInfo {
  const base = (last ?? new Date(0)).getTime();
  const due = new Date(base + intervalDays * DAY);
  return { due, overdue: due.getTime() <= now, daysLeft: Math.ceil((due.getTime() - now) / DAY) };
}

export const plantAgeDays = (plantedAt: Date, now = Date.now()) => Math.max(0, Math.floor((now - plantedAt.getTime()) / DAY));

export function plantAgeText(days: number) {
  if (days < 30) return `${days} ngày`;
  if (days < 365) return `${Math.floor(days / 30)} tháng`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m > 0 ? `${y} năm ${m} tháng` : `${y} năm`;
}
