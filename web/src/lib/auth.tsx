'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { logoutAction, meAction, requestOtpAction, verifyOtpAction } from '@/app/actions/auth';
import type { PublicUser } from '@/server/auth';

// Đăng nhập SĐT + OTP. Phiên nằm trong cookie httpOnly do server đặt; client chỉ giữ bản hiển thị.

export type User = PublicUser;

type AuthCtx = {
  user: User | null;
  ready: boolean;
  modalOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  requestOtp: (phone: string) => ReturnType<typeof requestOtpAction>;
  verifyOtp: (phone: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  setUser: (u: User | null) => void;
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

  useEffect(() => {
    meAction().then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
    // Link "?dang-nhap=1" (trang cần đăng nhập chuyển về) mở sẵn hộp đăng nhập.
    if (new URLSearchParams(location.search).has('dang-nhap')) setModalOpen(true);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const r = await verifyOtpAction(phone, code);
    if (!r.ok) return { ok: false, error: r.error };
    setUser(r.user);
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
        user, ready, modalOpen, verifyOtp, logout, setUser,
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
