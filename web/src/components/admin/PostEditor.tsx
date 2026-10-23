'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent as PasteEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { deletePostAction, lookupVideosAction, savePostAction, uploadPostImageAction } from '@/app/actions/posts';
import { normalize, parseYoutubeId } from '@/lib/catalog';
import { compressImage } from '@/lib/compress-image';
import { htmlToBlocks } from '@/lib/paste-html';
import { ARTICLE_ASPECTS, COVER_ASPECTS, useImageCrop } from './ImageCropper';
import { money } from '@/lib/format';
import {
  blockingChecks, BLOCK_NAMES, CATEGORIES, durationLabel, isShortsUrl, isTiktokShortLink, MAX_BLOCK_PRODUCTS, NOTE_TITLE, parseTiktokId,
  isExternalImage, postChecks, postImageUrl, postPath, postState, PRODUCTS_TITLE, safeHref, SECTIONS, sectionOf, SEO_MAX, STATE_LABELS, tiktokOembed,
  tiktokPlayer, youtubeThumb,
  type BlockType, type PostBlock, type PostKind, type PostStatus,
} from '@/lib/posts';
import { Icon, Thumb } from '../Icon';
import { Select } from '@/components/Select';

export type EditorPost = {
  id?: number; slug: string; status: PostStatus; publishedAt: string | null; updatedAt?: string; updatedBy?: string | null;
  kind: PostKind; category: string; title: string; excerpt: string; body: PostBlock[];
  coverFile: string | null; youtubeId: string | null; tiktokId: string | null; videoVertical: boolean; videoSeconds: number | null;
  authorName: string; reviewerName: string; reviewerTitle: string; diseases: string[]; tags: string[];
  seoDescription: string; featured: boolean;
};
export type ProductPick = { slug: string; name: string; sku: string; price: number | null; image: string | null; icon: string; active: boolean; pesticide: boolean };
type Item = { k: number; b: PostBlock };
type Field = { el: HTMLTextAreaElement; set: (v: string) => void };
type Intent = 'save' | 'review' | 'publish' | 'unpublish';

const BLANK: Record<BlockType, () => PostBlock> = {
  h2: () => ({ type: 'h2', text: '' }),
  h3: () => ({ type: 'h3', text: '' }),
  p: () => ({ type: 'p', text: '' }),
  list: () => ({ type: 'list', items: [''], ordered: false }),
  image: () => ({ type: 'image', file: '', caption: '' }),
  video: () => ({ type: 'video', youtubeId: '', caption: '' }),
  table: () => ({ type: 'table', rows: [['', ''], ['', ''], ['', '']] }),
  note: () => ({ type: 'note', title: NOTE_TITLE, text: '' }),
  products: () => ({ type: 'products', title: PRODUCTS_TITLE, slugs: [] }),
};

const pad = (n: number) => String(n).padStart(2, '0');
/** ISO → giá trị ô datetime-local theo giờ máy (người dùng ở VN). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

/** Ô nhập nhiều dòng tự cao theo nội dung. */
function AutoText({ value, onValue, remember, className, ...rest }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  value: string; onValue: (v: string) => void; remember?: (f: Field) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea ref={ref} rows={1} className={`pe-bare ${className ?? ''}`} value={value} onChange={(e) => onValue(e.target.value)}
      onFocus={(e) => remember?.({ el: e.currentTarget, set: onValue })} {...rest} />
  );
}

function Card({ title, children, right }: { title: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="ad-card">
      <div className="ad-card__h"><span>{title}</span>{right}</div>
      <div className="ad-card__b">{children}</div>
    </div>
  );
}

const ICON_OK = <Icon name="check" />;
const ICON_NO = <Icon name="alert" />;

