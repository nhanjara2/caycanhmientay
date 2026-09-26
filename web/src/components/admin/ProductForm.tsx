'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveProductAction } from '@/app/actions/admin';
import { Art, type IconName } from '@/components/Icon';
import { categories } from '@/lib/catalog';

type Option = { label: string; price: string; oldPrice: string; stock: string; existingStock?: number };
export type ProductFormValue = {
  slug?: string;
  sku?: string;
  name: string;
  category: string;
  sub: string;
  icon: IconName;
  origin: string;
  ship: 'plant' | 'supply';
  pesticide: boolean;
  unit: string;
  spec: string;
  lead: string;
  specs: [string, string][];
  active: boolean;
  flash: boolean;
  options: { label: string; price: number; oldPrice: number | null; stock: number }[];
};

/** Loại sản phẩm quyết định bộ thông số mặc định (AdminProductForm). */
const KINDS = {
  plant: { label: 'Cây sống', ship: 'plant', pesticide: false, category: 'cay-canh', icon: 'plant', specs: ['Chiều cao', 'Chậu', 'Ánh sáng', 'Tưới nước', 'Nguồn gốc', 'An toàn thú cưng'] },
  pesticide: { label: 'Thuốc BVTV', ship: 'supply', pesticide: true, category: 'thuoc-bvtv', icon: 'bottle', specs: ['Số đăng ký', 'Hoạt chất', 'Liều pha', 'Thời gian cách ly', 'Quy cách'] },
  fertilizer: { label: 'Phân bón', ship: 'supply', pesticide: false, category: 'phan-bon', icon: 'drop', specs: ['Thành phần', 'Liều dùng', 'Quy cách'] },
  supply: { label: 'Chậu – Vật tư', ship: 'supply', pesticide: false, category: 'chau', icon: 'pot', specs: ['Kích thước', 'Chất liệu', 'Quy cách'] },
} as const;
type Kind = keyof typeof KINDS;
const kindOf = (v: ProductFormValue): Kind => (v.pesticide ? 'pesticide' : v.ship === 'plant' ? 'plant' : v.category === 'phan-bon' ? 'fertilizer' : 'supply');

const ICONS: IconName[] = ['plant', 'leaf', 'flower', 'sprout', 'bottle', 'flask', 'drop', 'pot', 'box', 'tool', 'gauge'];
const digits = (s: string) => s.replace(/\D/g, '');
const fmt = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString('vi-VN') : '');

