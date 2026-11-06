'use client';

import Link from '@/components/LocaleLink';
import { useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/format';
import { useModalFocus } from '@/lib/use-modal';
import { welcomeText } from '@/lib/voucher-labels';
import { Icon } from './Icon';
import { useTranslations } from 'next-intl';

/** Hộp Đăng nhập / Đăng ký gộp: chỉ đăng nhập bằng Google (đã bỏ SĐT + OTP — shop không đăng ký dịch vụ gửi mã). */
export function AuthModal() {
  const { modalOpen, closeLogin } = useAuth();
  const box = useRef<HTMLDivElement>(null);
  useModalFocus(box, closeLogin, modalOpen);
  const t = useTranslations('auth');
  if (!modalOpen) return null;
  return (
    <div ref={box} tabIndex={-1} className="app-modal" role="dialog" aria-modal="true" aria-label={t('dialog')} onClick={(e) => e.target === e.currentTarget && closeLogin()}>
      <LoginBox onClose={closeLogin} />
    </div>
  );
}

/** Hộp đăng nhập (dùng trong AuthModal và trang đăng nhập quản trị). */
export function LoginBox({ onClose, googleNext, perks = true, title, subtitle }: {
  /** Trang quay về sau khi đăng nhập Google (mặc định: trang đang xem). */
  onClose?: () => void; googleNext?: string; title?: string; subtitle?: string;
  /** Quyền lợi khách hàng (quà tài khoản mới, tích điểm) — tắt ở trang đăng nhập nhân viên. */
  perks?: boolean;
}) {
  const { options } = useAuth();
  const t = useTranslations('auth');
  const closeLogin = onClose ?? (() => {});

  const loginWithGoogle = () => {
    const params = new URLSearchParams(location.search);
    params.delete('dang-nhap');
    const next = googleNext ?? location.pathname + (params.size ? `?${params}` : '');
    location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="au-box">
      <div className="au-head">
        {onClose && <button type="button" className="x" aria-label={t('close')} onClick={onClose}><Icon name="close" /></button>}
        <span className="mark"><Icon name="leaf" /></span>
        <h2>{title ?? t('title')}</h2>
        <p>{subtitle ?? t('subtitle')}</p>
      </div>

      <div className="au-body">
        {perks && (
          <>
            <div className="au-perk">
              {options.welcome && (
                <span>{options.welcome.discountType === 'amount' ? t('voucherAmount', { v: money(options.welcome.discountValue) }) : t('voucherPct', { v: options.welcome.discountValue })}</span>
              )}
              <span>{t('points')}</span>
            </div>
            {options.welcome && (
              <p className="au-terms" style={{ margin: 0 }}>
                {t('welcome', { text: welcomeText(options.welcome, money).toLowerCase(), days: options.welcome.days })}
              </p>
            )}
          </>
        )}
        {options.googleError && <span className="vx-err">{options.googleError}</span>}
        {/* Chưa biết Google bật hay chưa thì vẫn hiện nút (bấm khi chưa bật: /api/auth/google báo lỗi "chua-bat"). */}
        {!options.loaded || options.google ? (
          <div className="au-social">
            <button type="button" className="au-sbtn" autoFocus onClick={loginWithGoogle}><svg className="logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>{t('google')}</button>
          </div>
        ) : (
          <span className="vx-err">{t('closed')}</span>
        )}
        <p className="au-terms">
          {t.rich('terms', {
            terms: (c) => <Link href="/chinh-sach/dieu-khoan" onClick={closeLogin}>{c}</Link>,
            privacy: (c) => <Link href="/chinh-sach/bao-mat" onClick={closeLogin}>{c}</Link>,
          })}
        </p>
      </div>
    </div>
  );
}
