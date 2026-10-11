'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

/**
 * Thanh tiến trình mảnh trên cùng khi chuyển trang trong web — để khách biết web đang tải (máy chủ ở xa, có trang mất 1–2 giây).
 * Bắt đầu: sự kiện `ccmt:nav-start` do `src/instrumentation-client.ts` phát (mọi kiểu chuyển trang: bấm link, router.push,
 * nút Quay lại). Kết thúc: đường dẫn hoặc tham số ?… đổi (trang mới đã lên). Chuyển trang xong trong SHOW_AFTER_MS thì
 * không hiện gì (khỏi nháy). Thanh tự nhích dần tới 90% rồi chờ; quá GIVE_UP_MS mà địa chỉ không đổi (bấm lại đúng trang
 * đang xem qua một đường chuyển hướng) thì tự tắt. CSS `.app-navbar` trong khối HIỆU ỨNG SINH ĐỘNG (globals.css).
 */
const NAV_START_EVENT = 'ccmt:nav-start';
const SHOW_AFTER_MS = 120;
const STEP_MS = 280;
const GIVE_UP_MS = 15000;

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

function Bar() {
  const here = `${usePathname()}?${useSearchParams()}`;
  const ref = useRef<HTMLDivElement>(null);
  const run = useRef<{ stop: () => void } | null>(null);
  const fade = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onStart = (e: Event) => {
      const to = new URL(String((e as CustomEvent).detail ?? ''), location.href);
      // Chỉ đổi #mục trong trang, hoặc sang tên miền khác (trình duyệt tự tải lại cả trang) thì không cần thanh
      if (to.origin !== location.origin || (to.pathname === location.pathname && to.search === location.search)) return;
      run.current?.stop();
      clearTimeout(fade.current);
      let p = 0;
      const set = (v: number) => { p = v; el.style.setProperty('--p', String(v)); };
      const show = setTimeout(() => { set(0.12); el.dataset.state = 'loading'; }, SHOW_AFTER_MS);
      const step = setInterval(() => { if (el.dataset.state === 'loading') set(p + (0.9 - p) * 0.14); }, STEP_MS);
      const giveUp = setTimeout(() => run.current?.stop(), GIVE_UP_MS);
      run.current = {
        stop: () => {
          clearTimeout(show); clearInterval(step); clearTimeout(giveUp);
          run.current = null;
          if (el.dataset.state !== 'loading') return;
          // Chạy nốt tới 100% rồi mờ đi; xong mới đưa về 0 (lúc đó thanh đã trong suốt)
          set(1);
          el.dataset.state = 'done';
          fade.current = setTimeout(() => { delete el.dataset.state; el.style.removeProperty('--p'); }, 450);
        },
      };
    };
    window.addEventListener(NAV_START_EVENT, onStart);
    return () => { window.removeEventListener(NAV_START_EVENT, onStart); run.current?.stop(); clearTimeout(fade.current); };
  }, []);

  // Địa chỉ đổi = trang mới đã hiện
  useEffect(() => { run.current?.stop(); }, [here]);

  return <div ref={ref} className="app-navbar" aria-hidden="true"><i /></div>;
}
