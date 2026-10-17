// Tên chi tiết (SEO) của sản phẩm: dùng cho <title>, tiêu đề H1 trang sản phẩm và JSON-LD Product.
// Thẻ sản phẩm, menu, giỏ hàng vẫn dùng tên ngắn `name`.
//
// Công thức (cây cảnh): {Tên cây} ({tên gọi khác}) {vị trí đặt} – {công dụng / cách chăm}, phong thủy {ý nghĩa}, hợp mệnh {mệnh}
//   vd. "Cây kim tiền (Kim phát tài) để bàn, văn phòng, trong nhà – dễ chăm, chịu bóng, phong thủy tài lộc, hợp mệnh Mộc, Hỏa"
// Admin bấm "Tạo tự động" trong form sản phẩm để điền tên theo công thức rồi sửa lại; để trống thì web tự dùng tên tạo tự động.
// Hàm thuần — dùng chung server (trang sản phẩm) và client (form admin).
import { ELEMENTS, normalize, type Product } from './catalog';

/** Tên chi tiết tối đa (ký tự). Google chỉ hiện khoảng 60–65 ký tự đầu của <title>, nên phần quan trọng phải đứng đầu. */
export const SEO_NAME_MAX = 160;
/** Quá độ dài này thì form admin nhắc: Google cắt bớt trên kết quả tìm kiếm. */
export const SEO_TITLE_VISIBLE = 65;

export type SeoSource = Pick<Product, 'name' | 'category' | 'sub' | 'specs'> & {
  extraSubs?: string[];
  keywords?: string[];
  attrs?: { viTri?: string[]; anhSang?: string[]; vaiTro?: string[]; cham?: string | null; mau?: string[]; chiuGio?: boolean } | null;
  fengshui?: { elements: readonly string[]; meaning: string } | null;
};

/** Vị trí đặt, theo thứ tự hiện trong tên. Lấy từ "Vị trí đặt" (bộ lọc) và nhóm con / nhóm phụ của Cây cảnh. */
const PLACES: { name: string; keys: string[] }[] = [
  { name: 'để bàn', keys: ['cay-de-ban'] },
  { name: 'văn phòng', keys: ['van-phong', 'cay-van-phong'] },
  { name: 'trong nhà', keys: ['trong-nha', 'cay-trong-nha'] },
  { name: 'ban công', keys: ['ban-cong', 'cay-ban-cong'] },
  { name: 'sân vườn', keys: ['ngoai-troi', 'cay-san-vuon'] },
  { name: 'công trình', keys: ['cay-cong-trinh'] },
  { name: 'chậu treo', keys: ['treo'] },
];

/** Ý nghĩa phong thủy rút gọn, dò theo chữ (không dấu) trong "Ý nghĩa phong thủy". */
const MEANINGS: { name: string; re: RegExp }[] = [
  { name: 'tài lộc', re: /\btai loc\b|\btien tai\b|\bphu quy\b|\bthinh vuong\b|\bphat tai\b|\bgiau sang\b|\bloc\b/ },
  { name: 'may mắn', re: /\bmay man\b|\bcat tuong\b/ },
  { name: 'bình an', re: /\bbinh an\b|\bxua\b|\btran trach\b|\bbao ve\b|\btru ta\b|\btranh ta\b/ },
  { name: 'hạnh phúc', re: /\bhanh phuc\b|\btinh yeu\b|\bhon nhan\b|\bsum vay\b/ },
  { name: 'trường thọ', re: /\btruong tho\b|\bsuc khoe\b|\bbat tu\b|\btruong ton\b/ },
  { name: 'thăng tiến', re: /\bthang tien\b|\bthanh cong\b|\bsu nghiep\b|\bvuon len\b/ },
];

const specOf = (specs: [string, string][], name: string) => specs.find(([k]) => normalize(k) === normalize(name))?.[1] ?? '';
const hasAccent = (s: string) => /[^\x00-\x7f]/.test(s);

