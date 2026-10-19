'use client';

import { useEffect, useRef } from 'react';

/** Khối mua (BuyBox) và cột ảnh (ProductGallery) là hai component riêng: chọn quy cách có ảnh riêng
 *  (vd. hoa màu đỏ) thì phát sự kiện này, cột ảnh nhảy tới ảnh đó. */
const EVENT = 'ccmt:variant-image';
type Detail = { slug: string; image: number };

export const showVariantImage = (slug: string, image: number) =>
  window.dispatchEvent(new CustomEvent<Detail>(EVENT, { detail: { slug, image } }));

export function useVariantImage(slug: string, onShow: (image: number) => void) {
  const cb = useRef(onShow);
  useEffect(() => { cb.current = onShow; });
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<Detail>).detail;
      if (d?.slug === slug) cb.current(d.image);
    };
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, [slug]);
}