export function PostEditor({ initial, role, products, diseases, people, stats }: {
  initial: EditorPost; role: 'staff' | 'admin';
  products: ProductPick[]; diseases: { slug: string; name: string }[];
  people: { authors: string[]; reviewers: string[]; titles: string[] };
  stats?: { views: number; helpfulYes: number; helpfulNo: number };
}) {
  const router = useRouter();
  const isAdmin = role === 'admin';
  const keyRef = useRef(0);
  const [v, setV] = useState(initial);
  const [items, setItems] = useState<Item[]>(() => initial.body.map((b) => ({ k: keyRef.current++, b })));
  const [publishAt, setPublishAt] = useState(toLocalInput(initial.publishedAt));
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
  const [ytText, setYtText] = useState(initial.tiktokId ? tiktokPlayer(initial.tiktokId) : initial.youtubeId ? `https://youtu.be/${initial.youtubeId}` : '');
  const latestLink = useRef(ytText);
  const [active, setActive] = useState<number | null>(null);
  const [focusKey, setFocusKey] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const lastField = useRef<Field | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const { crop, cropDialog } = useImageCrop();
  const replaceAt = useRef<number | null>(null);

  const canEdit = isAdmin || v.status !== 'published';
  const state = postState(v);
  const section = sectionOf(v.category);
  const pesticideSet = useMemo(() => new Set(products.filter((p) => p.pesticide).map((p) => p.slug)), [products]);
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const touch = () => { setDirty(true); setMsg(''); };
  const set = <K extends keyof EditorPost>(k: K, val: EditorPost[K]) => { setV((x) => ({ ...x, [k]: val })); touch(); };
  const setBlock = (k: number, b: PostBlock) => { setItems((xs) => xs.map((x) => (x.k === k ? { ...x, b } : x))); touch(); };
  const insert = (blocks: PostBlock[], at = active === null ? items.length : active + 1) => {
    const added = blocks.map((b) => ({ k: keyRef.current++, b }));
    setItems((xs) => [...xs.slice(0, at), ...added, ...xs.slice(at)]);
    setActive(at + added.length - 1);
    setFocusKey(added[0]?.k ?? null);
    touch();
  };
  const move = (i: number, d: -1 | 1) => {
    setItems((xs) => { const a = [...xs]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });
    setActive(i + d);
    touch();
  };
  const remove = (i: number) => {
    const b = items[i].b;
    const filled = (b.type === 'p' || b.type === 'note') ? b.text.trim() : b.type === 'list' ? b.items.some(Boolean) : b.type === 'table' ? b.rows.flat().some(Boolean) : false;
    if (filled && !confirm(`Xóa khối "${BLOCK_NAMES[b.type]}" này?`)) return;
    setItems((xs) => xs.filter((_, j) => j !== i));
    setActive(null);
    touch();
  };

  const body = items.map((x) => x.b);
  const tags = tagsText.split(',').map((s) => s.trim()).filter(Boolean);
  const draft = { ...v, body, tags };
  const checks = postChecks(draft, pesticideSet);
  const blocking = blockingChecks(checks);
  const scheduled = publishAt && new Date(publishAt).getTime() > Date.now();

  const payload = (cur = v) => ({
    id: cur.id, kind: cur.kind, category: cur.category, title: cur.title, excerpt: cur.excerpt, body,
    coverFile: cur.coverFile, youtubeId: cur.kind === 'video' ? cur.youtubeId : null, tiktokId: cur.kind === 'video' ? cur.tiktokId : null,
    videoVertical: cur.videoVertical,
    videoSeconds: cur.videoSeconds, authorName: cur.authorName, reviewerName: cur.reviewerName, reviewerTitle: cur.reviewerTitle,
    diseases: cur.diseases, tags, seoDescription: cur.seoDescription, featured: cur.featured,
    slug: cur.status !== 'published' && cur.slug ? cur.slug : undefined,
    publishAt: publishAt ? new Date(publishAt).toISOString() : null,
  });

  /** Lưu; bài mới lưu lần đầu thì đổi địa chỉ trang thành /admin/noi-dung/<id> (không tải lại trang). */
  const save = async (intent: Intent, cur = v) => {
    const r = await savePostAction(payload(cur), intent).catch(() => ({ ok: false as const, error: 'Mất kết nối, vui lòng thử lại' }));
    if (!r.ok) { setError(r.error); return null; }
    setV((x) => ({ ...x, id: r.id, slug: r.slug, status: r.status, publishedAt: r.publishedAt, updatedAt: new Date().toISOString() }));
    setPublishAt(toLocalInput(r.publishedAt));
    if (!cur.id) window.history.replaceState(null, '', `/admin/noi-dung/${r.id}`);
    return r;
  };

  const run = async (intent: Intent) => {
    setError('');
    if (intent === 'publish' && blocking.length) { setError(`Chưa đăng được: ${blocking.map((c) => c.label.toLowerCase()).join('; ')}`); return; }
    if (intent === 'unpublish' && v.status === 'published' && !confirm('Gỡ bài khỏi website? Bài trở về nháp, khách không xem được nữa.')) return;
    setBusy('Đang lưu…');
    const r = await save(intent);
    setBusy('');
    if (!r) return;
    setDirty(false);
    const st = postState(r);
    setMsg(intent === 'review' ? 'Đã gửi duyệt — quản trị viên sẽ xem và đăng'
      : st === 'published' ? 'Đã đăng lên website' : st === 'scheduled' ? `Đã lên lịch, bài tự hiện lúc ${fmt(r.publishedAt)}`
        : intent === 'unpublish' ? 'Đã gỡ bài về nháp' : 'Đã lưu');
    router.refresh();
  };

  const ensureId = async () => {
    if (v.id) return v.id;
    if (v.title.trim().length < 3) { setError('Nhập tiêu đề trước rồi mới tải ảnh (bài sẽ tự lưu nháp)'); return null; }
    setBusy('Đang lưu nháp…');
    const r = await save('save');
    setBusy('');
    return r?.id ?? null;
  };

  const upload = async (files: FileList | null, mode: 'cover' | 'block') => {
    if (!files?.length) return;
    setError('');
    const id = await ensureId();
    const list = [...files];
    let at = replaceAt.current ?? (active === null ? items.length : active + 1);
    const replacing = replaceAt.current !== null;
    for (const [i, f] of list.entries()) {
      if (!id) break;
      const one = mode === 'cover' || replacing || list.length === 1;
      const c = await crop(f, { aspects: mode === 'cover' ? COVER_ASPECTS : ARTICLE_ASPECTS, step: one ? undefined : `Ảnh ${i + 1}/${list.length}`, max: 1600, minSide: 600 });
      if (c === 'cancel') break;
      if (c === 'skip') continue;
      setBusy(list.length > 1 ? `Đang tải ảnh ${i + 1}/${list.length}…` : 'Đang tải ảnh…');
      try {
        const fd = new FormData();
        fd.set('postId', String(id));
        fd.set('photo', await compressImage(f, 1600, undefined, c));
        const r = await uploadPostImageAction(fd);
        if (!r.ok) { setError(r.error); break; }
        if (mode === 'cover') set('coverFile', r.file);
        else if (replacing) {
          setItems((xs) => xs.map((x, j) => (j === at && x.b.type === 'image' ? { ...x, b: { ...x.b, file: r.file } } : x)));
          touch();
        } else insert([{ type: 'image', file: r.file, caption: '' }], at++);
      } catch {
        setError('Không đọc được ảnh này, vui lòng chọn ảnh khác (JPG, PNG, WebP)');
        break;
      }
      if (mode === 'cover' || replacing) break;
    }
    replaceAt.current = null;
    setBusy('');
    if (coverInput.current) coverInput.current.value = '';
    if (imageInput.current) imageInput.current.value = '';
  };

  /** In đậm / chèn link vào ô đang gõ. */
  const wrap = (before: string, after: string, placeholder: string) => {
    const f = lastField.current;
    if (!f || !f.el.isConnected) { setError('Bấm vào một đoạn văn (hoặc danh sách, hộp lưu ý) trước'); return; }
    const { el } = f;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = el.value.slice(s, e) || placeholder;
    f.set(el.value.slice(0, s) + before + sel + after + el.value.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  /** Link ảnh ngoài (https://…): hiện thẳng từ máy chủ ảnh kia, không tải về database. */
  const askImageUrl = (): string | null => {
    const url = prompt('Dán link ảnh trực tiếp (https://…, đuôi .jpg / .png / .webp) — ảnh không cần ghi nguồn (CC0, public domain)');
    if (url === null || !url.trim()) return null;
    if (!isExternalImage(url.trim())) { setError('Link ảnh phải bắt đầu bằng https:// và không có dấu cách'); return null; }
    setError('');
    return url.trim();
  };
  const addImageUrl = (at?: number) => {
    const url = askImageUrl();
    if (url) insert([{ type: 'image', file: url, caption: '' }], at);
  };
  const addLink = () => {
    const url = prompt('Dán đường dẫn — trang trong web (vd /san-pham/…, /benh-cay/…) hoặc link đầy đủ https://…');
    if (url === null) return;
    if (!safeHref(url)) { setError('Đường dẫn phải bắt đầu bằng / hoặc https://'); return; }
    wrap('[', `](${url.trim()})`, 'chữ bấm vào');
  };
  const remember = (f: Field) => { lastField.current = f; };
  /** Dán từ web khác / Word / Google Docs: giữ tiêu đề, đoạn, danh sách, bảng, ảnh, chữ đậm, link. */
  const pasteRich = (e: PasteEvent<HTMLDivElement>) => {
    const html = e.clipboardData.getData('text/html');
    const t = e.target;
    const host = t instanceof HTMLElement ? t.closest<HTMLElement>('[data-i]') : null;
    if (!html || !host || !(t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement)) return;
    const blocks = htmlToBlocks(html);
    if (!blocks.length) return;
    const i = Number(host.dataset.i);
    const cur = items[i]?.b;
    if (!cur) return;
    const f = lastField.current;
    // Một đoạn dán vào ô đang gõ: chèn tại con trỏ.
    if (blocks.length === 1 && blocks[0].type === 'p' && f?.el === t) {
      e.preventDefault();
      const s = t.selectionStart ?? t.value.length, end = t.selectionEnd ?? s, text = blocks[0].text;
      f.set(t.value.slice(0, s) + text + t.value.slice(end));
      requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + text.length, s + text.length); });
      return;
    }
    if (blocks.length === 1 && (blocks[0].type === 'p' || blocks[0].type === 'h2' || blocks[0].type === 'h3')) return;
    e.preventDefault();
    const empty = (cur.type === 'p' || cur.type === 'h2' || cur.type === 'h3') && !cur.text.trim();
    if (empty) setItems((xs) => xs.filter((_, j) => j !== i));
    insert(blocks, empty ? i : i + 1);
  };

  const tool = (label: ReactNode, onClick: () => void, title: string, extra?: string) => (
    <button type="button" className={extra} title={title} aria-label={title} disabled={!canEdit || !!busy}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}>{label}</button>
  );

  const title = !v.id ? (v.kind === 'video' ? 'Thêm video' : 'Viết bài mới') : v.kind === 'video' ? 'Sửa video' : 'Sửa bài viết';
  const path = v.slug ? postPath(v) : '';

  return (
    <div className="ad-body" style={{ paddingBottom: 0 }}>
      <div className="ad-title">
        <h1>{title}</h1>
        <span className="vx-crumb"><Link href="/admin/noi-dung">Bài viết & video</Link>/<span>{v.title || 'Mới'}</span></span>
        {v.id && (
          <span className="acts">
            <a href={`${path}${state === 'published' ? '' : '?xem-truoc=1'}`} target="_blank" rel="noreferrer" className="vx-btn vx-btn--outline">
              {state === 'published' ? 'Xem trên web' : 'Xem trước'}
            </a>
          </span>
        )}
      </div>

      <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files, 'cover')} />
      <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files, 'block')} />
      {cropDialog}

      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="ad-editor">
          <div className="ad-paper">
            <div className="ad-tools pe-tools" role="toolbar" aria-label="Thêm nội dung">
              {tool('H2', () => insert([BLANK.h2()]), 'Tiêu đề mục (hiện trong mục lục)')}
              {tool('H3', () => insert([BLANK.h3()]), 'Tiêu đề nhỏ')}
              {tool('¶ Đoạn', () => insert([BLANK.p()]), 'Đoạn văn')}
              {tool(<b>B</b>, () => wrap('**', '**', 'chữ đậm'), 'In đậm chữ đang chọn')}
              {tool('Link', addLink, 'Chèn đường dẫn vào chữ đang chọn')}
              {tool('• Danh sách', () => insert([BLANK.list()]), 'Danh sách')}
              {tool('Ảnh', () => { replaceAt.current = null; imageInput.current?.click(); }, 'Chèn ảnh (chọn được nhiều ảnh)')}
              {tool('Link ảnh', () => addImageUrl(), 'Chèn ảnh bằng link trực tiếp (không tải về máy chủ)')}
              {tool('Video', () => insert([BLANK.video()]), 'Chèn video YouTube')}
              {tool('Bảng', () => insert([BLANK.table()]), 'Bảng')}
              {tool('Lưu ý', () => insert([BLANK.note()]), 'Hộp lưu ý (bắt buộc khi bài nhắc tới thuốc BVTV)')}
              {tool('+ Sản phẩm', () => insert([BLANK.products()]), 'Khối sản phẩm — khách thêm vào giỏ ngay trong bài', 'on')}
            </div>
            <div className="ad-doc pe-doc" onPaste={pasteRich}>
              <AutoText className="pe-title" value={v.title} onValue={(x) => set('title', x.replace(/\n/g, ' '))} maxLength={150}
                placeholder={v.kind === 'video' ? 'Tiêu đề video' : 'Tiêu đề bài viết'} aria-label="Tiêu đề" />
              <AutoText className="pe-lead" value={v.excerpt} onValue={(x) => set('excerpt', x)} maxLength={400}
                placeholder="Đoạn dẫn: 1–2 câu tóm tắt, hiện dưới tiêu đề và trên thẻ bài" aria-label="Đoạn dẫn" />

              {v.kind === 'video' && (
                <div className="pe-video">
                  <div className="ad-f">
                    <label htmlFor="pe-yt">Link video YouTube hoặc TikTok <i>*</i></label>
                    <input id="pe-yt" className="vx-input" value={ytText} placeholder="https://youtube.com/shorts/… hoặc https://vt.tiktok.com/…"
                      onChange={(e) => {
                        const t = e.target.value;
                        setYtText(t);
                        latestLink.current = t;
                        const yt = parseYoutubeId(t);
                        const tt = yt ? null : parseTiktokId(t);
                        setV((x) => ({ ...x, youtubeId: yt, tiktokId: tt, videoVertical: tt || (yt && isShortsUrl(t)) ? true : x.videoVertical }));
                        touch();
                        // Hỏi YouTube / TikTok: mở link rút gọn TikTok, video dọc hay ngang, điền sẵn tiêu đề nếu còn trống
                        // (chỉ khi có quyền đăng — action kiểm tra quyền). TikTok: máy chủ không lấy được tên thì trình duyệt hỏi lại.
                        if (!isAdmin || (!yt && !tt && !isTiktokShortLink(t)) || (yt && yt === v.youtubeId) || (tt && tt === v.tiktokId)) return;
                        lookupVideosAction(t).then(async (r) => {
                          const it = r.ok ? r.items[0] : undefined;
                          if (!it || it.error || !it.videoId || latestLink.current !== t) return;
                          const title = it.title || (it.source === 'tiktok' ? (await tiktokOembed(it.url))?.title ?? '' : '');
                          setV((x) => (latestLink.current !== t ? x : {
                            ...x, youtubeId: it.source === 'youtube' ? it.videoId : null, tiktokId: it.source === 'tiktok' ? it.videoId : null,
                            videoVertical: it.vertical, title: x.title.trim() ? x.title : title,
                          }));
                        }).catch(() => {});
                      }} />
                    {ytText && !v.youtubeId && !v.tiktokId && (isTiktokShortLink(ytText)
                      ? <span className="hint">Đang mở link TikTok rút gọn… Nếu không được: mở link trên trình duyệt, chép link đầy đủ (có /video/…) rồi dán lại.</span>
                      : <span className="vx-err">Link chưa đúng — dán link YouTube (video thường hoặc Shorts) hoặc link video TikTok</span>)}
                  </div>
                  {v.tiktokId && (
                    <div className="pe-video__row">
                      <span className="pe-yt pe-yt--v pe-tt">TikTok</span>
                      <div className="ad-fcol">
                        <span className="hint">Video TikTok phát bằng trình phát của TikTok. TikTok không cho lấy ảnh cố định — hãy <b>tải ảnh bìa</b> (khung Ảnh bìa bên phải) để thẻ video có ảnh.</span>
                        <div className="ad-f">
                          <label htmlFor="pe-sec-tt">Thời lượng (giây)</label>
                          <input id="pe-sec-tt" className="vx-input" type="number" min={1} max={36000} value={v.videoSeconds ?? ''} placeholder="60"
                            onChange={(e) => set('videoSeconds', e.target.value ? Math.max(1, Math.min(36000, Math.round(+e.target.value))) : null)} />
                        </div>
                      </div>
                    </div>
                  )}
                  {v.youtubeId && (
                    <div className="pe-video__row">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={youtubeThumb(v.youtubeId)} alt="Ảnh video" className={v.videoVertical ? 'pe-yt pe-yt--v' : 'pe-yt'} />
                      <div className="ad-fcol">
                        <label className="pe-check"><input type="checkbox" checked={v.videoVertical} onChange={(e) => set('videoVertical', e.target.checked)} /> Video dọc (YouTube Shorts)</label>
                        <div className="ad-f">
                          <label htmlFor="pe-sec">Thời lượng (giây)</label>
                          <input id="pe-sec" className="vx-input" type="number" min={1} max={36000} value={v.videoSeconds ?? ''} placeholder="60"
                            onChange={(e) => set('videoSeconds', e.target.value ? Math.max(1, Math.min(36000, Math.round(+e.target.value))) : null)} />
                          <span className="hint">{v.videoSeconds ? `Hiện là “${durationLabel(v.videoSeconds)}”` : 'Hiện trên thẻ video, có thể bỏ trống'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <span className="hint">Bên dưới là phần mô tả thêm cho video (không bắt buộc): cách làm, sản phẩm dùng trong video…</span>
                </div>
              )}

              {items.map((it, i) => (
                <div key={it.k} className="pe-block" data-i={i} data-active={active === i || undefined} onFocus={() => setActive(i)}>
                  <div className="pe-block__bar">
                    <span>{BLOCK_NAMES[it.b.type]}</span>
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Đưa lên" title="Đưa lên">↑</button>
                    <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Đưa xuống" title="Đưa xuống">↓</button>
                    <button type="button" onClick={() => remove(i)} aria-label="Xóa khối" title="Xóa khối">✕</button>
                  </div>
                  <BlockEditor b={it.b} set={(b) => setBlock(it.k, b)} remember={remember} autoFocus={focusKey === it.k}
                    products={products} bySlug={bySlug}
                    onReplaceImage={() => { replaceAt.current = i; imageInput.current?.click(); }}
                    onImageUrl={() => { const url = askImageUrl(); if (url && it.b.type === 'image') setBlock(it.k, { ...it.b, file: url }); }} />
                </div>
              ))}
              {!items.length && (
                <p className="pe-empty">
                  {v.kind === 'video' ? 'Chưa có mô tả.' : 'Bài chưa có nội dung.'} Bấm các nút trên thanh công cụ để thêm đoạn văn, tiêu đề mục, ảnh, khối sản phẩm…
                </p>
              )}
            </div>
          </div>

          <div className="ad-fcol">
            <Card title="Xuất bản" right={<span className={`ad-pill ${STATE_LABELS[state].pill}`}>{STATE_LABELS[state].label}</span>}>
              {v.id && (
                <span className="hint">
                  {state === 'published' && v.publishedAt && <>Đăng lúc {fmt(v.publishedAt)}. </>}
                  {state === 'scheduled' && <>Tự hiện lúc {fmt(v.publishedAt)}. </>}
                  {v.updatedBy && <>Sửa lần cuối: {v.updatedBy}{v.updatedAt ? `, ${fmt(v.updatedAt)}` : ''}.</>}
                </span>
              )}
              <div className="ad-f">
                <label>Loại</label>
                <span className="vx-seg">
                  <button type="button" className="vx-chip" aria-pressed={v.kind === 'article'} onClick={() => set('kind', 'article')}>Bài viết</button>
                  <button type="button" className="vx-chip" aria-pressed={v.kind === 'video'} onClick={() => set('kind', 'video')}>Video</button>
                </span>
              </div>
              <div className="ad-f">
                <label htmlFor="pe-cat">Chuyên mục <i>*</i></label>
                <Select id="pe-cat" className="vx-input" value={v.category} onChange={(e) => set('category', e.target.value)}>
                  {(['blog', 'news'] as const).map((s) => (
                    <optgroup key={s} label={SECTIONS[s].name}>
                      {CATEGORIES.filter((c) => c.section === s).map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </Select>
                <span className="hint">Hiện ở trang {SECTIONS[section].name} ({SECTIONS[section].path}).</span>
              </div>
              <div className="ad-f">
                <label htmlFor="pe-at">Lịch đăng</label>
                <input id="pe-at" className="vx-input" type="datetime-local" value={publishAt} onChange={(e) => { setPublishAt(e.target.value); touch(); }} />
                <span className="hint">{publishAt ? (scheduled ? 'Giờ ở tương lai: bài tự hiện đúng giờ này.' : 'Ngày đăng hiện trên bài.') : 'Để trống: đăng ngay khi bấm Đăng.'}</span>
              </div>
              <label className="pe-check"><input type="checkbox" checked={v.featured} onChange={(e) => set('featured', e.target.checked)} /> {v.kind === 'video' ? 'Nổi bật — đứng đầu hàng video ở trang chủ và trang Video ngắn' : 'Nổi bật — đưa lên khối đầu trang'}</label>
            </Card>

            <Card title="Ảnh bìa">
              {v.coverFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={postImageUrl(v.coverFile)} alt="Ảnh bìa" className="pe-cover" />
              ) : v.kind === 'video' && v.youtubeId ? (
                <span className="hint">Đang dùng ảnh của video YouTube. Tải ảnh riêng nếu muốn.</span>
              ) : v.kind === 'video' && v.tiktokId ? (
                <span className="hint">Video TikTok cần ảnh bìa (ảnh dọc, chụp màn hình video là được) — chưa có thì thẻ video là nền đen.</span>
              ) : (
                <span className="hint">Ảnh ngang 16:9, hiện đầu bài và trên thẻ bài. Chưa có thì hiện hình minh họa.</span>
              )}
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={!!busy} onClick={() => coverInput.current?.click()}>
                  {v.coverFile ? 'Đổi ảnh' : 'Tải ảnh bìa'}
                </button>
                <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={!!busy} onClick={() => { const url = askImageUrl(); if (url) set('coverFile', url); }}>Dán link ảnh</button>
                {v.coverFile && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => set('coverFile', null)}>Bỏ ảnh bìa</button>}
              </span>
            </Card>

            <Card title="Tác giả & kiểm duyệt">
              <div className="ad-f">
                <label htmlFor="pe-author">Tác giả</label>
                <input id="pe-author" className="vx-input" list="pe-authors" value={v.authorName} maxLength={60} placeholder="Cây Cảnh Miền Tây"
                  onChange={(e) => set('authorName', e.target.value)} />
              </div>
              <div className="ad-f">
                <label htmlFor="pe-rev">Kỹ sư kiểm duyệt</label>
                <input id="pe-rev" className="vx-input" list="pe-reviewers" value={v.reviewerName} maxLength={60} placeholder="Họ tên kỹ sư"
                  onChange={(e) => set('reviewerName', e.target.value)} />
                <input className="vx-input" list="pe-titles" value={v.reviewerTitle} maxLength={60} placeholder="Chức danh, vd Kỹ sư BVTV" aria-label="Chức danh kỹ sư"
                  onChange={(e) => set('reviewerTitle', e.target.value)} disabled={!v.reviewerName.trim()} />
                <span className="hint">Có kỹ sư thì bài hiện nhãn “Đã kiểm duyệt”. Nên có với bài bắt bệnh, thuốc & phân bón.</span>
              </div>
              <datalist id="pe-authors">{people.authors.map((x) => <option key={x} value={x} />)}</datalist>
              <datalist id="pe-reviewers">{people.reviewers.map((x) => <option key={x} value={x} />)}</datalist>
              <datalist id="pe-titles">{people.titles.map((x) => <option key={x} value={x} />)}</datalist>
            </Card>

            <Card title="Gắn bệnh trong thư viện">
              {v.diseases.length > 0 && (
                <span className="ad-tags">
                  {v.diseases.map((s) => (
                    <button key={s} type="button" className="vx-badge vx-badge--info" title="Bấm để bỏ" onClick={() => set('diseases', v.diseases.filter((x) => x !== s))}>
                      {diseases.find((d) => d.slug === s)?.name ?? s} ✕
                    </button>
                  ))}
                </span>
              )}
              {v.diseases.length < 10 && (
                <Select className="vx-input" value="" aria-label="Gắn bệnh" onChange={(e) => e.target.value && set('diseases', [...v.diseases, e.target.value])}>
                  <option value="">+ Chọn bệnh…</option>
                  {diseases.filter((d) => !v.diseases.includes(d.slug)).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
                </Select>
              )}
              <span className="hint">Bài hiện link sang trang bệnh, và trang bệnh hiện link về bài này.</span>
            </Card>

            <Card title="Thẻ chủ đề">
              <input className="vx-input" value={tagsText} onChange={(e) => { setTagsText(e.target.value); touch(); }} placeholder="Kiểng lá, Thối rễ, Mùa mưa" aria-label="Thẻ chủ đề" />
              <span className="hint">Cách nhau bằng dấu phẩy, tối đa 10. Hiện ở khối “Chủ đề nổi bật”, khách bấm để xem các bài cùng chủ đề.</span>
            </Card>

            <Card title="SEO & đường dẫn">
              <div className="ad-f">
                <label htmlFor="pe-slug">Đường dẫn</label>
                {v.status === 'published' ? (
                  <span className="hint" style={{ wordBreak: 'break-all' }}>{path}<br />Bài đã đăng: đổi đường dẫn ở khung “Google & chia sẻ” cuối trang (link cũ tự chuyển sang link mới).</span>
                ) : (
                  <>
                    <input id="pe-slug" className="vx-input" value={v.slug} maxLength={90} placeholder="tu-tao-theo-tieu-de"
                      onChange={(e) => set('slug', normalize(e.target.value).replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-'))} />
                    <span className="hint">{SECTIONS[section].path}/{v.slug || '…'} · Để trống thì tự tạo theo tiêu đề.</span>
                  </>
                )}
              </div>
              <div className="ad-f">
                <label htmlFor="pe-seo">Mô tả SEO</label>
                <textarea id="pe-seo" className="vx-input" style={{ minHeight: 72 }} value={v.seoDescription} maxLength={300} onChange={(e) => set('seoDescription', e.target.value)}
                  placeholder="1–2 câu hiện dưới tiêu đề trên Google. Để trống thì dùng đoạn dẫn." />
                <span className="hint">{v.seoDescription.length}/{SEO_MAX} ký tự</span>
              </div>
              <div className="pe-serp" aria-label="Xem trước trên Google">
                <small>caycanhmientay · {SECTIONS[section].path}/{v.slug || '…'}</small>
                <b>{v.title || 'Tiêu đề bài viết'}</b>
                <span>{(v.seoDescription || v.excerpt || 'Mô tả bài viết…').slice(0, SEO_MAX)}</span>
              </div>
            </Card>

            <Card title="Kiểm tra trước khi đăng">
              <div className="ad-check">
                {checks.map((c) => (
                  <div key={c.label} className={c.ok ? 'ok' : 'no'}>{c.ok ? ICON_OK : ICON_NO}{c.label}{!c.ok && c.required && <b> · bắt buộc</b>}</div>
                ))}
              </div>
            </Card>

            {stats && v.status === 'published' && (
              <Card title="Số liệu">
                <div className="ad-kv">
                  <span>Lượt xem</span><b>{stats.views.toLocaleString('vi-VN')}</b>
                  <span>Thấy hữu ích</span><b>{stats.helpfulYes} có · {stats.helpfulNo} không</b>
                </div>
              </Card>
            )}
          </div>
        </div>
      </fieldset>

      <div className="ad-sticky" style={{ margin: '0 calc(-1 * var(--space-4))' }}>
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span>
            : busy || msg || (!canEdit ? 'Bài đã đăng: chỉ quản trị viên được sửa' : dirty ? 'Có thay đổi chưa lưu' : v.id ? 'Đã lưu' : 'Bài mới chưa lưu')}
        </span>
        {isAdmin && v.id && <DeleteButton id={v.id} title={v.title} disabled={!!busy} />}
        {!canEdit ? (
          <Link href="/admin/noi-dung" className="vx-btn vx-btn--outline">Quay lại</Link>
        ) : v.status === 'published' ? (
          <>
            <button type="button" className="vx-btn vx-btn--outline" disabled={!!busy} onClick={() => run('unpublish')}>Gỡ bài</button>
            <button type="button" className="vx-btn vx-btn--primary" disabled={!!busy} onClick={() => run('save')}>Cập nhật</button>
          </>
        ) : (
          <>
            {isAdmin && v.status === 'review' && <button type="button" className="vx-btn vx-btn--ghost" disabled={!!busy} onClick={() => run('unpublish')}>Trả về nháp</button>}
            <button type="button" className="vx-btn vx-btn--outline" disabled={!!busy} onClick={() => run('save')}>{v.status === 'review' ? 'Lưu' : 'Lưu nháp'}</button>
            {isAdmin ? (
              <button type="button" className="vx-btn vx-btn--primary" disabled={!!busy} onClick={() => run('publish')}>
                {scheduled ? 'Lên lịch đăng' : v.status === 'review' ? 'Duyệt & đăng' : 'Đăng bài'}
              </button>
            ) : v.status !== 'review' && (
              <button type="button" className="vx-btn vx-btn--primary" disabled={!!busy} onClick={() => run('review')}>Gửi duyệt</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DeleteButton({ id, title, disabled }: { id: number; title: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="vx-btn vx-btn--ghost pe-danger" disabled={disabled || busy} onClick={async () => {
      if (!confirm(`Xóa hẳn “${title}”? Ảnh trong bài cũng bị xóa, không khôi phục được.\nMuốn tạm ẩn thì bấm Gỡ bài.`)) return;
      setBusy(true);
      const r = await deletePostAction(id).catch(() => ({ ok: false }));
      setBusy(false);
      if (!r.ok) { alert('Không xóa được, vui lòng thử lại'); return; }
      router.push('/admin/noi-dung');
    }}>{busy ? 'Đang xóa…' : 'Xóa'}</button>
  );
}

/** Ô nhập của từng loại khối. */
function BlockEditor({ b, set, remember, autoFocus, products, bySlug, onReplaceImage, onImageUrl }: {
  b: PostBlock; set: (b: PostBlock) => void; remember: (f: Field) => void; autoFocus: boolean;
  products: ProductPick[]; bySlug: Map<string, ProductPick>; onReplaceImage: () => void; onImageUrl: () => void;
}) {
  switch (b.type) {
    case 'h2': case 'h3':
      return (
        <input className={`pe-bare pe-${b.type}`} value={b.text} maxLength={150} autoFocus={autoFocus} aria-label={BLOCK_NAMES[b.type]}
          placeholder={b.type === 'h2' ? 'Tiêu đề mục — hiện trong mục lục' : 'Tiêu đề nhỏ'} onChange={(e) => set({ ...b, text: e.target.value })} />
      );
    case 'p':
      return (
        <AutoText className="pe-p" value={b.text} onValue={(text) => set({ ...b, text })} remember={remember} autoFocus={autoFocus} maxLength={5000}
          placeholder="Viết đoạn văn… Chọn chữ rồi bấm B để in đậm, Link để chèn đường dẫn." aria-label="Đoạn văn" />
      );
    case 'list':
      return (
        <>
          <span className="vx-seg">
            <button type="button" className="vx-chip" aria-pressed={!b.ordered} onClick={() => set({ ...b, ordered: false })}>• Dấu chấm</button>
            <button type="button" className="vx-chip" aria-pressed={b.ordered} onClick={() => set({ ...b, ordered: true })}>1. Đánh số</button>
          </span>
          <AutoText className="pe-p" value={b.items.join('\n')} onValue={(t) => set({ ...b, items: t.split('\n').slice(0, 30) })} remember={remember}
            autoFocus={autoFocus} placeholder={'Mỗi dòng một ý\nNhấn Enter để xuống ý mới'} aria-label="Danh sách" />
        </>
      );
    case 'image':
      return (
        <>
          {b.file && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={postImageUrl(b.file)} alt={b.caption || 'Ảnh trong bài'} className="pe-img" />
          )}
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input className="vx-input pe-mini" value={b.caption} maxLength={200} placeholder="Chú thích ảnh (không bắt buộc)" aria-label="Chú thích ảnh"
              onChange={(e) => set({ ...b, caption: e.target.value })} />
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={onReplaceImage}>Đổi ảnh</button>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={onImageUrl}>Dán link</button>
          </span>
        </>
      );
    case 'video':
      return <VideoBlock b={b} set={set} autoFocus={autoFocus} />;
    case 'table':
      return <TableBlock b={b} set={set} />;
    case 'note':
      return (
        <div className="vx-note pe-note">
          {ICON_NO}
          <div style={{ display: 'grid', gap: 4, flex: 1 }}>
            <input className="pe-bare pe-note__t" value={b.title} maxLength={60} placeholder={NOTE_TITLE} aria-label="Tiêu đề hộp lưu ý" onChange={(e) => set({ ...b, title: e.target.value })} />
            <AutoText value={b.text} onValue={(text) => set({ ...b, text })} remember={remember} autoFocus={autoFocus} maxLength={1000}
              placeholder="Đeo găng tay khi pha thuốc, để xa trẻ em và vật nuôi…" aria-label="Nội dung lưu ý" />
          </div>
        </div>
      );
    case 'products':
      return <ProductsBlock b={b} set={set} products={products} bySlug={bySlug} autoFocus={autoFocus} />;
  }
}

function VideoBlock({ b, set, autoFocus }: { b: Extract<PostBlock, { type: 'video' }>; set: (b: PostBlock) => void; autoFocus: boolean }) {
  const [text, setText] = useState(b.youtubeId ? `https://youtu.be/${b.youtubeId}` : '');
  return (
    <>
      <input className="vx-input pe-mini" value={text} autoFocus={autoFocus} placeholder="Dán link YouTube" aria-label="Link YouTube"
        onChange={(e) => { setText(e.target.value); set({ ...b, youtubeId: parseYoutubeId(e.target.value) ?? '' }); }} />
      {text && !b.youtubeId && <span className="vx-err">Link chưa đúng</span>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {b.youtubeId && <img src={youtubeThumb(b.youtubeId)} alt="Ảnh video" className="pe-yt" />}
      <input className="vx-input pe-mini" value={b.caption} maxLength={200} placeholder="Chú thích (không bắt buộc)" aria-label="Chú thích video"
        onChange={(e) => set({ ...b, caption: e.target.value })} />
    </>
  );
}

function TableBlock({ b, set }: { b: Extract<PostBlock, { type: 'table' }>; set: (b: PostBlock) => void }) {
  const cols = b.rows[0]?.length ?? 0;
  const cell = (i: number, j: number, val: string) => set({ ...b, rows: b.rows.map((r, x) => (x === i ? r.map((c, y) => (y === j ? val : c)) : r)) });
  return (
    <>
      <div className="pe-table">
        <table>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>
                    <input className="pe-bare" value={c} maxLength={300} placeholder={i === 0 ? `Tiêu đề cột ${j + 1}` : ''} aria-label={`Hàng ${i + 1}, cột ${j + 1}`}
                      onChange={(e) => cell(i, j, e.target.value)} style={i === 0 ? { fontWeight: 600 } : undefined} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="pe-row">
        <button type="button" disabled={b.rows.length >= 30} onClick={() => set({ ...b, rows: [...b.rows, Array(cols).fill('')] })}>+ Hàng</button>
        <button type="button" disabled={cols >= 8} onClick={() => set({ ...b, rows: b.rows.map((r) => [...r, '']) })}>+ Cột</button>
        <button type="button" disabled={b.rows.length <= 1} onClick={() => set({ ...b, rows: b.rows.slice(0, -1) })}>− Hàng cuối</button>
        <button type="button" disabled={cols <= 1} onClick={() => set({ ...b, rows: b.rows.map((r) => r.slice(0, -1)) })}>− Cột cuối</button>
        <small>Hàng đầu là tiêu đề cột.</small>
      </span>
    </>
  );
}

function ProductsBlock({ b, set, products, bySlug, autoFocus }: {
  b: Extract<PostBlock, { type: 'products' }>; set: (b: PostBlock) => void; products: ProductPick[]; bySlug: Map<string, ProductPick>; autoFocus: boolean;
}) {
  const [find, setFind] = useState('');
  const terms = normalize(find).split(/\s+/).filter(Boolean);
  const matches = terms.length
    ? products.filter((p) => !b.slugs.includes(p.slug) && terms.every((t) => normalize(`${p.name} ${p.sku}`).includes(t))).slice(0, 8)
    : [];
  const moveTo = (i: number, d: -1 | 1) => { const a = [...b.slugs]; [a[i], a[i + d]] = [a[i + d], a[i]]; set({ ...b, slugs: a }); };
  return (
    <>
      <input className="pe-bare pe-h3" value={b.title} maxLength={60} placeholder={PRODUCTS_TITLE} aria-label="Tiêu đề khối sản phẩm" onChange={(e) => set({ ...b, title: e.target.value })} />
      <div className="pe-prods">
        {b.slugs.map((s, i) => {
          const p = bySlug.get(s);
          return (
            <div key={s} className="pe-prod">
              <span className="ad-thumb"><Thumb src={p?.image} icon={p?.icon ?? 'leaf'} /></span>
              <span>
                {p ? p.name : <s>{s}</s>}
                <small style={{ color: p?.active ? undefined : 'var(--danger)' }}>
                  {!p ? 'Sản phẩm đã bị xóa — không hiện' : !p.active ? 'Đang ẩn — không hiện trong bài' : p.price !== null ? `từ ${money(p.price)}` : p.sku}
                </small>
              </span>
              <span className="pe-prod__tools">
                <button type="button" disabled={i === 0} onClick={() => moveTo(i, -1)} aria-label="Lên trước">‹</button>
                <button type="button" disabled={i === b.slugs.length - 1} onClick={() => moveTo(i, 1)} aria-label="Ra sau">›</button>
                <button type="button" onClick={() => set({ ...b, slugs: b.slugs.filter((x) => x !== s) })} aria-label="Bỏ sản phẩm">✕</button>
              </span>
            </div>
          );
        })}
      </div>
      {b.slugs.length < MAX_BLOCK_PRODUCTS && (
        <div className="ad-f">
          <input className="vx-input pe-mini" value={find} autoFocus={autoFocus} onChange={(e) => setFind(e.target.value)} placeholder="Tìm sản phẩm để thêm (tên hoặc SKU)" aria-label="Tìm sản phẩm" />
          {matches.map((p) => (
            <button key={p.slug} type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal' }}
              onClick={() => { set({ ...b, slugs: [...b.slugs, p.slug] }); setFind(''); }}>
              + {p.name} <small style={{ color: 'var(--ink-muted)' }}>{p.sku}{p.active ? '' : ' · đang ẩn'}</small>
            </button>
          ))}
          {terms.length > 0 && !matches.length && <span className="hint">Không tìm thấy sản phẩm.</span>}
        </div>
      )}
      <small className="hint">Tối đa {MAX_BLOCK_PRODUCTS} sản phẩm. Trong bài hiện thẻ có giá và nút “Thêm vào giỏ”.</small>
    </>
  );
}
