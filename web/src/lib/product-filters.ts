// Bộ lọc sản phẩm trang danh mục (/danh-muc/...): danh sách giá trị, đọc/ghi đường dẫn, lọc và đếm.
// Hàm thuần — server lọc danh sách theo URL, client (components/ProductFilters.tsx) dùng lại đúng các hàm này để đếm trực tiếp.
//
// Luật lọc: trong cùng một nhóm chọn nhiều giá trị = khớp MỘT trong số đó (Trong nhà HOẶC Văn phòng);
// giữa các nhóm = khớp TẤT CẢ; nhóm "Khác" (giảm giá, còn hàng…) mỗi mục là một điều kiện riêng nên cũng phải khớp tất cả.
import { ELEMENTS, isSoldOut, normalize, type Product } from './catalog';

export type FilterOption = { key: string; name: string; /** Chấm màu cạnh chữ (nhóm Màu sắc). */ swatch?: string };

/** Đặc điểm cây do admin chọn (cột products.attrs). Giá trị là `key` trong các danh sách bên dưới.
 *  anhSang / vaiTro / cham / thuCung / chiuGio dùng cho trang Tư vấn chọn cây (danh sách ở lib/plant-advisor.ts). */
export type ProductAttrs = {
  viTri?: string[]; kichThuoc?: string; mau?: string[];
  anhSang?: string[]; vaiTro?: string[]; cham?: string; thuCung?: string; chiuGio?: boolean;
};

export const VI_TRI: FilterOption[] = [
  { key: 'trong-nha', name: 'Trong nhà' },
  { key: 'van-phong', name: 'Văn phòng, để bàn' },
  { key: 'ban-cong', name: 'Ban công, cửa sổ' },
  { key: 'ngoai-troi', name: 'Ngoài trời, sân vườn' },
  { key: 'treo', name: 'Treo, rủ' },
];

export const KICH_THUOC: FilterOption[] = [
  { key: 'mini', name: 'Mini (dưới 30cm)' },
  { key: 'nho', name: 'Nhỏ (30–60cm)' },
  { key: 'vua', name: 'Vừa (60–100cm)' },
  { key: 'lon', name: 'Lớn (100–150cm)' },
  { key: 'cay-lon', name: 'Cây lớn (trên 150cm)' },
];

export const MAU_SAC: FilterOption[] = [
  { key: 'xanh', name: 'Xanh lá', swatch: '#4caf50' },
  { key: 'xanh-dam', name: 'Xanh đậm', swatch: '#1b5e20' },
  { key: 'loang', name: 'Loang, đa sắc', swatch: 'linear-gradient(135deg, #66bb6a 50%, #fff176 50%)' },
  { key: 'do-hong', name: 'Đỏ, hồng', swatch: '#e57373' },
  { key: 'tim', name: 'Tím', swatch: '#8e5bb5' },
  { key: 'bac-trang', name: 'Bạc, trắng', swatch: '#cfd8dc' },
  { key: 'vang', name: 'Vàng', swatch: '#fbc02d' },
  { key: 'co-hoa', name: 'Có hoa', swatch: '#f48fb1' },
];

export const MENH: FilterOption[] = ELEMENTS.map((e) => ({ key: e.key, name: `Mệnh ${e.name}` }));

export const KHAC: FilterOption[] = [
  { key: 'giam-gia', name: 'Đang giảm giá' },
  { key: 'con-hang', name: 'Còn hàng' },
  { key: 'moi', name: 'Hàng mới' },
  { key: 'co-chau', name: 'Có chậu kèm' },
];

export const attrKeys = {
  viTri: VI_TRI.map((o) => o.key),
  kichThuoc: KICH_THUOC.map((o) => o.key),
  mau: MAU_SAC.map((o) => o.key),
};

// ---- Nhóm lọc ----------------------------------------------------------------------------------

export type FilterKey = 'vi-tri' | 'kich-thuoc' | 'mau' | 'menh' | 'khac' | 'nha-vuon';
export type Sel = Partial<Record<FilterKey, string[]>>;

/** Tên tham số trên đường dẫn chính là `key` của nhóm: ?vi-tri=trong-nha,van-phong&mau=xanh */
export const FILTER_KEYS: FilterKey[] = ['vi-tri', 'kich-thuoc', 'mau', 'menh', 'khac', 'nha-vuon'];