/** "Kim tiền" → "Cây kim tiền"; tên đã có "Cây" / "Cỏ" / "Bộ" (sản phẩm bộ) ở đầu thì giữ. */
function plantName(name: string) {
  const n = name.trim();
  if (/^(cây|cỏ|bộ|combo)\s/i.test(n)) return n[0].toUpperCase() + n.slice(1);
  return `Cây ${n[0].toLowerCase()}${n.slice(1)}`;
}

/** Tên gọi khác tiếng Việt đầu tiên không trùng tên chính (bỏ tên tiếng Anh / tên khoa học, tên cây đã gộp như "Kim tiền mini"). */
function alias(name: string, keywords: string[] = []) {
  const base = normalize(name).replace(/^cay /, '');
  return keywords.find((k) => {
    const n = normalize(k).replace(/^cay /, '');
    return hasAccent(k) && k.length <= 24 && !n.includes(base) && !base.includes(n);
  });
}

/** Công dụng / cách chăm nổi bật, tối đa 2 ý. */
function traits(s: SeoSource) {
  const a = s.attrs ?? {};
  const roles = a.vaiTro ?? [];
  const light = a.anhSang ?? [];
  const use = normalize(specOf(s.specs, 'Công dụng'));
  const care = normalize(specOf(s.specs, 'Mức độ dễ chăm'));
  const out: string[] = [];
  if (roles.includes('hang-rao')) out.push('làm hàng rào');
  if (roles.includes('bong-mat')) out.push('tạo bóng mát');
  if (roles.includes('leo')) out.push('leo giàn');
  if (roles.includes('an-trai')) out.push('cho trái');
  if (/loc khong khi/.test(use)) out.push('lọc không khí');
  if (a.cham === 'de' || /^(rat )?de cham/.test(care)) out.push('dễ chăm');
  if (light.includes('ram') || light.includes('den')) out.push('chịu bóng');
  else if (light.includes('nang-gat') || a.chiuGio) out.push('chịu nắng');
  if (a.mau?.includes('co-hoa')) out.push('hoa đẹp');
  return out.slice(0, 2);
}

/** Tên chi tiết theo công thức. Không phải cây cảnh thì trả lại tên ngắn (chưa có công thức). */
export function autoSeoName(s: SeoSource): string {
  if (!s.name.trim()) return '';
  if (s.category !== 'cay-canh') return s.name.trim();
  const keys = new Set([...(s.attrs?.viTri ?? []), s.sub, ...(s.extraSubs ?? [])]);
  const places = PLACES.filter((p) => p.keys.some((k) => keys.has(k))).map((p) => p.name).slice(0, 3);
  const other = alias(s.name, s.keywords);
  const head = `${plantName(s.name)}${other ? ` (${other})` : ''}${places.length ? ` ${places.join(', ')}` : ''}`;

  const meaning = normalize(s.fengshui?.meaning ?? '');
  const themes = MEANINGS.filter((m) => m.re.test(meaning)).map((m) => m.name).slice(0, 2);
  const elements = ELEMENTS.filter((e) => s.fengshui?.elements.includes(e.key)).map((e) => e.name);
  const tail = [
    ...traits(s),
    ...(themes.length ? [`phong thủy ${themes.join(', ')}`] : []),
    ...(elements.length ? [`hợp mệnh ${elements.join(', ')}`] : []),
  ];
  // quá dài thì bỏ bớt ý ở giữa (công dụng trước), giữ vị trí đặt + phong thủy
  const build = (t: string[]) => (t.length ? `${head} – ${t.join(', ')}` : head);
  while (tail.length && build(tail).length > SEO_NAME_MAX) tail.splice(tail.length > 2 ? 0 : tail.length - 1, 1);
  return build(tail).slice(0, SEO_NAME_MAX);
}

/** Tên chi tiết đang dùng: admin đã nhập thì lấy, không thì tạo tự động. */
export const seoNameOf = (p: SeoSource & { seoName?: string | null }) => p.seoName?.trim() || autoSeoName(p);
