'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { saveDiseaseAction, uploadDiseaseImageAction } from '@/app/actions/diseases';
import { normalize } from '@/lib/catalog';
import { compressImage } from '@/lib/compress-image';
import { CAUSES, diseaseImageUrl, PARTS, PLANTS, SEVERITY, type Disease, type PartKey } from '@/lib/diseases';
import { Select } from '@/components/Select';

type ProductPick = { slug: string; name: string; sku: string; active: boolean };
type DiseasePick = { slug: string; name: string };

const MAX_PRODUCTS = 8;

/** Bảng các dòng lặp lại (triệu chứng, bước xử lý…) với nút thêm/xóa. */
function Rows<T>({ title, hint, items, max, blank, onChange, render }: {
  title: ReactNode; hint?: string; items: T[]; max: number; blank: T; onChange: (x: T[]) => void;
  render: (item: T, set: (patch: Partial<T>) => void, i: number) => ReactNode;
}) {
  return (
    <div className="ad-card">
      <div className="ad-card__h">
        <span>{title}</span>
        {items.length < max && <a style={{ cursor: 'pointer' }} onClick={() => onChange([...items, blank])}>+ Thêm dòng</a>}
      </div>
      <div className="ad-card__b">
        {items.map((it, i) => (
          <div key={i} className="ad-frow app-rowx">
            <div style={{ display: 'grid', gap: 6 }}>
              {render(it, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
            </div>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label="Xóa dòng" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {!items.length && <span className="hint">Chưa có dòng nào.</span>}
        {hint && <span className="hint" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>{hint}</span>}
      </div>
    </div>
  );
}

/** Ảnh minh họa của một triệu chứng: tải ngay lên server (nén ở trình duyệt), gắn vào bài khi bấm Lưu bài bệnh. */
function SymptomPhoto({ slug, file, onChange }: { slug: string; file?: string; onChange: (file: string | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (f?: File) => {
    if (!f) return;
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('slug', slug);
      fd.set('photo', await compressImage(f, 1200));
      const r = await uploadDiseaseImageAction(fd);
      if (r.ok) onChange(r.file); else setError(r.error);
    } catch {
      setError('Không đọc được ảnh này, vui lòng chọn ảnh khác (JPG, PNG, WebP)');
    }
    setBusy(false);
    if (input.current) input.current.value = '';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {file
        ? <img src={diseaseImageUrl(file)} alt="Ảnh minh họa triệu chứng" width={72} height={54} style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
        : <span style={{ width: 72, height: 54, borderRadius: 6, border: '1px dashed var(--border)', display: 'grid', placeItems: 'center', fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>Chưa có ảnh</span>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Đang tải…' : file ? 'Đổi ảnh' : '+ Thêm ảnh'}
      </button>
      {file && !busy && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => onChange(undefined)}>Bỏ ảnh</button>}
      {error && <span className="vx-err" role="alert">{error}</span>}
    </div>
  );
}

export function DiseaseForm({ initial, canEdit, products, diseases }: {
  initial: Disease; canEdit: boolean; products: ProductPick[]; diseases: DiseasePick[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [aliases, setAliases] = useState(initial.aliases.join(', '));
  const [prevention, setPrevention] = useState(initial.prevention.map((text) => ({ text })));
  const [find, setFind] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof Disease>(k: K, val: Disease[K]) => { setV((x) => ({ ...x, [k]: val })); setSaved(false); };
  const toggle = <T extends string>(list: T[], k: T, order: readonly { key: string }[]) =>
    list.includes(k) ? list.filter((x) => x !== k) : order.map((o) => o.key as T).filter((o) => o === k || list.includes(o));

  const byslug = new Map(products.map((p) => [p.slug, p]));
  const terms = normalize(find).split(/\s+/).filter(Boolean);
  const matches = terms.length
    ? products.filter((p) => !v.products.includes(p.slug) && terms.every((t) => normalize(`${p.name} ${p.sku}`).includes(t))).slice(0, 8)
    : [];
  const moveProduct = (i: number, d: -1 | 1) => {
    const a = [...v.products];
    [a[i], a[i + d]] = [a[i + d], a[i]];
    set('products', a);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...v,
      slug: v.slug || undefined,
      aliases: aliases.split(',').map((s) => s.trim()).filter(Boolean),
      prevention: prevention.map((p) => p.text),
      symptoms: v.symptoms.filter((s) => s.text.trim()),
      steps: v.steps.filter((s) => s.title.trim() || s.detail.trim()),
      confusions: v.confusions.filter((c) => c.name.trim() || c.text.trim()).map((c) => ({ ...c, slug: c.slug || undefined })),
    };
    start(async () => {
      const r = await saveDiseaseAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setSaved(true);
      if (!v.slug) router.push(`/admin/benh-cay/${r.slug}`);
      router.refresh();
    });
  };

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title">
        <h1>{v.slug ? 'Sửa bài bệnh' : 'Thêm bài bệnh'}</h1>
        <span className="vx-crumb"><Link href="/admin/benh-cay">Bệnh cây</Link>/<span>{v.slug ? v.name : 'Mới'}</span></span>
        {v.slug && <span className="acts"><Link href={`/benh-cay/${v.slug}`} target="_blank" className="vx-btn vx-btn--outline">Xem trên web</Link></span>}
      </div>
      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="ad-form">
          <div className="ad-fcol">
            <div className="ad-card">
              <div className="ad-card__h">Thông tin chung</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label htmlFor="df-name">Tên bệnh <i>*</i></label>
                  <input id="df-name" className="vx-input" value={v.name} onChange={(e) => set('name', e.target.value)} maxLength={100} required placeholder="Thối rễ (úng rễ do nấm)" />
                  {!v.slug && <span className="hint">Đường dẫn trang tạo từ tên lúc lưu lần đầu và không đổi về sau.</span>}
                </div>
                <div className="ad-f">
                  <label htmlFor="df-alias">Tên gọi khác</label>
                  <input id="df-alias" className="vx-input" value={aliases} onChange={(e) => { setAliases(e.target.value); setSaved(false); }} placeholder="úng rễ, thối gốc, rễ đen" />
                  <span className="hint">Cách nhau bằng dấu phẩy. Khách tìm bằng các tên này cũng ra bài.</span>
                </div>
                <div className="ad-f">
                  <label htmlFor="df-sum">Mô tả ngắn <i>*</i></label>
                  <textarea id="df-sum" className="vx-input" style={{ minHeight: 80 }} value={v.summary} onChange={(e) => set('summary', e.target.value)} maxLength={800}
                    placeholder="Bệnh do đâu, khi nào hay gặp, hậu quả ra sao…" />
                </div>
                <div className="ad-frow">
                  <div className="ad-f">
                    <label htmlFor="df-spread">Lây lan</label>
                    <input id="df-spread" className="vx-input" value={v.spread} onChange={(e) => set('spread', e.target.value)} maxLength={60} placeholder="Qua đất, nước tưới" />
                  </div>
                  <div className="ad-f">
                    <label htmlFor="df-season">Mùa hay gặp</label>
                    <input id="df-season" className="vx-input" value={v.season} onChange={(e) => set('season', e.target.value)} maxLength={60} placeholder="Mùa mưa, nồm ẩm" />
                  </div>
                </div>
              </div>
            </div>

            <Rows title={<>Triệu chứng <i style={{ color: 'var(--danger)', fontStyle: 'normal' }}>*</i></>} items={v.symptoms} max={8} blank={{ part: 'la' as PartKey, text: '' }}
              onChange={(x) => set('symptoms', x)}
              hint={v.slug
                ? 'Mỗi dòng một dấu hiệu nhìn thấy được, kèm bộ phận có dấu hiệu đó. Ảnh minh họa (không bắt buộc) hiện trên trang bệnh thay cho biểu tượng bộ phận.'
                : 'Mỗi dòng một dấu hiệu nhìn thấy được, kèm bộ phận có dấu hiệu đó. Muốn thêm ảnh minh họa: bấm Lưu bài bệnh trước, rồi quay lại thêm ảnh cho từng triệu chứng.'}
              render={(s, upd) => (
                <>
                  <div className="ad-frow app-symrow">
                    <Select className="vx-input" value={s.part} onChange={(e) => upd({ part: e.target.value as PartKey })} aria-label="Bộ phận">
                      {PARTS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                    </Select>
                    <input className="vx-input" value={s.text} onChange={(e) => upd({ text: e.target.value })} maxLength={200} placeholder="Lá dưới vàng, mềm, rũ…" aria-label="Triệu chứng" />
                  </div>
                  {v.slug && <SymptomPhoto slug={v.slug} file={s.image} onChange={(image) => upd({ image })} />}
                </>
              )} />

            <Rows title="Dễ nhầm với" items={v.confusions} max={4} blank={{ name: '', text: '', slug: '' }}
              onChange={(x) => set('confusions', x)} hint="Giúp khách phân biệt với bệnh có dấu hiệu giống. Chọn bài liên kết để hiện nút “Xem bài”."
              render={(c, upd) => (
                <>
                  <div className="ad-frow app-pair">
                    <input className="vx-input" value={c.name} onChange={(e) => upd({ name: e.target.value })} maxLength={60} placeholder="Tên bệnh dễ nhầm" aria-label="Tên bệnh dễ nhầm" />
                    <Select className="vx-input" value={c.slug ?? ''} onChange={(e) => upd({ slug: e.target.value, name: c.name || diseases.find((d) => d.slug === e.target.value)?.name || '' })} aria-label="Liên kết tới bài">
                      <option value="">Không liên kết</option>
                      {diseases.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
                    </Select>
                  </div>
                  <input className="vx-input" value={c.text} onChange={(e) => upd({ text: e.target.value })} maxLength={300} placeholder="Cách phân biệt: thiếu nước lá giòn, đất khô; thối rễ lá mềm, đất ẩm." aria-label="Cách phân biệt" />
                </>
              )} />

            <Rows title={<>Cách xử lý <i style={{ color: 'var(--danger)', fontStyle: 'normal' }}>*</i></>} items={v.steps} max={8} blank={{ title: '', detail: '' }}
              onChange={(x) => set('steps', x)} hint="Các bước theo thứ tự, trang web tự đánh số 1, 2, 3…"
              render={(s, upd, i) => (
                <>
                  <input className="vx-input" value={s.title} onChange={(e) => upd({ title: e.target.value })} maxLength={120} placeholder={`Bước ${i + 1}: Cắt bỏ rễ thối`} aria-label={`Bước ${i + 1}`} />
                  <input className="vx-input" value={s.detail} onChange={(e) => upd({ detail: e.target.value })} maxLength={300} placeholder="Chi tiết: dùng kéo sạch, cắt đến phần rễ trắng chắc" aria-label={`Chi tiết bước ${i + 1}`} />
                </>
              )} />

            <Rows title="Phòng bệnh" items={prevention} max={8} blank={{ text: '' }}
              onChange={(x) => { setPrevention(x); setSaved(false); }}
              render={(p, upd) => (
                <input className="vx-input" value={p.text} onChange={(e) => upd({ text: e.target.value })} maxLength={200} placeholder="Chỉ tưới khi mặt đất khô 2–3 cm" aria-label="Cách phòng bệnh" />
              )} />

            <div className="ad-card">
              <div className="ad-card__h">Lưu ý an toàn</div>
              <div className="ad-card__b">
                <textarea className="vx-input" style={{ minHeight: 64 }} value={v.safety} onChange={(e) => set('safety', e.target.value)} maxLength={600} aria-label="Lưu ý an toàn"
                  placeholder="Đeo găng tay, khẩu trang khi pha thuốc…" />
                <span className="hint" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>Bắt buộc nên có khi cách xử lý dùng thuốc BVTV. Bỏ trống thì trang không hiện khung này.</span>
              </div>
            </div>
          </div>

          <div className="ad-fcol">
            <div className="ad-card">
              <div className="ad-card__h">Trạng thái</div>
              <div className="ad-card__b">
                <span className="vx-seg">
                  <button type="button" className="vx-chip" aria-pressed={v.active} onClick={() => set('active', true)}>Hiện trên web</button>
                  <button type="button" className="vx-chip" aria-pressed={!v.active} onClick={() => set('active', false)}>Ẩn</button>
                </span>
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card__h">Phân loại</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label htmlFor="df-cause">Nguyên nhân <i>*</i></label>
                  <Select id="df-cause" className="vx-input" value={v.cause} onChange={(e) => set('cause', e.target.value as Disease['cause'])}>
                    {CAUSES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                  </Select>
                </div>
                <div className="ad-f">
                  <label>Bộ phận bị bệnh <i>*</i></label>
                  <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                    {PARTS.map((p) => (
                      <button key={p.key} type="button" className="vx-chip" aria-pressed={v.parts.includes(p.key)} onClick={() => set('parts', toggle(v.parts, p.key, PARTS))}>{p.name}</button>
                    ))}
                  </span>
                  <span className="hint">Bộ phận đầu tiên hiện ở đường dẫn phía trên trang.</span>
                </div>
                <div className="ad-f">
                  <label>Hay gặp ở</label>
                  <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                    {PLANTS.map((p) => (
                      <button key={p.key} type="button" className="vx-chip" aria-pressed={v.plants.includes(p.key)} onClick={() => set('plants', toggle(v.plants, p.key, PLANTS))}>{p.name}</button>
                    ))}
                  </span>
                </div>
                <div className="ad-f">
                  <label>Mức nguy hiểm</label>
                  <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" className="vx-chip" aria-pressed={v.severity === n} onClick={() => set('severity', n)}>{SEVERITY[n]}</button>
                    ))}
                  </span>
                </div>
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card__h">Sản phẩm xử lý</div>
              <div className="ad-card__b">
                {v.products.map((s, i) => {
                  const p = byslug.get(s);
                  return (
                    <div key={s} className="ad-frow app-rowx" style={{ alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem' }}>
                        {p ? p.name : <s>{s}</s>}
                        <small style={{ display: 'block', color: p?.active ? 'var(--ink-muted)' : 'var(--danger)' }}>{!p ? 'Sản phẩm đã bị xóa' : p.active ? p.sku : `${p.sku} · Đang ẩn, không hiện trên web`}</small>
                      </span>
                      <span style={{ display: 'flex', gap: 2 }}>
                        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={i === 0} onClick={() => moveProduct(i, -1)} aria-label="Lên trên">‹</button>
                        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={i === v.products.length - 1} onClick={() => moveProduct(i, 1)} aria-label="Xuống dưới">›</button>
                        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => set('products', v.products.filter((x) => x !== s))} aria-label="Bỏ sản phẩm">✕</button>
                      </span>
                    </div>
                  );
                })}
                {v.products.length < MAX_PRODUCTS && (
                  <div className="ad-f">
                    <input className="vx-input" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Tìm sản phẩm để thêm (tên hoặc SKU)" aria-label="Tìm sản phẩm" />
                    {matches.map((p) => (
                      <button key={p.slug} type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal' }}
                        onClick={() => { set('products', [...v.products, p.slug]); setFind(''); }}>
                        + {p.name} <small style={{ color: 'var(--ink-muted)' }}>{p.sku}</small>
                      </button>
                    ))}
                    {terms.length > 0 && !matches.length && <span className="hint">Không tìm thấy sản phẩm.</span>}
                  </div>
                )}
                <span className="hint" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>Tối đa {MAX_PRODUCTS} sản phẩm, hiện cuối trang bệnh theo thứ tự này.</span>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
      <div className="ad-sticky" style={{ margin: '0 calc(-1 * var(--space-4))' }}>
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span> : saved ? 'Đã lưu' : canEdit ? 'Lưu xong trang bệnh cập nhật ngay trên website' : 'Chỉ quản trị viên được sửa bài bệnh'}
        </span>
        <Link href="/admin/benh-cay" className="vx-btn vx-btn--outline">{canEdit ? 'Hủy' : 'Quay lại'}</Link>
        {canEdit && <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu bài bệnh'}</button>}
      </div>
    </form>
  );
}
