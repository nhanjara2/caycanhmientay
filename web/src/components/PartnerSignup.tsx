'use client';

import Link from '@/components/LocaleLink';
import { useState, useTransition } from 'react';
import { applyPartnerAction } from '@/app/actions/partners';
import { useAuth } from '@/lib/auth';
import { PARTNER_INFO, PARTNER_TYPES, WHOLESALE_QUOTE_URL, type PartnerType } from '@/lib/partners';
import { Icon } from './Icon';

/** Thông tin đơn vị đã lưu của tài khoản đang xem (server đọc sẵn để điền form). */
export type SignupProfile = { type: PartnerType | null; company: string; taxCode: string; area: string };

/** Khung "Đăng ký đối tác" trên /doi-tac: chưa đăng nhập → mời đăng nhập; đã đăng ký → trạng thái + sửa thông tin đơn vị. */
export function PartnerSignup({ profile }: { profile: SignupProfile | null }) {
  const { user, ready, openLogin, setUser } = useAuth();
  const [f, setF] = useState({ type: profile?.type ?? null as PartnerType | null, company: profile?.company ?? '', taxCode: profile?.taxCode ?? '', area: profile?.area ?? '' });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!ready) return <div className="pt-signup" style={{ minHeight: 160 }} />;

  if (!user) {
    return (
      <div className="pt-signup pt-signup--login">
        <span className="pt-signup__ic"><Icon name="user" /></span>
        <div>
          <b>Đăng nhập để đăng ký đối tác</b>
          <p>Dùng tài khoản Google hoặc số điện thoại. Đăng ký xong, shop duyệt và báo cho bạn qua điện thoại / Zalo.</p>
        </div>
        <button type="button" className="vx-btn vx-btn--primary vx-btn--lg" onClick={openLogin}>Đăng nhập / Tạo tài khoản</button>
      </div>
    );
  }

  const p = user.partner;
  const status = p && !editing && (
    <div className={`pt-signup pt-signup--${p.status}`} role="status">
      <span className="pt-signup__ic"><Icon name={p.status === 'approved' ? 'check' : 'clock'} /></span>
      <div>
        <b>{p.status === 'approved' ? `Bạn là ${PARTNER_INFO[p.type].label.toLowerCase()}` : 'Đã nhận đăng ký — đang chờ shop duyệt'}</b>
        <p>
          {p.status === 'approved'
            ? p.discount > 0
              ? <>Chiết khấu riêng <b>{p.discount}%</b> trên tiền hàng, tự trừ trong giỏ hàng mỗi khi bạn đăng nhập và đặt hàng.</>
              : 'Bạn đặt hàng trên web như bình thường; mức chiết khấu riêng (nếu có) sẽ được shop cập nhật vào tài khoản. Đơn số lượng lớn gửi danh sách để nhận giá sỉ.'
            : `Loại đối tác: ${PARTNER_INFO[p.type].label}. Trong lúc chờ, bạn vẫn đặt hàng trên web hoặc gửi danh sách để nhận báo giá sỉ.`}
        </p>
        {f.company && <p className="pt-signup__co">{f.company}{f.taxCode && ` · MST ${f.taxCode}`}{f.area && ` · ${f.area}`}</p>}
      </div>
      <div className="pt-signup__acts">
        <Link href={WHOLESALE_QUOTE_URL} className="vx-btn vx-btn--primary">Gửi yêu cầu báo giá</Link>
        <button type="button" className="vx-btn vx-btn--outline" onClick={() => { setEditing(true); setMsg(null); }}>Sửa thông tin đơn vị</button>
      </div>
    </div>
  );
  if (status) return <>{msg && <p className={msg.ok ? 'vx-help' : 'vx-err'} role="status">{msg.text}</p>}{status}</>;

  const locked = p?.status === 'approved';
  const submit = () => {
    setMsg(null);
    if (!f.type) { setMsg({ ok: false, text: 'Chọn bạn là đối tác nào' }); return; }
    start(async () => {
      const r = await applyPartnerAction({ ...f, type: f.type }).catch(() => ({ ok: false as const, error: 'Không gửi được, vui lòng thử lại' }));
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      setUser(r.user);
      setEditing(false);
      setMsg({ ok: true, text: locked ? 'Đã lưu thông tin đơn vị.' : 'Đã gửi đăng ký. Shop sẽ liên hệ để xác nhận.' });
    });
  };

  return (
    <form className="pt-signup pt-signup--form" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div className="qf-opts app-qf-opts3" role="radiogroup" aria-label="Loại đối tác">
        {PARTNER_TYPES.map((t) => (
          <button key={t} type="button" role="radio" className="qf-opt" aria-checked={f.type === t} disabled={locked && f.type !== t}
            onClick={() => !locked && setF((x) => ({ ...x, type: t }))}>
            <Icon name={PARTNER_INFO[t].icon} />
            {PARTNER_INFO[t].label}<small>{PARTNER_INFO[t].hint}</small>
          </button>
        ))}
      </div>
      <div className="ad-frow">
        <div className="vx-field">
          <div className="vx-fl"><label htmlFor="pt-co">Tên đơn vị / cửa hàng (không bắt buộc)</label><input id="pt-co" value={f.company} maxLength={120} autoComplete="organization" onChange={(e) => setF((x) => ({ ...x, company: e.target.value }))} /></div>
        </div>
        <div className="vx-field">
          <div className="vx-fl"><label htmlFor="pt-tax">Mã số thuế (không bắt buộc)</label><input id="pt-tax" value={f.taxCode} maxLength={14} inputMode="numeric" onChange={(e) => setF((x) => ({ ...x, taxCode: e.target.value.replace(/[^\d-]/g, '') }))} /></div>
        </div>
        <div className="vx-field">
          <div className="vx-fl"><label htmlFor="pt-area">Khu vực hoạt động</label><input id="pt-area" value={f.area} maxLength={120} placeholder="Ví dụ: TP. Hồ Chí Minh, Đồng Nai" onChange={(e) => setF((x) => ({ ...x, area: e.target.value }))} /></div>
        </div>
      </div>
      {msg && <span className={msg.ok ? 'vx-help' : 'vx-err'} role="alert">{msg.text}</span>}
      <div className="app-qf-actions">
        {editing && <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setEditing(false)}>Hủy</button>}
        <button type="submit" className="vx-btn vx-btn--primary vx-btn--lg" disabled={pending}>{pending ? 'Đang gửi…' : locked ? 'Lưu thông tin' : p ? 'Cập nhật đăng ký' : 'Gửi đăng ký đối tác'}</button>
      </div>
    </form>
  );
}
