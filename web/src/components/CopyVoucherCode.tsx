'use client';

import { useState } from 'react';
import { Icon } from './Icon';

/** Nút chép mã giảm giá — dùng ở trang Khuyến mãi công khai. */
export function CopyVoucherCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <button type="button" className="vx-iconbtn" style={{ width: 24, height: 24 }} aria-label={`Chép mã ${code}`} onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} size={16} />
    </button>
  );
}
