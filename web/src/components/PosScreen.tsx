'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPosOrderAction, posCustomerAction, posVoucherAction } from '@/app/actions/pos';
import { Icon, Thumb, type IconName } from '@/components/Icon';
import { normalize } from '@/lib/catalog';
import { money } from '@/lib/format';
import type { PosItem } from '@/server/pos';

type Store = { id: number; name: string };
type Customer = { phone: string; name: string | null; points: number; member: boolean; orders: number; spend: number };
type Pay = 'cash' | 'qr' | 'card';
const PAYS: { key: Pay; label: string; icon: IconName }[] = [
  { key: 'cash', label: 'Tiền mặt', icon: 'cash' }, { key: 'qr', label: 'QR', icon: 'qr' }, { key: 'card', label: 'Thẻ', icon: 'card' },
];
const digits = (s: string) => s.replace(/\D/g, '');

/** AdminPOS: bán tại quầy toàn màn hình — tìm / quét mã, chọn món, nhận ra khách theo SĐT, mã giảm giá, thanh toán (F9), in hóa đơn. */
export function PosScreen({ stores, storeId, items, categories, cashier }: {
  stores: Store[]; storeId: number; items: PosItem[]; categories: { slug: string; name: string }[]; cashier: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [voucher, setVoucher] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [pay, setPay] = useState<Pay>('cash');
  const [given, setGiven] = useState('');
  const [safety, setSafety] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ code: string; total: number; change: number } | null>(null);
  const [pending, start] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const key = (i: PosItem) => `${i.slug}|${i.idx}`;
  const byKey = useMemo(() => new Map(items.map((i) => [key(i), i])), [items]);
  const lines = Object.entries(cart).flatMap(([k, qty]) => { const it = byKey.get(k); return it ? [{ it, qty }] : []; });
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.it.price * l.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const hasPesticide = lines.some((l) => l.it.pesticide);
  const givenN = Number(digits(given) || 0);
  const change = pay === 'cash' && givenN > total ? givenN - total : 0;
  const payload = useMemo(() => lines.map((l) => ({ slug: l.it.slug, option: l.it.idx, qty: l.qty })), [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    const toks = normalize(query).split(/\s+/).filter(Boolean);
    return items.filter((i) => (!cat || i.category === cat) && (!toks.length || toks.every((t) => normalize(`${i.name} ${i.label ?? ''} ${i.sku}`).includes(t))));
  }, [items, query, cat]);

  const add = useCallback((i: PosItem, d = 1) => {
    setCart((c) => {
      const k = key(i);
      const n = Math.max(0, Math.min(99, (c[k] ?? 0) + d));
      const { [k]: _old, ...rest } = c;
      return n ? { ...rest, [k]: n } : rest;
    });
    setDone(null);
  }, []);

  // Nhận ra khách theo SĐT (khi đủ 10 số)
  useEffect(() => {
    const p = digits(phone);
    if (p.length !== 10) { setCustomer(null); return; }
    let live = true;
    posCustomerAction(p).then((c) => { if (live) setCustomer(c); }).catch(() => {});
    return () => { live = false; };
  }, [phone]);

  // Mã giảm giá đã áp dụng: tính lại khi đổi giỏ / SĐT
  const applied = discount > 0 || voucherMsg.startsWith('Áp dụng');
  useEffect(() => {
    if (!applied || !voucher) return;
    if (!payload.length) { setDiscount(0); return; }
    let live = true;
    posVoucherAction(voucher, payload, digits(phone)).then((r) => {
      if (!live) return;
      if (r.ok) { setDiscount(r.discount); setVoucherMsg(`Áp dụng mã ${r.code}: -${money(r.discount)}`); } else { setDiscount(0); setVoucherMsg(r.error); }
    }).catch(() => {});
    return () => { live = false; };
  }, [payload, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyVoucher = () => {
    setVoucherMsg('');
    start(async () => {
      const r = await posVoucherAction(voucher, payload, digits(phone)).catch(() => ({ ok: false as const, error: 'Không kiểm tra được mã' }));
      if (r.ok) { setDiscount(r.discount); setVoucherMsg(`Áp dụng mã ${r.code}: -${money(r.discount)}`); } else { setDiscount(0); setVoucherMsg(r.error); }
    });
  };

  const reset = () => {
    setCart({}); setPhone(''); setName(''); setCustomer(null); setVoucher(''); setDiscount(0); setVoucherMsg(''); setGiven(''); setSafety(false); setError(''); setDone(null);
    router.refresh();
    searchRef.current?.focus();
  };

  const canPay = lines.length > 0 && !pending && (pay !== 'cash' || !given || givenN >= total) && (!hasPesticide || safety);
  const checkout = useCallback(() => {
    if (!canPay) return;
    setError('');
    start(async () => {
      const r = await createPosOrderAction({
        storeId, items: payload, phone: digits(phone) || undefined, name: name || undefined, payment: pay,
        voucherCode: discount > 0 ? voucher : undefined, safetyAck: safety,
      }).catch(() => ({ ok: false as const, error: 'Không gửi được, kiểm tra mạng rồi thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setDone({ code: r.code, total: r.total, change });
      setCart({});
    });
  }, [canPay, storeId, payload, phone, name, pay, discount, voucher, safety, change]);

  // Phím tắt: F2 = tìm / quét mã, F9 = thanh toán
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); }
      if (e.key === 'F9') { e.preventDefault(); checkout(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checkout]);

  const onSearchEnter = () => {
    const q = query.trim().toLowerCase();
    const exact = items.find((i) => i.sku.toLowerCase() === q) ?? (shown.length === 1 ? shown[0] : undefined);
    if (exact) { add(exact); setQuery(''); }
  };

  const switchStore = (id: number) => {
    if (lines.length && !confirm('Đổi cửa hàng sẽ xóa giỏ hiện tại. Tiếp tục?')) return;
    router.push(`/admin/pos?cua-hang=${id}`);
  };

  return (
    <div className="app-pos">
      <div className="pos">
        <div className="pos-left">
          <div className="pos-top">
            <label className="vx-sfind__search">
              <Icon name="search" />
              <input ref={searchRef} className="app-bare" value={query} placeholder="Quét mã vạch hoặc gõ tên sản phẩm (F2)" aria-label="Tìm sản phẩm"
                onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSearchEnter(); } }} autoFocus />
            </label>
            <select className="vx-input ad-sel" value={storeId} onChange={(e) => switchStore(Number(e.target.value))} aria-label="Cửa hàng bán">
              {stores.map((s) => <option key={s.id} value={s.id}>Cửa hàng: {s.name}</option>)}
            </select>
            <span className="ad-me"><span className="vx-avatar vx-avatar--sm">{cashier.split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase()}</span>{cashier}</span>
            <Link href="/admin" className="vx-btn vx-btn--ghost vx-btn--sm">Thoát</Link>
          </div>
          <div className="pos-cats">
            <button type="button" className="vx-chip" aria-pressed={cat === null} onClick={() => setCat(null)}>Tất cả</button>
            {categories.map((c) => <button key={c.slug} type="button" className="vx-chip" aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)}>{c.name}</button>)}
          </div>
          <div className="pos-grid">
            {shown.map((i) => {
              const q = cart[key(i)] ?? 0;
              const out = i.stock <= 0;
              return (
                <button key={key(i)} type="button" className="pos-item app-pos-item" disabled={out && !q} onClick={() => add(i)} aria-label={`Thêm ${i.name}${i.label ? ` ${i.label}` : ''}`}>
                  {q > 0 && <span className="q">{q}</span>}
                  <span className="im"><Thumb src={i.image} icon={i.icon as IconName} /></span>
                  <b>{i.name}{i.label ? ` · ${i.label}` : ''}</b>
                  <span className="pr">{money(i.price)}</span>
                  <small style={out ? { color: 'var(--danger)' } : undefined}>{out ? 'Hết hàng' : `${i.stock} tồn`}</small>
                </button>
              );
            })}
            {!shown.length && <p style={{ gridColumn: '1 / -1', color: 'var(--ink-muted)' }}>Không tìm thấy sản phẩm nào.</p>}
          </div>
        </div>

        <div className="pos-right">
          <div className="pos-cust">
            <div className="au-phone"><span>SĐT</span><input value={phone} inputMode="tel" maxLength={14} placeholder="SĐT khách (không bắt buộc)" aria-label="Số điện thoại khách" onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} /></div>
            {customer ? (
              <div className="au-who">
                <span className="vx-avatar vx-avatar--sm">{(customer.name ?? '?').split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase()}</span>
                <span><b>{customer.name ?? 'Khách hàng'}</b><small>{customer.member ? `${customer.points.toLocaleString('vi-VN')} điểm · ` : ''}{customer.orders} đơn · {money(customer.spend)}</small></span>
                <span className="ok">{customer.member ? 'Thành viên' : 'Khách cũ'}</span>
              </div>
            ) : digits(phone).length === 10 ? (
              <input className="vx-input" placeholder="Tên khách (khách mới)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            ) : null}
          </div>

          <div className="pos-lines">
            {lines.map(({ it, qty }) => (
              <div className="pos-line" key={key(it)}>
                <span>{it.name}{it.label ? ` · ${it.label}` : ''}<small>{money(it.price)}</small></span>
                <span className="vx-stepper"><button type="button" aria-label="Giảm" onClick={() => add(it, -1)}>−</button><span>{qty}</span><button type="button" aria-label="Tăng" disabled={qty >= it.stock} onClick={() => add(it, 1)}>+</button></span>
                <b>{money(it.price * qty)}</b>
              </div>
            ))}
            {!lines.length && <p style={{ padding: 16, color: 'var(--ink-muted)', margin: 0 }}>Chạm sản phẩm bên trái hoặc quét mã để thêm vào đơn.</p>}
          </div>

          <div className="pos-sum">
            <div className="r"><span>Tạm tính ({count} món)</span><b>{money(subtotal)}</b></div>
            <div className="app-pos-voucher">
              <input className="vx-input" placeholder="Mã giảm giá (cần SĐT khách)" value={voucher} maxLength={30} onChange={(e) => { setVoucher(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setDiscount(0); setVoucherMsg(''); }} />
              <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={!voucher || !lines.length || pending} onClick={applyVoucher}>Áp dụng</button>
            </div>
            {voucherMsg && <span className={discount ? 'vx-help' : 'vx-err'} style={{ margin: 0 }}>{voucherMsg}</span>}
            {discount > 0 && <div className="r"><span>Mã giảm giá</span><b style={{ color: 'var(--sale)' }}>-{money(discount)}</b></div>}
            <div className="r tot"><span>Khách trả</span><b>{money(total)}</b></div>
            <div className="pos-pay">
              {PAYS.map((p) => <button key={p.key} type="button" aria-pressed={pay === p.key} onClick={() => setPay(p.key)}><Icon name={p.icon} />{p.label}</button>)}
            </div>
            {pay === 'cash' && (
              <div className="app-pos-cash">
                <input className="vx-input" inputMode="numeric" placeholder="Khách đưa (đ)" value={given} onChange={(e) => setGiven(digits(e.target.value))} aria-label="Tiền khách đưa" />
                <span>{givenN && givenN < total ? <b style={{ color: 'var(--danger)' }}>Thiếu {money(total - givenN)}</b> : change ? <>Thối lại <b>{money(change)}</b></> : null}</span>
              </div>
            )}
            {hasPesticide && (
              <label className="vx-check" style={{ fontSize: 12 }}>
                <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
                Đã dặn khách đọc hướng dẫn an toàn thuốc BVTV
              </label>
            )}
            {error && <span className="vx-err" role="alert">{error}</span>}
            <button type="button" className="vx-btn vx-btn--primary vx-btn--block pos-cta" disabled={!canPay} onClick={checkout}>
              {pending ? 'Đang xử lý…' : `Thanh toán ${money(total)} (F9)`}
            </button>
          </div>
        </div>
      </div>

      {done && (
        <div className="app-pos-done" role="dialog" aria-modal="true" aria-label="Đã thanh toán">
          <div className="app-pos-done__box">
            <span className="app-pos-done__ok"><Icon name="check" size={28} /></span>
            <h2>Đã thanh toán {money(done.total)}</h2>
            <p>Đơn <b>{done.code}</b>{done.change ? <> · thối lại <b>{money(done.change)}</b></> : null}</p>
            <span className="acts">
              <a className="vx-btn vx-btn--outline" href={`/admin/pos/hoa-don/${done.code}`} target="_blank" rel="noreferrer">In hóa đơn</a>
              <button type="button" className="vx-btn vx-btn--primary" onClick={reset} autoFocus>Đơn mới</button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
