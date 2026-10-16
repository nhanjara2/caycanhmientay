'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteRedirectAction, saveRedirectAction, saveRedirectsBulkAction } from '@/app/actions/seo';
import { Icon } from '@/components/Icon';
import { SeoPanel, type SeoValue } from './SeoPanel';

/** Nút "SEO" ở bảng trang của /admin/seo: mở hộp sửa tiêu đề / mô tả / noindex / canonical cho một đường dẫn bất kỳ. */
export function SeoEditButton({ path, initial, live }: { path: string; initial: SeoValue | null; live: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const set = !!initial;
  return (
    <>
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => setOpen(true)} aria-label={`Sửa SEO ${path}`}>{set ? 'Sửa SEO' : 'SEO'}</button>
      {open && (
        <div className="app-modal" role="dialog" aria-modal="true" aria-label={`SEO ${path}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="vx-modal" style={{ maxWidth: 560, textAlign: 'left' }}>
            <div className="vx-modal__head">
              <span style={{ wordBreak: 'break-all' }}>SEO · {path}</span>
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)}><Icon name="close" /></button>
            </div>
            <div className="vx-modal__body">
              <SeoPanel bare path={path} initial={initial} fields={['title', 'description']} canEdit isAdmin live={live}
                note="Ô trống = web tự tạo như cũ. Trang có ô SEO riêng trong admin (sản phẩm, bài viết…) thì sửa ở trang đó sẽ đủ hơn (có chọn ảnh chia sẻ)."
                onSaved={() => router.refresh()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type Redirect = { fromPath: string; toPath: string; reason: string; note: string; hits: number; lastHit: string | null; createdBy: string | null; created: string };

/** Bảng chuyển hướng + form thêm (chỉ Quản lý). `suggest` = trang đã gỡ / đang ẩn chưa có chuyển hướng. */
export function RedirectAdmin({ redirects, suggest, initialFrom }: { redirects: Redirect[]; suggest: { path: string; why: string }[]; initialFrom?: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom ?? '');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await saveRedirectAction({ from, to, note });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: [`Đã lưu: ${r.from} → ${r.to}`, ...r.warnings].join(' ') });
    setFrom(''); setTo(''); setNote('');
    router.refresh();
  }

  async function remove(path: string) {
    if (!confirm(`Xóa chuyển hướng ${path}?\n\nLink cũ sẽ báo "Không tìm thấy" (404).`)) return;
    await deleteRedirectAction(path);
    router.refresh();
  }

  return (
    <>
      <form className="ad-card" onSubmit={add} style={{ marginBottom: 12 }}>
        <div className="ad-card__h">Thêm chuyển hướng</div>
        <div className="ad-card__b">
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
            <div className="ad-f">
              <label htmlFor="rd-from">Đường dẫn cũ</label>
              <input id="rd-from" className="vx-input" value={from} maxLength={300} required placeholder="/san-pham/ten-cu" onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="ad-f">
              <label htmlFor="rd-to">Chuyển tới</label>
              <input id="rd-to" className="vx-input" value={to} maxLength={300} required placeholder="/san-pham/ten-moi hoặc /danh-muc/cay-canh" onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="ad-f">
              <label htmlFor="rd-note">Ghi chú</label>
              <input id="rd-note" className="vx-input" value={note} maxLength={200} placeholder="Ngừng bán, thay bằng…" onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <span className="hint">
            Chuyển hướng vĩnh viễn (308). Chỉ có tác dụng khi trang cũ đã ẩn / xóa — trang đang hiện không bao giờ bị chuyển đi.
            Đường dẫn cũ phải là sản phẩm, danh mục, bài viết, bệnh cây hoặc công trình. Dán cả link đầy đủ cũng được.
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <button className="vx-btn vx-btn--primary" disabled={busy || !from || !to}>{busy ? 'Đang lưu…' : 'Lưu chuyển hướng'}</button>
            {msg && <span role="status" style={{ color: msg.ok ? 'var(--primary-hover)' : 'var(--danger, #c62828)' }}>{msg.text}</span>}
          </div>
        </div>
      </form>

      <BulkRedirects />

      {suggest.length > 0 && (
        <div className="ad-card" style={{ marginBottom: 12 }}>
          <div className="ad-card__h">Trang đã gỡ / đang ẩn chưa có chuyển hướng</div>
          <div className="ad-card__b">
            <span className="hint">Ngừng bán hẳn mà có trang thay thế (sản phẩm tương tự, danh mục) thì chuyển hướng để giữ khách từ Google, Zalo. Còn bán lại thì để nguyên.</span>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {suggest.map((s) => (
                <li key={s.path} style={{ marginBottom: 4 }}>
                  <button type="button" className="app-bare" style={{ color: 'var(--primary)', fontWeight: 600, textAlign: 'left', wordBreak: 'break-all' }} onClick={() => { setFrom(s.path); document.getElementById('rd-to')?.focus(); }}>
                    {s.path}
                  </button>{' '}
                  <small style={{ color: 'var(--ink-muted)' }}>· {s.why}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="ad-card">
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Đường dẫn cũ</th><th>Chuyển tới</th><th>Lý do</th><th className="num">Lượt dùng</th><th>Tạo</th><th /></tr></thead>
            <tbody>
              {redirects.map((r) => (
                <tr key={r.fromPath}>
                  <td style={{ wordBreak: 'break-all' }}><b>{r.fromPath}</b></td>
                  <td data-label="Chuyển tới" style={{ wordBreak: 'break-all' }}><a href={r.toPath} target="_blank" rel="noopener" style={{ color: 'var(--primary)' }}>{r.toPath}</a></td>
                  <td data-label="Lý do" data-m="note">{r.reason === 'slug' ? 'Đổi đường dẫn' : 'Thêm tay'}{r.note ? ` · ${r.note}` : ''}</td>
                  <td className="num" data-label="Lượt dùng" data-m="third">{r.hits}{r.lastHit && <small style={{ display: 'block', color: 'var(--ink-muted)' }}>{r.lastHit}</small>}</td>
                  <td data-label="Tạo">{r.created}<small style={{ display: 'block', color: 'var(--ink-muted)' }}>{r.createdBy}</small></td>
                  <td data-m="foot end"><button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)' }} onClick={() => remove(r.fromPath)}>Xóa</button></td>
                </tr>
              ))}
              {!redirects.length && <tr><td colSpan={6} data-wide style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>Chưa có chuyển hướng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** Dán cả bảng đối chiếu link cũ → link mới (vd. copy 2 cột từ Excel) khi đổi cấu trúc web / ngừng bán nhiều sản phẩm. */
function BulkRedirects() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ line: string; ok: boolean; text: string }[]>([]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResults([]);
    const r = await saveRedirectsBulkAction(text);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setResults(r.results);
    setText(r.results.filter((x) => !x.ok).map((x) => x.line).join('\n'));
    router.refresh();
  }

  const done = results.filter((x) => x.ok).length;
  return (
    <details className="ad-card" style={{ marginBottom: 12 }}>
      <summary className="ad-card__h" style={{ cursor: 'pointer' }}>Thêm nhiều chuyển hướng một lần</summary>
      <form className="ad-card__b" onSubmit={save}>
        <div className="ad-f">
          <label htmlFor="rd-bulk">Mỗi dòng: đường dẫn cũ rồi đường dẫn mới</label>
          <textarea id="rd-bulk" className="vx-input" rows={6} value={text} spellCheck={false} style={{ fontFamily: 'monospace', minHeight: 120 }}
            placeholder={'/san-pham/ten-cu    /san-pham/ten-moi\n/tin-tuc/bai-cu → /tin-tuc/bai-moi'} onChange={(e) => setText(e.target.value)} />
        </div>
        <span className="hint">Copy 2 cột từ Excel dán vào được. Cách nhau bằng dấu cách, Tab, → hoặc dấu phẩy. Tối đa 300 dòng.</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <button className="vx-btn vx-btn--primary" disabled={busy || !text.trim()}>{busy ? 'Đang lưu…' : 'Lưu tất cả'}</button>
          {error && <span role="alert" style={{ color: 'var(--danger, #c62828)' }}>{error}</span>}
          {results.length > 0 && <span role="status">Đã lưu {done}/{results.length} dòng{done < results.length ? ' — dòng lỗi còn lại trong ô để sửa' : ''}.</span>}
        </div>
        {results.length > 0 && (
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, wordBreak: 'break-all' }}>
            {results.map((x, i) => (
              <li key={i} style={{ color: x.ok ? undefined : 'var(--danger, #c62828)', marginBottom: 2 }}>
                {x.ok ? x.text : <><b>{x.line}</b> — {x.text}</>}
              </li>
            ))}
          </ul>
        )}
      </form>
    </details>
  );
}
