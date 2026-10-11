'use client';

import { useEffect } from 'react';

/**
 * Khối nội dung hiện dần (mờ → rõ, trượt nhẹ lên) khi khách cuộn tới — CSS `[data-rv]` trong khối "HIỆU ỨNG SINH ĐỘNG" (globals.css).
 * Chỉ giấu khối đang nằm DƯỚI màn hình lúc quét, nên phần khách thấy ngay khi mở trang không bao giờ bị ẩn; máy không chạy
 * được script, máy bật giảm chuyển động, bản in đều thấy đủ nội dung. Hiện xong thì gỡ thuộc tính (transform còn nằm lại sẽ
 * làm hỏng `position: sticky / fixed` của phần tử bên trong). Thêm khối mới: thêm selector vào REVEAL.
 */
const REVEAL = [
  '.hm-body > section', '.vx-panel', '.vx-flash', '.vx-pcard', '.pm-sec', '.pm-contact', '.dn-sec', '.dn-faq',
  '.sv-sec', '.sv-cta', '.vx-cblock', '.vx-dtile', '.vx-pdpage > .vx-card', '.ab-tl__item', '.shv-card',
].join(',');
const STEP_MS = 60;
const MAX_STEPS = 5;
const DONE_MS = 700;

export function ScrollReveal() {
  useEffect(() => {
    const site = document.querySelector('.app-site');
    if (!site || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        // Các thẻ cùng hiện một lượt (một hàng sản phẩm) lệch nhau một nhịp, trái trước phải sau
        const batch = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({ el: e.target as HTMLElement, top: e.boundingClientRect.top, left: e.boundingClientRect.left }))
          .sort((a, b) => a.top - b.top || a.left - b.left);
        batch.forEach(({ el }, i) => {
          io.unobserve(el);
          const delay = Math.min(i, MAX_STEPS) * STEP_MS;
          el.style.setProperty('--rv-d', `${delay}ms`);
          el.setAttribute('data-rv', 'in');
          setTimeout(() => {
            el.removeAttribute('data-rv');
            el.style.removeProperty('--rv-d');
          }, delay + DONE_MS);
        });
      },
      { rootMargin: '0px 0px -40px 0px' },
    );

    const scan = () => {
      const fold = window.innerHeight - 40;
      for (const el of site.querySelectorAll<HTMLElement>(REVEAL)) {
        if (seen.has(el)) continue;
        seen.add(el);
        // Khối nằm trong một khối khác đã hiện dần thì đi theo khối ngoài
        if (el.parentElement?.closest(REVEAL)) continue;
        if (el.getBoundingClientRect().top < fold) continue;
        el.setAttribute('data-rv', '');
        io.observe(el);
      }
    };

    // Chuyển trang, lọc sản phẩm, nội dung tải sau đều thêm phần tử mới → quét lại (gộp theo khung hình)
    let frame = 0;
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); });
    });
    mo.observe(site, { childList: true, subtree: true });
    scan();

    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(frame);
      for (const el of site.querySelectorAll('[data-rv]')) el.removeAttribute('data-rv');
    };
  }, []);
  return null;
}
