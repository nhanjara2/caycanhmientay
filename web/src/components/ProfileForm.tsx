'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { updateProfileAction } from '@/app/actions/auth';
import { Avatar } from './Avatar';
import { useAuth } from '@/lib/auth';

/**
 * ProfileForm: họ tên, email, SĐT. Tài khoản Google tự khai SĐT (bắt buộc, không xác thực). Tài khoản SĐT cũ (tạo khi còn
 * đăng nhập OTP) giữ SĐT đã xác thực, khóa không sửa — chưa gắn Google thì nhắc gắn, vì hết phiên này là không đăng nhập lại được.
 */
export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string; phoneVerified: boolean; hasGoogle: boolean; initials: string; avatarUrl: string | null } }) {
  const { setUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await updateProfileAction({ name, email, phone }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (r.ok) { setUser(r.user); setMsg({ ok: true, text: 'Đã cập nhật thông tin' }); router.refresh(); }
      else setMsg({ ok: false, text: r.error });
    });
  };

  return (
    <section className="vx-profile">
      <div className="vx-profile__head">Thông tin cá nhân</div>
      <form className="vx-profile__body" onSubmit={submit}>
        <div className="vx-profile__av"><Avatar initials={initial.initials} url={initial.avatarUrl} /></div>
        {!initial.hasGoogle && (
          <div className="vx-note" role="note">
            <div>
              Website đã bỏ đăng nhập bằng số điện thoại. Hãy liên kết tài khoản Google để lần sau vẫn vào được tài khoản này (đơn hàng, điểm giữ nguyên).
              <a className="vx-btn vx-btn--primary" style={{ marginTop: 8 }} href="/api/auth/google?next=%2Ftai-khoan">Liên kết tài khoản Google</a>
            </div>
          </div>
        )}
        <div className="vx-fl">
          <label htmlFor="pf-name">Họ và tên</label>
          <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Nhập họ và tên" />
        </div>
        {initial.phoneVerified ? (
          <div className="vx-fl vx-fl--locked">
            <label htmlFor="pf-phone">Số điện thoại (đã xác thực)</label>
            <input id="pf-phone" value={initial.phone} disabled />
          </div>
        ) : (
          <div className="vx-fl">
            <label htmlFor="pf-phone">Số điện thoại (bắt buộc để đặt hàng)</label>
            <input id="pf-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="Shop gọi xác nhận đơn qua số này" required />
          </div>
        )}
        <div className="vx-fl">
          <label htmlFor="pf-email">Email (không bắt buộc)</label>
          <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhận hóa đơn và mẹo chăm cây" autoComplete="email" />
        </div>
        {msg && <span className={msg.ok ? 'vx-badge vx-badge--success' : 'vx-err'} role="status" style={{ alignSelf: 'center' }}>{msg.text}</span>}
        <button className="vx-btn vx-btn--primary vx-btn--lg" style={{ alignSelf: 'center' }} disabled={pending}>
          {pending ? 'Đang lưu…' : 'Cập nhật thông tin'}
        </button>
      </form>
    </section>
  );
}
