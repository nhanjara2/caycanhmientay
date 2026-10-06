import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { money } from '@/lib/format';
import { fmtYmd } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { getReceipt } from '@/server/receipts';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Phiếu nhập ${(await params).code}` };
}

const when = (d: Date) => d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Chi tiết một phiếu nhập (chỉ xem): nhà cung cấp, chứng từ, từng dòng với giá nhập, lô, hạn dùng. */
export default async function ReceiptDetailPage({ params }: Props) {
  await requireAccess('inventory');
  const r = await getReceipt((await params).code.slice(0, 20).toUpperCase());
  if (!r) notFound();
  const units = r.lines.reduce((s, l) => s + l.qty, 0);
  const costed = r.lines.filter((l) => l.unitCost !== null);
  const total = costed.reduce((s, l) => s + l.qty * (l.unitCost ?? 0), 0);

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Phiếu nhập {r.code}</h1>
        <span className="vx-crumb"><Link href="/admin/nhap-hang">Nhập hàng</Link>/<span>{r.code}</span></span>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Thông tin phiếu</div>
        <div className="ad-card__b">
          <div className="ad-kv">
            <span>Thời gian</span><b>{when(r.createdAt)}</b>
            <span>Người nhập</span><b>{r.actor}</b>
            <span>Nguồn</span><b>{r.source === 'excel' ? `File Excel${r.fileName ? ` · ${r.fileName}` : ''}` : 'Nhập tay ở trang Kho'}</b>
            <span>Nhà cung cấp</span><b>{r.supplier ?? '—'}</b>
            <span>Số chứng từ</span><b>{r.docNo ?? '—'}</b>
            <span>Ghi chú</span><b>{r.note ?? '—'}</b>
            <span>Tổng</span>
            <b>
              {r.lines.length} dòng · {units.toLocaleString('vi-VN')} sản phẩm
              {costed.length > 0 && <> · tiền hàng {money(total)}{costed.length < r.lines.length ? ` (${r.lines.length - costed.length} dòng chưa ghi giá nhập)` : ''}</>}
            </b>
          </div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Các dòng nhập</div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Sản phẩm</th><th>Cửa hàng</th><th className="num">Số lượng</th><th className="num">Giá nhập</th><th className="num">Thành tiền</th><th>Số lô</th><th>Hạn dùng</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {r.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.name} · {l.label}<small>{l.sku}-{l.optionIdx + 1} · {l.unit}</small></td>
                  <td data-label="Cửa hàng">{l.store}</td>
                  <td className="num" data-label="Số lượng">{l.qty.toLocaleString('vi-VN')}</td>
                  <td className="num" data-label="Giá nhập">{l.unitCost === null ? '—' : money(l.unitCost)}</td>
                  <td className="num" data-label="Thành tiền">{l.unitCost === null ? '—' : money(l.qty * l.unitCost)}</td>
                  <td data-label="Số lô">{l.lotCode ?? '—'}</td>
                  <td data-label="Hạn dùng">{l.expiry ? fmtYmd(l.expiry) : '—'}</td>
                  <td data-label="Ghi chú">{l.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
