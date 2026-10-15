// Thư viện bệnh cây: kiểu dữ liệu + danh mục (bộ phận, nguyên nhân, loại cây) dùng chung cho server và client.
// Bài bệnh nằm trong database — truy vấn qua src/server/diseases.ts.
import { normalize } from './catalog';
import { imageUrl } from './images';

/** Bộ phận của cây (thứ tự theo hình minh họa, từ ngọn xuống rễ). */
export const PARTS = [
  { key: 'hoa', name: 'Hoa' },
  { key: 'la', name: 'Lá' },
  { key: 'qua', name: 'Quả' },
  { key: 'than', name: 'Thân – Cành' },
  { key: 'goc', name: 'Gốc – Cổ rễ' },
  { key: 're', name: 'Rễ' },
  { key: 'toan-cay', name: 'Toàn cây' },
] as const;
export type PartKey = (typeof PARTS)[number]['key'];

/** Nhóm nguyên nhân; `warm` = tô màu cam (sâu, côn trùng, ngộ độc). */
export const CAUSES = [
  { key: 'nam', name: 'Nấm bệnh', hint: 'Đốm lá, thán thư, phấn trắng, thối rễ' },
  { key: 'vi-khuan', name: 'Vi khuẩn', hint: 'Cháy lá, thối nhũn, héo xanh' },
  { key: 'virus', name: 'Virus', hint: 'Khảm lá, xoăn lá, lùn cây' },
  { key: 'sau-hai', name: 'Sâu hại', hint: 'Sâu ăn lá, sâu đục thân', warm: true },
  { key: 'nhen-rep', name: 'Nhện – Rệp – Bọ trĩ', hint: 'Nhện đỏ, rệp sáp, bọ trĩ', warm: true },
  { key: 'tuyen-trung', name: 'Tuyến trùng', hint: 'Sưng rễ, u rễ' },
  { key: 'oc-sen', name: 'Ốc sên – Động vật', hint: 'Ốc sên, sên nhớt' },
  { key: 'dinh-duong', name: 'Thiếu dinh dưỡng', hint: 'Vàng lá, vàng gân, còi cọc' },
  { key: 'sinh-ly', name: 'Sinh lý – Môi trường', hint: 'Cháy nắng, thiếu nước, sốc' },
  { key: 'ngo-doc', name: 'Ngộ độc phân, thuốc', hint: 'Cháy rễ do bón quá liều', warm: true },
] as const;
export type CauseKey = (typeof CAUSES)[number]['key'];

/** Nhóm cây hay gặp bệnh — lọc trong danh sách. */
export const PLANTS = [
  { key: 'kieng-la', name: 'Kiểng lá' },
  { key: 'lan', name: 'Lan' },
  { key: 'sen-da', name: 'Sen đá – Xương rồng' },
  { key: 'hoa', name: 'Cây hoa' },
  { key: 'rau', name: 'Rau màu' },
  { key: 'an-trai', name: 'Cây ăn trái' },
] as const;
export type PlantKey = (typeof PLANTS)[number]['key'];

/** Ảnh minh họa triệu chứng: công khai, phục vụ qua /api/disease-images/[file]. */
export const diseaseImageUrl = (file: string, slug?: string) => imageUrl('disease-images', file, slug);
/** Tên file ảnh hợp lệ (hex ngẫu nhiên + đuôi) — khớp `isSafeName` ở server/uploads.ts. */
export const DISEASE_IMAGE_FILE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

export const SEVERITY = ['', 'Thấp', 'Trung bình', 'Khá cao', 'Cao', 'Rất cao'] as const;

export const partName = (k: string) => PARTS.find((p) => p.key === k)?.name ?? k;
export const causeOf = (k: string) => CAUSES.find((c) => c.key === k);
export const plantName = (k: string) => PLANTS.find((p) => p.key === k)?.name ?? k;
export const isPart = (k?: string): k is PartKey => PARTS.some((p) => p.key === k);
export const isCause = (k?: string): k is CauseKey => CAUSES.some((c) => c.key === k);
export const isPlant = (k?: string): k is PlantKey => PLANTS.some((p) => p.key === k);

export type Disease = {
  slug: string;
  name: string;
  /** Tên gọi khác, dùng khi tìm kiếm ("bồ hóng", "bù lạch"…). */
  aliases: string[];
  cause: CauseKey;
  parts: PartKey[];
  plants: PlantKey[];
  /** 1 (thấp) → 5 (rất cao). */
  severity: number;
  /** Lây lan qua đâu, ví dụ "Qua đất, nước". */
  spread: string;
  /** Mùa hay gặp, ví dụ "Mùa mưa". */
  season: string;
  /** Mô tả ngắn: bệnh là gì, vì sao bị. */
  summary: string;
  /** `image` = tên file ảnh minh họa trong disease_images (không bắt buộc). */
  symptoms: { part: PartKey; text: string; image?: string }[];
  /** Dễ nhầm với — `slug` (không bắt buộc) trỏ tới bài bệnh kia. */
  confusions: { name: string; text: string; slug?: string }[];
  steps: { title: string; detail: string }[];
  prevention: string[];
  /** Lưu ý an toàn khi xử lý (bỏ trống = không hiện). */
  safety: string;
  /** Sản phẩm xử lý (slug sản phẩm). */
  products: string[];
  active: boolean;
};

const haystack = (d: Disease) => normalize([
  d.name, ...d.aliases, d.summary, causeOf(d.cause)?.name ?? '', ...d.parts.map(partName),
  ...d.symptoms.map((s) => s.text), ...d.plants.map(plantName),
].join(' '));

/**
 * Điểm khớp khi tìm (không phân biệt dấu), 0 = không khớp. Mỗi từ phải khớp đầu một chữ ("la" khớp "lá", "lan");
 * khớp nguyên cụm trong tên/tên khác > khớp nguyên cụm ở triệu chứng > chỉ khớp từng từ.
 */
export function diseaseScore(d: Disease, q: string) {
  const phrase = normalize(q).replace(/\s+/g, ' ');
  const terms = phrase.split(' ').filter(Boolean);
  if (!terms.length) return 1;
  const hay = haystack(d);
  const words = hay.split(/[^a-z0-9]+/);
  if (!terms.every((t) => words.some((w) => w.startsWith(t)))) return 0;
  if (normalize([d.name, ...d.aliases].join(' ')).includes(phrase)) return 3;
  return hay.includes(phrase) ? 2 : 1;
}

export const matchesDisease = (d: Disease, q: string) => diseaseScore(d, q) > 0;
