import type { Metadata } from 'next';
import Link from 'next/link';
import { Thumb } from '@/components/Icon';
import { fmtDateTime } from '@/lib/order-labels';
import { WARRANTY_RESOLUTION_LABEL, WARRANTY_STATUS_LABEL } from '@/lib/warranty-labels';
import { maskPhone, requireStaff } from '@/server/auth';
import { WARRANTY_STATUSES } from '@/server/db/schema';
import { countWarrantyByStatus, listWarranty } from '@/server/warranty';

export const metadata: Metadata = { title: 'Bảo hành cây' };

type Status = (typeof WARRANTY_STATUSES)[number];
type Props = { searchParams: Promise<{ trang_thai?: string }> };
const PILL: Record<Status, string> = { pending: 'new', approved: 'done', rejected: 'cancel' };

export default async function AdminWarrantyListPage({ searchParams }: Props) {
  await requireStaff();
  const raw = (await searchParams).trang_thai;
  const status = WARRANTY_STATUSES.includes(raw as Status) ? (raw as Status) : undefined;
  const rows = await listWarranty(status);
  const counts = await countWarrantyByStatus();

  return (
    <div className="ad-body">
      <div className="ad-title"><h1>Bảo hành cây</h1></div>
      <div className="ad-card">
        <div className="ad-stabs">
          <Link href="/admin/bao-hanh" aria-current={!status ? 'true' : undefined}>Tất cả</Link>
          {WARRANTY_STATUSES.map((s) => (
            <Link key={s} href={`/admin/bao-hanh?trang_thai=${s}`} aria-current={status === s ? 'true' : undefined}>
              {WARRANTY_STATUS_LABEL[s]}{counts[s] ? <em>{counts[s]}</em> : null}
            </Link>
          ))}
        </div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Mã</th><th>Cây</th><th>Khách</th><th>Triệu chứng</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.w.id}>
                  <td><Link className="code" href={`/admin/bao-hanh/${r.w.id}`}>{r.code}</Link><small>{fmtDateTime(r.w.createdAt)}</small></td>
                  <td data-label="Cây" data-wide><span className="ad-prod"><span className="ad-thumb"><Thumb src={r.itemImage} icon={r.itemIcon} /></span><span>{r.itemName}<small>Đơn {r.orderCode} · {r.photos.length} ảnh</small></span></span></td>
                  <td data-label="Khách">{r.customer ?? 'Khách hàng'}<small>{r.customerPhone ? maskPhone(r.customerPhone) : ''}</small></td>
                  <td data-label="Triệu chứng">{r.w.symptoms.join(', ')}</td>
                  <td data-label="Trạng thái">
                    <span className={`ad-pill ${PILL[r.w.status]}`}>{WARRANTY_STATUS_LABEL[r.w.status]}</span>
                    {r.w.resolution && <small>{WARRANTY_RESOLUTION_LABEL[r.w.resolution]}</small>}
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Chưa có yêu cầu bảo hành.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
