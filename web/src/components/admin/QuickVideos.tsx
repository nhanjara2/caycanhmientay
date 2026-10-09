'use client';

import Link from 'next/link';
import { useState } from 'react';
import { lookupVideosAction, quickAddVideosAction } from '@/app/actions/posts';
import { CATEGORIES, MAX_QUICK_VIDEOS, SECTIONS, TITLE_MAX, TITLE_MIN, VIDEO_PAGE, youtubeThumb, type CategoryKey } from '@/lib/posts';
import { Select } from '../Select';

type Row = {
  youtubeId: string; vertical: boolean; title: string; channel: string; error: string | null;
  existing: { id: number; title: string; published: boolean } | null;
  category: CategoryKey; featured: boolean; pick: boolean;
};

const DEFAULT_CATEGORY: CategoryKey = 'cham-soc';

function CategorySelect({ value, onChange, id, label }: { value: string; onChange: (v: CategoryKey) => void; id?: string; label?: string }) {
  return (
    <Select id={id} aria-label={label} className="vx-input" value={value} onChange={(e) => onChange(e.target.value as CategoryKey)}>
      {(['blog', 'news'] as const).map((s) => (
        <optgroup key={s} label={SECTIONS[s].name}>
          {CATEGORIES.filter((c) => c.section === s).map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
        </optgroup>
      ))}
    </Select>
  );
}

const titleError = (t: string) => {
  const n = t.trim().length;
  return n < TITLE_MIN ? `Tiêu đề cần ít nhất ${TITLE_MIN} ký tự` : n > TITLE_MAX ? `Tiêu đề tối đa ${TITLE_MAX} ký tự` : null;
};

/** Thêm nhanh video ngắn: dán nhiều link YouTube (Shorts) → lấy sẵn tiêu đề từ YouTube → sửa nếu cần → đăng một lượt. */
export function QuickVideos() {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [busy, setBusy] = useState<'' | 'lookup' | 'save'>('');
  const [error, setError] = useState('');
  const [posted, setPosted] = useState(0);

  const patch = (id: string, p: Partial<Row>) => setRows((rs) => rs && rs.map((r) => (r.youtubeId === id ? { ...r, ...p } : r)));
  const picked = rows?.filter((r) => r.pick) ?? [];
  const invalid = picked.some((r) => titleError(r.title));

  const lookup = async () => {
    setBusy('lookup'); setError(''); setPosted(0);
    const r = await lookupVideosAction(text).catch(() => ({ ok: false as const, error: 'Mất kết nối, thử lại' }));
    setBusy('');
    if (!r.ok) { setError(r.error); return; }
    setRows(r.items.map((x) => ({ ...x, category, featured: false, pick: !x.error && !x.existing })));
  };

  const save = async () => {
    if (!picked.length || invalid) return;
    setBusy('save'); setError('');
    const r = await quickAddVideosAction(picked.map(({ youtubeId, title, vertical, category, featured, channel }) => ({ youtubeId, title, vertical, category, featured, channel })))
      .catch(() => ({ ok: false as const, error: 'Mất kết nối, thử lại' }));
    setBusy('');
    if (!r.ok) { setError(r.error); return; }
    const okIds = new Set(r.results.filter((x) => x.ok).map((x) => x.youtubeId));
    const failed = new Map(r.results.filter((x) => !x.ok).map((x) => [x.youtubeId, x.error ?? 'Không đăng được']));
    setPosted((n) => n + okIds.size);
    // Video đã đăng rời khỏi danh sách; video lỗi ở lại kèm lý do để sửa rồi đăng lại.
    const left = (rows ?? []).filter((x) => !okIds.has(x.youtubeId)).map((x) => (failed.has(x.youtubeId) ? { ...x, error: failed.get(x.youtubeId)!, pick: false } : x));
    setRows(left.length ? left : null);
    if (!left.length) setText('');
  };

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Thêm nhanh video ngắn</h1>
        <span className="vx-crumb"><Link href="/admin/noi-dung">Bài viết & video</Link>/<span>Thêm nhanh video ngắn</span></span>
        <span className="acts">
          <Link href={VIDEO_PAGE} target="_blank" className="vx-btn vx-btn--outline">Xem trang Video ngắn</Link>
        </span>
      </div>

      {posted > 0 && (
        <div className="ad-card qv-done" role="status">
          <b>Đã đăng {posted} video.</b> Video hiện ngay ở <Link href={VIDEO_PAGE} target="_blank">trang Video ngắn</Link>, trang chủ (8 video đầu) và hàng
          “Video ngắn” ở Góc chăm cây. Muốn thêm mô tả hoặc sản phẩm dùng trong video: mở video trong <Link href="/admin/noi-dung?loai=video">danh sách</Link> để sửa.
        </div>
      )}

      <div className="ad-card">
        <div className="ad-card__h"><span>1. Dán link video</span></div>
        <div className="ad-card__b">
          <div className="ad-f">
            <label htmlFor="qv-links">Link YouTube — mỗi dòng một link (tối đa {MAX_QUICK_VIDEOS})</label>
            <textarea id="qv-links" className="vx-input qv-links" rows={6} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={'https://youtube.com/shorts/…\nhttps://youtu.be/…'} />
            <span className="hint">Trên app YouTube: mở video → bấm <b>Chia sẻ</b> → <b>Sao chép đường liên kết</b>, rồi dán vào đây. Dán được cả video của kênh khác (video không cho nhúng sẽ báo lỗi).</span>
          </div>
          <div className="qv-bar">
            <button type="button" className="vx-btn vx-btn--primary" onClick={lookup} disabled={!text.trim() || !!busy}>
              {busy === 'lookup' ? 'Đang lấy thông tin…' : 'Lấy thông tin video'}
            </button>
            {error && !rows && <span className="vx-err" role="alert">{error}</span>}
          </div>
        </div>
      </div>

      {rows && (
        <div className="ad-card">
          <div className="ad-card__h">
            <span>2. Kiểm tra rồi đăng ({picked.length}/{rows.length} video được chọn)</span>
            <label className="qv-all">
              <span>Chuyên mục cho tất cả</span>
              <CategorySelect value={category} label="Chuyên mục cho tất cả" onChange={(c) => { setCategory(c); setRows((rs) => rs && rs.map((r) => ({ ...r, category: c }))); }} />
            </label>
          </div>
          <div className="ad-card__b">
            {rows.map((r) => {
              const locked = !!r.existing || (!!r.error && !r.title);
              const te = r.pick ? titleError(r.title) : null;
              return (
                <div key={r.youtubeId} className="qv-row" data-off={r.pick ? undefined : ''}>
                  <input type="checkbox" className="qv-pick" checked={r.pick} disabled={locked} aria-label={`Đăng video ${r.title || r.youtubeId}`}
                    onChange={(e) => patch(r.youtubeId, { pick: e.target.checked })} />
                  <a href={`https://www.youtube.com/watch?v=${r.youtubeId}`} target="_blank" rel="noreferrer" className={r.vertical ? 'qv-thumb qv-thumb--v' : 'qv-thumb'} title="Xem trên YouTube">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={youtubeThumb(r.youtubeId)} alt="" loading="lazy" />
                  </a>
                  <div className="qv-fields">
                    <input className="vx-input" value={r.title} maxLength={TITLE_MAX} disabled={locked} aria-label="Tiêu đề video" placeholder="Tiêu đề video"
                      onChange={(e) => patch(r.youtubeId, { title: e.target.value.replace(/\n/g, ' ') })} />
                    {te && <span className="vx-err">{te}</span>}
                    <span className="qv-meta">
                      {r.channel && <>Kênh: {r.channel}</>}
                      {r.existing && <> · Đã có trên web: <Link href={`/admin/noi-dung/${r.existing.id}`}>{r.existing.title}</Link>{!r.existing.published && ' (chưa đăng)'}</>}
                    </span>
                    {r.error && <span className="vx-err">{r.error}</span>}
                    {!locked && (
                      <div className="qv-opts">
                        <CategorySelect value={r.category} label="Chuyên mục" onChange={(c) => patch(r.youtubeId, { category: c })} />
                        <label className="pe-check"><input type="checkbox" checked={r.vertical} onChange={(e) => patch(r.youtubeId, { vertical: e.target.checked })} /> Video dọc (Shorts)</label>
                        <label className="pe-check"><input type="checkbox" checked={r.featured} onChange={(e) => patch(r.youtubeId, { featured: e.target.checked })} /> Nổi bật — đứng đầu ở trang chủ</label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="qv-bar">
              <button type="button" className="vx-btn vx-btn--primary" onClick={save} disabled={!picked.length || invalid || !!busy}>
                {busy === 'save' ? 'Đang đăng…' : `Đăng ${picked.length} video`}
              </button>
              <button type="button" className="vx-btn vx-btn--outline" onClick={() => { setRows(null); setError(''); }} disabled={!!busy}>Bỏ, dán lại</button>
              {error ? <span className="vx-err" role="alert">{error}</span>
                : <span className="hint">Đăng xong video hiện ngay trên web. Video đã có trên web không đăng trùng.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
