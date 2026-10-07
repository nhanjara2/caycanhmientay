'use client';

import { useState } from 'react';
import { Icon } from './Icon';

/** Nút chép mã giảm giá. `text` = nút có chữ "Chép mã" (trang Khuyến mãi); mặc định chỉ có biểu tượng (hộp đăng nhập). */
export function CopyVoucherCode({ code, text = false }: { code: string; text?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  if (text) {
    return (
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" aria-label={`Chép mã ${code}`} onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} size={16} />
        {copied ? 'Đã chép' : 'Chép mã'}
      </button>
    );
  }
  return (
    <button type="button" className="vx-iconbtn" style={{ width: 24, height: 24 }} aria-label={`Chép mã ${code}`} onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} size={16} />
    </button>
  );
}
