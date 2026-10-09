'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type FormEvent } from 'react';
import {
  deleteBannerAction, moveBannerAction, saveBannerAction, setBannerActiveAction, uploadBannerImageAction,
} from '@/app/actions/home-banners';
import { SlideBody, type Slide } from '@/components/home/HomeCarousel';
import { Icon } from '@/components/Icon';
import { Select } from '@/components/Select';
import { compressImage } from '@/lib/compress-image';
import { BANNER_SLOTS, bannerImageUrl, slotOf, type Banner, type BannerSlot } from '@/lib/home-banners';
import '@/styles/home.css';

type Row = Banner & { updatedBy: string | null; updatedAt: Date };

const vnDay = (d: Date | null) => (d ? d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) : null);
const showDay = (d: Date) => d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

/** Trạng thái hiện trên web theo bật / tắt + ngày. */
function statusOf(b: Pick<Banner, 'active' | 'startsAt' | 'endsAt'>, now = new Date()) {
  if (!b.active) return { live: false, text: 'Đang tắt' };
  if (b.startsAt && b.startsAt > now) return { live: false, text: `Chờ đến ${showDay(b.startsAt)}` };
  if (b.endsAt && b.endsAt < now) return { live: false, text: `Hết hạn ${showDay(b.endsAt)}` };
  return { live: true, text: b.endsAt ? `Đang hiện · đến ${showDay(b.endsAt)}` : 'Đang hiện' };
}

type Draft = {
  id?: number; slot: BannerSlot; title: string; subtitle: string; cta: string; href: string; showText: boolean;
  image: string | null; imageMobile: string | null; startsAt: string; endsAt: string; active: boolean;
};

const blank = (slot: BannerSlot): Draft => ({
  slot, title: '', subtitle: '', cta: '', href: '', showText: false, image: null, imageMobile: null, startsAt: '', endsAt: '', active: true,
});

/** Xem trước đúng khung trên trang chủ (dùng chung CSS + component với trang khách). */
function Preview({ d, mobile }: { d: Draft; mobile?: boolean }) {
  const img = mobile ? d.imageMobile ?? d.image : d.image;
  if (!img) return null;
  if (d.slot === 'backdrop') {
    return <div className="ad-bnr-prev ad-bnr-prev--bg"><img src={bannerImageUrl(img)} alt="" /><span>Khung ảnh lớn nằm trên nền này</span></div>;
  }
  const s: Slide = {
    key: 'prev', title: d.title || 'Tiêu đề banner', subtitle: d.subtitle || undefined, cta: d.cta || undefined, showText: d.showText, image: bannerImageUrl(img),
  };
  if (d.slot === 'side') return <div className="hm-side ad-bnr-prev ad-bnr-prev--side"><SlideBody s={s} /></div>;
  return (
    <div className={`hm-car ${d.slot === 'event' ? 'hm-car--band' : 'hm-car--hero'} ad-bnr-prev`}>
      <div className="hm-car__track" style={mobile ? { aspectRatio: '4 / 3' } : undefined}><div className="hm-slide"><SlideBody s={s} /></div></div>
    </div>
  );
}

