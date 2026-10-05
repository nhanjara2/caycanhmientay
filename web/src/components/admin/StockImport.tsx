'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { importStockAction } from '@/app/actions/admin';
import { fmtYmd } from '@/lib/stock';

type Result = Awaited<ReturnType<typeof importStockAction>>;
type Checked = Extract<Result, { ok: true }>;

const SHOW_MAX = 200;

/** Tải lên file Excel nhập hàng: tự kiểm tra ngay khi chọn file, hiện từng dòng đúng/sai, bấm xác nhận mới ghi vào kho. */
export function StockImport() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<Checked | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ lines: number; units: number } | null>(null);
  const [pending, start] = useTransition();

  const reset = () => { setFile(null); setRes(null); setError(''); if (input.current) input.current.value = ''; };

  const run = (f: File, mode: 'preview' | 'commit') => {
    setError('');
    start(async () => {
      const fd = new FormData();
      fd.set('file', f);
      fd.set('mode', mode);
      const r = await importStockAction(fd).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); setRes(null); return; }
      if (r.committed) {
        setDone({ lines: r.lines, units: r.units });
        reset();
        router.refresh();
        return;
      }
      setRes(r);
    });
  };

  const pick = (f: File | undefined) => {
    setDone(null);
    setRes(null);
    setFile(f ?? null);
    if (f) run(f, 'preview');
  };

  const bad = res ? res.rows.filter((r) => r.errors.length) : [];
  const good = res ? res.rows.filter((r) => !r.errors.length) : [];
  const units = good.reduce((s, r) => s + (r.qty ?? 0), 0);
  const shown = res ? [...bad, ...good].slice(0, SHOW_MAX) : [];

  return (
    <div className="ad-card__b">
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
          <div>Đã nhập kho <b>{done.lines}</b> dòng, tổng <b>{done.units.toLocaleString('vi-VN')}</b> sản phẩm. Xem lịch sử ở <a href="/admin/kho" style={{ color: 'var(--primary)', fontWeight: 600 }}>Kho &amp; tồn kho</a>.</div>
        </div>
      )}

      {res && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ad-pill done">{good.length} dòng hợp lệ · {units.toLocaleString('vi-VN')} sản phẩm</span>
            {bad.length > 0 && <span className="ad-pill cancel">{bad.length} dòng lỗi</span>}
            {res.skipped > 0 && <small style={{ color: 'var(--ink-muted)' }}>{res.skipped} dòng bỏ qua (chưa điền số lượng)</small>}
          </div>
          {!res.rows.length && <span className="vx-err">Không có dòng nào có Số lượng nhập. Điền số lượng vào file mẫu rồi tải lại.</span>}
          {bad.length > 0 && <span className="vx-help">Còn dòng lỗi nên chưa thể nhập. Sửa trong file Excel rồi chọn lại file (không dòng nào được nhập khi còn lỗi).</span>}

          {res.rows.length > 0 && (
            <div className="ad-tablewrap">
              <table className="ad-table app-mtable">
                <thead>
                  <tr><th>Sản phẩm</th><th>Dòng</th><th>Cửa hàng</th><th className="num">Số lượng</th><th>Số lô</th><th>Hạn dùng</th><th>Kết quả</th></tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.row}>
                      <td>{r.name ? `${r.name} · ${r.label}` : r.sku}<small>{r.sku}</small></td>
                      <td data-label="Dòng">{r.row}</td>
                      <td data-label="Cửa hàng">{r.storeCode ?? '—'}</td>
                      <td className="num" data-label="Số lượng">{r.qty ?? '—'}</td>
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
              disabled={pending || !file || !!bad.length || !good.length}
              onClick={() => file && confirm(`Nhập kho ${good.length} dòng (tổng ${units.toLocaleString('vi-VN')} sản phẩm)? Không thể hoàn tác hàng loạt — chỉnh lại từng mặt hàng ở trang Kho.`) && run(file, 'commit')}
            >
              {pending ? 'Đang nhập kho…' : `Xác nhận nhập kho (${good.length} dòng)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
