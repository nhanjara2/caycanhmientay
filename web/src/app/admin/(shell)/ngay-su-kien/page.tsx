import type { Metadata } from 'next';
import { StickerDays } from '@/components/admin/StickerDays';
import { fmtDateTime } from '@/lib/order-labels';
import { vnDate } from '@/lib/shipping';
import { activeStickerDay } from '@/lib/sticker-days';
import { requireAccess } from '@/server/auth';
import { getStickerDays, stickerDaysMeta } from '@/server/sticker-days';

export const metadata: Metadata = { title: 'Ngày sự kiện' };

/** Ngày đặc biệt hiện thành ô sticker (15.10, 11.11…) trên ảnh sản phẩm: mặc định ngày đôi mỗi tháng, shop thêm ngày khác. */
export default async function AdminStickerDaysPage() {
  await requireAccess('promotions');
  const [config, meta] = await Promise.all([getStickerDays(), stickerDaysMeta()]);
  const today = activeStickerDay(config, vnDate());
  return (
    <>
      <StickerDays initial={config} today={today} />
      {meta && <p className="vx-help" style={{ margin: '0 var(--space-4) var(--space-4)' }}>Lần lưu gần nhất: {meta.by} · {fmtDateTime(meta.at)}</p>}
    </>
  );
}
