// Kiểu dữ liệu và hàm thuần dùng chung cho server và client.
// Sản phẩm, danh mục nằm trong database — truy vấn qua src/server/catalog.ts, src/server/categories.ts (chỉ chạy trên server).
import type { IconName } from '@/components/Icon';
import type { ProductAttrs } from './product-filters';
import { plainText, slugify, SLUG_RE } from './slug';

/** Cách giao khác nhau: cây sống giao riêng bằng xe, vật tư giao nhanh. */
export type ShipGroup = 'plant' | 'supply';

/** Một dòng trong bộ thông số điền sẵn của danh mục / nhóm con. `required` = bắt buộc nhập khi lưu sản phẩm. */
export type SpecField = { name: string; required?: boolean };

/** Danh mục + nhóm con nằm trong database (bảng categories, subcategories) — đọc qua src/server/categories.ts. */
export type SubCategory = { slug: string; name: string; active: boolean; specs: SpecField[] };
export type Category = { slug: string; name: string; icon: IconName; active: boolean; specs: SpecField[]; subs: SubCategory[] };

/** Ngũ hành — mệnh hợp với cây. */
export const ELEMENTS = [
  { key: 'kim', name: 'Kim' }, { key: 'moc', name: 'Mộc' }, { key: 'thuy', name: 'Thủy' }, { key: 'hoa', name: 'Hỏa' }, { key: 'tho', name: 'Thổ' },
] as const;
export type ElementKey = (typeof ELEMENTS)[number]['key'];
export const elementName = (k: ElementKey) => ELEMENTS.find((e) => e.key === k)?.name ?? k;

/** Thông tin phong thủy (bỏ trống thì không hiện). */
export type FengShui = {
  elements: ElementKey[];
  /** Hợp tuổi, ví dụ "Tý, Thìn, Thân". */
  ages: string;
  meaning: string;
  /** Vị trí / hướng đặt. */
  placement: string;
};

/**
 * Quy cách bán. `price` = giá lẻ (giá bán), `oldPrice` = giá gạch ngang, `combo2` = giá 2 cây cùng quy cách.
 * Giá tại vườn / giá gốc không có ở đây — chỉ admin đọc (server/products-admin.ts).
 */
export type Unit = {
  /** Số thứ tự trong database — giỏ hàng, đơn, kho tham chiếu theo số này. KHÔNG phải vị trí trong mảng `options`: quy cách đã xóa để lại khoảng trống. */
  idx: number;
  label: string; price: number; oldPrice?: number; combo2?: number;
  /** Cây lớn / cồng kềnh: tính thêm phụ phí giao mỗi cây (Cài đặt giao hàng). */
  bulky?: boolean;
};

/** Quy cách theo số thứ tự database (`Unit.idx`); undefined khi quy cách đã bị xóa. */
export const optionOf = (p: { options: Unit[] }, idx: number) => p.options.find((o) => o.idx === idx);

/** Giá 0 = chưa có giá: hiện "Liên hệ báo giá", khách gọi / Zalo hỏi giá, không cho vào giỏ hay đặt online. */
export const isQuote = (u: Pick<Unit, 'price'>) => u.price <= 0;
export const QUOTE_TEXT = 'Liên hệ báo giá';

/** Vị trí trong mảng của quy cách rẻ nhất có giá (bỏ "Liên hệ báo giá"); không quy cách nào có giá thì 0. Thẻ sản phẩm hiện giá này, trang sản phẩm chọn sẵn quy cách này. */
export const cheapestOption = (options: Unit[]) =>
  options.reduce((b, o, i) => (!isQuote(o) && (isQuote(options[b]) || o.price < options[b].price) ? i : b), 0);

/** Thứ tự hiện quy cách ở trang sản phẩm: giá thấp → cao, "Liên hệ báo giá" cuối. Chỉ đổi thứ tự hiện —
 *  số thứ tự trong database giữ nguyên vì đơn hàng / giỏ hàng tham chiếu theo đó (vd. quy cách "Mini" gộp vào sau cỡ lớn). */
export const optionOrder = (options: Unit[]) =>
  options.map((_, i) => i).sort((a, b) => (isQuote(options[a]) ? 1 : 0) - (isQuote(options[b]) ? 1 : 0) || options[a].price - options[b].price);

