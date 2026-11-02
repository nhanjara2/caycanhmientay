import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeBannerAdmin } from '@/components/admin/HomeBannerAdmin';
import { hasAccess } from '@/lib/permissions';
import { requireAccess } from '@/server/auth';
import { listBannersAdmin } from '@/server/home-banners';

export const metadata: Metadata = { title: 'Banner trang chủ' };

/** Ảnh sự kiện / mùa cây / khuyến mãi trên trang chủ: chủ shop tự tải, đặt link, hẹn ngày hiện. */
export default async function AdminHomeBannersPage() {
  const me = await requireAccess('content');
  const canEdit = hasAccess(me, 'content', 'full');
  const rows = await listBannersAdmin();

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Banner trang chủ</h1>
        <span className="acts">
          <Link href="/" target="_blank" className="vx-btn vx-btn--outline">Xem trang chủ</Link>
        </span>
      </div>
      <div className="vx-callout">
        <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></svg>
        <div>
          Tải ảnh sự kiện, mùa cây, chương trình giảm giá… lên trang chủ. Mỗi ảnh có thể gắn <b>link</b> (bấm vào ảnh mở trang đó) và <b>ngày bắt đầu / kết thúc</b> — hết hạn tự ẩn, không cần nhớ gỡ.
          Ảnh chưa có chữ thì bật <b>“Hiện chữ trên ảnh”</b> để web tự đè tiêu đề + nút lên ảnh; ảnh đã thiết kế sẵn chữ thì tắt.
          <b>Băng ảnh rộng trên cùng</b>: mỗi ảnh kèm một nền riêng (ảnh nền và / hoặc màu) — qua ảnh mới thì cả khoảng nền phía sau đổi theo, như Long Châu.
          Ảnh dựng sẵn của shop cũng nằm trong danh sách dưới đây — sửa, tắt, đổi thứ tự hay xóa như ảnh tự tải; <b>thêm ảnh mới không làm mất ảnh cũ</b>.
        </div>
      </div>
      <HomeBannerAdmin banners={rows} canEdit={canEdit} />
    </div>
  );
}