function Editor({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [pending, start] = useTransition();
  const main = useRef<HTMLInputElement>(null);
  const mob = useRef<HTMLInputElement>(null);
  const slot = slotOf(d.slot);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const upload = async (f: File | undefined, key: 'image' | 'imageMobile') => {
    if (!f) return;
    setError('');
    setBusy(key === 'image' ? 'Đang tải ảnh…' : 'Đang tải ảnh điện thoại…');
    try {
      const fd = new FormData();
      fd.set('photo', await compressImage(f, 1920));
      const r = await uploadBannerImageAction(fd);
      if (r.ok) set(key, r.file); else setError(r.error);
    } catch {
      setError('Không đọc được ảnh này, vui lòng chọn ảnh khác (JPG, PNG, WebP)');
    }
    setBusy('');
    if (main.current) main.current.value = '';
    if (mob.current) mob.current.value = '';
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!d.image) { setError('Chọn ảnh banner'); return; }
    setError('');
    start(async () => {
      const r = await saveBannerAction({ ...d, startsAt: d.startsAt || null, endsAt: d.endsAt || null })
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.refresh();
      onClose();
    });
  };

  const remove = () => {
    if (!d.id || !confirm(`Xóa banner “${d.title}”?\nẢnh cũng bị xóa. Muốn tạm ẩn thì tắt “Đang bật”.`)) return;
    start(async () => {
      const r = await deleteBannerAction(d.id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label={d.id ? 'Sửa banner' : 'Thêm banner'} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="vx-modal ad-bnr-modal" onSubmit={submit}>
        <div className="vx-modal__head">
          {d.id ? 'Sửa banner' : 'Thêm banner'}
          <button type="button" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="vx-modal__body">
          <div className="vx-fl">
            <label htmlFor="bn-slot">Vị trí trên trang chủ</label>
            <Select id="bn-slot" value={d.slot} onChange={(e) => set('slot', e.target.value as BannerSlot)}>
              {BANNER_SLOTS.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
            </Select>
            <span className="vx-help">{slot.hint} Cỡ ảnh nên dùng: <b>{slot.size}</b>.</span>
          </div>

          <input ref={main} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0], 'image')} />
          <input ref={mob} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0], 'imageMobile')} />
          {d.image ? (
            <div className="ad-bnr-imgs">
              <Preview d={d} />
              <div className="ad-bnr-imgacts">
                <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={!!busy} onClick={() => main.current?.click()}>Đổi ảnh</button>
                {d.slot !== 'side' && (
                  d.imageMobile
                    ? <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => set('imageMobile', null)}>Bỏ ảnh riêng cho điện thoại</button>
                    : <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={!!busy} onClick={() => mob.current?.click()}>+ Ảnh riêng cho điện thoại (4:3)</button>
                )}
                {busy && <span className="vx-help">{busy}</span>}
              </div>
              {d.imageMobile && d.slot !== 'side' && (
                <div className="ad-bnr-mob">
                  <span className="vx-help">Trên điện thoại:</span>
                  <Preview d={d} mobile />
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="pi-tile pi-tile--add ad-bnr-pick" style={{ aspectRatio: String(slot.ratio) }} disabled={!!busy} onClick={() => main.current?.click()}>
              <b>{busy || '+ Chọn ảnh banner'}</b>
              {!busy && <small>{slot.size} · JPG, PNG, WebP</small>}
            </button>
          )}

          <div className="vx-fl">
            <label htmlFor="bn-title">Tiêu đề <i style={{ color: 'var(--danger)', fontStyle: 'normal' }}>*</i></label>
            <input id="bn-title" value={d.title} maxLength={120} required onChange={(e) => set('title', e.target.value)} placeholder="Ví dụ: Hội chợ cây cảnh Tết 2027 — giảm 20% cây công trình" />
            <span className="vx-help">Dùng làm chữ mô tả ảnh cho người dùng trình đọc màn hình và Google; bật “Hiện chữ trên ảnh” thì hiện to trên ảnh.</span>
          </div>
          {d.slot !== 'backdrop' && (
            <>
              <label className="vx-check">
                <input type="checkbox" checked={d.showText} onChange={(e) => set('showText', e.target.checked)} />
                Hiện chữ trên ảnh (ảnh chưa có chữ)
              </label>
              {d.showText && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 8 }}>
                  <div className="vx-fl">
                    <label htmlFor="bn-sub">Dòng mô tả</label>
                    <input id="bn-sub" value={d.subtitle} maxLength={200} onChange={(e) => set('subtitle', e.target.value)} placeholder="Từ 15/12 đến 15/01 · số lượng có hạn" />
                  </div>
                  <div className="vx-fl">
                    <label htmlFor="bn-cta">Chữ trên nút</label>
                    <input id="bn-cta" value={d.cta} maxLength={30} onChange={(e) => set('cta', e.target.value)} placeholder="Xem ngay" />
                  </div>
                </div>
              )}
              <div className="vx-fl">
                <label htmlFor="bn-href">Bấm vào ảnh thì mở</label>
                <input id="bn-href" value={d.href} maxLength={300} onChange={(e) => set('href', e.target.value.trim())} placeholder="/danh-muc/cay-canh hoặc https://…" inputMode="url" />
                <span className="vx-help">Trang trong web: chép phần sau tên miền, ví dụ <b>/khuyen-mai</b>. Để trống = ảnh không bấm được.</span>
              </div>
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            <div className="vx-fl">
              <label htmlFor="bn-from">Hiện từ ngày</label>
              <input id="bn-from" type="date" value={d.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
            </div>
            <div className="vx-fl">
              <label htmlFor="bn-to">Đến hết ngày</label>
              <input id="bn-to" type="date" value={d.endsAt} min={d.startsAt || undefined} onChange={(e) => set('endsAt', e.target.value)} />
            </div>
          </div>
          <span className="vx-help">Để trống = hiện ngay / không hết hạn.</span>
          <label className="vx-check">
            <input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} />
            Đang bật (tắt để tạm ẩn mà không xóa)
          </label>
          {error && <span className="vx-err" role="alert">{error}</span>}
        </div>
        <div className="vx-modal__foot" style={{ display: 'flex', gap: 8 }}>
          {d.id && <button type="button" className="vx-btn vx-btn--outline vx-btn--lg" style={{ color: 'var(--danger)' }} disabled={pending} onClick={remove}>Xóa</button>}
          <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={pending || !!busy}>{pending ? 'Đang lưu…' : 'Lưu banner'}</button>
        </div>
      </form>
    </div>
  );
}

