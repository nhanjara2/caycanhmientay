'use client';

import { usePathname } from '@/components/LocaleLink';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { setContactPhoneAction } from '@/app/actions/auth';
import { isPhone, useAuth, type User } from '@/lib/auth';
import { useModalFocus } from '@/lib/use-modal';
import { Icon } from './Icon';

/** Hộp khai SĐT cho tài khoản Google: bắt buộc trước khi đặt hàng, KHÔNG gửi mã xác thực. */
export function PhoneModal({ initial = '', note, onClose, onSaved }: {
  initial?: string;
  /** Dòng giải thích dưới tiêu đề. */
  note?: string;
  onClose: () => void;
  onSaved?: (u: User) => void;
}) {
  const { setUser } = useAuth();
  const [phone, setPhone] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const box = useRef<HTMLDivElement>(null);
  useModalFocus(box, onClose);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isPhone(phone)) { setError('Số điện thoại chưa đúng'); return; }
    setError(''); setBusy(true);
    const r = await setContactPhoneAction(phone).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setUser(r.user);
    onClose();
    onSaved?.(r.user);
  };

  return (
    <div ref={box} tabIndex={-1} className="app-modal app-modal--top" role="dialog" aria-modal="true" aria-label="Cập nhật số điện thoại" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="au-box">
        <div className="au-head">
          <button type="button" className="x" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
          <span className="mark"><Icon name="phone" /></span>
          <h2>Cập nhật số điện thoại</h2>
          <p>{note ?? 'Bắt buộc để đặt hàng — shop gọi xác nhận đơn và giao hàng qua số này.'}</p>
        </div>
        <form className="au-body" onSubmit={submit}>
          <div className="au-phone">
            <span>+84</span>
            <input autoFocus inputMode="tel" autoComplete="tel" placeholder="Nhập số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Số điện thoại" />
          </div>
          {error && <span className="vx-err" role="alert">{error}</span>}
          <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu số điện thoại'}</button>
          <p className="au-terms">Không cần mã xác thực. Bạn có thể đổi số này trong Tài khoản → Thông tin cá nhân.</p>
        </form>
      </div>
    </div>
  );
}

const DISMISS_KEY = 'ccmt_phone_prompt_dismissed';

/** Nhắc một lần mỗi phiên trình duyệt khi khách đăng nhập Google mà chưa có SĐT (trang thanh toán tự hỏi khi bấm Đặt hàng). */
export function PhonePrompt() {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1'); } catch { setDismissed(false); }
  }, []);

  if (!ready || !user || user.phone || user.role !== 'customer' || dismissed || pathname === '/thanh-toan') return null;
  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* trình duyệt chặn lưu trữ: chỉ ẩn trong lần xem này */ }
  };
  return <PhoneModal onClose={close} />;
}