export type Product = {
  slug: string;
  sku: string;
  name: string;
  /** Tên chi tiết (SEO) admin tự nhập; không có thì tạo tự động — đọc qua `seoNameOf` (lib/seo-name.ts). */
  seoName?: string;
  category: string;
  sub: string;
  /** Nhóm con phụ cùng danh mục — sản phẩm hiện ở cả `sub` lẫn các nhóm này. */
  extraSubs?: string[];
  icon: IconName;
  origin: string;
  ship: ShipGroup;
  /** Thuốc BVTV: giỏ hàng bắt buộc xác nhận đã đọc hướng dẫn an toàn. */
  pesticide?: boolean;
  /** Không áp mã giảm giá / miễn phí giao — không hiện vé voucher, tiền không tính vào tiền hàng xét mã. */
  noVoucher?: boolean;
  /** Đơn vị bán, "/ Chậu", "/ Chai"… — giá hiển thị luôn kèm đơn vị. */
  unit: string;
  options: Unit[];
  spec: string;
  lead: string;
  specs: [string, string][];
  rating: number;
  reviews: number;
  sold: number;
  flash?: { sold: number; total: number };
  keywords?: string[];
  /** Đường dẫn ảnh thật, ảnh đầu là ảnh đại diện. Không có thì hiện biểu tượng `icon`. */
  images?: string[];
  /** Video hướng dẫn trên YouTube (mã 11 ký tự). */
  youtubeId?: string;
  fengshui?: FengShui;
  /** Đặc điểm cây (vị trí đặt, kích thước, màu) cho bộ lọc trang danh mục; chưa gắn thì không lọc theo được. */
  attrs?: ProductAttrs;
  /** Còn hàng = ít nhất một quy cách còn tồn. Tính trên server. */
  inStock?: boolean;
  /** Đăng trong NEW_DAYS ngày gần đây → thẻ có nhãn "Mới" + viền xanh. Tính trên server. */
  isNew?: boolean;
  /** Sản phẩm đã có ảnh (mọi ảnh đều do shop tự chụp / tải lên) → sticker "Ảnh thật 100%". */
  realImg?: boolean;
};

/** Biểu tượng chọn được cho sản phẩm (hiện thay ảnh khi chưa có ảnh). Tên cũ đã lưu trong database phải giữ trong danh sách. */
export const PRODUCT_ICONS = [
  'plant', 'bonsai', 'leaf', 'flower', 'rose', 'cactus', 'tree', 'trees', 'palm', 'citrus', 'veggie', 'sprout',
  'spray', 'pest', 'bottle', 'flask', 'fertilizer', 'drop', 'pot', 'soil', 'terrarium', 'shovel', 'tool', 'autowater', 'gauge', 'box',
] as const satisfies readonly IconName[];

/** Biểu tượng chọn được cho danh mục (menu trái, trang chủ). */
export const CATEGORY_ICONS = [...PRODUCT_ICONS, 'home', 'gift', 'spark'] as const satisfies readonly IconName[];

/** Tên tiếng Việt của biểu tượng, hiện khi rê chuột / đọc màn hình ở ô chọn biểu tượng (admin). */
export const ICON_LABELS: Record<(typeof CATEGORY_ICONS)[number], string> = {
  plant: 'Chậu cây', bonsai: 'Bonsai', leaf: 'Lá', flower: 'Hoa – Lan', rose: 'Hoa hồng', cactus: 'Xương rồng – Sen đá',
  tree: 'Cây bóng mát', trees: 'Cây sân vườn', palm: 'Dừa – Cau', citrus: 'Cây ăn trái', veggie: 'Rau ăn lá', sprout: 'Mầm – Hạt giống',
  spray: 'Bình xịt thuốc', pest: 'Trừ sâu', bottle: 'Chai', flask: 'Bình thuốc', fertilizer: 'Bao phân', drop: 'Giọt nước',
  pot: 'Chậu', soil: 'Đất trồng', terrarium: 'Tiểu cảnh', shovel: 'Xẻng', tool: 'Dụng cụ', autowater: 'Tưới tự động',
  gauge: 'Đồng hồ đo', box: 'Thùng hàng', home: 'Nhà', gift: 'Quà', spark: 'Lấp lánh',
};

/**
 * Danh mục mà code dựa vào slug — đổi tên, biểu tượng, thứ tự, ẩn được nhưng không xóa được.
 * Giá trị = lý do, hiện ở trang admin Danh mục.
 */
