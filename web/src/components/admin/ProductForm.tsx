'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveProductAction } from '@/app/actions/admin';
import { Art, type IconName } from '@/components/Icon';
import { applySpecTemplate, ELEMENTS, ICON_LABELS, parseYoutubeId, PRODUCT_ICONS, specTemplate, type Category, type FengShui } from '@/lib/catalog';
import { KICH_THUOC, MAU_SAC, VI_TRI } from '@/lib/product-filters';
import { CARE_LEVELS, LIGHTS, PET_SAFETY, ROLES } from '@/lib/plant-advisor';
import { comboFromRetail, costFromGarden, PRICE_FORMULA, retailFromCost, strikeFromRetail } from '@/lib/pricing';
import { autoSeoName, SEO_NAME_MAX, SEO_TITLE_VISIBLE } from '@/lib/seo-name';
import { tracksLots } from '@/lib/stock';
import { ProductDeleteButton } from './ProductDeleteButton';
import { ProductImages, type AdminImage } from './ProductImages';
import { Select } from '@/components/Select';

/** `idx` = số thứ tự trong database của quy cách đã lưu (chưa có = quy cách mới thêm, chưa lưu). */
type Option = { idx?: number; label: string; garden: string; cost: string; price: string; combo2: string; oldPrice: string; bulky: boolean; stock: string; existingStock?: number };
type PriceKey = 'garden' | 'cost' | 'price' | 'combo2' | 'oldPrice';
export type ProductFormValue = {
  slug?: string;
  sku?: string;
  name: string;
  /** Tên chi tiết (SEO), trống = web tự tạo theo công thức (lib/seo-name.ts). */
  seoName: string;
  category: string;
  sub: string;
  /** Nhóm con phụ cùng danh mục: sản phẩm hiện thêm ở các nhóm này. */
  extraSubs: string[];
  icon: IconName;
  origin: string;
  ship: 'plant' | 'supply';
  pesticide: boolean;
  /** Không áp mã giảm giá / miễn phí giao. */
  noVoucher: boolean;
  unit: string;
  spec: string;
  lead: string;
  /** Tên gọi khác + tên khoa học, ngăn cách bằng dấu phẩy (lưu thành `products.keywords`). */
  keywords: string;
  specs: [string, string][];
  active: boolean;
  flash: boolean;
  /** Link YouTube, bỏ trống = không có video. */
  video: string;
  images: AdminImage[];
  fengshui: FengShui;
  /** Đặc điểm cây cho bộ lọc (chỉ cây sống). */
  attrs: {
    viTri: string[]; kichThuoc: string | null; mau: string[];
    /** Tư vấn chọn cây (lib/plant-advisor.ts). */
    anhSang: string[]; vaiTro: string[]; cham: string | null; thuCung: string | null; chiuGio: boolean;
  };
  options: { idx?: number; label: string; price: number; oldPrice: number | null; garden: number | null; cost: number | null; combo2: number | null; bulky: boolean; stock: number }[];
};

/**
 * Loại sản phẩm quyết định cách giao, thuốc BVTV hay không và danh mục gợi ý (AdminProductForm).
 * Bộ thông số điền sẵn lấy theo danh mục + nhóm con (admin sửa ở /admin/danh-muc).
 */
const KINDS = {
  plant: { label: 'Cây sống', ship: 'plant', pesticide: false, category: 'cay-canh', icon: 'plant' },
  pesticide: { label: 'Thuốc BVTV', ship: 'supply', pesticide: true, category: 'thuoc-bvtv', icon: 'spray' },
  fertilizer: { label: 'Phân bón', ship: 'supply', pesticide: false, category: 'phan-bon', icon: 'fertilizer' },
  supply: { label: 'Chậu – Vật tư', ship: 'supply', pesticide: false, category: 'chau', icon: 'pot' },
} as const;
const PESTICIDE_SPECS = ['Số đăng ký', 'Hoạt chất', 'Liều pha', 'Thời gian cách ly'];
type Kind = keyof typeof KINDS;
const kindOf = (v: ProductFormValue): Kind => (v.pesticide ? 'pesticide' : v.ship === 'plant' ? 'plant' : v.category === 'phan-bon' ? 'fertilizer' : 'supply');

