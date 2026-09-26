'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { googleStatusAction, logoutAction, meAction, requestOtpAction, verifyOtpAction } from '@/app/actions/auth';
import type { PublicUser } from '@/server/auth';

// Đăng nhập SĐT + OTP (Google gắn vào tài khoản SĐT, xem server/auth.ts). Phiên nằm trong cookie httpOnly do server đặt; client chỉ giữ bản hiển thị.

export type User = PublicUser;

/** enabled: nút Google có bật; pendingEmail: đã qua Google, chờ xác thực SĐT để gắn; error: lỗi vừa xảy ra. */
export type GoogleState = { enabled: boolean; pendingEmail: string | null; error: string };

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
  verifyOtp: (phone: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  setUser: (u: User | null) => void;
  google: GoogleState;
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
  const [google, setGoogle] = useState<GoogleState>({ enabled: false, pendingEmail: null, error: '' });

  useEffect(() => {
    meAction().then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
    const params = new URLSearchParams(location.search);
    // "?google=…" do /api/auth/google/callback gắn: chờ gắn SĐT hoặc báo lỗi. Đọc xong thì xóa khỏi URL.
    const g = params.get('google');
    googleStatusAction()
      .then((st) => setGoogle({ ...st, error: g ? GOOGLE_ERRORS[g] ?? '' : '' }))
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
    setGoogle((st) => ({ ...st, pendingEmail: null, error: '' })); // server đã gắn Google (nếu đang chờ)
    router.refresh(); // trang server (đơn hàng, tài khoản) đọc lại phiên mới
    return { ok: true };
  }, [router]);

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
    router.refresh();
  }, [router]);

  return (
    <Ctx.Provider
      value={{
        user, ready, modalOpen, verifyOtp, logout, setUser, google,
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