export function ProductForm({ initial, canEdit }: { initial: ProductFormValue; canEdit: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [opts, setOpts] = useState<Option[]>(
    initial.options.map((o) => ({ label: o.label, price: fmt(String(o.price)), oldPrice: o.oldPrice ? fmt(String(o.oldPrice)) : '', stock: '', existingStock: initial.slug ? o.stock : undefined })),
  );
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => { setV((x) => ({ ...x, [k]: val })); setSaved(false); };
  const kind = kindOf(v);
  const cat = categories.find((c) => c.slug === v.category) ?? categories[0];

  const pickKind = (k: Kind) => {
    const d = KINDS[k];
    const have = new Map(v.specs);
    const cat = categories.find((c) => c.slug === d.category)!;
    setV((x) => ({
      ...x, ship: d.ship, pesticide: d.pesticide, icon: x.slug ? x.icon : d.icon,
      category: d.category, sub: cat.subs.some((s) => s.slug === x.sub) ? x.sub : cat.subs[0].slug,
      // giữ thông số đã nhập, thêm dòng trống cho thông số của loại mới
      specs: [...x.specs, ...d.specs.filter((s) => !have.has(s)).map((s) => [s, ''] as [string, string])],
    }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...v,
      specs: v.specs.filter(([k, val]) => k.trim() && val.trim()),
      options: opts.map((o) => ({
        label: o.label,
        price: Number(digits(o.price) || 0),
        oldPrice: digits(o.oldPrice) ? Number(digits(o.oldPrice)) : null,
        stock: o.existingStock === undefined ? Number(digits(o.stock) || 0) : undefined,
      })),
    };
    start(async () => {
      const r = await saveProductAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setSaved(true);
      if (!v.slug) router.push(`/admin/san-pham/${r.slug}`);
      router.refresh();
    });
  };

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title">
        <h1>{v.slug ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
        <span className="vx-crumb"><Link href="/admin/san-pham">Sản phẩm</Link>/<span>{v.sku ?? 'Mới'}</span></span>
        {v.slug && <span className="acts"><Link href={`/san-pham/${v.slug}`} target="_blank" className="vx-btn vx-btn--outline">Xem trên web</Link></span>}
      </div>
      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="ad-form">
          <div className="ad-fcol">
            <div className="ad-card">
              <div className="ad-card__h">Loại sản phẩm</div>
              <div className="ad-card__b">
                <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                  {(Object.keys(KINDS) as Kind[]).map((k) => (
                    <button key={k} type="button" className="vx-chip" aria-pressed={kind === k} onClick={() => pickKind(k)}>{KINDS[k].label}</button>
                  ))}
                </span>
                <span className="hint" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Loại quyết định bộ thông số bên dưới và các trường bắt buộc.</span>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card__h">Thông tin cơ bản</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label htmlFor="pf-name">Tên sản phẩm <i>*</i></label>
                  <input id="pf-name" className="vx-input" value={v.name} onChange={(e) => set('name', e.target.value)} maxLength={120} required />
                  <span className="hint">Loại + tên + đặc điểm + quy cách. {v.name.length}/120 ký tự.</span>
                </div>
                <div className="ad-frow">
                  <div className="ad-f">
                    <label htmlFor="pf-origin">Xuất xứ <i>*</i></label>
                    <input id="pf-origin" className="vx-input" value={v.origin} onChange={(e) => set('origin', e.target.value)} placeholder="Đà Lạt, Việt Nam…" />
                  </div>
                  <div className="ad-f">
                    <label htmlFor="pf-unit">Đơn vị bán <i>*</i></label>
                    <input id="pf-unit" className="vx-input" value={v.unit} onChange={(e) => set('unit', e.target.value)} placeholder="Chậu, Chai, Bao…" />
                  </div>
                  <div className="ad-f">
                    <label htmlFor="pf-spec">Dòng thông số trên thẻ</label>
                    <input id="pf-spec" className="vx-input" value={v.spec} onChange={(e) => set('spec', e.target.value)} placeholder="Cao 60–70cm · Chậu Ø25" />
                  </div>
                </div>
                <div className="ad-f">
                  <label htmlFor="pf-lead">Mô tả ngắn <i>*</i></label>
                  <textarea id="pf-lead" className="vx-input" style={{ minHeight: 56 }} value={v.lead} onChange={(e) => set('lead', e.target.value)} maxLength={600} />
                </div>
                <div className="ad-f">
                  <label>Ảnh minh họa</label>
                  <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                    {ICONS.map((i) => (
                      <button key={i} type="button" className="vx-chip" aria-pressed={v.icon === i} aria-label={i} onClick={() => set('icon', i)} style={{ padding: 4, width: 36, height: 36, display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                        <Art name={i} />
                      </button>
                    ))}
                  </span>
                  <span className="hint">Tạm dùng biểu tượng cho đến khi có ảnh chụp tại vườn (xem PhotoGuide).</span>
                </div>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card__h">
                Quy cách bán
                <a style={{ cursor: 'pointer' }} onClick={() => setOpts((o) => [...o, { label: '', price: '', oldPrice: '', stock: '' }])}>+ Thêm quy cách</a>
              </div>
              <div className="ad-tablewrap">
                <table className="ad-table ad-vtable">
                  <thead><tr><th>Quy cách</th><th>Giá bán</th><th>Giá gốc</th><th className="num">Tồn</th><th /></tr></thead>
                  <tbody>
                    {opts.map((o, i) => {
                      const upd = (k: keyof Option, val: string) => { setOpts((x) => x.map((y, j) => (j === i ? { ...y, [k]: val } : y))); setSaved(false); };
                      return (
                        <tr key={i}>
                          <td><input className="vx-input" value={o.label} onChange={(e) => upd('label', e.target.value)} placeholder="Chậu sứ Ø25" aria-label="Tên quy cách" /></td>
                          <td><input className="vx-input" inputMode="numeric" value={o.price} onChange={(e) => upd('price', fmt(e.target.value))} placeholder="289.000" aria-label="Giá bán" /></td>
                          <td><input className="vx-input" inputMode="numeric" value={o.oldPrice} onChange={(e) => upd('oldPrice', fmt(e.target.value))} placeholder="Không giảm" aria-label="Giá gốc" /></td>
                          <td className="num">
                            {o.existingStock !== undefined
                              ? <Link href="/admin/kho" title="Đổi tồn ở trang Kho">{o.existingStock}</Link>
                              : <input className="vx-input" inputMode="numeric" style={{ width: 80 }} value={o.stock} onChange={(e) => upd('stock', digits(e.target.value))} placeholder="0" aria-label="Tồn đầu kỳ" />}
                          </td>
                          <td>{o.existingStock === undefined && opts.length > 1 && (
                            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => setOpts((x) => x.filter((_, j) => j !== i))}>Xóa</button>
                          )}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card__h">
                Thông số {KINDS[kind].label.toLowerCase()}
                <a style={{ cursor: 'pointer' }} onClick={() => set('specs', [...v.specs, ['', '']])}>+ Thêm dòng</a>
              </div>
              <div className="ad-card__b">
                {v.specs.map(([k, val], i) => {
                  const upd = (pos: 0 | 1, s: string) => set('specs', v.specs.map((row, j) => (j === i ? (pos === 0 ? [s, row[1]] : [row[0], s]) : row)) as [string, string][]);
                  const required = v.pesticide && ['Số đăng ký', 'Hoạt chất', 'Liều pha', 'Thời gian cách ly'].includes(k);
                  return (
                    <div key={i} className="ad-frow" style={{ gridTemplateColumns: '180px 1fr auto' }}>
                      <input className="vx-input" value={k} onChange={(e) => upd(0, e.target.value)} placeholder="Tên thông số" aria-label="Tên thông số" />
                      <input className="vx-input" value={val} onChange={(e) => upd(1, e.target.value)} placeholder={required ? 'Bắt buộc với thuốc BVTV' : 'Giá trị'} aria-label={k || 'Giá trị'} style={required && !val ? { borderColor: 'var(--danger)' } : undefined} />
                      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => set('specs', v.specs.filter((_, j) => j !== i))} aria-label="Xóa dòng">✕</button>
                    </div>
                  );
                })}
                {v.pesticide && (
                  <span className="hint" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                    Thuốc BVTV bắt buộc: <b>Số đăng ký, Hoạt chất, Liều pha, Thời gian cách ly</b>. Giỏ có thuốc sẽ yêu cầu khách xác nhận đã đọc hướng dẫn an toàn.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="ad-fcol">
            <div className="ad-card">
              <div className="ad-card__h">Trạng thái</div>
              <div className="ad-card__b">
                <span className="vx-seg">
                  <button type="button" className="vx-chip" aria-pressed={v.active} onClick={() => set('active', true)}>Đang bán</button>
                  <button type="button" className="vx-chip" aria-pressed={!v.active} onClick={() => set('active', false)}>Ẩn</button>
                </span>
                <div className="vx-label-row">
                  <span>Hiện ở Flash sale</span>
                  <button type="button" className="vx-switch" role="switch" aria-checked={v.flash} aria-label="Hiện ở Flash sale" onClick={() => set('flash', !v.flash)} />
                </div>
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card__h">Phân loại</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label htmlFor="pf-cat">Danh mục <i>*</i></label>
                  <select id="pf-cat" className="vx-input" value={v.category} onChange={(e) => { const c = categories.find((x) => x.slug === e.target.value)!; setV((x) => ({ ...x, category: c.slug, sub: c.subs[0].slug })); }}>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ad-f">
                  <label htmlFor="pf-sub">Nhóm con <i>*</i></label>
                  <select id="pf-sub" className="vx-input" value={v.sub} onChange={(e) => set('sub', e.target.value)}>
                    {cat.subs.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
                <div className="ad-f">
                  <label>Cách giao</label>
                  <span style={{ fontSize: 12 }}>{v.ship === 'plant' ? 'Cây sống — giao riêng bằng xe, chỉ nội thành' : 'Vật tư — giao nhanh 2h'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
      <div className="ad-sticky" style={{ margin: '0 calc(-1 * var(--space-4))' }}>
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span> : saved ? 'Đã lưu' : canEdit ? 'Thay đổi giá có hiệu lực ngay trên website' : 'Chỉ quản trị viên được sửa sản phẩm'}
        </span>
        <Link href="/admin/san-pham" className="vx-btn vx-btn--outline">{canEdit ? 'Hủy' : 'Quay lại'}</Link>
        {canEdit && <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>}
      </div>
    </form>
  );
}
