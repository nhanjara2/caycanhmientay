import type { Metadata } from 'next';
import Link from 'next/link';
import { StockImport } from '@/components/admin/StockImport';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { requireAccess } from '@/server/auth';
import { inventorySummary, listStores, MIN_STOCK } from '@/server/inventory';
import { listReceipts, listSupplierNames } from '@/server/receipts';

export const metadata: Metadata = { title: 'Nhập hàng' };

const when = (d: Date) => d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** AdminPurchasing: nhập nhiều mặt hàng cùng lúc bằng file Excel (tải mẫu → điền → tải lên → xác nhận) thành một phiếu nhập. Nhập lẻ từng mặt hàng ở trang Kho. */
export default async function AdminPurchasingPage() {
  const staff = await requireAccess('inventory');
  const [sum, stores, suppliers, receipts] = await Promise.all([inventorySummary(), listStores(), listSupplierNames(), listReceipts(20)]);
  const low = sum.counts['duoi-muc'];
  const link = { color: 'var(--primary)', fontWeight: 600 } as const;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Nhập hàng</h1>
        <span className="acts"><Link href="/admin/kho" className="vx-btn vx-btn--outline">Kho &amp; tồn kho</Link></span>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">1. Tải file Excel mẫu</div>
        <div className="ad-card__b">
          <p style={{ margin: 0 }}>File mẫu có sẵn mã SKU, tên sản phẩm, quy cách, đơn vị, xuất xứ, danh mục và tồn hiện tại. Bạn điền <b>Số lượng nhập</b>, <b>Giá nhập</b> (không bắt buộc) và Số lô, Hạn dùng với hàng có hạn dùng.</p>
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
        <div className="ad-card__h">Hàng mới, lô mới — làm thế nào?</div>
        <div className="ad-card__b" style={{ fontSize: 13, lineHeight: '19px' }}>
          <div>
            <b>Thêm lô mới cho hàng đã có.</b> Ghi Số lô và Hạn dùng của đợt hàng mới vào file mẫu. Khác với các lô đang có thì tự thành <b>lô mới</b>, lô cũ giữ nguyên.
            Trùng cả Số lô lẫn Hạn dùng (cùng cửa hàng) thì số lượng được <b>cộng thêm</b> vào lô đó. Nhập hàng không bao giờ làm mất tồn cũ.
          </div>
          <div>
            <b>Sản phẩm chưa có trong hệ thống.</b> File Excel không tạo được sản phẩm mới. Làm theo 3 bước:
            <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              <li>
                {staff.role === 'admin' ? <Link href="/admin/san-pham/moi" style={link}>Sản phẩm → Thêm mới</Link> : <>Nhờ quản trị viên vào Sản phẩm → Thêm mới</>}
                : điền thông tin và quy cách. Mã SKU tự sinh.
              </li>
              <li>Cây, chậu, vật tư thường có thể điền luôn Tồn đầu kỳ. <b>Thuốc BVTV, phân bón, hạt giống</b> để Tồn đầu kỳ = 0 (hệ thống không nhận tồn không có số lô và hạn dùng).</li>
              <li><b>Tải lại file mẫu</b> ở bước 1 (file tải từ trước không có sản phẩm mới), điền số lượng, giá nhập, số lô, hạn dùng rồi tải lên.</li>
            </ol>
          </div>
          <div><b>Chỉ nhập 1–2 mặt hàng?</b> Dùng nút “Nhập / Kiểm kê” ở trang <Link href="/admin/kho" style={link}>Kho &amp; tồn kho</Link> cho nhanh — cũng ra phiếu nhập.</div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">2. Tải lên file đã điền</div>
        <StockImport suppliers={suppliers} />
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Phiếu nhập gần đây</div>
        {receipts.length === 0 ? (
          <div className="ad-card__b"><span style={{ color: 'var(--ink-muted)' }}>Chưa có phiếu nhập nào. Mỗi lần xác nhận nhập kho sẽ tạo một phiếu ở đây.</span></div>
        ) : (
          <div className="ad-tablewrap">
            <table className="ad-table app-mtable">
              <thead><tr><th>Phiếu</th><th>Thời gian</th><th>Nhà cung cấp</th><th>Chứng từ</th><th className="num">Dòng</th><th className="num">Số lượng</th><th className="num">Tiền hàng</th><th>Người nhập</th></tr></thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/admin/nhap-hang/phieu/${r.code}`} style={link}>{r.code}</Link><small>{r.source === 'excel' ? 'Excel' : 'Nhập tay'}</small></td>
                    <td data-label="Thời gian">{when(r.createdAt)}</td>
                    <td data-label="Nhà cung cấp">{r.supplier ?? '—'}</td>
                    <td data-label="Chứng từ">{r.docNo ?? '—'}</td>
                    <td className="num" data-label="Dòng">{r.lines}</td>
                    <td className="num" data-label="Số lượng">{r.units.toLocaleString('vi-VN')}</td>
                    <td className="num" data-label="Tiền hàng">{r.costed ? money(r.total) : '—'}{r.costed > 0 && r.costed < r.lines && <small>{r.lines - r.costed} dòng chưa ghi giá</small>}</td>
                    <td data-label="Người nhập">{r.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
