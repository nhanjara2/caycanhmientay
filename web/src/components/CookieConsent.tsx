'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type Consent = { personal: boolean; analytics: boolean; ads: boolean; at: string };
const KEY = 'ccmt-consent';

/** Xin đồng ý cookie lần đầu vào web. Chưa đồng ý thì không tải mã phân tích/quảng cáo. */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [custom, setCustom] = useState(false);
  const [pref, setPref] = useState({ personal: true, analytics: true, ads: false });

  useEffect(() => {
    try { setShow(!localStorage.getItem(KEY)); } catch {}
  }, []);

  const save = (c: Omit<Consent, 'at'>) => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...c, at: new Date().toISOString() })); } catch {}
    setShow(false);
  };

  if (!show) return null;

  if (custom) {
    const row = (k: keyof typeof pref, title: string, sub: string) => (
      <div className="ck-row">
        <div><b>{title}</b><small>{sub}</small></div>
        <button type="button" className="vx-switch" role="switch" aria-checked={pref[k]} aria-label={title} onClick={() => setPref((p) => ({ ...p, [k]: !p[k] }))} />
      </div>
    );
    return (
      <div className="ck-pref app-ck-pref" role="dialog" aria-label="Tùy chỉnh quyền riêng tư">
        <div className="h">Tùy chỉnh quyền riêng tư</div>
        <div className="ck-row"><div><b>Cần thiết</b><small>Đăng nhập, giỏ hàng, thanh toán, bảo mật</small></div><span className="lock">Luôn bật</span></div>
        {row('personal', 'Cá nhân hóa', 'Gợi ý cây theo sở thích và lịch sử xem')}
        {row('analytics', 'Phân tích', 'Đo lượt truy cập để cải thiện website')}
        {row('ads', 'Quảng cáo', 'Hiện quảng cáo phù hợp trên mạng xã hội')}
        <div className="f">
          <button type="button" className="vx-btn vx-btn--outline" onClick={() => setCustom(false)}>Hủy</button>
          <button type="button" className="vx-btn vx-btn--primary" onClick={() => save(pref)}>Lưu lựa chọn</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ck app-ck" role="dialog" aria-label="Cookie">
      <b><Icon name="shield" />Cây Cảnh Miền Tây dùng cookie</b>
      <p>
        Chúng tôi dùng cookie và dữ liệu duyệt web để website hoạt động, ghi nhớ giỏ hàng và gợi ý cây phù hợp. Bạn có thể chọn loại dữ liệu cho phép.{' '}
        <Link href="/chinh-sach/bao-mat">Chính sách bảo mật</Link>
      </p>
      <div className="acts">
        <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setCustom(true)}>Tùy chỉnh</button>
        <button type="button" className="vx-btn vx-btn--outline" onClick={() => save({ personal: false, analytics: false, ads: false })}>Chỉ cần thiết</button>
        <button type="button" className="vx-btn vx-btn--primary" onClick={() => save({ personal: true, analytics: true, ads: true })}>Đồng ý tất cả</button>
      </div>
    </div>
  );
}
