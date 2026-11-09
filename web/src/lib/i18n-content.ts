import type { FengShui } from './catalog';
import type { PostBlock } from './posts';

/**
 * Bản tiếng Anh của dữ liệu trong database (cột `en` jsonb — products, categories, subcategories). Dịch bằng AI rồi
 * nạp qua migration (vd. drizzle/0085_ban_tieng_anh.sql); trang /en đọc bản này, thiếu ô nào thì dùng tiếng Việt.
 * Quy cách / đơn vị bán dịch bằng luật (dưới) vì lặp lại nhiều và theo mẫu.
 */
export type ProductEn = {
  name: string;
  lead?: string;
  spec?: string;
  specs?: [string, string][];
  fengshui?: Partial<Pick<FengShui, 'meaning' | 'placement' | 'ages'>>;
  body?: PostBlock[];
};

/** Chữ bản tiếng Anh của banner trang chủ (home_banners.en). */
export type BannerEn = { title?: string; subtitle?: string; cta?: string };

const UNIT: Record<string, string> = {
  'Chậu': 'pot', 'Cây': 'plant', 'Bộ': 'set', 'Bịch': 'bag', 'Hũ': 'jar', 'Túi': 'pack', 'Gói': 'pack', 'Bao': 'sack', 'Chai': 'bottle', 'Cái': 'piece',
};
export const unitEn = (u: string) => UNIT[u] ?? u;

const COLORS: Record<string, string> = { 'Đỏ': 'red', 'Hồng': 'pink', 'Vàng': 'yellow', 'Trắng': 'white', 'Cam': 'orange', 'Tím': 'purple', 'Xanh': 'green' };

/** "Cao 40–60cm" → "40–60cm tall", "Chậu C8 – Đỏ" → "Pot C8 – red", "Cỡ lớn" → "Large"… Không khớp mẫu nào thì giữ nguyên. */
export function optionLabelEn(label: string): string {
  let s = label.trim();
  const rules: [RegExp, string | ((...m: string[]) => string)][] = [
    [/^Cỡ tiêu chuẩn$/i, 'Standard size'], [/^Cỡ lớn$/i, 'Large'], [/^Cỡ nhỏ$/i, 'Small'], [/^Cỡ mini$/i, 'Mini'],
    [/^(\d+) thân$/i, (_, n) => `${n} stem${n === '1' ? '' : 's'}`],
    [/^Mini, cao (.+)$/i, (_, h) => `Mini, ${h} tall`],
    [/^Bầu, cao (.+)$/i, (_, h) => `Root ball, ${h} tall`],
    [/^Cao (.+)$/i, (_, h) => `${h} tall`],
    [/^Giỏ treo (.+)$/i, (_, h) => `Hanging basket ${h}`],
    [/^Bịch (.+)$/i, (_, h) => `Bag ${h}`], [/^Hũ (.+)$/i, (_, h) => `Jar ${h}`], [/^Túi (.+)$/i, (_, h) => `Pack ${h}`],
    [/^Dây dài (.+)$/i, (_, h) => `Trailing ${h}`],
  ];
  for (const [re, to] of rules) if (re.test(s)) { s = s.replace(re, to as never); break; }
  s = s.replace(/^Chậu /i, 'Pot ').replace(/\(miệng (\d+)cm\)/i, '($1cm rim)').replace(/kèm bình thủy tinh/i, 'with glass vase');
  s = s.replace(/– (Đỏ|Hồng|Vàng|Trắng|Cam|Tím|Xanh)$/u, (_, c: string) => `– ${COLORS[c]}`);
  return s.replace(/(\d),(\d)/g, '$1.$2');
}

/** Tên thông số tiếng Anh → tiếng Việt (code tra thông số theo tên tiếng Việt: thương hiệu, cách chăm…). */
export const SPEC_KEY_EN: Record<string, string> = {
  'Ánh sáng': 'Light', 'Tưới nước': 'Watering', 'Đất trồng': 'Soil', 'Bón phân': 'Feeding', 'Chiều cao': 'Height',
  'Nhiệt độ, độ ẩm': 'Temperature & humidity', 'Mức độ dễ chăm': 'Care level', 'Tốc độ sinh trưởng': 'Growth rate',
  'Kích thước trưởng thành': 'Mature size', 'An toàn thú cưng': 'Pet safety', 'Công dụng': 'Uses', 'Cách nhân giống': 'Propagation',
  'Nguồn gốc': 'Origin', 'Tên khoa học': 'Scientific name', 'Sâu bệnh thường gặp': 'Common pests & diseases', 'Phù hợp với ai': 'Best for',
  'Thành phần': 'Composition', 'Liều dùng': 'Dosage', 'Bón lại': 'Reapply', 'Phù hợp': 'Suitable for', 'Thương hiệu': 'Brand',
  'Hạn dùng': 'Shelf life', 'Thời gian nhả dinh dưỡng': 'Release period', 'Quy cách khác (liên hệ báo giá)': 'Other sizes (ask for a quote)',
};
const SPEC_KEY_VI = Object.fromEntries(Object.entries(SPEC_KEY_EN).map(([vi, en]) => [en, vi]));
/** Tên thông số (tiếng Anh hay tiếng Việt) → tên tiếng Việt. */
export const specKeyVi = (k: string) => SPEC_KEY_VI[k.trim()] ?? k;

/** Nơi xuất xứ thường gặp. */
const ORIGIN: Record<string, string> = { 'Việt Nam': 'Vietnam', 'Thái Lan': 'Thailand', 'Đài Loan': 'Taiwan', 'Nhật Bản': 'Japan', 'Hà Lan': 'Netherlands', 'Trung Quốc': 'China' };
export const originEn = (o: string) => ORIGIN[o] ?? o;
