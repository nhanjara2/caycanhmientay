'use client';

import Link from 'next/link';
import { useState } from 'react';
import { lookupVideosAction, quickAddVideosAction } from '@/app/actions/posts';
import {
  CATEGORIES, MAX_QUICK_VIDEOS, SECTIONS, tiktokOembed, tiktokPlayer, TITLE_MAX, TITLE_MIN, VIDEO_PAGE, type CategoryKey, type VideoSource,
} from '@/lib/posts';
import { Select } from '../Select';

type Row = {
  key: string; source: VideoSource; videoId: string; url: string; vertical: boolean; title: string; channel: string;
  thumb: string | null; error: string | null; existing: { id: number; title: string; published: boolean } | null;
  category: CategoryKey; featured: boolean; pick: boolean; excerpt: string; content: string;
};

const watchUrl = (r: Row) => (r.source === 'tiktok' ? tiktokPlayer(r.videoId) : `https://www.youtube.com/watch?v=${r.videoId}`);

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

/** Thêm nhanh video ngắn: dán nhiều link YouTube (Shorts) / TikTok → lấy sẵn tiêu đề từ YouTube → sửa nếu cần → đăng một lượt. */
export function QuickVideos() {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [busy, setBusy] = useState<'' | 'lookup' | 'save'>('');
  const [error, setError] = useState('');
  const [posted, setPosted] = useState(0);
  const [noCover, setNoCover] = useState<{ id: number; title: string }[]>([]);

  const patch = (key: string, p: Partial<Row> | ((r: Row) => Partial<Row>)) =>
    setRows((rs) => rs && rs.map((r) => (r.key === key ? { ...r, ...(typeof p === 'function' ? p(r) : p) } : r)));
  const picked = rows?.filter((r) => r.pick) ?? [];
  const invalid = picked.some((r) => titleError(r.title));

  const lookup = async () => {
    setBusy('lookup'); setError(''); setPosted(0); setNoCover([]);
    const r = await lookupVideosAction(text).catch(() => ({ ok: false as const, error: 'Mất kết nối, thử lại' }));
    setBusy('');
    if (!r.ok) { setError(r.error); return; }
    setRows(r.items.map((x) => ({ ...x, category, featured: false, excerpt: '', content: '', pick: !x.error && !x.existing })));
    for (const x of r.items) {
      if (x.source !== 'tiktok' || x.error || x.existing || (x.title && x.thumb)) continue;
      tiktokOembed(x.url).then((t) => {
        if (t) patch(x.key, (row) => ({ title: row.title || t.title, channel: row.channel || t.channel, thumb: row.thumb || t.thumb }));
      });
    }
  };

  const save = async () => {
    if (!picked.length || invalid) return;
    setBusy('save'); setError('');
    const r = await quickAddVideosAction(picked.map(({ source, videoId, title, vertical, category, featured, channel, thumb, excerpt, content }) =>
      ({ source, videoId, title, vertical, category, featured, channel, excerpt, content, thumb: source === 'tiktok' ? thumb : null })))
      .catch(() => ({ ok: false as const, error: 'Mất kết nối, thử lại' }));
    setBusy('');
    if (!r.ok) { setError(r.error); return; }
    const okKeys = new Set(r.results.filter((x) => x.ok).map((x) => x.key));
    const failed = new Map(r.results.filter((x) => !x.ok).map((x) => [x.key, x.error ?? 'Không đăng được']));
    setPosted((n) => n + okKeys.size);
    setNoCover((list) => [...list, ...r.results.flatMap((x) => (x.ok && x.noCover && x.id
      ? [{ id: x.id, title: rows?.find((row) => row.key === x.key)?.title ?? '' }] : []))]);
    // Video đã đăng rời khỏi danh sách; video lỗi ở lại kèm lý do để sửa rồi đăng lại.
    const left = (rows ?? []).filter((x) => !okKeys.has(x.key)).map((x) => (failed.has(x.key) ? { ...x, error: failed.get(x.key)!, pick: false } : x));
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
          {noCover.length > 0 && (
            <p className="qv-nocover">
              Video TikTok chưa lấy được ảnh (thẻ video đang là nền đen) — mở từng video, bấm <b>Tải ảnh bìa</b>:{' '}
              {noCover.map((x, i) => <span key={x.id}>{i > 0 && ', '}<Link href={`/admin/noi-dung/${x.id}`}>{x.title || `video ${x.id}`}</Link></span>)}
            </p>
          )}
        </div>
      )}

      <div className="ad-card">
        <div className="ad-card__h"><span>1. Dán link video</span></div>
        <div className="ad-card__b">
          <div className="ad-f">
            <label htmlFor="qv-links">Link YouTube hoặc TikTok — mỗi dòng một link (tối đa {MAX_QUICK_VIDEOS})</label>
            <textarea id="qv-links" className="vx-input qv-links" rows={6} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={'https://youtube.com/shorts/…\nhttps://vt.tiktok.com/…'} />
            <span className="hint">
              Trên app YouTube / TikTok: mở video → bấm <b>Chia sẻ</b> → <b>Sao chép liên kết</b>, rồi dán vào đây. Dán được cả video của kênh khác
              (video không cho nhúng sẽ báo lỗi). Video TikTok: nếu web không lấy được tên thì gõ tên video, ảnh bìa tải sau trong trang sửa video.
            </span>
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
                <div key={r.key} className="qv-row" data-off={r.pick ? undefined : ''}>
                  <input type="checkbox" className="qv-pick" checked={r.pick} disabled={locked} aria-label={`Đăng video ${r.title || r.videoId || r.url}`}
                    onChange={(e) => patch(r.key, { pick: e.target.checked })} />
                  {r.videoId ? (
                    <a href={watchUrl(r)} target="_blank" rel="noreferrer" className={r.vertical ? 'qv-thumb qv-thumb--v' : 'qv-thumb'}
                      title={r.source === 'tiktok' ? 'Xem trên TikTok' : 'Xem trên YouTube'}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.thumb ? <img src={r.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="qv-thumb__blank">{r.source === 'tiktok' ? 'TikTok' : ''}</span>}
                    </a>
                  ) : <span className="qv-thumb qv-thumb--v"><span className="qv-thumb__blank">TikTok</span></span>}
                  <div className="qv-fields">
                    <input className="vx-input" value={r.title} maxLength={TITLE_MAX} disabled={locked} aria-label="Tiêu đề video"
                      placeholder={r.source === 'tiktok' && !r.title ? 'Gõ tên video (không lấy được tên từ TikTok)' : 'Tiêu đề video'}
                      onChange={(e) => patch(r.key, { title: e.target.value.replace(/\n/g, ' ') })} />
                    {te && <span className="vx-err">{te}</span>}
                    <span className="qv-meta">
                      {r.source === 'tiktok' ? 'TikTok' : 'YouTube'}{r.channel && <> · Kênh: {r.channel}</>}
                      {r.existing && <> · Đã có trên web: <Link href={`/admin/noi-dung/${r.existing.id}`}>{r.existing.title}</Link>{!r.existing.published && ' (chưa đăng)'}</>}
                    </span>
                    {r.error && <span className="vx-err">{r.error}</span>}
                    {!locked && (
                      <details className="qv-info" open={!!(r.excerpt || r.content) || undefined}>
                        <summary>Thông tin bài viết về video {r.excerpt || r.content ? '✓' : '(không bắt buộc)'}</summary>
                        <textarea className="vx-input" rows={2} maxLength={400} value={r.excerpt} aria-label="Đoạn dẫn"
                          placeholder="Đoạn dẫn: 1–2 câu tóm tắt video (hiện dưới tiêu đề, trên thẻ và trên Google)"
                          onChange={(e) => patch(r.key, { excerpt: e.target.value.replace(/\n/g, ' ') })} />
                        <textarea className="vx-input" rows={5} maxLength={8000} value={r.content} aria-label="Nội dung bài viết"
                          placeholder={'Nội dung: cách làm, lưu ý, sản phẩm dùng trong video…\nCách một dòng trống để xuống đoạn mới.'}
                          onChange={(e) => patch(r.key, { content: e.target.value })} />
                        <span className="hint">Muốn thêm ảnh, tiêu đề mục, khối sản phẩm: đăng xong mở video trong danh sách để sửa.</span>
                      </details>
                    )}
                    {!locked && (
                      <div className="qv-opts">
                        <CategorySelect value={r.category} label="Chuyên mục" onChange={(c) => patch(r.key, { category: c })} />
                        {r.source === 'youtube' && <label className="pe-check"><input type="checkbox" checked={r.vertical} onChange={(e) => patch(r.key, { vertical: e.target.checked })} /> Video dọc (Shorts)</label>}
                        <label className="pe-check"><input type="checkbox" checked={r.featured} onChange={(e) => patch(r.key, { featured: e.target.checked })} /> Nổi bật — đứng đầu ở trang chủ</label>
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