const digits = (s: string) => s.replace(/\D/g, '');
const fmt = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString('vi-VN') : '');
const num = (s: string) => (digits(s) ? Number(digits(s)) : null);

/** Sửa một ô giá: các ô phía sau tính lại theo công thức (vườn → gốc → lẻ → combo 2 cây + giá gạch ngang). Ô combo / gạch ngang sửa riêng. */
function cascade(o: Option, k: PriceKey, raw: string): Option {
  const n: Option = { ...o, [k]: fmt(raw) };
  const val = (x: string) => Number(digits(x) || 0);
  const show = (x: number) => fmt(String(x));
  if (k === 'garden') {
    if (!val(n.garden)) return n;
    n.cost = show(costFromGarden(val(n.garden)));
  }
  if (k === 'garden' || k === 'cost') {
    if (!val(n.cost)) return n;
    n.price = show(retailFromCost(val(n.cost)));
  }
  if (k === 'garden' || k === 'cost' || k === 'price') {
    const retail = val(n.price);
    n.combo2 = retail ? show(comboFromRetail(retail)) : '';
    n.oldPrice = retail ? show(strikeFromRetail(retail)) : '';
  }
  return n;
}

/** Nhóm con mặc định khi đổi danh mục: giữ nhóm cũ nếu có, không thì nhóm đang hiện đầu tiên. */
const pickSub = (c: Category | undefined, current: string) =>
  c?.subs.some((s) => s.slug === current) ? current : (c?.subs.find((s) => s.active) ?? c?.subs[0])?.slug ?? '';

