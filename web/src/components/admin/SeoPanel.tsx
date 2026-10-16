'use client';

import { useState } from 'react';
import { changeSlugAction, saveSeoAction } from '@/app/actions/seo';
import { lengthHint, SEO_DESC_MAX, SEO_TITLE_MAX } from '@/lib/seo-cms';
import { normalize } from '@/lib/catalog';

export type SeoValue = { title: string | null; description: string | null; canonical: string | null; noindex: boolean; image: string | null };
export type SeoHistory = { at: string; actor: string; text: string };

type Props = {
  /** Đường dẫn công khai của trang (khóa của SEO đặt tay). */
  path: string;
  initial: SeoValue | null;
  /** Ô nội dung hiện trong khung (ô nào form phía trên đã có thì không hiện lại). */
  fields: ('title' | 'description' | 'image')[];
  /** Sửa được tiêu đề / mô tả / ảnh. */
  canEdit: boolean;
  /** Quản lý: được đổi Ẩn khỏi Google + đường dẫn chuẩn. */
  isAdmin: boolean;
  /** Chữ web tự tạo khi ô trống (hiện mờ trong ô). */
  auto?: { title?: string; description?: string };
  /** Ghi chú cho ô không hiện ("Tiêu đề Google lấy từ ô Tên chi tiết ở trên"). */
  note?: string;
  images?: { url: string; label: string }[];
  /** Trang đang hiện cho khách. */
  live: boolean;
  /** Đổi đường dẫn (bài viết, công trình) — đã lên web thì tự chuyển hướng link cũ. */
  slug?: { kind: 'post' | 'project'; id: number; value: string; prefix: string; wasPublic: boolean };
  history?: SeoHistory[];
  /** Hiện trong hộp thoại (trang /admin/seo) — bỏ khung thẻ ngoài. */
  bare?: boolean;
  onSaved?: () => void;
};

const EMPTY: SeoValue = { title: null, description: null, canonical: null, noindex: false, image: null };

