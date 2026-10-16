'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { importStockAction } from '@/app/actions/admin';
import { money } from '@/lib/format';
import { fmtYmd } from '@/lib/stock';

type Result = Awaited<ReturnType<typeof importStockAction>>;
type Checked = Extract<Result, { ok: true }>;

const SHOW_MAX = 200;

/**
 * Tải lên file Excel nhập hàng: điền thông tin phiếu (nhà cung cấp, số chứng từ), tự kiểm tra ngay khi chọn file,
 * hiện từng dòng đúng/sai, bấm xác nhận mới ghi vào kho thành một phiếu nhập. `suppliers` = tên nhà cung cấp đã dùng (gợi ý khi gõ).
 */
export function StockImport({ suppliers }: { suppliers: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<Checked | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ lines: number; units: number; code: string } | null>(null);
  const [supplier, setSupplier] = useState('');
  const [docNo, setDocNo] = useState('');
  const [note, setNote] = useState('');
  const [allowDup, setAllowDup] = useState(false);
  const [consign, setConsign] = useState(false);
  const [pending, start] = useTransition();

  const reset = () => { setFile(null); setRes(null); setError(''); setAllowDup(false); if (input.current) input.current.value = ''; };

  const run = (f: File, mode: 'preview' | 'commit') => {
    setError('');
    start(async () => {
      const fd = new FormData();
      fd.set('file', f);
      fd.set('mode', mode);
      fd.set('supplier', supplier);
      fd.set('docNo', docNo);
      fd.set('note', note);
      if (allowDup) fd.set('allowDuplicate', '1');
      if (consign) fd.set('consign', '1');
      const r = await importStockAction(fd).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); setRes(null); return; }
      if (r.committed) {
        setDone({ lines: r.lines, units: r.units, code: r.code });
        reset();
        setSupplier(''); setDocNo(''); setNote(''); setConsign(false);
        router.refresh();
        return;
      }
      setRes(r);
    });
  };

  const pick = (f: File | undefined) => {
    setDone(null);
    setRes(null);
    setAllowDup(false);
    setFile(f ?? null);
    if (f) run(f, 'preview');
  };

  const bad = res ? res.rows.filter((r) => r.errors.length) : [];
  const good = res ? res.rows.filter((r) => !r.errors.length) : [];
  const units = good.reduce((s, r) => s + (r.qty ?? 0), 0);
  const costed = good.filter((r) => r.unitCost !== null);
  const total = costed.reduce((s, r) => s + (r.qty ?? 0) * (r.unitCost ?? 0), 0);
  const dup = res?.duplicate ?? null;
  const shown = res ? [...bad, ...good].slice(0, SHOW_MAX) : [];

  return (
    <div className="ad-card__b">
      <div className="ad-grid2">
        <div className="vx-fl">
          <label htmlFor="si-supplier">Nhà vườn / nhà cung cấp{consign ? ' (bắt buộc)' : ' (không bắt buộc)'}</label>
          <input id="si-supplier" list="supplier-list" value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={80} placeholder="Chọn hoặc gõ tên mới" autoComplete="off" />
          <datalist id="supplier-list">{suppliers.map((n) => <option key={n} value={n} />)}</datalist>
        </div>
        <div className="vx-fl">
          <label htmlFor="si-doc">Số hóa đơn / chứng từ NCC</label>
          <input id="si-doc" value={docNo} onChange={(e) => setDocNo(e.target.value)} maxLength={60} placeholder="HD-0123" autoComplete="off" />
        </div>
      </div>
      <label className="vx-check">
        <input type="checkbox" checked={consign} onChange={(e) => setConsign(e.target.checked)} />
        <span><b>Hàng ký gửi</b> — cây vẫn ở vườn nhà cung cấp, trả tiền nhà vườn theo số đã bán (xem ở Đối soát nhà vườn)</span>
      </label>
      <div className="vx-fl">
        <label htmlFor="si-note">Ghi chú phiếu</label>
        <input id="si-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Giao buổi sáng, kiểm hàng bởi…" autoComplete="off" />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label="Chọn file Excel nhập hàng"
          disabled={pending}
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {pending && <small>Đang xử lý…</small>}
        {file && !pending && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={reset}>Chọn file khác</button>}
      </div>

      {error && <span className="vx-err" role="alert">{error}</span>}
      {done && (
        <div className="vx-callout" role="status">
          <div>Đã nhập kho <b>{done.lines}</b> dòng, tổng <b>{done.units.toLocaleString('vi-VN')}</b> sản phẩm — phiếu <Link href={`/admin/nhap-hang/phieu/${done.code}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{done.code}</Link>. Xem tồn ở <a href="/admin/kho" style={{ color: 'var(--primary)', fontWeight: 600 }}>Kho &amp; tồn kho</a>.</div>
        </div>
      )}

      {res && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ad-pill done">{good.length} dòng hợp lệ · {units.toLocaleString('vi-VN')} sản phẩm</span>
            {costed.length > 0 && <span className="ad-pill">Tiền hàng {money(total)}{costed.length < good.length ? ` (${good.length - costed.length} dòng chưa ghi giá nhập)` : ''}</span>}
            {bad.length > 0 && <span className="ad-pill cancel">{bad.length} dòng lỗi</span>}
            {res.skipped > 0 && <small style={{ color: 'var(--ink-muted)' }}>{res.skipped} dòng bỏ qua (chưa điền số lượng)</small>}
          </div>
          {!res.rows.length && <span className="vx-err">Không có dòng nào có Số lượng nhập. Điền số lượng vào file mẫu rồi tải lại.</span>}
          {dup && !bad.length && (
            <div className="vx-callout" role="alert" style={{ borderColor: 'var(--sale)' }}>
              <div>
                <b>Nội dung này đã được nhập</b> ở phiếu <Link href={`/admin/nhap-hang/phieu/${dup.code}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{dup.code}</Link>{' '}
                ({new Date(dup.at).toLocaleString('vi-VN')}{dup.actor ? ` · ${dup.actor}` : ''}). Nhập lại sẽ cộng đôi số lượng vào kho.
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontWeight: 600 }}>
                  <input type="checkbox" checked={allowDup} onChange={(e) => setAllowDup(e.target.checked)} />
                  Tôi hiểu, đây là lần giao hàng khác — vẫn nhập
                </label>
              </div>
            </div>
          )}
          {bad.length > 0 && <span className="vx-help">Còn dòng lỗi nên chưa thể nhập. Sửa trong file Excel rồi chọn lại file (không dòng nào được nhập khi còn lỗi).</span>}

          {res.rows.length > 0 && (
            <div className="ad-tablewrap">
              <table className="ad-table app-mtable">
                <thead>
                  <tr><th>Sản phẩm</th><th>Dòng</th><th>Cửa hàng</th><th className="num">Số lượng</th><th className="num">Giá nhập</th><th>Số lô</th><th>Hạn dùng</th><th>Kết quả</th></tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.row}>
                      <td>{r.name ? `${r.name} · ${r.label}` : r.sku}<small>{r.sku}</small></td>
                      <td data-label="Dòng">{r.row}</td>
                      <td data-label="Cửa hàng">{r.storeCode ?? '—'}</td>
                      <td className="num" data-label="Số lượng">{r.qty ?? '—'}</td>
                      <td className="num" data-label="Giá nhập">{r.unitCost === null ? '—' : money(r.unitCost)}</td>
                      <td data-label="Số lô">{r.lotCode ?? '—'}</td>
                      <td data-label="Hạn dùng">{r.expiry ? fmtYmd(r.expiry) : '—'}</td>
                      <td data-label="Kết quả" data-wide>
                        {r.errors.length ? (
                          <span style={{ color: 'var(--danger)' }}>{r.errors.map((m) => <span key={m} style={{ display: 'block' }}>{m}</span>)}</span>
                        ) : (
                          <>
                            <span className="ad-pill done">Hợp lệ</span>
                            {r.warnings.map((m) => <small key={m} style={{ color: 'var(--sale)' }}>{m}</small>)}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {res.rows.length > SHOW_MAX && <small style={{ color: 'var(--ink-muted)' }}>Chỉ hiện {SHOW_MAX} dòng đầu (dòng lỗi lên trước); tổng {res.rows.length} dòng.</small>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="vx-btn vx-btn--primary"
              disabled={pending || !file || !!bad.length || !good.length || (!!dup && !allowDup)}
              onClick={() => file && confirm(`Nhập kho ${good.length} dòng (tổng ${units.toLocaleString('vi-VN')} sản phẩm)${supplier ? ` từ ${supplier}` : ''}? Không thể hoàn tác hàng loạt — chỉnh lại từng mặt hàng ở trang Kho.`) && run(file, 'commit')}
            >
              {pending ? 'Đang nhập kho…' : `Xác nhận nhập kho (${good.length} dòng)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