/** Nhóm lọc theo danh mục: cây cảnh có đủ bộ, các nhóm hàng khác chỉ có "Khác" + xuất xứ. */
export function groupsFor(category: string): FilterKey[] {
  return category === 'cay-canh' ? FILTER_KEYS : ['khac', 'nha-vuon'];
}

export function groupTitle(g: FilterKey, category: string) {
  switch (g) {
    case 'vi-tri': return 'Vị trí đặt';
    case 'kich-thuoc': return 'Kích thước';
    case 'mau': return 'Màu sắc';
    case 'menh': return 'Hợp mệnh';
    case 'khac': return 'Khác';
    case 'nha-vuon': return category === 'cay-canh' ? 'Nhà vườn' : 'Xuất xứ';
  }
}

/** Giá trị cố định của nhóm; riêng nhà vườn lấy từ sản phẩm (xem originOptions). */
export function staticOptions(g: FilterKey, category: string): FilterOption[] {
  switch (g) {
    case 'vi-tri': return VI_TRI;
    case 'kich-thuoc': return KICH_THUOC;
    case 'mau': return MAU_SAC;
    case 'menh': return MENH;
    case 'khac': return category === 'cay-canh' ? KHAC : KHAC.filter((o) => o.key !== 'co-chau');
    case 'nha-vuon': return [];
  }
}

export const originKey = (origin: string) => normalize(origin).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/** Nhà vườn / xuất xứ có trong danh mục, nhiều sản phẩm nhất xếp trước. */
export function originOptions(products: Product[]): FilterOption[] {
  const seen = new Map<string, { name: string; n: number }>();
  for (const p of products) {
    const key = originKey(p.origin);
    if (!key) continue;
    const e = seen.get(key);
    if (e) e.n++; else seen.set(key, { name: p.origin.trim(), n: 1 });
  }
  return [...seen].sort((a, b) => b[1].n - a[1].n || a[1].name.localeCompare(b[1].name, 'vi')).map(([key, v]) => ({ key, name: v.name }));
}

// ---- Dữ liệu rút gọn để lọc/đếm (gửi xuống trình duyệt, nhẹ hơn cả Product) ----------------------------

export type FacetItem = {
  vt: string[]; ks: string | null; mau: string[]; menh: string[];
  sale: boolean; stock: boolean; isNew: boolean; pot: boolean; nv: string;
};

/** Có quy cách bán kèm chậu ("Cây + chậu sứ", "Chậu sứ Ø15"…). "Chỉ cây (bầu)" thì không. */
const hasPot = (p: Product) => p.options.some((o) => /\bchau\b/.test(normalize(o.label)) && !/\bchi cay\b/.test(normalize(o.label)));

export const toFacet = (p: Product): FacetItem => ({
  vt: p.attrs?.viTri ?? [],
  ks: p.attrs?.kichThuoc ?? null,
  mau: p.attrs?.mau ?? [],
  menh: p.fengshui?.elements ?? [],
  sale: p.options.some((o) => o.oldPrice != null),
  stock: p.inStock !== false && !isSoldOut(p.options),
  isNew: Boolean(p.isNew),
  pot: hasPot(p),
  nv: originKey(p.origin),
});

const has = (f: FacetItem, g: FilterKey, key: string): boolean => {
  switch (g) {
    case 'vi-tri': return f.vt.includes(key);
    case 'kich-thuoc': return f.ks === key;
    case 'mau': return f.mau.includes(key);
    case 'menh': return f.menh.includes(key);
    case 'khac': return key === 'giam-gia' ? f.sale : key === 'con-hang' ? f.stock : key === 'moi' ? f.isNew : key === 'co-chau' ? f.pot : false;
    case 'nha-vuon': return f.nv === key;
  }
};

/** Nhóm "Khác": mỗi mục là điều kiện riêng → phải khớp tất cả. Các nhóm còn lại: khớp một trong số đã chọn. */
const matchGroup = (f: FacetItem, g: FilterKey, keys: string[]) =>
  g === 'khac' ? keys.every((k) => has(f, g, k)) : keys.some((k) => has(f, g, k));

