import type { Metadata } from 'next';
import { StaffInvite, StaffRowActions } from '@/components/admin/StaffAdmin';
import { Icon } from '@/components/Icon';
import { AREAS, AREA_INFO, ASSIGNABLE_ROLES, STAFF_ROLE_INFO, STAFF_ROLES, type Level } from '@/lib/permissions';
import { fmtDateTime } from '@/lib/order-labels';
import { maskPhone, requireAccess } from '@/server/auth';
import { listStaff } from '@/server/staff';

export const metadata: Metadata = { title: 'Phân quyền' };

const MARK: Record<Level, { cls: string; text: string; label: string }> = {
  full: { cls: 'full', text: '✓', label: 'Toàn quyền' },
  view: { cls: 'view', text: '👁', label: 'Chỉ xem' },
  none: { cls: 'none', text: '–', label: 'Ẩn' },
};

const initials = (name: string | null) => (name ?? '?').split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase();

/** AdminRoles: ma trận vai trò × chức năng + danh sách nhân viên (mời, đổi vai trò, gỡ quyền). Chỉ Quản lý. */
export default async function AdminRolesPage() {
  const me = await requireAccess('settings');
  const staff = await listStaff();
  const demo = process.env.OTP_DEMO === '1';

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Phân quyền</h1>
        <span className="acts"><StaffInvite /></span>
      </div>

      {demo && (
        <div className="vx-note" role="alert">
          <Icon name="alert" />
          <div>
            Website đang ở chế độ <b>chạy thử OTP</b> (mã đăng nhập hiện ngay trên màn hình): ai biết số điện thoại của nhân viên đều đăng nhập được.
            Hãy tắt chế độ này (bỏ biến <code>OTP_DEMO</code>) và cấu hình gửi OTP thật trước khi bán chính thức.
          </div>
        </div>
      )}

      <div className="ad-card">
        <div className="ad-card__h">
          Quyền theo vai trò
          <span className="ad-legend2">
            {(['full', 'view', 'none'] as Level[]).map((l) => <span key={l}><span className={`ad-perm ${MARK[l].cls}`}>{MARK[l].text}</span>{MARK[l].label}</span>)}
          </span>
        </div>
        <div className="ad-tablewrap">
          <table className="ad-table ad-matrix">
            <thead>
              <tr>
                <th>Chức năng</th>
                {STAFF_ROLES.map((r) => <th key={r} title={STAFF_ROLE_INFO[r].hint}>{STAFF_ROLE_INFO[r].name}</th>)}
              </tr>
            </thead>
            <tbody>
              {AREAS.map((a) => (
                <tr key={a}>
                  <td>{AREA_INFO[a].name}</td>
                  {AREA_INFO[a].levels.map((l, i) => (
                    <td key={STAFF_ROLES[i]}><span className={`ad-perm ${MARK[l].cls}`} title={MARK[l].label}>{MARK[l].text}</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ad-card__b">
          <p className="vx-help" style={{ margin: 0 }}>
            <b>Quản lý</b> là quản trị viên: toàn quyền, thêm / gỡ nhân viên. Các vai trò khác gán cho nhân viên: {ASSIGNABLE_ROLES.map((r) => `${STAFF_ROLE_INFO[r].name} — ${STAFF_ROLE_INFO[r].hint.toLowerCase()}`).join('; ')}.
            Quyền áp dụng ngay khi bạn đổi vai trò; mục không có quyền sẽ ẩn khỏi menu của nhân viên.
          </p>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Nhân viên ({staff.length})</div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Tên</th><th>Số điện thoại</th><th>Đăng nhập gần nhất</th><th>Vai trò</th></tr></thead>
            <tbody>
              {staff.map((s) => {
                const phone = s.phone ?? s.contactPhone;
                const self = s.id === me.id;
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="ad-prod">
                        <span className="app-staff-ava" aria-hidden="true">{initials(s.name)}</span>
                        <span>{s.name ?? 'Chưa có tên'}{self && ' (bạn)'}<small>{s.email ?? ''}</small></span>
                      </span>
                    </td>
                    <td data-label="Số điện thoại">{phone ? maskPhone(phone) : '—'}</td>
                    <td data-label="Đăng nhập gần nhất">{s.lastLogin ? fmtDateTime(s.lastLogin) : <span style={{ color: 'var(--ink-muted)' }}>Chưa đăng nhập</span>}</td>
                    <td data-label="Vai trò">
                      <StaffRowActions
                        id={s.id}
                        name={s.name ?? 'nhân viên này'}
                        role={s.effective}
                        locked={self || s.locked}
                        lockReason={self ? `${STAFF_ROLE_INFO[s.effective].name} · tài khoản của bạn` : `${STAFF_ROLE_INFO[s.effective].name} · cấu hình hệ thống`}
                      />
                    </td>
                  </tr>
                );
              })}
              {!staff.length && <tr><td colSpan={4} style={{ color: 'var(--ink-muted)' }}>Chưa có nhân viên nào.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-card__b">
          <p className="vx-help" style={{ margin: 0 }}>
            Thao tác nhạy cảm của nhân viên (xác nhận hoàn tiền, xóa sản phẩm, đổi giá) chỉ Quản lý làm được. Lịch sử đơn, bảo hành, kho đều ghi tên người thao tác.
          </p>
        </div>
      </div>
    </div>
  );
}
