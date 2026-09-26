'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isPhone, normalizePhone, useAuth } from '@/lib/auth';
import { Icon } from './Icon';

/** Hộp Đăng nhập / Đăng ký gộp: SĐT → OTP 6 số (gửi qua Zalo, SMS dự phòng), hoặc Google. */
export function AuthModal() {
  const { modalOpen, closeLogin } = useAuth();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeLogin();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeLogin]);
  if (!modalOpen) return null;
  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label="Đăng nhập" onClick={(e) => e.target === e.currentTarget && closeLogin()}>
      <OtpLoginBox onDone={closeLogin} onClose={closeLogin} />
    </div>
  );
}

/** Hộp đăng nhập OTP (dùng trong AuthModal và trang đăng nhập quản trị). */
export function OtpLoginBox({ onDone, onClose, googleNext, title = 'Đăng nhập Cây Cảnh Miền Tây', subtitle = 'Theo dõi đơn, bảo hành cây và nhận lịch chăm cây' }: {
  /** Trang quay về sau khi đăng nhập Google (mặc định: trang đang xem). */
  onDone: () => void; onClose?: () => void; googleNext?: string; title?: string; subtitle?: string;
}) {
  const { requestOtp, verifyOtp, options } = useAuth();
  const closeLogin = onClose ?? (() => {});
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [devCode, setDevCode] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!isPhone(phone)) { setError('Số điện thoại chưa đúng'); return; }
    setError(''); setBusy(true);
    const r = await requestOtp(phone).catch(() => ({ ok: false as const, error: 'Không gửi được mã. Vui lòng thử lại.', retryAfter: undefined }));
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      if (r.retryAfter) { setStep('otp'); setLeft(r.retryAfter); }
      return;
    }
    setDevCode(r.devCode ?? '');
    setCode(''); setStep('otp'); setLeft(60);
    setTimeout(() => otpRef.current?.focus(), 50);
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await verifyOtp(phone, code).catch(() => ({ ok: false, error: 'Có lỗi, vui lòng thử lại' }));
    setBusy(false);
    if (r.ok) onDone();
    else setError(r.error ?? 'Mã xác thực chưa đúng');
  };

  const loginWithGoogle = () => {
    const params = new URLSearchParams(location.search);
    params.delete('dang-nhap');
    const next = googleNext ?? location.pathname + (params.size ? `?${params}` : '');
    location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  return (
      <div className="au-box">
        <div className="au-head">
          {onClose && <button type="button" className="x" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>}
          <span className="mark"><Icon name={step === 'phone' ? 'leaf' : 'shield'} /></span>
          {step === 'phone' ? (
            <>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </>
          ) : (
            <>
              <h2>Nhập mã xác thực</h2>
              <p>
                Mã 6 số đã gửi qua <b>Zalo</b> tới {normalizePhone(phone)}{' '}
                <a style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setStep('phone')}>Đổi số</a>
              </p>
            </>
          )}
        </div>

        {step === 'phone' ? (
          <form className="au-body" onSubmit={sendOtp}>
            <div className="au-perk"><span>Tặng voucher 50.000đ</span><span>Tích điểm mọi đơn</span></div>
            {options.phone && (
              <>
                <div className="au-phone">
                  <span>+84</span>
                  <input autoFocus inputMode="tel" autoComplete="tel" placeholder="Nhập số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {error && <span className="vx-err">{error}</span>}
                <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={busy}>Tiếp tục</button>
              </>
            )}
            {options.googleError && <span className="vx-err">{options.googleError}</span>}
            {options.google && (
              <>
                {options.phone && <div className="au-or">hoặc</div>}
                <div className="au-social">
                  <button type="button" className="au-sbtn" onClick={loginWithGoogle}><span className="logo">G</span>Tiếp tục với Google</button>
                </div>
              </>
            )}
            {!options.phone && !options.google && <span className="vx-err">Đăng nhập tạm thời chưa mở. Vui lòng quay lại sau.</span>}
            <p className="au-terms">
              Bằng việc tiếp tục, bạn đồng ý với <Link href="/chinh-sach/dieu-khoan" onClick={closeLogin}>Điều khoản sử dụng</Link> và{' '}
              <Link href="/chinh-sach/bao-mat" onClick={closeLogin}>Chính sách bảo mật dữ liệu cá nhân</Link> của Cây Cảnh Miền Tây.
            </p>
          </form>
        ) : (
          <form className="au-body" onSubmit={confirm}>
            <label className="au-otp" onClick={() => otpRef.current?.focus()}>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={i < code.length ? 'f' : i === code.length ? 'cur' : undefined}>{code[i] ?? ''}</span>
              ))}
              <input
                ref={otpRef}
                className="app-sr"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Mã OTP"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
            {error && <span className="vx-err" style={{ textAlign: 'center' }}>{error}</span>}
            <div className="au-resend">
              {left > 0 ? <>Gửi lại mã sau <b>00:{String(left).padStart(2, '0')}</b></> : <a style={{ cursor: 'pointer' }} onClick={() => sendOtp()}>Gửi lại mã</a>}
              {' · '}<a style={{ cursor: 'pointer' }} onClick={() => sendOtp()}>Gửi qua SMS</a>
            </div>
            <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={code.length < 6 || busy}>Xác nhận</button>
            {devCode && <p className="au-terms">Chế độ chạy thử — mã OTP: <b>{devCode}</b> (cũng in ở log server).</p>}
          </form>
        )}
      </div>
  );
}
