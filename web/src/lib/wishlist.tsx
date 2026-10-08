'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { wishlistSlugsAction } from '@/app/actions/wishlist';
import { useAuth } from './auth';

// Danh sách sản phẩm yêu thích của người đang đăng nhập — tải một lần, dùng cho tim trên mọi thẻ sản phẩm
// (một trang có hàng chục thẻ; mỗi thẻ hỏi server riêng thì quá nhiều lượt gọi).

type WishCtx = { has: (slug: string) => boolean; set: (slug: string, on: boolean) => void };

const Ctx = createContext<WishCtx>({ has: () => false, set: () => {} });

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ready) return;
    if (!user) { setSlugs(new Set()); return; }
    let live = true;
    wishlistSlugsAction().then((list) => { if (live) setSlugs(new Set(list)); }).catch(() => {});
    return () => { live = false; };
  }, [ready, user]);

  const has = useCallback((slug: string) => slugs.has(slug), [slugs]);
  const set = useCallback((slug: string, on: boolean) => setSlugs((cur) => {
    if (cur.has(slug) === on) return cur;
    const next = new Set(cur);
    if (on) next.add(slug); else next.delete(slug);
    return next;
  }), []);
  return <Ctx.Provider value={{ has, set }}>{children}</Ctx.Provider>;
}

export const useWishlist = () => useContext(Ctx);
