'use client';

import { useEffect } from 'react';

/** Mở hộp thoại in ngay khi trang hóa đơn tải xong; nút In lại + Đóng cho lần sau. */
export function PrintButton({ auto = true }: { auto?: boolean }) {
  useEffect(() => { if (auto) { const t = setTimeout(() => window.print(), 300); return () => clearTimeout(t); } }, [auto]);
  return (
    <span className="no-print" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
      <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={() => window.print()}>In lại</button>
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => window.close()}>Đóng</button>
    </span>
  );
}
