import type { Metadata } from 'next';
import Link from 'next/link';
import { StockImport } from '@/components/admin/StockImport';
import { Icon } from '@/components/Icon';
import { requireStaff } from '@/server/auth';
import { inventorySummary, listStores, MIN_STOCK } from '@/server/inventory';

export const metadata: Metadata = { title: 'Nhập hàng' };

/** AdminPurchasing: nhập nhiều mặt hàng cùng lúc bằng file Excel (tải mẫu → điền → tải lên → xác nhận). Nhập lẻ từng mặt hàng ở trang Kho. */
export default async function AdminPurchasingPage() {
  await requireStaff();
  const [sum, stores] = await Promise.all([inventorySummary(), listStores()]);
  const low = sum.counts['duoi-muc'];

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Nhập hàng</h1>
        <span className="acts"><Link href="/admin/kho" className="vx-btn vx-btn--outline">Kho &amp; tồn kho</Link></span>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">1. Tải file Excel mẫu</div>
        <div className="ad-card__b">
          <p style={{ margin: 0 }}>File mẫu có sẵn mã SKU, tên sản phẩm, quy cách và tồn hiện tại. Bạn chỉ cần điền <b>Số lượng nhập</b> (và Số lô, Hạn dùng với hàng có hạn dùng).</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/admin/nhap-hang/mau" className="vx-btn vx-btn--primary" download>Tải mẫu · tất cả {sum.counts['tat-ca']} quy cách</a>
            <a href="/admin/nhap-hang/mau?loai=duoi-muc" className="vx-btn vx-btn--outline" download>Chỉ hàng dưới mức tối thiểu ({low})</a>
          </div>
          <div className="vx-callout" style={{ fontSize: 12, lineHeight: '17px' }}>
            <Icon name="alert" />
            <div>
              Dòng để trống Số lượng nhập sẽ được bỏ qua, không cần xóa. Cột <b>Cửa hàng nhập</b> chọn mã: {stores.map((s) => `${s.code} (${s.name})`).join(', ')}.
              Hàng ghi “Có” ở cột <b>Theo lô</b> (thuốc BVTV, phân bón, hạt giống) bắt buộc Số lô và Hạn dùng; lô đã hết hạn không nhập kho. Mức tồn tối thiểu là {MIN_STOCK}.
            </div>
          </div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">2. Tải lên file đã điền</div>
        <StockImport />
      </div>
    </div>
  );
}
