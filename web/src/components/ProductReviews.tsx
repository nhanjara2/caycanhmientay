'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { deleteReviewAction, saveReviewAction } from '@/app/actions/reviews';
import { saveAfterLogin, takeAfterLogin } from '@/lib/after-login';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/compress-image';
import {
  initials, MAX_REVIEW_PHOTOS, REVIEW_MAX_CHARS, REVIEW_MIN_CHARS, reviewStats, STAR_LABEL, starsText, timeAgo, type ReviewView,
} from '@/lib/reviews';
import { useModalFocus } from '@/lib/use-modal';
import { HelpfulButton } from './HelpfulButton';
import { Icon } from './Icon';

type Filter = 'all' | 'photo' | 5 | 4 | 'low';
const PAGE = 5;

/**
 * Khối Reviews ở trang chi tiết: điểm trung bình + phân bố sao → chip lọc → danh sách → "Xem thêm".
 * Khách đã đăng nhập viết / sửa / xóa đánh giá của mình ngay tại đây (mỗi người 1 đánh giá / sản phẩm).
 */
export function ProductReviews({ slug, items, isPlant }: { slug: string; items: ReviewView[]; isPlant: boolean }) {
  const { user, ready, openLogin } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => reviewStats(items), [items]);
  const mine = items.find((r) => r.mine) ?? null;

  const list = items.filter((r) =>
    filter === 'all' ? true : filter === 'photo' ? r.photos.length > 0 : filter === 'low' ? r.stars <= 3 : r.stars === filter);

  const write = () => {
    setNotice('');
    if (!ready) return;
    if (!user) { saveAfterLogin({ kind: 'review', slug }); openLogin(); return; }
    setEditing(true);
  };

  // Mở sẵn khung viết: link "#viet-danh-gia" (từ trang đơn hàng), hoặc vừa đăng nhập sau khi bấm "Gửi đánh giá" (lib/after-login.ts)
  useEffect(() => {
    if (!user) return;
    if (takeAfterLogin('review', (a) => a.slug === slug) || location.hash === '#viet-danh-gia') setEditing(true);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [editing]);

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'photo', label: `Có ảnh thực tế (${stats.withPhotos})` },
    { key: 5, label: '5 sao' },
    { key: 4, label: '4 sao' },
    { key: 'low', label: '3 sao trở xuống' },
  ];

  return (
    <section className="vx-card" id="danh-gia">
      <div className="vx-sect">
        <h2 style={{ fontSize: '1.125rem' }}>
          Đánh giá sản phẩm <small style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '0.875rem' }}>({stats.count} đánh giá)</small>
        </h2>
      </div>

      <div className="vx-rating">
        <div className="vx-rating__big">
          {stats.count ? (
            <>
              <span style={{ color: 'var(--ink-muted)', fontSize: '0.8125rem' }}>Trung bình</span>
              <b>{stats.avg.toFixed(1).replace('.', ',')}</b>
              <span className="vx-stars">{starsText(stats.avg)}</span>
            </>
          ) : (
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Chưa có đánh giá nào.<br />Hãy là người đầu tiên chia sẻ trải nghiệm!</span>
          )}
          {!editing && (
            <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" style={{ alignSelf: 'flex-start' }} onClick={write}>
              {mine ? 'Sửa đánh giá của bạn' : 'Gửi đánh giá'}
            </button>
          )}
        </div>
        <div className="vx-bars">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = stats.dist[s - 1];
            return (
              <div key={s}>
                <span>{s} ★</span>
                <i><em style={{ width: `${stats.count ? (n / stats.count) * 100 : 0}%` }} /></i>
                <span>{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {notice && !editing && <div className="vx-note" role="status"><Icon name="check" /><div>{notice}</div></div>}

      {editing && (
        <div ref={formRef} id="viet-danh-gia">
          <ReviewForm
            key={mine?.id ?? 0} // vừa đăng nhập: đánh giá cũ của khách về sau khi khung đã mở → dựng lại khung với nội dung cũ
            slug={slug}
            mine={mine}
            isPlant={isPlant}
            onCancel={() => setEditing(false)}
            onDone={(msg) => { setEditing(false); setNotice(msg); setFilter('all'); }}
          />
        </div>
      )}

      {stats.count > 0 && (
        <div className="vx-row" style={{ flexWrap: 'wrap' }}>
          <span className="vx-spec">Lọc theo:</span>
          {chips.map((c) => (
            <button key={c.key} type="button" className="vx-chip" aria-pressed={filter === c.key} onClick={() => { setFilter(c.key); setShown(PAGE); }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {list.slice(0, shown).map((r) => (
        <ReviewItem key={r.id} r={r} slug={slug} onZoom={setZoom} onEdit={write} onDeleted={() => setNotice('Đã xóa đánh giá của bạn.')} />
      ))}
      {stats.count > 0 && !list.length && <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', margin: 0 }}>Chưa có đánh giá phù hợp bộ lọc.</p>}
      {list.length > shown && (
        <button type="button" className="vx-btn vx-btn--ghost" style={{ alignSelf: 'center' }} onClick={() => setShown((n) => n + 10)}>
          Xem thêm {list.length - shown} đánh giá
        </button>
      )}

      {zoom && <ZoomPhoto src={zoom} onClose={() => setZoom(null)} />}
    </section>
  );
}

function ZoomPhoto({ src, onClose }: { src: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useModalFocus(box, onClose);
  return (
    <div ref={box} tabIndex={-1} className="rvw-zoom" role="dialog" aria-modal="true" aria-label="Ảnh đánh giá" onClick={onClose}>
      <img src={src} alt="" />
      <button type="button" aria-label="Đóng"><Icon name="close" /></button>
    </div>
  );
}

function ReviewItem({ r, slug, onZoom, onEdit, onDeleted }: {
  r: ReviewView; slug: string; onZoom: (url: string) => void; onEdit: () => void; onDeleted: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const remove = () => {
    if (!confirm('Xóa đánh giá của bạn cho sản phẩm này?')) return;
    start(async () => {
      const res = await deleteReviewAction(slug).catch(() => ({ ok: false as const, error: 'Không xóa được, vui lòng thử lại' }));
      if (!res.ok) { alert(res.error); return; }
      onDeleted();
      router.refresh();
    });
  };

  return (
    <div className="vx-review">
      <span className="vx-avatar vx-avatar--sm">{initials(r.name)}</span>
      <div className="vx-review__body">
        <div className="vx-review__who">
          {r.name}
          {r.verified && <span className="vx-verified">Đã mua hàng</span>}
          <small suppressHydrationWarning>{timeAgo(r.createdAt)}</small>
        </div>
        <span className="vx-stars" aria-label={`${r.stars} sao`}>{starsText(r.stars)}</span>
        <span style={{ whiteSpace: 'pre-line' }}>{r.content}</span>
        {r.photos.length > 0 && (
          <div className="vx-photos rvw-photos">
            {r.photos.map((ph) => (
              <button key={ph.file} type="button" onClick={() => onZoom(ph.url)} aria-label="Xem ảnh lớn">
                <img src={ph.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        <div className="vx-review__acts">
          <HelpfulButton kind="review" id={r.id} count={r.helpful} voted={r.voted} own={r.mine} />
          {r.mine && (
            <>
              <span>Đánh giá của bạn</span>
              <a role="button" tabIndex={0} onClick={onEdit} onKeyDown={(e) => e.key === 'Enter' && onEdit()}>Sửa</a>
              <a role="button" tabIndex={0} onClick={pending ? undefined : remove} onKeyDown={(e) => e.key === 'Enter' && remove()}>
                {pending ? 'Đang xóa…' : 'Xóa'}
              </a>
            </>
          )}
        </div>
        {r.reply && (
          <div className="vx-reply">
            <span className="vx-avatar vx-avatar--sm vx-avatar--shop">MT</span>
            <div className="vx-review__body">
              <div className="vx-review__who">
                Cây Cảnh Miền Tây<span className="vx-staff">Shop</span>
                {r.repliedAt && <small suppressHydrationWarning>{timeAgo(r.repliedAt)}</small>}
              </div>
              <span style={{ whiteSpace: 'pre-line' }}>{r.reply}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type NewPhoto = { file: File; url: string };

function ReviewForm({ slug, mine, isPlant, onCancel, onDone }: {
  slug: string; mine: ReviewView | null; isPlant: boolean; onCancel: () => void; onDone: (msg: string) => void;
}) {
  const router = useRouter();
  const [stars, setStars] = useState(mine?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState(mine?.content ?? '');
  const [keep, setKeep] = useState(mine?.photos ?? []);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const room = MAX_REVIEW_PHOTOS - keep.length - added.length;
  const len = content.trim().length;

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setBusy(true);
    const out: NewPhoto[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      try {
        const c = await compressImage(f);
        out.push({ file: c, url: URL.createObjectURL(c) });
      } catch {
        setError('Không đọc được một ảnh, vui lòng chọn ảnh khác');
      }
    }
    if (files.length > room) setError(`Tối đa ${MAX_REVIEW_PHOTOS} ảnh`);
    setAdded((a) => [...a, ...out]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = () => {
    setError('');
    if (!stars) return setError('Chọn số sao cho sản phẩm');
    if (len < REVIEW_MIN_CHARS) return setError(`Viết ít nhất ${REVIEW_MIN_CHARS} ký tự để người mua sau tham khảo`);
    const fd = new FormData();
    fd.set('slug', slug);
    fd.set('stars', String(stars));
    fd.set('content', content);
    keep.forEach((k) => fd.append('keep', k.file));
    added.forEach((a) => fd.append('photos', a.file));
    start(async () => {
      const r = await saveReviewAction(fd).catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
      if (!r.ok) { setError(r.error); return; }
      onDone(mine ? 'Đã cập nhật đánh giá của bạn.' : 'Cảm ơn bạn đã đánh giá! Chia sẻ của bạn giúp người mua sau chọn cây dễ hơn.');
      router.refresh();
    });
  };

  const shown = hover || stars;
  return (
    <div className="rvw-form">
      <b style={{ fontSize: '0.9375rem' }}>{mine ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}</b>
      <div className="rvw-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`${s} sao – ${STAR_LABEL[s]}`}
            aria-pressed={stars === s}
            className={s <= shown ? 'on' : undefined}
            onMouseEnter={() => setHover(s)}
            onClick={() => setStars(s)}
          >★</button>
        ))}
        <span>{shown ? STAR_LABEL[shown] : 'Chạm để chấm sao'}</span>
      </div>
      <div className="ad-f">
        <label htmlFor="rvw-text">Nhận xét của bạn</label>
        <textarea
          id="rvw-text"
          className="vx-input"
          rows={4}
          value={content}
          maxLength={REVIEW_MAX_CHARS}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isPlant
            ? 'Cây giao về thế nào? Lá, rễ, chậu, đóng gói… Sau vài tuần cây phát triển ra sao?'
            : 'Sản phẩm dùng có hiệu quả không? Đóng gói, hạn dùng, giao hàng thế nào?'}
        />
        <small style={{ color: len && len < REVIEW_MIN_CHARS ? 'var(--danger)' : 'var(--ink-muted)', fontSize: '0.75rem' }}>
          {len}/{REVIEW_MAX_CHARS} ký tự{len < REVIEW_MIN_CHARS ? ` · tối thiểu ${REVIEW_MIN_CHARS}` : ''}
        </small>
      </div>
      <div className="ad-f">
        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Ảnh thực tế <small style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>(không bắt buộc, tối đa {MAX_REVIEW_PHOTOS} ảnh)</small></span>
        <div className="rvw-pics">
          {keep.map((k) => (
            <span key={k.file} style={{ backgroundImage: `url(${k.url})` }}>
              <button type="button" aria-label="Bỏ ảnh" onClick={() => setKeep((x) => x.filter((y) => y.file !== k.file))}>✕</button>
            </span>
          ))}
          {added.map((a) => (
            <span key={a.url} style={{ backgroundImage: `url(${a.url})` }}>
              <button type="button" aria-label="Bỏ ảnh" onClick={() => setAdded((x) => x.filter((y) => y.url !== a.url))}>✕</button>
            </span>
          ))}
          {room > 0 && (
            <button type="button" className="rvw-add" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Icon name="plus" />{busy ? 'Đang nén…' : 'Thêm ảnh'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
        </div>
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="vx-btn vx-btn--primary" onClick={submit} disabled={pending || busy}>
          {pending ? 'Đang gửi…' : mine ? 'Lưu đánh giá' : 'Gửi đánh giá'}
        </button>
        <button type="button" className="vx-btn vx-btn--ghost" onClick={onCancel} disabled={pending}>Hủy</button>
      </div>
    </div>
  );
}