export const SYSTEM_CATEGORIES: Record<string, string> = {
  'cay-canh': 'Có bộ lọc đặc điểm cây (vị trí đặt, kích thước, màu); danh mục mặc định của loại “Cây sống”.',
  'thuoc-bvtv': 'Danh mục mặc định của loại “Thuốc BVTV”.',
  'phan-bon': 'Nhập kho theo số lô + hạn dùng; danh mục mặc định của loại “Phân bón”.',
  'hat-giong': 'Nhập kho theo số lô + hạn dùng.',
  'chau': 'Danh mục mặc định của loại “Chậu – Vật tư”.',
};

/** Sản phẩm thuộc nhóm con (nhóm chính hoặc nhóm phụ). */
export const inSub = (p: Pick<Product, 'sub' | 'extraSubs'>, sub: string) => p.sub === sub || Boolean(p.extraSubs?.includes(sub));

export const findCategory = (list: Category[], slug: string) => list.find((c) => c.slug === slug);

/** Tên danh mục + nhóm con của sản phẩm (danh mục đã xóa thì trả về slug). */
export function categoryLabel(list: Category[], category: string, sub?: string) {
  const c = findCategory(list, category);
  return { cat: c?.name ?? category, sub: sub ? c?.subs.find((s) => s.slug === sub)?.name : undefined };
}

/**
 * Bộ thông số của sản phẩm trong danh mục + nhóm con: của danh mục trước, rồi thêm của nhóm con.
 * Trùng tên thì gộp làm một, bắt buộc nếu một trong hai bắt buộc.
 */
export function specTemplate(cat: Category | undefined, sub: string): SpecField[] {
  const out: SpecField[] = [];
  for (const f of [...(cat?.specs ?? []), ...(cat?.subs.find((s) => s.slug === sub)?.specs ?? [])]) {
    const same = out.find((x) => x.name.toLowerCase() === f.name.toLowerCase());
    if (same) same.required = same.required || f.required;
    else out.push({ ...f });
  }
  return out;
}

/**
 * Áp bộ thông số mới vào bảng thông số của sản phẩm: các dòng theo thứ tự bộ thông số trước (giữ giá trị đã nhập),
 * sau đó các dòng tự thêm có giá trị. Dòng trống không thuộc bộ mới bị bỏ.
 */
export function applySpecTemplate(rows: [string, string][], fields: SpecField[]): [string, string][] {
  const key = (s: string) => s.trim().toLowerCase();
  const names = new Set(fields.map((f) => key(f.name)));
  const value = (name: string) => rows.find(([k, v]) => key(k) === key(name) && v.trim())?.[1] ?? rows.find(([k]) => key(k) === key(name))?.[1] ?? '';
  return [
    ...fields.map((f): [string, string] => [f.name, value(f.name)]),
    ...rows.filter(([k, v]) => !names.has(key(k)) && (v.trim() || !k.trim())),
  ];
}

/** Tìm không phân biệt dấu: "tri nam" khớp "trị nấm". */
export const normalize = plainText;

/** "Cây nội thất" → "cay-noi-that" (đường dẫn danh mục / nhóm con) — quy ước chung ở lib/slug.ts. */
export const toSlug = (s: string, max = 60) => slugify(s, max);
export { SLUG_RE };

/** Tối đa ảnh mỗi sản phẩm (mỗi ảnh ~200–500KB sau khi nén). */
export const MAX_PRODUCT_IMAGES = 10;

export const productImageUrl = (file: string) => `/api/product-images/${file}`;

/** Lấy mã video từ link YouTube: youtu.be/…, watch?v=…, /shorts/…, /embed/…, /live/… hoặc dán thẳng mã. */
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1] ?? null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** Số ngày sản phẩm mới đăng được gắn nhãn "Mới". */
export const NEW_DAYS = 30;
/** 18 sản phẩm mẫu nạp lúc chuyển sang Supabase (26/09/2026 09:45 UTC) không tính là hàng mới. */
const SEED_BATCH_END = Date.parse('2026-09-26T10:00:00Z');
export const isNewProduct = (createdAt: Date, now = Date.now()) =>
  createdAt.getTime() > SEED_BATCH_END && now - createdAt.getTime() < NEW_DAYS * 86_400_000;

export const discountPct = (u: Pick<Unit, 'price' | 'oldPrice'>) => (u.oldPrice ? Math.round((1 - u.price / u.oldPrice) * 100) : 0);
