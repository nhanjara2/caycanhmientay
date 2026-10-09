'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { normalize } from '@/lib/catalog';
import { locateMe } from '@/lib/geo';
import { SALES_PHONE } from '@/lib/contact';
import { distanceKm } from '@/lib/stock';
import { directionsUrl, formatPhone, hoursText, isOpenNow, STORE_SERVICES, type PublicStore, type StoreService } from '@/lib/stores';
import { StoreMap } from './StoreMap';

type Filter = 'all' | 'open' | StoreService;
type Coords = { lat: number; lng: number };

const fmtKm = (km: number) => `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km).toLocaleString('vi-VN')} km`;

const PERKS: { icon: React.ReactNode; title: string; text: string }[] = [
  { icon: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></>, title: 'Xem cây tận nơi', text: 'Chọn đúng cây mình thích, kỹ sư hướng dẫn chọn cây hợp vị trí đặt.' },
  { icon: <><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" /></>, title: 'Mang lá bệnh đến khám', text: 'Mang mẫu lá, ảnh cây để kỹ sư bắt bệnh và kê thuốc phù hợp miễn phí.' },
  { icon: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>, title: 'Vật tư chính hãng', text: 'Thuốc BVTV có số đăng ký, phân bón có nguồn gốc rõ ràng.' },
  { icon: <><path d="M6 12h12l-1.5 8h-9z" /><path d="M12 12V7" /><path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" /><path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" /></>, title: 'Thay chậu, sang chậu tại chỗ', text: 'Mua chậu và đất, nhân viên thay chậu giúp trong 15 phút.' },
  { icon: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>, title: 'Giao cây tận nơi', text: 'Cây lớn giao bằng xe tải nhỏ, có người khiêng và đặt đúng vị trí.' },
  { icon: <><path d="M3 7 12 3l9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>, title: 'Đổi trả, bảo hành tại cửa hàng', text: 'Mang cây hoặc hóa đơn đến bất kỳ cửa hàng nào để được hỗ trợ.' },
];

const Ico = ({ children, size }: { children: React.ReactNode; size?: number }) => (
  <svg className="vx-ico" viewBox="0 0 24 24" style={size ? { width: size, height: size } : undefined} aria-hidden="true">{children}</svg>
);

/** Trang Hệ thống cửa hàng: tìm theo tên / địa chỉ, "Gần bạn" (định vị), lọc, bản đồ thật, chỉ đường, gọi, đặt lịch. Dữ liệu từ bảng stores (admin /admin/cua-hang). */
export function StoreLocator({ stores }: { stores: PublicStore[] }) {
  const [tab, setTab] = useState<'find' | 'near'>('find');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [me, setMe] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(stores[0]?.id ?? null);
  // Giờ hiện tại chỉ biết sau khi trang chạy trên trình duyệt (tránh lệch giữa HTML server và client).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const statusOf = (s: PublicStore) => (s.open24h ? true : now ? isOpenNow(s, now) : null);

  const locate = () => {
    setMsg('');
    setLocating(true);
    locateMe()
      .then((p) => {
        setMe(p);
        // Chọn luôn cửa hàng gần nhất.
        const nearest = [...stores].sort((a, b) => distanceKm(p, a) - distanceKm(p, b))[0];
        if (nearest) setSelectedId(nearest.id);
      })
      .catch((e: Error) => setMsg(e.message))
      .finally(() => setLocating(false));
  };

  const chips = useMemo(() => {
    const c: [Filter, string][] = [['all', 'Tất cả']];
    if (stores.some((s) => s.services.includes('nursery'))) c.push(['nursery', STORE_SERVICES.nursery]);
    if (stores.some((s) => s.services.includes('workshop'))) c.push(['workshop', 'Có workshop']);
    if (stores.some((s) => s.services.includes('supply'))) c.push(['supply', STORE_SERVICES.supply]);
    c.push(['open', 'Đang mở']);
    return c;
  }, [stores]);

  const list = useMemo(() => {
    const key = normalize(q);
    const out = stores
      .filter((s) => !key || normalize(`${s.name} ${s.address}`).includes(key))
      .filter((s) => {
        if (filter === 'all') return true;
        if (filter === 'open') return now ? isOpenNow(s, now) === true : true;
        return s.services.includes(filter);
      })
      .map((s) => ({ s, km: me ? distanceKm(me, s) : null }));
    if (tab === 'near' && me) out.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
    return out;
  }, [stores, q, filter, now, me, tab]);

  const shown = list.find((x) => x.s.id === selectedId) ?? list[0] ?? null;
  const sel = shown?.s ?? null;
  const selStatus = sel ? statusOf(sel) : null;

  const onItemKey = (e: KeyboardEvent, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(id); }
  };

  return (
    <div className="vx-storepage">
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<span>Hệ thống cửa hàng</span>
      </div>
      <h1>Hệ thống cửa hàng &amp; vườn ươm</h1>
      <span className="sub">Chọn một cửa hàng để xem địa chỉ, giờ mở cửa và chỉ đường</span>

      {!stores.length ? (
        <div className="vx-sdetail" style={{ alignItems: 'flex-start' }}>
          <p style={{ margin: 0 }}>Danh sách cửa hàng đang được cập nhật. Vui lòng gọi <a href={`tel:${SALES_PHONE}`}>{formatPhone(SALES_PHONE)}</a> để được hướng dẫn đường đến vườn.</p>
        </div>
      ) : (
        <div className="vx-stores">
          <aside className="vx-sfind">
            <div className="vx-sfind__tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'find'} aria-current={tab === 'find' ? 'true' : undefined} onClick={() => setTab('find')}>
                <Ico><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Ico>
                Tìm cửa hàng
              </button>
              <button type="button" role="tab" aria-selected={tab === 'near'} aria-current={tab === 'near' ? 'true' : undefined}
                onClick={() => { setTab('near'); if (!me && !locating) locate(); }}>
                <Ico><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></Ico>
                Gần bạn
              </button>
            </div>
            <div className="vx-sfind__body">
              <label className="vx-sfind__search">
                <Ico><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Ico>
                <input className="app-bare" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, đường, tỉnh" aria-label="Tìm cửa hàng" />
              </label>
              {tab === 'near' && (
                <div className="app-store-near" role="status">
                  {locating ? 'Đang lấy vị trí của bạn…' : me ? 'Đã sắp xếp theo khoảng cách từ vị trí của bạn.' : (
                    <>
                      {msg || 'Cho phép trình duyệt dùng vị trí để xem cửa hàng gần bạn nhất.'}{' '}
                      <button type="button" className="vx-btn vx-btn--soft vx-btn--sm" onClick={locate}>Thử lại</button>
                    </>
                  )}
                </div>
              )}
              <div className="vx-sfilter">
                {chips.map(([k, label]) => (
                  <button key={k} type="button" className="vx-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
                ))}
              </div>
              <div className="vx-sres" role="radiogroup" aria-label="Danh sách cửa hàng">
                <div className="vx-sres__head">{list.length ? `Có ${list.length} cửa hàng` : 'Không tìm thấy cửa hàng phù hợp'}</div>
                {list.map(({ s, km }) => {
                  const st = statusOf(s);
                  return (
                    <div key={s.id} className="vx-sres__item" role="radio" tabIndex={0} aria-checked={s.id === shown?.s.id}
                      onClick={() => setSelectedId(s.id)} onKeyDown={(e) => onItemKey(e, s.id)}>
                      <span className="vx-radio" style={{ marginTop: 2 }} />
                      <span>
                        <b>{s.name}</b>
                        <small>{s.address}</small>
                        <span className="row">
                          {st === true && <span className="vx-open">Đang mở</span>}
                          {st === false && <span className="vx-closed">Đã đóng</span>}
                          {km != null && <span style={{ color: 'var(--ink-muted)' }}>{st != null ? '· ' : ''}{fmtKm(km)}</span>}
                          {s.services.includes('nursery') && <span className="vx-badge vx-badge--info">{STORE_SERVICES.nursery}</span>}
                          {s.services.includes('workshop') && <span className="vx-badge vx-badge--info">{STORE_SERVICES.workshop}</span>}
                          {s.kind === 'partner' && <span className="vx-badge">Đối tác</span>}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="vx-sdetail">
            {sel ? (
              <>
                <h2>
                  {sel.name}{' '}
                  {sel.services.includes('nursery') && <span className="vx-badge vx-badge--info" style={{ verticalAlign: 'middle' }}>{STORE_SERVICES.nursery}</span>}
                  {sel.kind === 'partner' && <span className="vx-badge" style={{ verticalAlign: 'middle' }}>Đối tác cung cấp</span>}
                </h2>
                <div className="vx-sdetail__top">
                  <StoreMap stores={stores} selectedId={sel.id} me={me} onSelect={setSelectedId} />
                  <div className="vx-sinfo">
                    <span className="lab">Địa chỉ</span>
                    <b>{sel.address}</b>
                    {sel.note && <span>{sel.note}</span>}
                    {(selStatus != null || hoursText(sel)) && (
                      <span>
                        {selStatus === true && <span className="vx-open">Đang mở</span>}
                        {selStatus === false && <span className="vx-closed">Đã đóng</span>}
                        {hoursText(sel) && `${selStatus != null ? ' · ' : ''}${hoursText(sel)}`}
                      </span>
                    )}
                    {sel.phone && (
                      <span>
                        Điện thoại: <a href={`tel:${sel.phone}`}><b>{formatPhone(sel.phone)}</b></a>{sel.contactName && ` (${sel.contactName})`}
                      </span>
                    )}
                    {sel.services.length > 0 && (
                      <div className="vx-svc">
                        {sel.services.map((k) => <span key={k} className="vx-badge vx-badge--info">{STORE_SERVICES[k]}</span>)}
                      </div>
                    )}
                    {sel.kind === 'store' && <Link href="/chinh-sach/giay-phep-kinh-doanh">Thông tin pháp lý cửa hàng</Link>}
                    <div className="vx-sinfo__cta">
                      <a className="vx-btn vx-btn--primary" href={directionsUrl(sel)} target="_blank" rel="noreferrer">
                        <Ico size={16}><path d="m3 11 18-8-8 18-2-8z" /></Ico>
                        Xem chỉ đường
                      </a>
                      {sel.phone && <a className="vx-btn vx-btn--soft" href={`tel:${sel.phone}`}>Gọi tư vấn</a>}
                      {sel.kind === 'store' && <Link className="vx-btn vx-btn--outline" href="/bao-gia-si">Yêu cầu báo giá sỉ</Link>}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--ink-muted)' }}>Không có cửa hàng nào khớp với tìm kiếm. Hãy thử từ khóa khác hoặc chọn “Tất cả”.</p>
            )}
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
              Cây Cảnh Miền Tây có vườn ươm riêng và hệ thống cửa hàng, nơi bạn xem cây tận mắt và nhận tư vấn trực tiếp từ kỹ sư:
            </p>
            <div className="vx-perks">
              {PERKS.map((p) => (
                <div key={p.title} className="vx-perk">
                  <span><Ico>{p.icon}</Ico></span>
                  <span><b>{p.title}</b>{p.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
