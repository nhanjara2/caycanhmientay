'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { inviteStaffAction, removeStaffAction, setStaffRoleAction } from '@/app/actions/staff';
import { ASSIGNABLE_ROLES, STAFF_ROLE_INFO, type StaffRole } from '@/lib/permissions';

const ROLE_OPTIONS: StaffRole[] = ['manager', ...ASSIGNABLE_ROLES];

/** Nút "Mời nhân viên" + biểu mẫu: SĐT, tên, vai trò. */
export function StaffInvite() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('cskh');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDone('');
    start(async () => {
      const r = await inviteStaffAction({ phone, name, role }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setDone(`Đã thêm ${name}. Họ đăng nhập ở trang Quản trị bằng số ${phone} (nhận mã OTP).`);
      setPhone(''); setName('');
      router.refresh();
    });
  };

  return (
    <>
      <button type="button" className="vx-btn vx-btn--primary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Đóng' : '+ Mời nhân viên'}
      </button>
      {open && (
        <form className="ad-card app-staff-invite" onSubmit={submit}>
          <div className="ad-card__h">Mời nhân viên mới</div>
          <div className="ad-card__b">
            <div className="app-staff-invite__grid">
              <div className="vx-field">
                <label htmlFor="si-name">Tên nhân viên</label>
                <input id="si-name" className="vx-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Lê Thị Thảo" autoComplete="off" />
              </div>
              <div className="vx-field">
                <label htmlFor="si-phone">Số điện thoại đăng nhập</label>
                <input id="si-phone" className="vx-input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="09xx xxx xxx" autoComplete="off" />
              </div>
              <div className="vx-field">
                <label htmlFor="si-role">Vai trò</label>
                <select id="si-role" className="vx-input" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{STAFF_ROLE_INFO[r].name}</option>)}
                </select>
              </div>
            </div>
            <p className="vx-help" style={{ margin: 0 }}>{STAFF_ROLE_INFO[role].hint}. Nhân viên đăng nhập bằng đúng số điện thoại này (mã OTP gửi về số đó).</p>
            {error && <span className="vx-err" role="alert">{error}</span>}
            {done && <span className="vx-ok" role="status" style={{ color: 'var(--success)', fontSize: '0.8125rem' }}>{done}</span>}
            <span className="acts" style={{ display: 'flex', gap: 8 }}>
              <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang thêm…' : 'Thêm nhân viên'}</button>
            </span>
          </div>
        </form>
      )}
    </>
  );
}

/** Ô đổi vai trò + nút gỡ quyền của một dòng nhân viên. `locked` = tài khoản cấu hình hệ thống / chính mình. */
export function StaffRowActions({ id, name, role, locked, lockReason }: { id: number; name: string; role: StaffRole; locked: boolean; lockReason: string }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  if (locked) return <span className="vx-help" style={{ margin: 0 }}>{lockReason}</span>;

  const change = (next: StaffRole) => {
    const prev = value;
    setValue(next);
    setError('');
    start(async () => {
      const r = await setStaffRoleAction(id, next).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); setValue(prev); }
      router.refresh();
    });
  };
  const remove = () => {
    if (!confirm(`Gỡ quyền nhân viên của ${name}? Tài khoản này sẽ trở lại là khách bình thường.`)) return;
    setError('');
    start(async () => {
      const r = await removeStaffAction(id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  };

  return (
    <span className="app-staff-act">
      <select className="vx-input" value={value} disabled={pending} aria-label={`Vai trò của ${name}`} onChange={(e) => change(e.target.value as StaffRole)}>
        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{STAFF_ROLE_INFO[r].name}</option>)}
      </select>
      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={remove}>Gỡ quyền</button>
      {error && <span className="vx-err" role="alert">{error}</span>}
    </span>
  );
}
