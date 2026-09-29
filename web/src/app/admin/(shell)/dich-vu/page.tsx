import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceBoard, ServiceFilters } from '@/components/admin/ServiceBoard';
import { Icon } from '@/components/Icon';
import { SERVICE_TYPES, shortMoney, type ServiceType } from '@/lib/service-labels';
import { requireStaff } from '@/server/auth';
import { serviceBoard, serviceKpis, staffOptions } from '@/server/service-requests';

export const metadata: Metadata = { title: 'Yêu cầu dịch vụ' };

type Props = { searchParams: Promise<{ loai?: string; ks?: string; thua?: string }> };

/** AdminServiceRequests: 4 chỉ số + bảng Kanban Mới → Đã hẹn khảo sát → Đã báo giá → Đang thi công → Hoàn thành (+ Thua). */
export default async function AdminServiceRequestsPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const service = SERVICE_TYPES.includes(sp.loai as ServiceType) ? (sp.loai as ServiceType) : undefined;
  const assignee = Number(sp.ks) > 0 ? Number(sp.ks) : undefined;
  const lost = sp.thua === '1';
  const [cards, kpi, staff] = await Promise.all([serviceBoard({ service, assignee, lost }), serviceKpis(), staffOptions()]);

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Yêu cầu dịch vụ</h1>
        <span className="acts">
          <ServiceFilters staff={staff} value={{ loai: service ?? '', ks: assignee ? String(assignee) : '', thua: lost }} />
          <Link href="/admin/dich-vu/moi" className="vx-btn vx-btn--primary"><Icon name="plus" />Tạo yêu cầu</Link>
        </span>
      </div>
      <div className="ad-kpis">
        <div className="ad-kpi">
          <span><Icon name="receipt" />Yêu cầu tháng này</span>
          <b>{kpi.thisMonth}</b>
          <small>
            {kpi.diff === 0 ? 'Bằng tháng trước' : <><span className={kpi.diff > 0 ? 'ad-up' : 'ad-down'}>{kpi.diff > 0 ? '▲' : '▼'} {Math.abs(kpi.diff)}</span> so với tháng trước</>}
          </small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="check" />Tỉ lệ chốt</span>
          <b>{kpi.closeRate == null ? '—' : `${kpi.closeRate}%`}</b>
          <small>Báo giá → ký hợp đồng</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="cash" />Giá trị hợp đồng</span>
          <b>{kpi.wonValue ? shortMoney(kpi.wonValue) : '0'}</b>
          <small>Đang thi công: {kpi.runningValue ? shortMoney(kpi.runningValue) : '0'}</small>
        </div>
        <div className={`ad-kpi${kpi.overdue ? ' warn' : ''}`}>
          <span><Icon name="clock" />Chưa gọi lại quá 2 giờ</span>
          <b>{kpi.overdue}</b>
          <small>{kpi.overdue ? 'Cần xử lý ngay' : 'Không có yêu cầu quá hạn'}</small>
        </div>
      </div>
      <ServiceBoard cards={cards} showLost={lost} />
      {!cards.length && (
        <p className="vx-help" style={{ textAlign: 'center', margin: 0 }}>
          Chưa có yêu cầu nào{service || assignee ? ' khớp bộ lọc' : ''}. Khách gửi ở trang <Link href="/dich-vu/dat-lich-khao-sat" style={{ color: 'var(--primary)' }}>Đặt lịch khảo sát</Link>, hoặc bấm “Tạo yêu cầu” khi khách gọi hotline.
        </p>
      )}
    </div>
  );
}
