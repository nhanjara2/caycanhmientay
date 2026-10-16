'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/** Hộp thoại đang mở, mới nhất ở cuối — chỉ hộp trên cùng giữ Tab / nhận Esc (hộp mở chồng: sổ địa chỉ → bản đồ). */
const stack: HTMLElement[] = [];

/**
 * Bàn phím cho hộp thoại tự vẽ (`role="dialog"`, không phải `<dialog>`) — mục 12 checklist SEO:
 * mở thì focus vào trong (ô có `autoFocus`, không thì ô bấm được đầu tiên, không thì chính hộp — hộp cần `tabIndex={-1}`),
 * Tab / Shift+Tab chỉ đi vòng trong hộp, Esc gọi `onClose`, đóng (gỡ khỏi trang) thì focus quay về nút đã mở.
 * `<dialog>` mở bằng `showModal()` thì trình duyệt tự làm đủ — không cần hook này.
 */
export function useModalFocus(ref: RefObject<HTMLElement | null>, onClose?: () => void, active = true) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  useEffect(() => {
    const box = ref.current;
    if (!active || !box) return;
    const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stack.push(box);
    const items = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => e.getClientRects().length > 0 && !e.closest('[inert]'));
    if (!box.contains(document.activeElement)) {
      const first = box.querySelector<HTMLElement>('[autofocus]') ?? items()[0];
      (first ?? box).focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== box || e.defaultPrevented) return;
      if (e.key === 'Escape' && close.current) { e.preventDefault(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) { e.preventDefault(); box.focus(); return; }
      const cur = document.activeElement;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && (cur === first || cur === box || !box.contains(cur))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (cur === last || !box.contains(cur))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(box), 1);
      // Trả focus về nút đã mở (nếu nút còn trên trang và focus đang lạc — chưa có ai chủ động chuyển đi chỗ khác).
      const cur = document.activeElement;
      if (back?.isConnected && (!cur || cur === document.body || !cur.isConnected || box.contains(cur))) back.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
