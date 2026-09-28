import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { CopyVoucherCode } from '@/components/CopyVoucherCode';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import { voucherValueText } from '@/lib/voucher-labels';
import { listActiveVouchers } from '@/server/vouchers';

export const metadata: Metadata = { title: 'Khuyến mãi' };

/** Trang Khuyến mãi công khai: danh sách mã giảm giá đang áp dụng (dữ liệu thật từ admin Khuyến mãi). */
export default async function PromotionsPage() {
  await connection(); // danh sách mã còn hiệu lực đổi theo thời gian thật — không cho build sinh trang tĩnh
  const vouchers = await listActiveVouchers();

  return (
    <div className="vx-content app-page">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khuyến mãi' }]} />
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Mã giảm giá đang áp dụng</h1>
      <p className="vx-help" style={{ marginBottom: 16 }}>Chép mã và dán vào ô "Nhập mã giảm giá" ở trang thanh toán.</p>
      {vouchers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vouchers.map((v) => (
            <div key={v.id} className="vx-voucher">
              <span className="vx-voucher__ic sale"><Icon name="tag" /></span>
              <span className="vx-voucher__body">
                <b>{v.label}</b>
                <span className="cond">
                  {voucherValueText(v, money)} · {v.minOrder > 0 ? `Đơn từ ${money(v.minOrder)}` : 'Không điều kiện'}
                </span>
                <span className="cond">
                  Mã: <b style={{ color: 'var(--primary)' }}>{v.code}</b>
                  {v.endsAt && <span className="exp"> · Hết hạn {fmtDate(v.endsAt)}</span>}
                </span>
              </span>
              <CopyVoucherCode code={v.code} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="tag" title="Chưa có mã giảm giá nào" text="Quay lại sau nhé, shop sẽ cập nhật khuyến mãi mới ở đây." />
      )}
    </div>
  );
}
