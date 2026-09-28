'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { adjustStockAction, stockHistoryAction } from '@/app/actions/admin';
import { Icon } from '@/components/Icon';
import { expiryLevel, fmtYmd } from '@/lib/stock';

const REASON = { import: 'Nhập hàng', adjust: 'Kiểm kê', order: 'Bán', cancel: 'Hủy đơn', transfer: 'Chuyển kho', warranty: 'Bảo hành' } as const;
type Move = Awaited<ReturnType<typeof stockHistoryAction>>[number];
type Mode = 'import' | 'count' | 'transfer';

export type StoreOpt = { id: number; code: string; name: string };
export type LotOpt = { id: number; storeId: number; lotCode: string | null; expiry: string | null; qty: number };

const digits = (s: string) => s.replace(/\D/g, '').slice(0, 6);

/** Nút "Nhập / Kiểm kê" + hộp thoại: nhập hàng vào cửa hàng (theo lô), kiểm kê từng lô, chuyển kho; kèm lịch sử gần nhất. */
export function StockDialog({ slug, idx, name, label, stock, lotTracked, stores, lots }: {
  slug: string; idx: number; name: string; label: string; stock: number; lotTracked: boolean; stores: StoreOpt[]; lots: LotOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('import');
  const [storeId, setStoreId] = useState(stores[0]?.id ?? 0);
  const [to, setTo] = useState(stores[1]?.id ?? 0);
  const [lotId, setLotId] = useState(lots[0]?.id ?? 0);
  const [lotCode, setLotCode] = useState('');
  const [expiry, setExpiry] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [moves, setMoves] = useState<Move[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    stockHistoryAction(slug, idx).then(setMoves).catch(() => setMoves([]));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, slug, idx]);

  const storeCode = (id: number) => stores.find((s) => s.id === id)?.code ?? '?';
  const lotText = (l: Pick<LotOpt, 'lotCode' | 'expiry'>) => [l.lotCode && `Lô ${l.lotCode}`, l.expiry && `HSD ${fmtYmd(l.expiry)}`].filter(Boolean).join(' · ') || 'Không theo lô';
  const inStore = (id: number) => lots.filter((l) => l.storeId === id && expiryLevel(l.expiry) !== 'expired').reduce((s, l) => s + l.qty, 0);
  const n = Number(qty || 0);
  const lot = lots.find((l) => l.id === lotId);

  const preview =
    qty === '' ? null
      : mode === 'import' ? <>Tồn tổng sau khi lưu: <b>{stock + n}</b></>
      : mode === 'count' ? (lot ? <>Lô sau kiểm kê: <b>{n}</b>{n !== lot.qty ? ` (${n - lot.qty > 0 ? '+' : ''}${n - lot.qty})` : ' — khớp'}</> : null)
      : <>{storeCode(storeId)} còn {inStore(storeId) - n} · {storeCode(to)} thêm {n}</>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload =
      mode === 'import' ? { mode, slug, idx, storeId, qty: n, lotCode: lotCode || undefined, expiry: expiry || undefined, note: note || undefined }
        : mode === 'count' ? { mode, lotId, qty: n, note: note || undefined }
        : { mode, slug, idx, from: storeId, to, qty: n, note: note || undefined };
    start(async () => {
      const r = await adjustStockAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setOpen(false); setQty(''); setNote(''); setLotCode(''); setExpiry('');
      router.refresh();
    });
  };

  const storeSelect = (id: string, value: number, onChange: (v: number) => void, labelText: string) => (
    <div className="vx-fl">
      <label htmlFor={id}>{labelText}</label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name} (còn {inStore(s.id)})</option>)}
      </select>
    </div>
  );

  return (
    <>
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => setOpen(true)}>Nhập / Kiểm kê</button>
      {open && (
        <div className="app-modal" role="dialog" aria-modal="true" aria-label="Chỉnh tồn kho" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="vx-modal" style={{ maxWidth: 480, textAlign: 'left' }} onSubmit={submit}>
            <div className="vx-modal__head">
              Chỉnh tồn kho
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)}><Icon name="close" /></button>
            </div>
            <div className="vx-modal__body">
              <div>
                <b>{name}</b>
                <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
                  {label} · tổng tồn <b>{stock}</b> · {stores.map((s) => `${s.code} ${inStore(s.id)}`).join(' · ')}
                </div>
              </div>
              <span className="vx-seg">
                <button type="button" className="vx-chip" aria-pressed={mode === 'import'} onClick={() => setMode('import')}>Nhập hàng</button>
                <button type="button" className="vx-chip" aria-pressed={mode === 'count'} onClick={() => setMode('count')} disabled={!lots.length}>Kiểm kê</button>
                <button type="button" className="vx-chip" aria-pressed={mode === 'transfer'} onClick={() => setMode('transfer')} disabled={stores.length < 2 || !stock}>Chuyển kho</button>
              </span>

              {mode === 'import' && (
                <>
                  {storeSelect('sd-store', storeId, setStoreId, 'Nhập vào cửa hàng')}
                  {lotTracked && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <div className="vx-fl"><label htmlFor="sd-lot">Số lô</label><input id="sd-lot" value={lotCode} onChange={(e) => setLotCode(e.target.value.toUpperCase())} maxLength={40} placeholder="L2609-01" /></div>
                      <div className="vx-fl"><label htmlFor="sd-exp">Hạn dùng</label><input id="sd-exp" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
                    </div>
                  )}
                </>
              )}

              {mode === 'count' && (
                <div className="vx-fl">
                  <label htmlFor="sd-lotsel">Lô cần kiểm kê</label>
                  <select id="sd-lotsel" value={lotId} onChange={(e) => setLotId(Number(e.target.value))}>
                    {lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {storeCode(l.storeId)} · {lotText(l)} · đang {l.qty}{expiryLevel(l.expiry) === 'expired' ? ' · ĐÃ HẾT HẠN' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'transfer' && (
                <>
                  {storeSelect('sd-from', storeId, setStoreId, 'Từ cửa hàng')}
                  {storeSelect('sd-to', to, setTo, 'Đến cửa hàng')}
                </>
              )}

              <div className="vx-fl">
                <label htmlFor="sd-qty">{mode === 'import' ? 'Số lượng nhập' : mode === 'count' ? 'Số lượng đếm được' : 'Số lượng chuyển'}</label>
                <input id="sd-qty" inputMode="numeric" autoFocus value={qty} onChange={(e) => setQty(digits(e.target.value))} />
              </div>
              <div className="vx-fl">
                <label htmlFor="sd-note">{mode === 'count' ? 'Lý do lệch (hư, hết hạn phải hủy…)' : 'Ghi chú (nhà cung cấp, số phiếu…)'}</label>
                <input id="sd-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
              </div>
              {preview && <span className="vx-help">{preview}</span>}
              {mode === 'transfer' && n > inStore(storeId) && <span className="vx-err">{storeCode(storeId)} chỉ còn {inStore(storeId)} (hàng còn hạn)</span>}
              {mode === 'transfer' && <span className="vx-help">Chuyển lô hết hạn sớm nhất trước, giữ nguyên số lô và hạn dùng.</span>}
              {error && <span className="vx-err" role="alert">{error}</span>}

              {lots.length > 0 && (
                <>
                  <hr className="vx-divider" />
                  <p className="vx-modal__sec">Tồn theo lô</p>
                  <div className="ad-log">
                    {lots.map((l) => {
                      const lv = expiryLevel(l.expiry);
                      return (
                        <div key={l.id}>
                          <span>{storeCode(l.storeId)}</span>
                          {/* gói trong 1 span: .ad-log là lưới 2 cột, mỗi thẻ <b> rời sẽ rớt xuống hàng mới */}
                          <span style={{ color: 'var(--ink)' }}>
                            {lotText(l)} · <b>{l.qty}</b>
                            {lv === 'expired' && <b style={{ color: 'var(--danger)' }}> · Đã hết hạn — kiểm kê về 0 khi hủy</b>}
                            {lv === 'soon' && <b style={{ color: 'var(--warning, #b7791f)' }}> · Sắp hết hạn</b>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {moves.length > 0 && (
                <>
                  <hr className="vx-divider" />
                  <p className="vx-modal__sec">Lịch sử gần đây</p>
                  <div className="ad-log">
                    {moves.map((m) => (
                      <div key={m.id}>
                        <span>{new Date(m.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        {REASON[m.reason]}{m.store ? ` ${m.store}` : ''}{m.lotCode ? ` (lô ${m.lotCode})` : ''} {m.delta > 0 ? `+${m.delta}` : m.delta} → tổng {m.after} · {m.actor}{m.note ? ` · ${m.note}` : ''}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="vx-modal__foot">
              <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={pending || qty === ''}>{pending ? 'Đang lưu…' : 'Lưu'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
