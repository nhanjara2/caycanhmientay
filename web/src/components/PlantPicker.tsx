'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Breadcrumb } from './Blocks';
import { Icon } from './Icon';
import { formatPhone, SALES_PHONE, ZALO_QR, ZALO_URL } from '@/lib/contact';
import { money } from '@/lib/format';
import { thumbUrl } from '@/lib/images';
import { normalize } from '@/lib/catalog';
import { FILTER_GROUPS, pad2, PICKER_STORE_KEY, pickerMessage, type PickerItem } from '@/lib/plant-picker';
import { WHOLESALE_DRAFT_KEY } from './WholesaleQuoteForm';

type Contact = { name: string; phone: string; note: string };

/** Bảng chọn cây (/bang-chon-cay): lọc, chọn cây + số lượng, gửi danh sách qua Zalo hoặc form báo giá sỉ. */
export function PlantPicker({ items }: { items: PickerItem[] }) {
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [picked, setPicked] = useState<Map<number, number>>(new Map());
  const [contact, setContact] = useState<Contact>({ name: '', phone: '', note: '' });
  const [copied, setCopied] = useState<'' | 'ok' | 'fail'>('');

  // Danh sách đã chọn lưu trên máy này
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(PICKER_STORE_KEY) ?? '{}') as { picked?: Record<string, number>; contact?: Contact };
      const ok = new Set(items.map((p) => p.n));
      setPicked(new Map(Object.entries(s.picked ?? {}).filter(([k]) => ok.has(+k)).map(([k, v]) => [+k, Math.max(1, +v || 1)])));
      if (s.contact) setContact(s.contact);
    } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem(PICKER_STORE_KEY, JSON.stringify({ picked: Object.fromEntries(picked), contact })); } catch { /* bỏ qua */ }
  }, [picked, contact]);

  const query = normalize(q.trim());
  const shown = useMemo(() => items.filter((p) => {
    if (query && !normalize(p.name).includes(query)) return false;
    return FILTER_GROUPS.every((g) => {
      const on = filters[g.key];
      return !on?.length || g.opts.some(([k, , fn]) => on.includes(k) && fn(p));
    });
  }), [items, query, filters]);
  const active = Boolean(query) || Object.values(filters).some((v) => v.length);

  const toggle = (g: string, k: string) => setFilters((f) => {
    const cur = f[g] ?? [];
    return { ...f, [g]: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] };
  });
  const setQty = (n: number, v: number) => setPicked((m) => {
    const next = new Map(m);
    const q2 = Math.max(0, Math.min(9999, Math.floor(v) || 0));
    if (q2) next.set(n, q2); else next.delete(n);
    return next;
  });

  const chosen = items.filter((p) => picked.has(p.n));
  const total = chosen.reduce((s, p) => s + picked.get(p.n)!, 0);
  const message = pickerMessage(items, picked, contact);

  const copy = () => {
    navigator.clipboard.writeText(message).then(() => setCopied('ok'), () => setCopied('fail'));
  };
  // Chuyển sang form báo giá sỉ: điền sẵn danh sách vào nháp của form đó
  const toQuote = () => {
    try {
      const d = JSON.parse(localStorage.getItem(WHOLESALE_DRAFT_KEY) ?? '{}') as Record<string, unknown>;
      localStorage.setItem(WHOLESALE_DRAFT_KEY, JSON.stringify({
        ...d, items: pickerMessage(items, picked, { note: contact.note }).split('\n').slice(1).join('\n'),
        ...(contact.name.trim() ? { name: contact.name } : {}), ...(contact.phone.trim() ? { phone: contact.phone } : {}),
      }));
    } catch { /* bỏ qua */ }
  };

  const stepper = (n: number, id: string) => (
    <div className="app-pk-step">
      <button type="button" aria-label="Bớt một" onClick={() => setQty(n, (picked.get(n) ?? 0) - 1)}>−</button>
      <input id={id} type="number" inputMode="numeric" min={0} max={9999} aria-label="Số lượng"
        value={picked.get(n) ?? 0} onChange={(e) => setQty(n, +e.target.value)} />
      <button type="button" aria-label="Thêm một" onClick={() => setQty(n, (picked.get(n) ?? 0) + 1)}>+</button>
    </div>
  );

  return (
    <div className="app-pk">
      <Breadcrumb items={[{ label: 'Bảng chọn cây' }]} />
      <h1>{items.length} loại cây có sẵn tại vườn</h1>

      <div className="app-pk-filters">
        <label className="app-pk-search">
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên cây" aria-label="Tìm tên cây" />
        </label>
        {FILTER_GROUPS.map((g) => (
          <div key={g.key} className="app-pk-group">
            <span>{g.label}</span>
            <div className="app-pk-chips" role="group" aria-label={g.label}>
              {g.opts.map(([k, label, fn]) => (
                <button key={k} type="button" className="app-pk-chip" aria-pressed={filters[g.key]?.includes(k) ?? false} onClick={() => toggle(g.key, k)}>
                  {label} <small>{items.filter(fn).length}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="app-pk-result">
        <span>{active ? <>Đang xem <b>{shown.length}</b> / {items.length} cây</> : <>Tất cả <b>{items.length}</b> loại cây</>}</span>
        {active && <button type="button" className="vx-link" onClick={() => { setQ(''); setFilters({}); }}>Xóa bộ lọc</button>}
      </div>

      <ul className="app-pk-grid">
        {shown.map((p) => {
          const qty = picked.get(p.n);
          return (
            <li key={p.n} className="app-pk-card" data-on={qty ? '' : undefined}>
              <div className="app-pk-ph">
                {p.photo
                  ? <img src={thumbUrl(p.photo, 480)} alt={p.name} loading="lazy" decoding="async" width={480} height={480} />
                  : <span className="app-pk-none"><Icon name="plant" size={34} />Đang cập nhật ảnh</span>}
                <span className="app-pk-no">{pad2(p.n)}</span>
                {p.photo && <span className={p.real ? 'app-pk-badge app-pk-badge--real' : 'app-pk-badge'}>{p.real ? 'Ảnh tại vườn' : 'Ảnh minh họa'}</span>}
                {qty ? <span className="app-pk-tick"><Icon name="check" size={14} /></span> : null}
              </div>
              <div className="app-pk-body">
                <h2>{p.name}</h2>
                <p className="app-pk-meta">{p.size} · {p.form}</p>
                <p className="app-pk-place"><Icon name="pin" size={14} />{p.place}</p>
                <div className="app-pk-tags">
                  <span className="app-pk-tag"><Icon name="sun" size={12} />{p.light}</span>
                  {p.wall !== 'Không' && <span className={p.wall === 'Có' ? 'app-pk-tag app-pk-tag--wall' : 'app-pk-tag app-pk-tag--cond'}>
                    {p.wall === 'Có' ? 'Tường nhiệt đới' : 'Tường nhiệt đới (có điều kiện)'}
                  </span>}
                </div>
                {p.price && p.slug ? (
                  <div className="app-pk-price">
                    <span><small>Từ </small><b>{money(p.price)}</b><small> / {p.unit}</small></span>
                    <Link href={`/san-pham/${p.slug}`}>Xem sản phẩm</Link>
                  </div>
                ) : null}
                <div className="app-pk-act">
                  {qty ? stepper(p.n, `pk-q-${p.n}`) : (
                    <button type="button" className="vx-btn vx-btn--primary app-pk-add" onClick={() => setQty(p.n, 1)} aria-label={`Chọn ${p.name}`}>
                      <Icon name="plus" size={16} />Chọn cây
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="app-pk-empty">Không có cây nào khớp bộ lọc</li>}
      </ul>

      <section id="gui" className="app-pk-send" aria-labelledby="pk-send-h">
        <h2 id="pk-send-h">Danh sách đã chọn</h2>
        {chosen.length ? (
          <ul className="app-pk-list">
            {chosen.map((p) => (
              <li key={p.n}>
                {p.photo ? <img src={thumbUrl(p.photo, 160)} alt="" width={52} height={52} /> : <span className="app-pk-noimg" />}
                <div><b>{p.name}</b><small>Mã {pad2(p.n)} · {p.size}</small></div>
                {stepper(p.n, `pk-l-${p.n}`)}
              </li>
            ))}
          </ul>
        ) : <p className="app-pk-muted">Chưa chọn cây nào</p>}

        <div className="app-pk-fields">
          <label htmlFor="pk-name">Tên<input id="pk-name" className="vx-input" autoComplete="name" maxLength={80} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></label>
          <label htmlFor="pk-phone">SĐT / Zalo<input id="pk-phone" className="vx-input" inputMode="tel" autoComplete="tel" maxLength={15} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></label>
          <label htmlFor="pk-note" className="app-pk-wide">Giao đến / ghi chú<textarea id="pk-note" className="vx-input" maxLength={600} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} placeholder="Địa chỉ, kích thước, loại chậu" /></label>
        </div>

        <div className="app-pk-ways">
          <div className="app-pk-way">
            <h3>Gửi qua Zalo</h3>
            <textarea className="app-pk-msg" readOnly value={message} aria-label="Tin nhắn gửi shop" />
            <button type="button" className="vx-btn vx-btn--primary" disabled={!chosen.length} onClick={copy}><Icon name="copy" size={16} />1. Chép tin nhắn</button>
            {copied === 'ok' && <span className="app-pk-ok" role="status">Đã chép</span>}
            {copied === 'fail' && <span className="vx-err" role="alert">Chưa chép được, bôi đen tin nhắn để chép</span>}
            <a className="vx-btn vx-btn--outline" href={ZALO_URL} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={16} />2. Mở Zalo {formatPhone(SALES_PHONE)}</a>
            <img className="app-pk-qr" src={ZALO_QR} alt="Mã QR Zalo Cây Cảnh Miền Tây" width={120} height={120} />
          </div>
          <div className="app-pk-way">
            <h3>Gửi yêu cầu báo giá</h3>
            <Link href={chosen.length ? '/bao-gia-si' : '#gui'} className="vx-btn vx-btn--outline" aria-disabled={!chosen.length} onClick={chosen.length ? toQuote : undefined}>
              <Icon name="receipt" size={16} />Mở form báo giá
            </Link>
          </div>
        </div>

        {items.some((p) => p.credit) && (
          <details className="app-pk-credits">
            <summary>Nguồn ảnh minh họa</summary>
            <ul>
              {items.filter((p) => p.credit && !p.real).map((p) => (
                <li key={p.n}>{pad2(p.n)} {p.name}: <a href={p.credit!.page} target="_blank" rel="noopener noreferrer">{p.credit!.author}</a>, {p.credit!.license}, Wikimedia Commons</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {chosen.length > 0 && (
        <div className="app-pk-bar">
          <p><b>Đã chọn {chosen.length} loại · {total} cây</b><span>{chosen.map((p) => p.name).join(', ')}</span></p>
          <a href="#gui" className="vx-btn app-pk-barbtn">Gửi danh sách</a>
        </div>
      )}
    </div>
  );
}