/** Khung "Google & chia sẻ" cuối trang sửa nội dung (mục 14 checklist SEO) — lưu riêng, không cần bấm Lưu của form. */
export function SeoPanel({ path, initial, fields, canEdit, isAdmin, auto = {}, note, images = [], live, slug, history = [], bare, onSaved }: Props) {
  const start = initial ?? EMPTY;
  const [v, setV] = useState({ title: start.title ?? '', description: start.description ?? '', canonical: start.canonical ?? '', noindex: start.noindex, image: start.image ?? '' });
  const [saved, setSaved] = useState(v);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newSlug, setNewSlug] = useState(slug?.value ?? '');
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  const has = (f: Props['fields'][number]) => fields.includes(f);
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => { setV((x) => ({ ...x, [k]: val })); setMsg(null); };

  async function save() {
    setBusy(true);
    setMsg(null);
    const input: Record<string, unknown> = { path };
    if (canEdit) {
      if (has('title')) input.title = v.title;
      if (has('description')) input.description = v.description;
      if (has('image')) input.image = v.image;
    }
    if (isAdmin) { input.noindex = v.noindex; input.canonical = v.canonical; }
    const r = await saveSeoAction(input);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setSaved(v);
    setMsg({ ok: true, text: r.changed ? 'Đã lưu — trang khách đổi ngay, sitemap đổi trong ≤ 10 phút.' : 'Không có gì thay đổi.' });
    onSaved?.();
  }

  function toggleNoindex(on: boolean) {
    if (on && !confirm('Ẩn trang này khỏi Google?\n\nTrang vẫn mở được cho khách có link, nhưng Google sẽ gỡ trang khỏi kết quả tìm kiếm và trang rời sitemap.')) return;
    set('noindex', on);
  }

  async function changeSlug() {
    if (!slug) return;
    const clean = normalize(newSlug).replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
    if (!clean || clean === slug.value) return;
    const warn = slug.wasPublic
      ? `Đổi đường dẫn thành ${slug.prefix}/${clean}?\n\nLink cũ ${slug.prefix}/${slug.value} sẽ tự chuyển (308) sang link mới — link đã chia sẻ và Google vẫn tới đúng trang.`
      : `Đổi đường dẫn thành ${slug.prefix}/${clean}?`;
    if (!confirm(warn)) return;
    setBusy(true);
    const r = await changeSlugAction(slug.kind, slug.id, clean);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    window.location.reload();
  }

  const title = v.title || auto.title || '';
  const desc = v.description || auto.description || '';
  const titleHint = has('title') ? lengthHint('title', v.title || auto.title || '') : null;
  const descHint = has('description') ? lengthHint('description', v.description || auto.description || '') : null;

  const body = (
    <>
      {!live && <div className="vx-note" style={{ marginBottom: 10 }}><div>Trang đang ẩn / chưa đăng — các cài đặt dưới đây có tác dụng khi trang hiện cho khách.</div></div>}
      {note && <p className="hint" style={{ margin: '0 0 10px' }}>{note}</p>}

      {has('title') && (
        <div className="ad-f">
          <label htmlFor={`seo-t-${path}`}>Tiêu đề Google</label>
          <input id={`seo-t-${path}`} className="vx-input" value={v.title} maxLength={120} disabled={!canEdit}
            placeholder={auto.title ? `Để trống = ${auto.title}` : 'Để trống = web tự tạo'} onChange={(e) => set('title', e.target.value)} />
          <span className="hint">{v.title.length}/{SEO_TITLE_MAX} ký tự{titleHint ? ` · ${titleHint}` : ''}</span>
        </div>
      )}
      {has('description') && (
        <div className="ad-f">
          <label htmlFor={`seo-d-${path}`}>Mô tả Google</label>
          <textarea id={`seo-d-${path}`} className="vx-input" style={{ minHeight: 72 }} value={v.description} maxLength={320} disabled={!canEdit}
            placeholder={auto.description ? `Để trống = ${auto.description}` : 'Để trống = web tự tạo'} onChange={(e) => set('description', e.target.value)} />
          <span className="hint">{v.description.length}/{SEO_DESC_MAX} ký tự{descHint ? ` · ${descHint}` : ''}</span>
        </div>
      )}
      {(has('title') || has('description')) && (
        <div className="pe-serp" aria-label="Xem trước trên Google" style={{ marginBottom: 12 }}>
          <small>caycanhmientay.com{path}</small>
          <b>{title.slice(0, SEO_TITLE_MAX) || 'Tiêu đề trang'}</b>
          <span>{desc.slice(0, SEO_DESC_MAX) || 'Mô tả trang…'}</span>
        </div>
      )}

      {has('image') && images.length > 0 && (
        <div className="ad-f">
          <span className="lbl" style={{ fontWeight: 600 }}>Ảnh khi chia sẻ Zalo / Facebook</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="radiogroup" aria-label="Ảnh chia sẻ">
            <button type="button" className="vx-chip" aria-pressed={!v.image} disabled={!canEdit} onClick={() => set('image', '')}>Mặc định (ảnh đầu)</button>
            {images.map((im) => (
              <button key={im.url} type="button" aria-pressed={v.image === im.url} disabled={!canEdit} title={im.label} aria-label={im.label} onClick={() => set('image', im.url)}
                style={{ padding: 0, width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: v.image === im.url ? '3px solid var(--primary)' : '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                <img src={`${im.url}${im.url.startsWith('/api/') ? '?w=160' : ''}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <details style={{ margin: '4px 0 12px' }} open={!!(v.noindex || v.canonical)}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Nâng cao (chỉ Quản lý)</summary>
        <div className="vx-label-row" style={{ marginTop: 8 }}>
          <span>Ẩn trang này khỏi Google (noindex)</span>
          <button type="button" className="vx-switch" role="switch" aria-checked={v.noindex} aria-label="Ẩn trang này khỏi Google" disabled={!isAdmin || path === '/'}
            onClick={() => toggleNoindex(!v.noindex)} />
        </div>
        <div className="ad-f">
          <label htmlFor={`seo-c-${path}`}>Đường dẫn chuẩn (canonical)</label>
          <input id={`seo-c-${path}`} className="vx-input" value={v.canonical} maxLength={300} disabled={!isAdmin}
            placeholder={`Để trống = ${path}`} onChange={(e) => set('canonical', e.target.value)} />
          <span className="hint">Chỉ điền khi trang này trùng nội dung với một trang khác và muốn Google chỉ giữ trang kia.</span>
        </div>
      </details>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="vx-btn vx-btn--primary" disabled={busy || !dirty || (!canEdit && !isAdmin)} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu SEO'}</button>
        {msg && <span role="status" style={{ color: msg.ok ? 'var(--primary-hover)' : 'var(--danger, #c62828)' }}>{msg.text}</span>}
      </div>

      {slug && (
        <div className="ad-f" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <label htmlFor={`seo-s-${path}`}>Đổi đường dẫn</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input id={`seo-s-${path}`} className="vx-input" style={{ flex: '1 1 14rem' }} value={newSlug} maxLength={90} disabled={!canEdit}
              onChange={(e) => setNewSlug(normalize(e.target.value).replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-'))} />
            <button type="button" className="vx-btn vx-btn--outline" disabled={busy || !canEdit || !newSlug || newSlug === slug.value} onClick={changeSlug}>Đổi</button>
          </div>
          <span className="hint" style={{ wordBreak: 'break-all' }}>
            {slug.prefix}/{newSlug || '…'}{slug.wasPublic ? ' · Link cũ tự chuyển sang link mới.' : ''}
          </span>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <b style={{ fontSize: '0.875rem' }}>Lịch sử thay đổi SEO</b>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            {history.map((h, i) => <li key={i}>{h.at} · {h.actor}: {h.text}</li>)}
          </ul>
        </div>
      )}
    </>
  );

  if (bare) return body;
  return (
    <div className="ad-card" id="seo">
      <div className="ad-card__h"><span>Google & chia sẻ (SEO)</span><span className="hint" style={{ fontWeight: 400 }}>Lưu riêng</span></div>
      <div className="ad-card__b">{body}</div>
    </div>
  );
}
