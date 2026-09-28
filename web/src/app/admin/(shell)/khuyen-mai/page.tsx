import type { Metadata } from 'next';
import Link from 'next/link';
import { VoucherActiveToggle } from '@/components/admin/VoucherActiveToggle';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import { VOUCHER_STATUS_LABEL, voucherStatus, voucherValueText, WELCOME_CODE, WELCOME_DAYS } from '@/lib/voucher-labels';
import { requireStaff } from '@/server/auth';
import { listVouchers } from '@/server/vouchers';

export const metadata: Metadata = { title: 'Khuyến mãi' };

const STATUS_PILL = { active: 'done', scheduled: 'prep', expired: 'cancel', off: 'wait' } as const;

export default async function AdminVouchersPage() {
  const me = await requireStaff();
  const rows = await listVouchers();
  const isAdmin = me.role === 'admin';

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Khuyến mãi</h1>
        {isAdmin && <span className="acts"><Link href="/admin/khuyen-mai/moi" className="vx-btn vx-btn--primary">+ Tạo mã giảm giá</Link></span>}
      </div>
      <div className="ad-card">
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr><th>Mã</th><th>Giá trị</th><th>Điều kiện</th><th>Thời gian</th><th className="num">Đã dùng</th><th className="num">Doanh thu</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {rows.map(({ v, used, revenue }) => {
                const status = voucherStatus(v);
                return (
                  <tr key={v.id}>
                    <td>
                      {isAdmin ? <Link className="code" href={`/admin/khuyen-mai/${v.id}`}>{v.code}</Link> : <b className="code">{v.code}</b>}
                      <small>{v.label}</small>
                      {v.code === WELCOME_CODE && <small><span className="vx-badge vx-badge--info">Quà tài khoản mới</span> tự tặng khi đăng nhập lần đầu, dùng trong {WELCOME_DAYS} ngày</small>}
                    </td>
                    <td data-label="Giá trị">{voucherValueText(v, money)}</td>
                    <td data-label="Điều kiện">{v.minOrder > 0 ? `Đơn từ ${money(v.minOrder)}` : 'Không điều kiện'}<small>Tối đa {v.perCustomerLimit} lượt/khách</small></td>
                    <td data-label="Thời gian" data-wide>
                      {v.startsAt ? fmtDate(v.startsAt) : 'Không giới hạn'} → {v.endsAt ? fmtDate(v.endsAt) : 'Không giới hạn'}
                    </td>
                    <td className="num" data-label="Đã dùng">{used}{v.usageLimit ? ` / ${v.usageLimit}` : ''}</td>
                    <td className="num" data-label="Doanh thu">{money(revenue)}</td>
                    <td data-label="Trạng thái">
                      {isAdmin
                        ? <VoucherActiveToggle id={v.id} active={v.active} />
                        : <span className={`ad-pill ${STATUS_PILL[status]}`}>{VOUCHER_STATUS_LABEL[status]}</span>}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Chưa có mã giảm giá nào.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} mã</span></div>
      </div>
    </div>
  );
}
