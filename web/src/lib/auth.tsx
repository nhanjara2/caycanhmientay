'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loginOptionsAction, logoutAction, meAction, requestOtpAction, verifyOtpAction } from '@/app/actions/auth';
import type { WelcomeOffer, WelcomeProgram } from '@/lib/voucher-labels';
import type { PublicUser } from '@/server/auth';

// Đăng nhập Google hoặc SĐT + OTP (xem server/auth.ts). Phiên nằm trong cookie httpOnly do server đặt; client chỉ giữ bản hiển thị.

export type User = PublicUser;

/** Cách đăng nhập đang bật + lỗi Google vừa xảy ra (từ "?google=…") + quà tài khoản mới đang chạy. */
export type LoginOptions = { google: boolean; phone: boolean; googleError: string; welcome: WelcomeProgram | null };

const GOOGLE_ERRORS: Record<string, string> = {
  'chua-bat': 'Đăng nhập Google chưa được bật.',
  huy: 'Bạn đã hủy đăng nhập Google.',
  phien: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.',
  google: 'Không đăng nhập được bằng Google. Vui lòng thử lại.',
};

type AuthCtx = {
  user: User | null;
  ready: boolean;
  modalOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  requestOtp: (phone: string) => ReturnType<typeof requestOtpAction>;
  /** welcome: quà tài khoản mới nếu đây là lần đăng nhập đầu tiên. */
  verifyOtp: (phone: string, code: string) => Promise<{ ok: boolean; error?: string; welcome?: WelcomeOffer | null }>;
  setUser: (u: User | null) => void;
  options: LoginOptions;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const normalizePhone = (s: string) => s.replace(/[^\d+]/g, '').replace(/^\+?84/, '0');
export const isPhone = (s: string) => /^0(3|5|7|8|9)\d{8}$/.test(normalizePhone(s));

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [options, setOptions] = useState<LoginOptions>({ google: false, phone: true, googleError: '', welcome: null });

  useEffect(() => {
    meAction().then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
    const params = new URLSearchParams(location.search);
    // "?google=<lỗi>" do /api/auth/google gắn khi đăng nhập Google không thành. Đọc xong thì xóa khỏi URL.
    const g = params.get('google');
    loginOptionsAction()
      .then((o) => setOptions({ ...o, googleError: g ? GOOGLE_ERRORS[g] ?? '' : '' }))
      .catch(() => {});
    if (g) {
      params.delete('google');
      history.replaceState(null, '', location.pathname + (params.size ? `?${params}` : '') + location.hash);
    }
    // Link "?dang-nhap=1" (trang cần đăng nhập chuyển về) mở sẵn hộp đăng nhập.
    if (params.has('dang-nhap') || g) setModalOpen(true);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const r = await verifyOtpAction(phone, code);
    if (!r.ok) return { ok: false, error: r.error };
    setUser(r.user);
    router.refresh(); // trang server (đơn hàng, tài khoản) đọc lại phiên mới
    return { ok: true, welcome: r.welcome };
  }, [router]);

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
    router.refresh();
  }, [router]);

  return (
    <Ctx.Provider
      value={{
        user, ready, modalOpen, verifyOtp, logout, setUser, options,
        requestOtp: requestOtpAction,
        openLogin: () => setModalOpen(true),
        closeLogin: () => setModalOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}
