// Kiểu dữ liệu, danh mục và hàm thuần dùng chung cho server và client.
// Sản phẩm nằm trong database — truy vấn qua src/server/catalog.ts (chỉ chạy trên server).
import type { IconName } from '@/components/Icon';

/** Cách giao khác nhau: cây sống giao riêng bằng xe, vật tư giao nhanh. */
export type ShipGroup = 'plant' | 'supply';

export type SubCategory = { slug: string; name: string };
export type Category = { slug: string; name: string; icon: IconName; subs: SubCategory[] };

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

export type Unit = { label: string; price: number; oldPrice?: number };

export type Product = {
  slug: string;
  sku: string;
  name: string;
  category: string;
  sub: string;
  icon: IconName;
  origin: string;
  ship: ShipGroup;
  /** Thuốc BVTV: giỏ hàng bắt buộc xác nhận đã đọc hướng dẫn an toàn. */
  pesticide?: boolean;
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
  /** Đăng trong NEW_DAYS ngày gần đây → thẻ có nhãn "Mới" + viền xanh. Tính trên server. */
  isNew?: boolean;
};

export const categories: Category[] = [
  {
    slug: 'cay-canh', name: 'Cây cảnh', icon: 'plant',
    subs: [
      { slug: 'cay-noi-that', name: 'Cây nội thất' },
      { slug: 'kieng-la', name: 'Kiểng lá' },
      { slug: 'sen-da-xuong-rong', name: 'Sen đá – Xương rồng' },
      { slug: 'lan', name: 'Lan' },
      { slug: 'bonsai', name: 'Bonsai' },
      { slug: 'cay-san-vuon', name: 'Cây sân vườn' },
    ],
  },
  {
    slug: 'hat-giong', name: 'Hạt giống – Cây giống', icon: 'sprout',
    subs: [
      { slug: 'hat-rau', name: 'Hạt giống rau' },
      { slug: 'hat-hoa', name: 'Hạt giống hoa' },
      { slug: 'cay-giong', name: 'Cây giống ăn trái' },
    ],
  },
  {
    slug: 'thuoc-bvtv', name: 'Thuốc BVTV', icon: 'flask',
    subs: [
      { slug: 'tru-sau', name: 'Thuốc trừ sâu' },
      { slug: 'tru-nam', name: 'Thuốc trừ nấm bệnh' },
      { slug: 'tru-nhen-rep', name: 'Thuốc trừ nhện – rệp – bọ trĩ' },
      { slug: 'tru-oc-sen', name: 'Thuốc trừ ốc sên' },
      { slug: 'sinh-hoc', name: 'Chế phẩm sinh học' },
    ],
  },
  {
    slug: 'phan-bon', name: 'Phân bón – Dinh dưỡng', icon: 'drop',
    subs: [
      { slug: 'phan-tan-cham', name: 'Phân tan chậm' },
      { slug: 'phan-bon-la', name: 'Phân bón lá' },
      { slug: 'huu-co', name: 'Phân hữu cơ' },
      { slug: 'kich-re', name: 'Kích rễ – Kích chồi' },
    ],
  },
  {
    slug: 'chau', name: 'Chậu – Phụ kiện chậu', icon: 'pot',
    subs: [
      { slug: 'chau-su', name: 'Chậu sứ' },
      { slug: 'chau-nhua', name: 'Chậu nhựa' },
      { slug: 'chau-tu-tuoi', name: 'Chậu tự tưới' },
    ],
  },
  {
    slug: 'dat-gia-the', name: 'Đất – Giá thể', icon: 'box',
    subs: [
      { slug: 'dat-tron-san', name: 'Đất trộn sẵn' },
      { slug: 'gia-the', name: 'Giá thể – Xơ dừa' },
    ],
  },
  { slug: 'trang-tri', name: 'Trang trí – Tiểu cảnh', icon: 'leaf', subs: [{ slug: 'tieu-canh', name: 'Tiểu cảnh' }] },
  { slug: 'dung-cu', name: 'Dụng cụ làm vườn', icon: 'tool', subs: [{ slug: 'keo-cat-tia', name: 'Kéo cắt tỉa' }, { slug: 'binh-tuoi', name: 'Bình tưới' }] },
  { slug: 'thiet-bi', name: 'Thiết bị – Công nghệ', icon: 'gauge', subs: [{ slug: 'tuoi-tu-dong', name: 'Tưới tự động' }] },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

/** Tìm không phân biệt dấu: "tri nam" khớp "trị nấm". */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

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

export const discountPct = (u: Unit) => (u.oldPrice ? Math.round((1 - u.price / u.oldPrice) * 100) : 0);
