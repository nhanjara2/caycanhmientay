'use client';

import { useEffect, useState } from 'react';

/**
 * Avatar tròn của chính người đang đăng nhập: ảnh Google nếu có, không có (hoặc tải lỗi) thì chữ cái đầu.
 * Chỉ dùng cho tài khoản của mình — đánh giá/hỏi đáp công khai vẫn chỉ hiện chữ cái đầu, không lộ ảnh người khác.
 */
export function Avatar({ initials, url, size, className }: { initials: string; url?: string | null; size?: 'sm' | 'lg'; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const cls = ['vx-avatar', size && `vx-avatar--${size}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls}>
      {url && !failed ? (
        // no-referrer: ảnh googleusercontent.com đôi khi từ chối request có Referer lạ
        <img src={url} alt="" referrerPolicy="no-referrer" draggable={false} onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
