'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { inviteStaffAction, removeStaffAction, setStaffRoleAction } from '@/app/actions/staff';
import { ASSIGNABLE_ROLES, STAFF_ROLE_INFO, type StaffRole } from '@/lib/permissions';
import { Select } from '@/components/Select';

const ROLE_OPTIONS: StaffRole[] = ['manager', ...ASSIGNABLE_ROLES];

/** Nút "Mời nhân viên" + biểu mẫu: email Google, tên, vai trò. */
export function StaffInvite() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
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
      const r = await inviteStaffAction({ email: email.trim(), name, role }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setDone(`Đã thêm ${name}. Họ vào trang Quản trị, bấm "Tiếp tục với Google" và chọn ${email.trim()}.`);
      setEmail(''); setName('');
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
                <label htmlFor="si-email">Email Google (Gmail) đăng nhập</label>
                <input id="si-email" className="vx-input" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder="ten@gmail.com" autoComplete="off" />
              </div>
              <div className="vx-field">
                <label htmlFor="si-role">Vai trò</label>
                <Select id="si-role" className="vx-input" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{STAFF_ROLE_INFO[r].name}</option>)}
                </Select>
              </div>
            </div>
            <p className="vx-help" style={{ margin: 0 }}>{STAFF_ROLE_INFO[role].hint}. Nhân viên đăng nhập bằng đúng tài khoản Google có email này.</p>
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
export function StaffRowActions({ id, name, role, locked, lockReason, invited = false }: {
  id: number; name: string; role: StaffRole; locked: boolean; lockReason: string;
  /** Lời mời chưa ai nhận (chưa đăng nhập Google lần nào): gỡ = hủy lời mời. */
  invited?: boolean;
}) {
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
    if (!confirm(invited ? `Hủy lời mời ${name}?` : `Gỡ quyền nhân viên của ${name}? Tài khoản này sẽ trở lại là khách bình thường.`)) return;
    setError('');
    start(async () => {
      const r = await removeStaffAction(id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  };

  return (
    <span className="app-staff-act">
      <Select className="vx-input" value={value} disabled={pending} aria-label={`Vai trò của ${name}`} onChange={(e) => change(e.target.value as StaffRole)}>
        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{STAFF_ROLE_INFO[r].name}</option>)}
      </Select>
      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={remove}>{invited ? 'Hủy lời mời' : 'Gỡ quyền'}</button>
      {error && <span className="vx-err" role="alert">{error}</span>}
    </span>
  );
}