/** Danh sách banner theo vị trí: ảnh thu nhỏ, trạng thái, bật / tắt, đổi thứ tự, sửa. */
export function HomeBannerAdmin({ banners, canEdit }: { banners: Row[]; canEdit: boolean }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    setError('');
    const r = await fn().catch(() => ({ ok: false, error: 'Có lỗi, vui lòng thử lại' }));
    if (!r.ok) setError(r.error ?? 'Có lỗi');
    router.refresh();
  });

  return (
    <>
      {error && <div className="vx-err" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
      {BANNER_SLOTS.map((slot) => {
        const list = banners.filter((b) => b.slot === slot.key);
        const live = list.filter((b) => statusOf(b).live).length;
        return (
          <section key={slot.key} className="ad-card" style={{ marginBottom: 16 }}>
            <div className="ad-card__h">
              <span>{slot.name} <small style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>· đang hiện {Math.min(live, slot.max)}/{slot.max}</small></span>
              {canEdit && <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={() => setEdit(blank(slot.key))}>+ Thêm ảnh</button>}
            </div>
            <div className="ad-card__b">
              <p className="vx-help" style={{ margin: '0 0 12px' }}>{slot.hint} Cỡ ảnh nên dùng: <b>{slot.size}</b>.{live > slot.max && ` Đang bật ${live} ảnh — trang chủ chỉ hiện ${slot.max} ảnh đầu.`}</p>
              {list.length === 0 ? (
                <p className="vx-help" style={{ margin: 0 }}>Chưa có ảnh — trang chủ đang dùng ảnh dựng sẵn từ ảnh sản phẩm.</p>
              ) : (
                <ul className="ad-bnr-list">
                  {list.map((b, i) => {
                    const st = statusOf(b);
                    return (
                      <li key={b.id} className={st.live ? 'ad-bnr' : 'ad-bnr ad-bnr--off'}>
                        <button type="button" className="ad-bnr__img" style={{ aspectRatio: String(slot.ratio) }} disabled={!canEdit}
                          onClick={() => setEdit({ ...b, startsAt: vnDay(b.startsAt) ?? '', endsAt: vnDay(b.endsAt) ?? '' })} aria-label={`Sửa banner ${b.title}`}>
                          <img src={bannerImageUrl(b.image)} alt="" loading="lazy" />
                          <span className={st.live ? 'ad-bnr__st ad-bnr__st--on' : 'ad-bnr__st'}>{st.text}</span>
                        </button>
                        <div className="ad-bnr__b">
                          <b>{b.title}</b>
                          <small>{b.href ? `Mở: ${b.href}` : 'Không gắn link'}{b.showText ? ' · có chữ trên ảnh' : ''}{b.imageMobile ? ' · có ảnh điện thoại' : ''}</small>
                          {b.updatedBy && <small>Sửa bởi {b.updatedBy} · {showDay(b.updatedAt)}</small>}
                        </div>
                        {canEdit && (
                          <div className="ad-bnr__acts">
                            <button type="button" className="vx-switch" role="switch" aria-checked={b.active} disabled={pending}
                              aria-label={b.active ? 'Đang bật — bấm để tắt' : 'Đang tắt — bấm để bật'} onClick={() => run(() => setBannerActiveAction(b.id, !b.active))} />
                            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending || i === 0} onClick={() => run(() => moveBannerAction(b.id, -1))} aria-label="Dời lên trước">↑</button>
                            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending || i === list.length - 1} onClick={() => run(() => moveBannerAction(b.id, 1))} aria-label="Dời ra sau">↓</button>
                            <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => setEdit({ ...b, startsAt: vnDay(b.startsAt) ?? '', endsAt: vnDay(b.endsAt) ?? '' })}>Sửa</button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        );
      })}
      {edit && <Editor key={edit.id ?? `new-${edit.slot}`} initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
