// Công trình đã cung cấp cây (trang Đối tác sỉ /doi-tac) — dùng chung trình duyệt + server.
// Dữ liệu do chủ shop tự nhập ở /admin/du-an; web KHÔNG tự đặt ra dự án, tên khách hay số liệu.

import type { IconName } from '@/components/Icon';
import { imageUrl } from './images';

/** Loại công trình: lọc trên trang /doi-tac. Thêm loại mới = thêm 1 dòng (key không đổi sau khi đã dùng). */
export const PROJECT_TYPES = [
  { key: 'van-phong', name: 'Văn phòng & tòa nhà', icon: 'home' },
  { key: 'khu-do-thi', name: 'Khu đô thị & bất động sản', icon: 'trees' },
  { key: 'khach-san', name: 'Khách sạn, resort, nhà hàng', icon: 'star' },
  { key: 'du-lich', name: 'Khu du lịch sinh thái', icon: 'palm' },
  { key: 'nha-may', name: 'Nhà máy & khu công nghiệp', icon: 'box' },
  { key: 'cong-cong', name: 'Trường học, bệnh viện, công trình công cộng', icon: 'shield' },
  { key: 'canh-quan', name: 'Công viên, đường phố, cảnh quan', icon: 'tree' },
  { key: 'san-vuon', name: 'Biệt thự, nhà phố, sân vườn', icon: 'flower' },
  { key: 'cung-cap', name: 'Cung cấp cây cho nhà thầu', icon: 'truck' },
] as const satisfies readonly { key: string; name: string; icon: IconName }[];
export type ProjectType = (typeof PROJECT_TYPES)[number]['key'];
export const isProjectType = (k: unknown): k is ProjectType => PROJECT_TYPES.some((t) => t.key === k);
export const projectTypeOf = (k: string) => PROJECT_TYPES.find((t) => t.key === k) ?? PROJECT_TYPES[0];

/** Phần việc shop đã làm trong dự án (chọn nhiều). */
export const PROJECT_ROLES = [
  { key: 'tu-van', name: 'Tư vấn chọn cây' },
  { key: 'cung-cap', name: 'Cung cấp cây' },
  { key: 'thi-cong', name: 'Thi công trồng cây' },
  { key: 'cham-soc', name: 'Chăm sóc định kỳ' },
  { key: 'cho-thue', name: 'Cho thuê cây' },
] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number]['key'];
export const roleName = (k: string) => PROJECT_ROLES.find((r) => r.key === k)?.name ?? k;

export type ProjectImage = { file: string; caption: string };
export type ProjectMetric = { value: string; label: string };
export type ProjectQuote = { quote: string; name: string; title: string };

export const MAX_PROJECT_IMAGES = 12;
export const MAX_PROJECT_METRICS = 4;
export const MAX_PROJECT_SCOPE = 12;
export const MAX_PROJECT_PLANTS = 30;

export const PROJECT_IMAGE_FILE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
export const projectImageUrl = (file: string, slug?: string) => imageUrl('project-images', file, slug);
export const projectPath = (slug: string) => `/doi-tac/cong-trinh/${slug}`;

/** Thông tin dự án hiện trên web (đã bỏ cột nội bộ). */
export type Project = {
  id: number;
  slug: string;
  title: string;
  type: ProjectType;
  roles: ProjectRole[];
  client: string;
  clientLogo: string | null;
  location: string;
  /** null = chưa rõ năm. */
  year: number | null;
  duration: string;
  summary: string;
  body: string;
  scope: string[];
  plants: string[];
  metrics: ProjectMetric[];
  quote: ProjectQuote | null;
  images: ProjectImage[];
  featured: boolean;
  published: boolean;
};

/** Đoạn văn mô tả: cách nhau bằng dòng trống (hoặc xuống dòng). */
export const paragraphs = (s: string) => s.split(/\n\s*\n|\r?\n/).map((p) => p.trim()).filter(Boolean);

/** Có nội dung riêng đáng mở trang chi tiết (ảnh, mô tả, hạng mục, ý kiến khách) — không thì chỉ hiện một dòng trong bảng công trình. */
export const hasProjectDetail = (p: Pick<Project, 'images' | 'body' | 'scope' | 'quote'>) => p.images.length > 0 || !!p.body || p.scope.length > 0 || !!p.quote;

/** Khu vực (tỉnh / thành) theo thứ tự xuất hiện, kèm số công trình. */
export function regionsOf(projects: Pick<Project, 'location'>[]) {
  const m = new Map<string, number>();
  for (const p of projects) if (p.location) m.set(p.location, (m.get(p.location) ?? 0) + 1);
  return [...m].map(([name, n]) => ({ name, n }));
}