/** Bỏ qua nhóm `skip` (dùng khi đếm số sản phẩm của từng giá trị trong chính nhóm đó). */
export function matches(f: FacetItem, sel: Sel, skip?: FilterKey): boolean {
  return FILTER_KEYS.every((g) => g === skip || !sel[g]?.length || matchGroup(f, g, sel[g]!));
}

/** Số sản phẩm sẽ có nếu chọn thêm giá trị `key` của nhóm `g` (giữ nguyên các lựa chọn hiện có). */
export function countWith(items: FacetItem[], sel: Sel, g: FilterKey, key: string): number {
  if (g === 'khac') {
    const next = { ...sel, khac: [...new Set([...(sel.khac ?? []), key])] };
    return items.filter((f) => matches(f, next)).length;
  }
  return items.filter((f) => matches(f, sel, g) && has(f, g, key)).length;
}

export const filterProducts = (products: Product[], sel: Sel) => products.filter((p) => matches(toFacet(p), sel));

export const selectedCount = (sel: Sel) => FILTER_KEYS.reduce((n, g) => n + (sel[g]?.length ?? 0), 0);

// ---- Đường dẫn ---------------------------------------------------------------------------------

type Params = Record<string, string | string[] | undefined>;

/** Đọc bộ lọc từ searchParams. Chỉ nhận giá trị hợp lệ của danh mục đó; nhóm không thuộc danh mục thì bỏ. */
export function parseSel(params: Params, allowed: FilterKey[], category = 'cay-canh'): Sel {
  const sel: Sel = {};
  for (const g of allowed) {
    const raw = params[g];
    const list = (Array.isArray(raw) ? raw : [raw]).flatMap((s) => (s ?? '').split(',')).map((s) => s.trim()).filter(Boolean);
    const valid = g === 'nha-vuon' ? list.filter((k) => /^[a-z0-9-]{1,40}$/.test(k)) : list.filter((k) => staticOptions(g, category).some((o) => o.key === k));
    if (valid.length) sel[g] = [...new Set(valid)].slice(0, 12);
  }
  return sel;
}

/** Thứ tự cố định của giá trị trong một nhóm (theo danh sách lọc; nhà vườn theo chữ cái) — chọn trước hay sau cũng ra một URL. */
function orderKeys(g: FilterKey, keys: string[]): string[] {
  if (g === 'nha-vuon') return [...keys].sort();
  const order = (g === 'khac' ? KHAC : staticOptions(g, 'cay-canh')).map((o) => o.key);
  return [...keys].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** Bộ lọc dạng chuẩn: nhà vườn phải có trong danh mục (`origins`), mọi nhóm xếp giá trị theo `orderKeys`. */
export function canonicalSel(sel: Sel, origins: FilterOption[]): Sel {
  const out: Sel = {};
  for (const g of FILTER_KEYS) {
    const keys = (sel[g] ?? []).filter((k) => g !== 'nha-vuon' || origins.some((o) => o.key === k));
    if (keys.length) out[g] = orderKeys(g, keys);
  }
  return out;
}

/** Tham số bộ lọc + sắp xếp theo thứ tự chuẩn: nhóm theo FILTER_KEYS, giá trị theo `orderKeys`, sap_xep cuối. */
export const queryPairs = (sel: Sel, sort?: string): [string, string | undefined][] => [
  ...FILTER_KEYS.filter((g) => sel[g]?.length).map((g): [string, string] => [g, orderKeys(g, sel[g]!).join(',')]),
  ['sap_xep', sort],
];

/** Chuỗi query (không có dấu ?) cho bộ lọc + sắp xếp; rỗng nếu không có gì. */
export function toQuery(sel: Sel, sort?: string): string {
  const q = new URLSearchParams();
  for (const [k, v] of queryPairs(sel, sort)) if (v) q.set(k, v);
  return q.toString().replace(/%2C/g, ',');
}

export const withQuery = (path: string, sel: Sel, sort?: string) => {
  const q = toQuery(sel, sort);
  return q ? `${path}?${q}` : path;
};

/** Bỏ một giá trị khỏi bộ lọc (nhãn ✕ trên trang). */
export function without(sel: Sel, g: FilterKey, key: string): Sel {
  const rest = (sel[g] ?? []).filter((k) => k !== key);
  return { ...sel, [g]: rest.length ? rest : undefined };
}