export function ProductForm({ initial, categories, canEdit }: { initial: ProductFormValue; categories: Category[]; canEdit: boolean }) {
  const router = useRouter();
  const findCat = (slug: string) => categories.find((c) => c.slug === slug);
  const [v, setV] = useState(() => {
    // sản phẩm mới: danh mục mặc định có thể đã bị đổi → lấy danh mục đầu tiên có nhóm con
    const c = findCat(initial.category) ?? categories.find((x) => x.subs.length);
    const category = c?.slug ?? initial.category;
    const sub = pickSub(c, initial.sub);
    return { ...initial, category, sub, specs: applySpecTemplate(initial.specs, specTemplate(c, sub)) };
  });
  const [opts, setOpts] = useState<Option[]>(
    initial.options.map((o) => ({
      idx: initial.slug ? o.idx : undefined, label: o.label, garden: o.garden ? fmt(String(o.garden)) : '', cost: o.cost ? fmt(String(o.cost)) : '',
      price: fmt(String(o.price)), combo2: o.combo2 ? fmt(String(o.combo2)) : '', oldPrice: o.oldPrice ? fmt(String(o.oldPrice)) : '', bulky: o.bulky,
      stock: '', existingStock: initial.slug ? o.stock : undefined,
    })),
  );
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => { setV((x) => ({ ...x, [k]: val })); setSaved(false); };
  const kind = kindOf(v);
  /** Thuốc BVTV, phân bón, hạt giống nhập theo lô: Tồn đầu kỳ không có Số lô + Hạn dùng nên chỉ nhập ở trang Nhập hàng. */
  const lotted = tracksLots({ pesticide: v.pesticide, category: v.category });
  const videoId = parseYoutubeId(v.video);
  const setFs = (patch: Partial<FengShui>) => set('fengshui', { ...v.fengshui, ...patch });
  const setAttrs = (patch: Partial<ProductFormValue['attrs']>) => set('attrs', { ...v.attrs, ...patch });
  const toggle = (list: string[], key: string, all: { key: string }[]) => all.map((o) => o.key).filter((k) => (k === key ? !list.includes(k) : list.includes(k)));
  // tên chi tiết theo công thức, tính từ dữ liệu đang nhập trên form (chưa cần Lưu)
  const autoName = autoSeoName({ ...v, keywords: v.keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) });
  const cat = findCat(v.category);
  const template = specTemplate(cat, v.sub);
  // gợi ý tên thông số khi gõ: mọi thông số trong các danh mục / nhóm con
  const specNames = [...new Set(categories.flatMap((c) => [...c.specs, ...c.subs.flatMap((s) => s.specs)].map((f) => f.name)))];

  /** Đổi danh mục / nhóm con: giữ thông số đã nhập, thêm dòng trống cho thông số của bộ mới, bỏ dòng trống của bộ cũ. */
  const moveTo = (category: string, sub: string, patch: Partial<ProductFormValue> = {}) => {
    const c = findCat(category);
    const s = pickSub(c, sub);
    setV((x) => ({
      ...x, ...patch, category: c ? category : x.category, sub: c ? s : x.sub,
      extraSubs: c && category !== x.category ? [] : x.extraSubs.filter((e) => e !== (c ? s : x.sub)),
      specs: applySpecTemplate(x.specs, specTemplate(c ?? findCat(x.category), c ? s : x.sub)),
    }));
    setSaved(false);
  };

  const pickKind = (k: Kind) => {
    const d = KINDS[k];
    // danh mục gợi ý của loại (nếu còn và có nhóm con), không thì giữ danh mục đang chọn
    const target = findCat(d.category)?.subs.length ? d.category : v.category;
    moveTo(target, v.sub, { ship: d.ship, pesticide: d.pesticide, icon: v.slug ? v.icon : d.icon });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...v,
      images: undefined, // ảnh đã lưu riêng khi tải lên
      specs: v.specs.filter(([k, val]) => k.trim() && val.trim()),
      options: opts.map((o) => ({
        idx: o.idx,
        label: o.label,
        price: Number(digits(o.price) || 0),
        oldPrice: num(o.oldPrice),
        garden: num(o.garden),
        cost: num(o.cost),
        combo2: num(o.combo2),
        bulky: kind === 'plant' && o.bulky,
        stock: o.existingStock === undefined ? (lotted ? 0 : Number(digits(o.stock) || 0)) : undefined,
      })),
    };
    start(async () => {
      const r = await saveProductAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setSaved(true);
      // quy cách vừa tạo nhận số thứ tự từ máy chủ → lần lưu sau là sửa, không tạo trùng
      setOpts((x) => (x.length === r.idxs.length ? x.map((o, i) => (o.idx === undefined
        ? { ...o, idx: r.idxs[i], existingStock: lotted ? 0 : Number(digits(o.stock) || 0), stock: '' } : o)) : x));
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
                <span className="hint" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>Loại quyết định bộ thông số bên dưới và các trường bắt buộc.</span>
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
                <div className="ad-f">
                  <label htmlFor="pf-seoname">Tên chi tiết (SEO Google)</label>
                  <div className="app-seoname">
                    <textarea id="pf-seoname" className="vx-input" rows={2} value={v.seoName} onChange={(e) => set('seoName', e.target.value.replace(/\s*\n\s*/g, ' '))}
                      maxLength={SEO_NAME_MAX} placeholder={autoName} />
                    <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={!autoName || v.seoName === autoName} onClick={() => set('seoName', autoName)}>Tạo tự động</button>
                  </div>
                  <span className="hint">
                    Hiện ở tiêu đề trang sản phẩm và tên trên Google; thẻ sản phẩm, giỏ hàng vẫn dùng tên ngắn. Bấm <b>Tạo tự động</b> để ghép theo công thức
                    {' '}<i>Tên cây (tên gọi khác) + vị trí đặt – công dụng, phong thủy, hợp mệnh</i> từ các mục bên dưới, rồi sửa lại cho tự nhiên.
                    Để trống thì web tự dùng tên tạo tự động (chữ mờ trong ô). {v.seoName.length}/{SEO_NAME_MAX} ký tự
                    {v.seoName.length > SEO_TITLE_VISIBLE && <> — Google chỉ hiện khoảng {SEO_TITLE_VISIBLE} ký tự đầu, giữ tên cây và ý chính ở đầu</>}.
                  </span>
                </div>
                <div className="ad-f">
                  <label htmlFor="pf-keywords">Tên gọi khác</label>
                  <input id="pf-keywords" className="vx-input" value={v.keywords} onChange={(e) => set('keywords', e.target.value)} maxLength={600} placeholder="kim phát tài, Zamioculcas zamiifolia" />
                  <span className="hint">Cách gọi khác và tên khoa học, ngăn cách bằng dấu phẩy. Khách gõ tên nào ở ô tìm kiếm cũng ra sản phẩm này (gõ không dấu cũng được); không hiện trên trang sản phẩm.</span>
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
                  <label>Biểu tượng (hiện khi chưa có ảnh)</label>
                  <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                    {PRODUCT_ICONS.map((i) => (
                      <button key={i} type="button" className="vx-chip" aria-pressed={v.icon === i} aria-label={ICON_LABELS[i]} title={ICON_LABELS[i]} onClick={() => set('icon', i)} style={{ padding: 4, width: 36, height: 36, display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                        <Art name={i} />
                      </button>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {kind === 'plant' && (
              <div className="ad-card">
                <div className="ad-card__h">Đặc điểm cây (bộ lọc trên web)</div>
                <div className="ad-card__b">
                  <div className="ad-f">
                    <label>Vị trí đặt</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {VI_TRI.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.viTri.includes(o.key)}
                          onClick={() => setAttrs({ viTri: toggle(v.attrs.viTri, o.key, VI_TRI) })}>{o.name}</button>
                      ))}
                    </span>
                    <span className="hint">Chọn được nhiều.</span>
                  </div>
                  <div className="ad-f">
                    <label>Kích thước</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {KICH_THUOC.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.kichThuoc === o.key}
                          onClick={() => setAttrs({ kichThuoc: v.attrs.kichThuoc === o.key ? null : o.key })}>{o.name}</button>
                      ))}
                    </span>
                    <span className="hint">Chọn 1 mức theo chiều cao cả chậu; bấm lại để bỏ chọn.</span>
                  </div>
                  <div className="ad-f">
                    <label>Màu sắc</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {MAU_SAC.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.mau.includes(o.key)}
                          onClick={() => setAttrs({ mau: toggle(v.attrs.mau, o.key, MAU_SAC) })}>{o.name}</button>
                      ))}
                    </span>
                    <span className="hint">Màu lá và màu hoa nổi bật; chọn được nhiều.</span>
                  </div>
                  <span className="hint">Khách lọc theo các mục này ở trang danh mục. Mục nào để trống thì cây không hiện khi khách lọc theo mục đó. “Hợp mệnh” lấy từ khung Phong thủy bên dưới.</span>
                </div>
              </div>
            )}

            {kind === 'plant' && (
              <div className="ad-card">
                <div className="ad-card__h">Tư vấn chọn cây</div>
                <div className="ad-card__b">
                  <div className="ad-f">
                    <label>Ánh sáng chịu được</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {LIGHTS.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.anhSang.includes(o.key)} title={o.hint}
                          onClick={() => setAttrs({ anhSang: toggle(v.attrs.anhSang, o.key, [...LIGHTS]) })}>{o.name}</button>
                      ))}
                    </span>
                    <span className="hint">Chọn mọi mức cây sống khỏe được. Cây chịu “Ít sáng” thì cũng được gợi ý cho chỗ chỉ có đèn.</span>
                  </div>
                  <div className="ad-f">
                    <label>Dùng làm</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {ROLES.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.vaiTro.includes(o.key)}
                          onClick={() => setAttrs({ vaiTro: toggle(v.attrs.vaiTro, o.key, [...ROLES]) })}>{o.name}</button>
                      ))}
                    </span>
                    <span className="hint">Vị trí cây hợp khi bố trí (để bàn, góc phòng, hàng rào…); chọn được nhiều.</span>
                  </div>
                  <div className="ad-f">
                    <label>Độ dễ chăm</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {CARE_LEVELS.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.cham === o.key}
                          onClick={() => setAttrs({ cham: v.attrs.cham === o.key ? null : o.key })}>{o.name}</button>
                      ))}
                    </span>
                  </div>
                  <div className="ad-f">
                    <label>Với trẻ nhỏ, chó mèo</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {PET_SAFETY.map((o) => (
                        <button key={o.key} type="button" className="vx-chip" aria-pressed={v.attrs.thuCung === o.key}
                          onClick={() => setAttrs({ thuCung: v.attrs.thuCung === o.key ? null : o.key })}>{o.name}</button>
                      ))}
                      <button type="button" className="vx-chip" aria-pressed={v.attrs.chiuGio} onClick={() => setAttrs({ chiuGio: !v.attrs.chiuGio })}>Chịu gió mạnh (ban công tầng cao)</button>
                    </span>
                  </div>
                  <span className="hint">
                    Dùng cho trang <a href="/tu-van-chon-cay" target="_blank" rel="noreferrer">Tư vấn chọn cây</a>. Mục nào để trống, trang tự đoán từ thông số
                    “Ánh sáng”, “Chiều cao”, “Mức độ dễ chăm”, “An toàn thú cưng” và tên quy cách (ví dụ “Cao 1m2”) — chọn ở đây thì gợi ý chính xác hơn.
                    Chiều cao từng cỡ lấy từ tên quy cách, không có thì lấy thông số Chiều cao.
                  </span>
                </div>
              </div>
            )}

            <div className="ad-card">
              <div className="ad-card__h">Phong thủy</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label>Hợp mệnh</label>
                  <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                    {ELEMENTS.map((e) => {
                      const on = v.fengshui.elements.includes(e.key);
                      return (
                        <button key={e.key} type="button" className="vx-chip" aria-pressed={on}
                          onClick={() => setFs({ elements: on ? v.fengshui.elements.filter((x) => x !== e.key) : ELEMENTS.map((x) => x.key).filter((k) => k === e.key || v.fengshui.elements.includes(k)) })}>
                          {e.name}
                        </button>
                      );
                    })}
                  </span>
                  <span className="hint">Chọn được nhiều mệnh.</span>
                </div>
                <div className="ad-frow">
                  <div className="ad-f">
                    <label htmlFor="pf-ages">Hợp tuổi</label>
                    <input id="pf-ages" className="vx-input" value={v.fengshui.ages} onChange={(e) => setFs({ ages: e.target.value })} maxLength={80} placeholder="Tý, Thìn, Thân" />
                  </div>
                  <div className="ad-f">
                    <label htmlFor="pf-place">Vị trí / hướng đặt</label>
                    <input id="pf-place" className="vx-input" value={v.fengshui.placement} onChange={(e) => setFs({ placement: e.target.value })} maxLength={300} placeholder="Phòng khách, hướng Đông hoặc Đông Nam" />
                  </div>
                </div>
                <div className="ad-f">
                  <label htmlFor="pf-meaning">Ý nghĩa phong thủy</label>
                  <textarea id="pf-meaning" className="vx-input" style={{ minHeight: 72 }} value={v.fengshui.meaning} onChange={(e) => setFs({ meaning: e.target.value })} maxLength={1000}
                    placeholder="Lá xẻ tượng trưng cho sự rộng mở, đón tài lộc…" />
                </div>
                <span className="hint">Bỏ trống hết nếu sản phẩm không liên quan phong thủy — trang sản phẩm sẽ không hiện mục này.</span>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card__h">Ảnh & video</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label>Ảnh sản phẩm</label>
                  <ProductImages key={v.slug} slug={v.slug} initial={v.images} canEdit={canEdit} />
                </div>
                <div className="ad-f">
                  <label htmlFor="pf-video">Video YouTube</label>
                  <input id="pf-video" className="vx-input" value={v.video} onChange={(e) => set('video', e.target.value)} placeholder="https://youtu.be/… hoặc https://www.youtube.com/watch?v=…" maxLength={200} />
                  {v.video.trim() && !videoId
                    ? <span className="vx-err">Link chưa đúng — mở video trên YouTube, bấm Chia sẻ → Sao chép đường liên kết rồi dán vào đây.</span>
                    : <span className="hint">Đăng video lên YouTube (có thể để chế độ “Không công khai”), rồi dán link vào đây. Video hiện ở phần mô tả trang sản phẩm. Bấm <b>Lưu sản phẩm</b> để áp dụng.</span>}
                  {videoId && (
                    <div className="app-yt" style={{ maxWidth: 360 }}>
                      <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="Xem trước video" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card__h">
                Quy cách bán
                <a style={{ cursor: 'pointer' }} onClick={() => setOpts((o) => [...o, { label: '', garden: '', cost: '', price: '', combo2: '', oldPrice: '', bulky: false, stock: '' }])}>+ Thêm quy cách</a>
              </div>
              <div className="ad-tablewrap">
                <table className="ad-table ad-vtable app-mtable">
                  <thead><tr><th>Quy cách</th><th>Giá tại vườn</th><th>Giá gốc</th><th>Giá lẻ (giá bán)</th><th>Combo 2 cây</th><th>Giá gạch ngang</th>{kind === 'plant' && <th>Cây lớn</th>}<th className="num">Tồn</th><th /></tr></thead>
                  <tbody>
                    {opts.map((o, i) => {
                      const removeOpt = () => {
                        // quy cách đã lưu: hỏi lại, và chỉ xóa thật khi bấm Lưu sản phẩm
                        if (o.idx !== undefined && !confirm(`Xóa quy cách “${o.label}”?${o.existingStock ? `\nTồn kho ${o.existingStock} của quy cách này sẽ bị hủy.` : ''}\nBấm “Lưu sản phẩm” để hoàn tất.`)) return;
                        setOpts((x) => x.filter((_, j) => j !== i));
                        setSaved(false);
                      };
                      const upd = (k: keyof Option, val: string) => { setOpts((x) => x.map((y, j) => (j === i ? { ...y, [k]: val } : y))); setSaved(false); };
                      const price = (k: PriceKey, label: string, hint: string) => (
                        <td data-label={label}>
                          <input className="vx-input app-pricein" inputMode="numeric" value={o[k]} onChange={(e) => { setOpts((x) => x.map((y, j) => (j === i ? cascade(y, k, e.target.value) : y))); setSaved(false); }} placeholder={hint} aria-label={label} />
                        </td>
                      );
                      return (
                        <tr key={o.idx ?? `moi-${i}`}>
                          <td data-label="Quy cách"><input className="vx-input app-optlabel" value={o.label} onChange={(e) => upd('label', e.target.value)} placeholder={kind === 'plant' ? 'Cao 40–60cm' : v.category === 'chau' ? '25x22cm' : 'Chai 500ml'} aria-label="Tên quy cách" /></td>
                          {price('garden', 'Giá tại vườn', 'Nhập giá vườn')}
                          {price('cost', 'Giá gốc', 'Tự tính')}
                          {price('price', 'Giá lẻ (giá bán)', '0 = Liên hệ')}
                          {price('combo2', 'Combo 2 cây', 'Tự tính')}
                          {price('oldPrice', 'Giá gạch ngang', 'Tự tính')}
                          {kind === 'plant' && (
                            <td data-label="Cây lớn">
                              <label className="vx-check" title="Cây lớn / cồng kềnh: tính thêm phụ phí giao mỗi cây (đặt số phụ phí ở Cài đặt giao hàng)">
                                <input type="checkbox" checked={o.bulky} onChange={(e) => { setOpts((x) => x.map((y, j) => (j === i ? { ...y, bulky: e.target.checked } : y))); setSaved(false); }} aria-label={`Quy cách ${o.label || i + 1} là cây lớn`} />
                              </label>
                            </td>
                          )}
                          <td className="num" data-label={o.existingStock !== undefined ? 'Tồn' : 'Tồn đầu kỳ'}>
                            {o.existingStock !== undefined
                              ? <Link href="/admin/kho" title="Đổi tồn ở trang Kho">{o.existingStock}</Link>
                              : <input className="vx-input" inputMode="numeric" style={{ width: 80 }} value={lotted ? '' : o.stock} onChange={(e) => upd('stock', digits(e.target.value))} placeholder="0" disabled={lotted} title={lotted ? 'Hàng theo lô: nhập ở trang Nhập hàng kèm Số lô và Hạn dùng' : undefined} aria-label="Tồn đầu kỳ" />}
                          </td>
                          <td data-m="foot end">{opts.length > 1 && (
                            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={removeOpt} aria-label={`Xóa quy cách ${o.label}`}>Xóa</button>
                          )}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="ad-card__b" style={{ paddingTop: 0 }}>
                <small className="vx-help">
                  {lotted
                    ? <>Hàng theo lô (thuốc BVTV, phân bón, hạt giống) không điền Tồn đầu kỳ ở đây. Lưu sản phẩm xong, vào <Link href="/admin/nhap-hang" style={{ color: 'var(--primary)', fontWeight: 600 }}>Nhập hàng</Link> để ghi số lượng kèm Số lô và Hạn dùng.</>
                    : <>{kind === 'plant' && <><b>Cây:</b> quy cách ghi kích thước của cây (Cao 40–60cm, 3 tầng, 15–20 lá…), không ghi chậu — chậu bán riêng ở danh mục Chậu (kích thước dài × cao, vd. 8x8cm). </>}
                      {v.category === 'chau' && <><b>Chậu:</b> quy cách ghi kích thước dài × cao (vd. 8x8cm, 25x22cm). </>}
                      <b>Cây lớn:</b> tích ở quy cách cồng kềnh (cây cao, chậu to khó vận chuyển) — khách giao hàng bị tính thêm phụ phí mỗi cây, số tiền đặt ở <Link href="/admin/cai-dat-giao-hang" style={{ color: 'var(--primary)', fontWeight: 600 }}>Cài đặt giao hàng</Link>. <b>Giá:</b> chỉ cần nhập <b>Giá tại vườn</b>, các ô khác tự tính — Giá gốc = vườn + {PRICE_FORMULA.costPct}%, Giá lẻ = gốc + {PRICE_FORMULA.retailPct}%, Combo 2 cây = (lẻ × 2) − {PRICE_FORMULA.comboPct}%, Giá gạch ngang = lẻ + {PRICE_FORMULA.strikeMinPct}–{PRICE_FORMULA.strikeMaxPct}% (ngẫu nhiên, để hiện % giảm). Sửa tay ô nào thì các ô bên phải tính lại theo ô đó. Giá tại vườn và giá gốc chỉ quản trị thấy; giá sỉ công trình khách liên hệ báo giá.
                      {' '}Giá lẻ để <b>0</b> (bỏ trống các giá khác) = web hiện “Liên hệ báo giá” (khách gọi / Zalo hỏi giá, không đặt online). Tồn đầu kỳ là số đang có sẵn. <b>Xóa</b> quy cách: bấm Xóa rồi Lưu sản phẩm (tồn kho của quy cách đó bị hủy). Hàng nhập thêm sau này làm ở <Link href="/admin/nhap-hang" style={{ color: 'var(--primary)', fontWeight: 600 }}>Nhập hàng</Link> (Excel) hoặc nút “Nhập / Kiểm kê” ở trang Kho.</>}
                </small>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card__h">
                Thông số
                <a style={{ cursor: 'pointer' }} onClick={() => set('specs', [...v.specs, ['', '']])}>+ Thêm dòng</a>
              </div>
              <div className="ad-card__b">
                <datalist id="pf-spec-names">{specNames.map((n) => <option key={n} value={n} />)}</datalist>
                {v.specs.map(([k, val], i) => {
                  const upd = (pos: 0 | 1, s: string) => set('specs', v.specs.map((row, j) => (j === i ? (pos === 0 ? [s, row[1]] : [row[0], s]) : row)) as [string, string][]);
                  const pesticideReq = v.pesticide && PESTICIDE_SPECS.includes(k);
                  const required = pesticideReq || template.some((f) => f.required && f.name.toLowerCase() === k.trim().toLowerCase());
                  return (
                    <div key={i} className="ad-frow app-specrow">
                      <input className="vx-input" value={k} onChange={(e) => upd(0, e.target.value)} placeholder="Tên thông số" aria-label="Tên thông số" list="pf-spec-names" />
                      <input className="vx-input" value={val} onChange={(e) => upd(1, e.target.value)} placeholder={pesticideReq ? 'Bắt buộc với thuốc BVTV' : required ? 'Bắt buộc' : 'Giá trị'} aria-label={k || 'Giá trị'} style={required && !val.trim() ? { borderColor: 'var(--danger)' } : undefined} />
                      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => set('specs', v.specs.filter((_, j) => j !== i))} aria-label="Xóa dòng">✕</button>
                    </div>
                  );
                })}
                <span className="hint" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>
                  Các dòng điền sẵn theo danh mục “{cat?.name ?? v.category}”{cat?.subs.find((s) => s.slug === v.sub) ? ` › ${cat.subs.find((s) => s.slug === v.sub)!.name}` : ''}; dòng để trống sẽ không hiện trên web.
                  {template.some((f) => f.required) && <> Ô viền đỏ là bắt buộc.</>}
                </span>
                {v.pesticide && (
                  <span className="hint" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>
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
                <div className="vx-label-row">
                  <span>Không áp mã giảm giá</span>
                  <button type="button" className="vx-switch" role="switch" aria-checked={v.noVoucher} aria-label="Không áp mã giảm giá" onClick={() => set('noVoucher', !v.noVoucher)} />
                </div>
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card__h">Phân loại</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label htmlFor="pf-cat">Danh mục <i>*</i></label>
                  <Select id="pf-cat" className="vx-input" value={v.category} onChange={(e) => moveTo(e.target.value, v.sub)}>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug} disabled={!c.subs.length}>
                        {c.name}{!c.subs.length ? ' (chưa có nhóm con)' : !c.active ? ' (đang ẩn)' : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="ad-f">
                  <label htmlFor="pf-sub">Nhóm con <i>*</i></label>
                  <Select id="pf-sub" className="vx-input" value={v.sub} onChange={(e) => moveTo(v.category, e.target.value)}>
                    {cat?.subs.map((s) => <option key={s.slug} value={s.slug}>{s.name}{!s.active ? ' (đang ẩn)' : ''}</option>)}
                  </Select>
                  {canEdit && <span className="hint"><Link href={`/admin/danh-muc/${v.category}`}>Sửa danh mục, nhóm con, bộ thông số</Link></span>}
                </div>
                {cat && cat.subs.length > 1 && (
                  <div className="ad-f">
                    <label>Hiện thêm ở nhóm</label>
                    <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                      {cat.subs.filter((s) => s.slug !== v.sub).map((s) => (
                        <button key={s.slug} type="button" className="vx-chip" aria-pressed={v.extraSubs.includes(s.slug)}
                          onClick={() => set('extraSubs', cat.subs.map((x) => x.slug).filter((k) => (k === s.slug ? !v.extraSubs.includes(k) : v.extraSubs.includes(k))))}>
                          {s.name}{!s.active ? ' (đang ẩn)' : ''}
                        </button>
                      ))}
                    </span>
                    <span className="hint">Một cây có thể thuộc nhiều nhóm (vd. Kim tiền: cây văn phòng và cây ban công). Chọn được nhiều.</span>
                  </div>
                )}
                <div className="ad-f">
                  <label>Cách giao</label>
                  <span style={{ fontSize: '0.75rem' }}>{v.ship === 'plant' ? 'Cây sống — đóng khung chống dập, giao toàn quốc' : 'Vật tư — giao nhanh 2h'}</span>
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
        {canEdit && v.slug && <ProductDeleteButton slug={v.slug} name={v.name} after="/admin/san-pham" />}
        {canEdit && <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>}
      </div>
    </form>
  );
}
