// Banner trang chủ (/) — dùng chung trình duyệt + server. Chủ shop tự tải ảnh ở /admin/trang-chu.

/** Vị trí banner trên trang chủ. Thêm vị trí mới = thêm 1 dòng (key không đổi sau khi đã dùng). */
export const BANNER_SLOTS = [
  {
    key: 'top', name: 'Băng ảnh rộng trên cùng', max: 8,
    size: '1216 × 280 px', ratio: 4.34, mobile: { size: '720 × 300 px', ratio: 2.4 },
    hint: 'Băng ảnh rộng nằm trên cùng trang chủ (trên ảnh lớn), chạy vòng 6 giây. Mỗi ảnh kèm một nền riêng phủ kín cả khoảng phía sau — qua ảnh mới thì cả nền đổi theo, như Long Châu.',
  },
  {
    key: 'hero', name: 'Ảnh lớn đầu trang', max: 8,
    size: '1600 × 800 px (tỉ lệ 2:1)', ratio: 2, mobile: { size: '1200 × 900 px (4:3)', ratio: 4 / 3 },
    hint: 'Chạy vòng tự động, mỗi ảnh 6 giây. Ảnh sự kiện, mùa cây, chương trình giảm giá…',
  },
  {
    key: 'side', name: 'Ảnh nhỏ cạnh ảnh lớn', max: 2,
    size: '800 × 390 px (tỉ lệ 2:1)', ratio: 2.05, mobile: null,
    hint: 'Hai ô xếp chồng bên phải ảnh lớn (máy tính); điện thoại hiện thành hàng dưới ảnh lớn.',
  },
  {
    key: 'backdrop', name: 'Ảnh nền sự kiện', max: 4,
    size: '1920 × 900 px', ratio: 2.13, mobile: { size: '720 × 900 px', ratio: 0.8 },
    hint: 'Nền chung phủ kín bề ngang phía sau băng ảnh rộng và ảnh lớn — đổi theo mùa / sự kiện (Tết, Trung thu, mùa mưa…), dùng khi ảnh trên băng rộng chưa có nền riêng. Chỉ hiện 1 ảnh: ảnh đang bật xếp trên cùng.',
  },
  {
    key: 'event', name: 'Dải sự kiện giữa trang', max: 6,
    size: '1600 × 400 px (tỉ lệ 4:1)', ratio: 4, mobile: { size: '1200 × 600 px (2:1)', ratio: 2 },
    hint: 'Dải ảnh ngang giữa các khối sản phẩm: hội chợ, workshop, mùa cây Tết, chương trình đối tác…',
  },
] as const;
export type BannerSlot = (typeof BANNER_SLOTS)[number]['key'];
export const BANNER_SLOT_KEYS = BANNER_SLOTS.map((s) => s.key) as [BannerSlot, ...BannerSlot[]];
export const slotOf = (k: string) => BANNER_SLOTS.find((s) => s.key === k) ?? BANNER_SLOTS[0];

/** Chữ trên ảnh: trắng trên lớp phủ tối (ảnh sáng) hoặc không có chữ (ảnh đã thiết kế sẵn chữ). */
export type Banner = {
  id: number;
  slot: BannerSlot;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  /** Hiện tiêu đề / mô tả / nút đè lên ảnh. Tắt khi ảnh đã có sẵn chữ. */
  showText: boolean;
  image: string;
  /** Ảnh riêng cho điện thoại (tỉ lệ 4:3), không có thì cắt ảnh chính. */
  imageMobile: string | null;
  /** Nền riêng phía sau (chỉ băng ảnh rộng trên cùng): ảnh (máy tính / điện thoại) và / hoặc màu #rrggbb. */
  bgImage: string | null;
  bgImageMobile: string | null;
  bgColor: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  sort: number;
};

/**
 * Nền dựng sẵn phía sau khung đầu trang (`public/images/home-bg/`, máy tính 1920px + điện thoại 720×900).
 * Ảnh nào chưa có nền riêng và chưa có "Ảnh nền sự kiện" thì lấy lần lượt theo thứ tự ảnh — qua ảnh mới là nền đổi theo.
 */
const HOME_BG = ['la-xanh', 'bau-troi', 'le-hoi', 'xanh-duong'] as const;
export const homeBg = (n: (typeof HOME_BG)[number]) => ({ image: `/images/home-bg/${n}.webp`, imageMobile: `/images/home-bg/${n}-mb.webp` });
export const HOME_BACKGROUNDS = HOME_BG.map(homeBg);

export const BG_COLOR = /^#[0-9a-f]{6}$/i;
export const BANNER_IMAGE_FILE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
export const bannerImageUrl = (file: string) => `/api/banner-images/${file}`;

/** Link trong site (/…) hoặc web ngoài (https://…). */
export const isExternal = (href: string) => /^https?:\/\//.test(href);
