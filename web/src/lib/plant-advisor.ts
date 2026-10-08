// Tư vấn chọn cây (/tu-van-chon-cay): câu hỏi theo loại không gian → các "chỗ cần cây" (vai trò, số lượng, chiều cao)
// → chọn cây đang bán khớp ánh sáng / vai trò / chiều cao / an toàn thú cưng / ngân sách.
// Hàm thuần dùng chung client/server: server dựng danh sách cây (toAdvisorPlant), trình duyệt tính phương án.
//
// Số liệu (mấy cây mỗi m², khoảng cách, chiều cao theo trần…) là quy tắc kinh nghiệm để ra phương án sơ bộ —
// kỹ sư chỉnh lại khi khảo sát. Muốn đổi thì sửa trong KINDS bên dưới.
import { snapOf, type CartSnap } from './cart-snap';
import type { IconName } from '@/components/Icon';
import { ELEMENTS, normalize, type ElementKey, type Product } from './catalog';
import { SUNS, type ServiceType } from './service-labels';

// ---- Danh sách giá trị (cũng là lựa chọn trong form sản phẩm admin, lưu ở products.attrs) ------------------

/** Mức ánh sáng, từ sáng nhất đến tối nhất. Cây chịu được "ram" thì cũng đặt được chỗ chỉ có đèn. */
export const LIGHTS = [
  { key: 'nang-gat', name: 'Nắng trực tiếp nhiều', hint: 'trên 4 giờ nắng / ngày' },
  { key: 'nang-nhe', name: 'Nắng nhẹ', hint: 'nắng sáng hoặc vài giờ' },
  { key: 'sang', name: 'Sáng, không nắng chiếu', hint: 'gần cửa sổ, ánh sáng tán xạ' },
  { key: 'ram', name: 'Ít sáng, bóng râm', hint: 'xa cửa sổ, hiên có mái' },
  { key: 'den', name: 'Chỉ có đèn điện', hint: 'phòng kín, máy lạnh' },
] as const;
export type LightKey = (typeof LIGHTS)[number]['key'];
const LIGHT_ORDER = LIGHTS.map((l) => l.key) as LightKey[];

/** Vai trò của cây trong bố cục. */
export const ROLES = [
  { key: 'de-ban', name: 'Để bàn, kệ' },
  { key: 'goc', name: 'Đặt sàn, góc phòng' },
  { key: 'treo', name: 'Treo, rủ' },
  { key: 'bon-hoa', name: 'Chậu hoa, lan can' },
  { key: 'leo', name: 'Dây leo, giàn' },
  { key: 'hang-rao', name: 'Hàng rào' },
  { key: 'bui', name: 'Bụi viền, thảm cây' },
  { key: 'co', name: 'Cỏ, phủ nền' },
  { key: 'bong-mat', name: 'Bóng mát, cây đường' },
  { key: 'an-trai', name: 'Cây ăn trái' },
] as const;
export type RoleKey = (typeof ROLES)[number]['key'];

export const CARE_LEVELS = [
  { key: 'de', name: 'Dễ chăm' },
  { key: 'vua', name: 'Trung bình' },
  { key: 'kho', name: 'Cần chăm kỹ' },
] as const;
export type CareKey = (typeof CARE_LEVELS)[number]['key'];

export const PET_SAFETY = [
  { key: 'an-toan', name: 'An toàn' },
  { key: 'doc', name: 'Có độc / gây ngứa' },
] as const;
export type PetKey = (typeof PET_SAFETY)[number]['key'];

export const advisorKeys = {
  anhSang: LIGHT_ORDER,
  vaiTro: ROLES.map((r) => r.key) as RoleKey[],
  cham: CARE_LEVELS.map((c) => c.key) as CareKey[],
  thuCung: PET_SAFETY.map((p) => p.key) as PetKey[],
};

// ---- Cây đang bán, rút gọn cho bộ tư vấn ---------------------------------------------------------

export type AdvisorOption = { label: string; price: number; /** Chiều cao cm [thấp, cao]; null = không đọc được. */ h: [number, number] | null; snap: CartSnap };

export type AdvisorPlant = {
  slug: string; name: string; image?: string; icon: string; category: string; sub: string; inStock: boolean;
  light: LightKey[]; roles: RoleKey[]; care?: CareKey; pet?: PetKey; wind?: boolean; menh: ElementKey[]; viTri: string[];
  options: AdvisorOption[];
  /** Đặc điểm do admin chọn (true) hay web tự đoán từ thông số chữ (false) — tự đoán thì xếp sau một chút. */
  known: { light: boolean; roles: boolean };
};

const specOf = (p: Product, ...names: string[]) => {
  const want = names.map(normalize);
  return p.specs.find(([k, v]) => want.includes(normalize(k)) && v.trim())?.[1] ?? '';
};

/** Đọc chiều cao (cm) từ chữ: "60–70cm", "1,2 - 1,5m", "Cao 1m2", "80cm". Không đọc được → null. */
export function parseHeight(text: string): [number, number] | null {
  const s = normalize(text).replace(/(\d+)m(\d{1,2})(?!\d)/g, (_, a, b) => `${a}.${b}m`).replace(/,/g, '.');
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:(cm|m)\s*)?(?:[–—-]|den)\s*(\d+(?:\.\d+)?)\s*(cm|m)\b/) ?? s.match(/(\d+(?:\.\d+)?)\s*(cm|m)\b/);
  if (!m) return null;
  let lo: number, hi: number;
  if (m.length === 5 && m[3] !== undefined && m[4] !== undefined) {
    const unitHi = m[4] === 'm' ? 100 : 1;
    const unitLo = m[2] ? (m[2] === 'm' ? 100 : 1) : unitHi;
    lo = Number(m[1]) * unitLo; hi = Number(m[3]) * unitHi;
  } else {
    lo = hi = Number(m[1]) * (m[2] === 'm' ? 100 : 1);
  }
  if (!(lo >= 3 && hi <= 3000 && lo <= hi)) return null;
  return [Math.round(lo), Math.round(hi)];
}

const SIZE_H: Record<string, [number, number]> = { mini: [10, 30], nho: [30, 60], vua: [60, 100], lon: [100, 150], 'cay-lon': [150, 300] };

/** Ánh sáng đoán từ thông số "Ánh sáng" (chữ tự do). */
function guessLight(text: string): LightKey[] {
  const s = normalize(text).replace(/(tranh|khong|han che|ne) nang[^,.;]*/g, ' ');
  const out = new Set<LightKey>();
  if (/nang gat|nang ca ngay|nang truc tiep|ua nang|toan phan|chiu nang|nang manh|nhieu nang/.test(s)) { out.add('nang-gat'); out.add('nang-nhe'); }
  if (/nang nhe|nang sang|ban phan|nang buoi sang|nang dip|nang/.test(s)) out.add('nang-nhe');
  if (/tan xa|sang|gian tiep|cua so/.test(s)) out.add('sang');
  if (/bong ram|ram|thieu sang|it sang|bong mat|chiu bong/.test(s)) out.add('ram');
  if (/\bden (dien|led|huynh quang)|anh den|may lanh|van phong/.test(s)) out.add('den');
  return LIGHT_ORDER.filter((l) => out.has(l));
}

const NAME_ROLES: [RegExp, RoleKey][] = [
  [/hoa giay|tigon|su quan tu|cat dang|bim bim|dau biec|thien ly|trau ba leo|day leo|gian leo/, 'leo'],
  [/chuoi ngoc|dam but|ac o|tram oi|hang rao|binh linh|cam thao/, 'hang-rao'],
  [/mat nai|cam tu mai|la gam|dua can|chieu tim|thao xanh|cay tham|ngu gia bi|mai chi thien/, 'bui'],
  [/buoi|\bcam\b|chanh|xoai|\bmit\b|\boi\b|\bman\b|sapo|\bnhan\b|vu sua|sau rieng|chom chom|\bkhe\b|me thai/, 'an-trai'],
  [/bang (dai loan|lang)|sao den|osaka|lim xet|phuong|giang huong|bang lang|me tay|so do|lat hoa|dau rai|chuong vang|muong hoang yen/, 'bong-mat'],
];

/** Vai trò đoán từ nhóm con, vị trí đặt, tên và chiều cao. */
function guessRoles(p: Product, hMax: number | null, outdoor: boolean): RoleKey[] {
  const out = new Set<RoleKey>();
  const name = normalize(p.name);
  for (const [re, role] of NAME_ROLES) if (re.test(name)) out.add(role);
  // "Cỏ nhật" và "Cọ Nhật" bỏ dấu giống nhau: chỉ coi là cỏ khi bán theo m², tấm, cuộn
  if (/^(co|tham co)\b/.test(name) && /m2|m²|tam|cuon/.test(normalize(p.unit))) return ['co'];
  if (p.attrs?.viTri?.includes('treo') || /chau treo|\btreo\b/.test(name)) out.add('treo');
  if (p.sub === 'cay-de-ban') out.add('de-ban');
  if (hMax != null) {
    if (hMax <= 45) out.add(outdoor ? 'bon-hoa' : 'de-ban');
    if (hMax <= 60 && (outdoor || p.attrs?.mau?.includes('co-hoa'))) out.add('bon-hoa');
    if (hMax >= 60 && hMax <= 260 && !out.has('treo')) out.add('goc');
    if (hMax >= 250 && outdoor) out.add('bong-mat');
  } else if (p.attrs?.kichThuoc) {
    if (['mini', 'nho'].includes(p.attrs.kichThuoc)) out.add(outdoor ? 'bon-hoa' : 'de-ban');
    else out.add('goc');
  }
  return [...out];
}

function guessCare(p: Product): CareKey | undefined {
  const level = normalize(specOf(p, 'Mức độ dễ chăm'));
  if (/\bkho\b|cham ky|cau ky/.test(level)) return 'kho';
  if (/\bde\b|chiu han/.test(level)) return 'de';
  if (/trung binh|\bvua\b/.test(level)) return 'vua';
  // Chưa ghi mức độ: tưới thưa (từ 1 tuần / lần) coi là dễ chăm. Không đọc chữ "khô" của "khi đất khô".
  return /2 tuan|1 tuan|10 ngay|chiu han|it tuoi/.test(normalize(specOf(p, 'Tưới nước'))) ? 'de' : undefined;
}

function guessPet(p: Product): PetKey | undefined {
  const s = normalize(specOf(p, 'An toàn thú cưng', 'An toàn cho thú cưng'));
  if (!s) return undefined;
  if (/^(khong|doc|co doc|gay ngua)/.test(s)) return 'doc';
  if (/^(co|an toan|lanh)/.test(s)) return 'an-toan';
  return undefined;
}

const OUTDOOR_SUBS = ['cay-san-vuon', 'cay-cong-trinh', 'cay-ban-cong'];

/** Sản phẩm → cây cho bộ tư vấn. Đặc điểm admin đã chọn (attrs) dùng thẳng, mục chưa chọn thì đoán từ thông số chữ. */
export function toAdvisorPlant(p: Product): AdvisorPlant {
  const a = p.attrs ?? {};
  const base = parseHeight(specOf(p, 'Chiều cao', 'Kích thước')) ?? parseHeight(p.spec) ?? (a.kichThuoc ? SIZE_H[a.kichThuoc] ?? null : null);
  const options: AdvisorOption[] = p.options.map((o, i) => ({ label: o.label, price: o.price, h: parseHeight(o.label) ?? base, snap: snapOf(p, i) }));
  const hMax = options.reduce<number | null>((m, o) => (o.h ? Math.max(m ?? 0, o.h[1]) : m), null);
  const outdoor = OUTDOOR_SUBS.includes(p.sub) || Boolean(a.viTri?.includes('ngoai-troi'));

  let light = (a.anhSang ?? []).filter((x): x is LightKey => LIGHT_ORDER.includes(x as LightKey));
  const lightKnown = light.length > 0;
  if (!lightKnown) {
    light = guessLight(specOf(p, 'Ánh sáng'));
    if (!light.length) {
      if (outdoor) light = ['nang-gat', 'nang-nhe'];
      else if (a.viTri?.includes('ban-cong')) light = ['nang-nhe', 'sang'];
      else if (a.viTri?.some((v) => v === 'trong-nha' || v === 'van-phong') || ['cay-trong-nha', 'cay-van-phong', 'cay-de-ban'].includes(p.sub)) light = ['sang'];
    }
  }
  const setRoles = (a.vaiTro ?? []).filter((x): x is RoleKey => advisorKeys.vaiTro.includes(x as RoleKey));
  return {
    slug: p.slug, name: p.name, image: p.images?.[0], icon: p.icon, category: p.category, sub: p.sub, inStock: p.inStock !== false,
    light,
    roles: setRoles.length ? setRoles : guessRoles(p, hMax, outdoor),
    care: (advisorKeys.cham.includes(a.cham as CareKey) ? a.cham as CareKey : undefined) ?? guessCare(p),
    pet: (advisorKeys.thuCung.includes(a.thuCung as PetKey) ? a.thuCung as PetKey : undefined) ?? guessPet(p),
    wind: a.chiuGio,
    menh: p.fengshui?.elements ?? [],
    viTri: a.viTri ?? [],
    options,
    known: { light: lightKnown, roles: setRoles.length > 0 },
  };
}

// ---- Câu hỏi --------------------------------------------------------------------------------------

export type ChoiceOpt = { key: string; name: string; hint?: string; /** Câu hỏi ánh sáng: mức ánh sáng của lựa chọn (mặc định = key). */ light?: LightKey; /** Ghi sẵn ô "Hướng / nắng" của form khảo sát. */ sun?: (typeof SUNS)[number] };
export type Answers = Record<string, number | string | string[]>;
type Cond = (a: Answers) => boolean;
export type Question =
  | { id: string; type: 'number'; label: string; hint?: string; unit: string; min: number; max: number; step?: number; def: number; showIf?: Cond }
  | { id: string; type: 'choice'; label: string; hint?: string; options: ChoiceOpt[]; def: string; showIf?: Cond }
  | { id: string; type: 'multi'; label: string; hint?: string; options: ChoiceOpt[]; def: string[]; showIf?: Cond };

export type Slot = {
  id: string; title: string; role: RoleKey | 'rau'; qty: number; unit: string;
  /** Chiều cao cây cần (cm); null = không xét (cỏ, hạt giống). */
  h: [number, number] | null;
  why: string;
  /** Chỗ này thường tối hơn chỗ khách tả (nhà tắm, chân cầu thang): lấy mức tối hơn trong hai mức. */
  lightCap?: LightKey;
  /** Chỗ gió mạnh (ban công tầng cao, sân thượng): ưu tiên cây đã ghi chịu gió. */
  wind?: boolean;
  /** Lấy sản phẩm trong danh mục khác thay vì cây cảnh (góc rau → hạt giống). */
  category?: string;
};
export type Zone = { key: string; title: string; note?: string; slots: Slot[] };

const num = (a: Answers, k: string) => Number(a[k]) || 0;
const str = (a: Answers, k: string) => String(a[k] ?? '');
const arr = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
const has = (k: string, v: string): Cond => (a) => arr(a, k).includes(v);

const CEILINGS: ChoiceOpt[] = [
  { key: '2.6', name: 'Thấp', hint: 'khoảng 2,6m' },
  { key: '2.8', name: 'Bình thường', hint: '2,7 – 3m' },
  { key: '3.2', name: 'Cao', hint: '3 – 3,5m' },
  { key: '4', name: 'Rất cao', hint: 'trên 3,5m, sảnh thông tầng' },
];
/** Cây trong nhà cao tối đa = trần trừ khoảng chừa cho ngọn phát triển. */
const underCeiling = (a: Answers, gap: number, cap: number) => Math.min(cap, Math.round((Number(a.ceiling) || 2.8) * 100 - gap));

export const SPACE_KINDS = ['de-ban', 'van-phong', 'trong-nha', 'ban-cong', 'san-vuon', 'cong-trinh'] as const;
export type SpaceKind = (typeof SPACE_KINDS)[number];

type KindDef = {
  name: string; hint: string; icon: IconName; sub: string;
  /** Dịch vụ + loại không gian ghi sẵn khi gửi phương án sang form khảo sát. */
  service: ServiceType; space: (a: Answers) => string | undefined; area?: (a: Answers) => number | undefined;
  /** Trường học… luôn chọn cây an toàn dù khách không đánh dấu trẻ nhỏ. */
  forceSafe?: (a: Answers) => boolean;
  /** Bán lẻ được ngay (thêm cả bộ vào giỏ là nút chính) hay nên khảo sát. */
  retail: boolean;
  questions: Question[];
  plan: (a: Answers) => Zone[];
};

export const KINDS: Record<SpaceKind, KindDef> = {
  'de-ban': {
    name: 'Cây để bàn', hint: 'Bàn làm việc, bàn học, quầy', icon: 'plant', sub: 'cay-de-ban', service: 'office', retail: true,
    space: () => 'Văn phòng',
    questions: [
      { id: 'desks', type: 'number', label: 'Cần đặt cây cho mấy bàn?', unit: 'bàn', min: 1, max: 300, def: 1 },
      {
        id: 'desk', type: 'choice', label: 'Mặt bàn cỡ nào?', def: 'vua', options: [
          { key: 'nho', name: 'Nhỏ', hint: 'dưới 1m' }, { key: 'vua', name: 'Vừa', hint: '1 – 1,4m' }, { key: 'lon', name: 'Lớn, bàn họp', hint: 'trên 1,4m' },
        ],
      },
      {
        id: 'light', type: 'choice', label: 'Chỗ đặt cây sáng cỡ nào?', def: 'sang', options: [
          { key: 'nang-nhe', name: 'Có nắng chiếu vào một lúc' }, { key: 'sang', name: 'Gần cửa sổ, sáng' },
          { key: 'ram', name: 'Xa cửa sổ, hơi tối' }, { key: 'den', name: 'Chỉ có đèn, máy lạnh cả ngày' },
        ],
      },
    ],
    plan: (a) => {
      const lon = str(a, 'desk') === 'lon';
      const h: [number, number] = str(a, 'desk') === 'nho' ? [10, 25] : lon ? [20, 40] : [15, 35];
      return [{
        key: 'ban', title: 'Mặt bàn', slots: [{
          id: 'de-ban', title: 'Cây để bàn', role: 'de-ban', qty: num(a, 'desks') * (lon ? 2 : 1), unit: 'chậu', h,
          why: `Cao tối đa ~40cm để không che mặt người ngồi đối diện; chậu gọn, đường kính khoảng 10–15cm.${lon ? ' Bàn lớn đặt 2 chậu ở hai đầu.' : ''}`,
        }],
      }];
    },
  },

  'van-phong': {
    name: 'Cây văn phòng', hint: 'Sảnh, khu làm việc, phòng họp', icon: 'trees', sub: 'cay-van-phong', service: 'office', retail: false,
    space: () => 'Văn phòng', area: (a) => num(a, 'area') || undefined,
    questions: [
      { id: 'area', type: 'number', label: 'Diện tích văn phòng', unit: 'm²', min: 5, max: 20000, def: 60 },
      { id: 'staff', type: 'number', label: 'Số nhân viên', hint: 'để tính cây để bàn; 0 nếu không cần', unit: 'người', min: 0, max: 5000, def: 10 },
      { id: 'ceiling', type: 'choice', label: 'Trần cao cỡ nào?', options: CEILINGS, def: '2.8' },
      {
        id: 'zones', type: 'multi', label: 'Cần đặt cây ở khu nào?', hint: 'chọn được nhiều', def: ['sanh', 'lam-viec'], options: [
          { key: 'sanh', name: 'Sảnh, lễ tân' }, { key: 'lam-viec', name: 'Khu làm việc chung' }, { key: 'hop', name: 'Phòng họp' },
          { key: 'gd', name: 'Phòng giám đốc' }, { key: 'pantry', name: 'Pantry, hành lang' },
        ],
      },
      { id: 'meetings', type: 'number', label: 'Số phòng họp', unit: 'phòng', min: 1, max: 50, def: 1, showIf: has('zones', 'hop') },
      { id: 'directors', type: 'number', label: 'Số phòng giám đốc', unit: 'phòng', min: 1, max: 50, def: 1, showIf: has('zones', 'gd') },
      {
        id: 'light', type: 'choice', label: 'Văn phòng sáng cỡ nào?', def: 'den', options: [
          { key: 'sang', name: 'Nhiều cửa kính, sáng tự nhiên' }, { key: 'den', name: 'Chủ yếu đèn, máy lạnh' }, { key: 'ram', name: 'Khá tối' },
        ],
      },
      {
        id: 'rent', type: 'choice', label: 'Bạn muốn thuê hay mua cây?', def: 'chua', options: [
          { key: 'thue', name: 'Thuê theo tháng', hint: 'shop thay cây, chăm định kỳ' }, { key: 'mua', name: 'Mua đứt' }, { key: 'chua', name: 'Chưa biết, cần tư vấn' },
        ],
      },
    ],
    plan: (a) => {
      const zones = arr(a, 'zones');
      const out: Zone[] = [];
      if (zones.includes('sanh')) out.push({
        key: 'sanh', title: 'Sảnh, lễ tân', slots: [
          { id: 'sanh-cap', title: 'Cặp cây hai bên cửa', role: 'goc', qty: 2, unit: 'chậu', h: [140, underCeiling(a, 60, 220)], why: 'Cặp cây cao đặt đối xứng hai bên cửa ra vào tạo điểm nhấn khi khách bước vào.' },
          { id: 'sanh-quay', title: 'Cây quầy lễ tân', role: 'de-ban', qty: 1, unit: 'chậu', h: [20, 40], why: 'Một chậu nhỏ trên quầy, không che mặt nhân viên lễ tân.' },
        ],
      });
      if (zones.includes('lam-viec')) {
        const work = num(a, 'area') * (zones.length > 1 ? 0.6 : 0.9);
        const slots: Slot[] = [{
          id: 'lv-san', title: 'Cây đặt sàn', role: 'goc', qty: Math.max(1, Math.round(work / 10)), unit: 'chậu', h: [80, underCeiling(a, 60, 160)],
          why: 'Khoảng 1 cây sàn cho mỗi 10m² khu làm việc; cao không quá 1,6m để không che tầm nhìn, đặt ở góc hoặc làm vách ngăn giữa các dãy bàn.',
        }];
        if (num(a, 'staff') > 0) slots.push({ id: 'lv-ban', title: 'Cây để bàn', role: 'de-ban', qty: Math.ceil(num(a, 'staff') / 2), unit: 'chậu', h: [15, 35], why: '1 chậu nhỏ cho mỗi 2 người ngồi cạnh nhau.' });
        out.push({ key: 'lam-viec', title: 'Khu làm việc chung', slots });
      }
      if (zones.includes('hop')) out.push({
        key: 'hop', title: `Phòng họp (${num(a, 'meetings')} phòng)`, slots: [
          { id: 'hop-goc', title: 'Cây góc phòng', role: 'goc', qty: 2 * num(a, 'meetings'), unit: 'chậu', h: [100, underCeiling(a, 60, 180)], why: '2 cây ở 2 góc trống mỗi phòng.' },
          { id: 'hop-ban', title: 'Cây giữa bàn họp', role: 'de-ban', qty: num(a, 'meetings'), unit: 'chậu', h: [15, 30], why: 'Thấp để người ngồi hai bên vẫn nhìn thấy nhau.' },
        ],
      });
      if (zones.includes('gd')) out.push({
        key: 'gd', title: `Phòng giám đốc (${num(a, 'directors')} phòng)`, slots: [
          { id: 'gd-goc', title: 'Cây góc phòng', role: 'goc', qty: num(a, 'directors'), unit: 'chậu', h: [120, underCeiling(a, 60, 200)], why: 'Một cây lớn dáng đẹp làm điểm nhấn.' },
          { id: 'gd-ban', title: 'Cây trên bàn', role: 'de-ban', qty: num(a, 'directors'), unit: 'chậu', h: [20, 40], why: 'Chậu nhỏ trên bàn làm việc hoặc bàn tiếp khách.' },
        ],
      });
      if (zones.includes('pantry')) out.push({
        key: 'pantry', title: 'Pantry, hành lang', slots: [
          { id: 'pantry', title: 'Cây đặt sàn nhỏ', role: 'goc', qty: 2, unit: 'chậu', h: [60, 120], lightCap: 'ram', why: 'Hành lang thường thiếu sáng: chọn cây chịu bóng, dáng gọn không vướng lối đi.' },
        ],
      });
      if (str(a, 'rent') === 'thue' && out.length) out[0].note = 'Bạn chọn thuê cây: giá bên dưới là giá mua tham khảo. Giá thuê tính theo tháng (đã gồm thay cây, chăm sóc), kỹ sư báo sau khảo sát.';
      return out;
    },
  },

  'trong-nha': {
    name: 'Cây trong nhà', hint: 'Phòng khách, phòng ngủ, bếp', icon: 'leaf', sub: 'cay-trong-nha', service: 'garden', retail: true,
    space: () => 'Khác',
    questions: [
      {
        id: 'rooms', type: 'multi', label: 'Muốn đặt cây ở đâu?', hint: 'chọn được nhiều', def: ['khach'], options: [
          { key: 'khach', name: 'Phòng khách' }, { key: 'ngu', name: 'Phòng ngủ' }, { key: 'bep', name: 'Bếp, phòng ăn' },
          { key: 'tam', name: 'Nhà tắm' }, { key: 'thang', name: 'Cầu thang, hành lang' }, { key: 'lamviec', name: 'Góc làm việc' },
        ],
      },
      { id: 'living', type: 'number', label: 'Phòng khách rộng khoảng', unit: 'm²', min: 5, max: 500, def: 25, showIf: has('rooms', 'khach') },
      { id: 'bedrooms', type: 'number', label: 'Số phòng ngủ cần cây', unit: 'phòng', min: 1, max: 10, def: 1, showIf: has('rooms', 'ngu') },
      { id: 'ceiling', type: 'choice', label: 'Trần nhà cao cỡ nào?', options: CEILINGS, def: '2.8' },
      {
        id: 'light', type: 'choice', label: 'Trong nhà sáng cỡ nào?', def: 'sang', options: [
          { key: 'nang-nhe', name: 'Có nắng chiếu vào' }, { key: 'sang', name: 'Sáng, gần cửa sổ / cửa kính' },
          { key: 'ram', name: 'Hơi tối, ít cửa sổ' }, { key: 'den', name: 'Gần như chỉ có đèn' },
        ],
      },
    ],
    plan: (a) => {
      const rooms = arr(a, 'rooms');
      const out: Zone[] = [];
      if (rooms.includes('khach')) out.push({
        key: 'khach', title: 'Phòng khách', slots: [
          { id: 'khach-goc', title: 'Cây góc lớn', role: 'goc', qty: num(a, 'living') >= 30 ? 2 : 1, unit: 'chậu', h: [100, underCeiling(a, 80, 200)], why: 'Đặt ở góc trống cạnh sofa hoặc kệ TV; cao bằng trần trừ 80cm–1m để ngọn còn chỗ phát triển.' },
          { id: 'khach-nho', title: 'Cây bàn trà, kệ', role: 'de-ban', qty: 1, unit: 'chậu', h: [20, 45], why: 'Một chậu nhỏ trên bàn trà hoặc kệ sách.' },
        ],
      });
      if (rooms.includes('ngu')) out.push({
        key: 'ngu', title: `Phòng ngủ (${num(a, 'bedrooms')} phòng)`, slots: [
          { id: 'ngu', title: 'Cây đầu giường, bàn trang điểm', role: 'de-ban', qty: num(a, 'bedrooms'), unit: 'chậu', h: [20, 60], why: 'Mỗi phòng 1 chậu (không nên quá 2), chọn cây lành, ít mùi hương.' },
        ],
      });
      if (rooms.includes('bep')) out.push({
        key: 'bep', title: 'Bếp, phòng ăn', slots: [
          { id: 'bep', title: 'Cây nhỏ cạnh cửa sổ', role: 'de-ban', qty: 1, unit: 'chậu', h: [15, 35], why: 'Đặt cạnh cửa sổ hoặc bàn ăn, tránh sát bếp nấu.' },
        ],
      });
      if (rooms.includes('tam')) out.push({
        key: 'tam', title: 'Nhà tắm', slots: [
          { id: 'tam', title: 'Cây ưa ẩm', role: 'de-ban', qty: 1, unit: 'chậu', h: [20, 50], lightCap: 'ram', why: 'Nhà tắm ẩm và ít sáng: chọn cây chịu bóng, thích độ ẩm cao.' },
        ],
      });
      if (rooms.includes('thang')) out.push({
        key: 'thang', title: 'Cầu thang, hành lang', slots: [
          { id: 'thang', title: 'Cây chân cầu thang', role: 'goc', qty: 1, unit: 'chậu', h: [80, 150], lightCap: 'ram', why: 'Chân cầu thang và cuối hành lang thường tối: chọn cây chịu bóng, dáng thẳng.' },
        ],
      });
      if (rooms.includes('lamviec')) out.push({
        key: 'lamviec', title: 'Góc làm việc', slots: [
          { id: 'lamviec', title: 'Cây để bàn', role: 'de-ban', qty: 1, unit: 'chậu', h: [15, 35], why: 'Chậu nhỏ cạnh màn hình, không che tầm nhìn.' },
        ],
      });
      return out;
    },
  },

  'ban-cong': {
    name: 'Cây ban công', hint: 'Ban công, lô gia, cửa sổ', icon: 'flower', sub: 'cay-ban-cong', service: 'garden', retail: true,
    space: () => 'Ban công chung cư',
    questions: [
      { id: 'length', type: 'number', label: 'Ban công dài bao nhiêu?', unit: 'm', min: 0.5, max: 50, step: 0.5, def: 3 },
      { id: 'depth', type: 'number', label: 'Sâu bao nhiêu (từ tường ra lan can)?', unit: 'm', min: 0.3, max: 10, step: 0.1, def: 1.2 },
      { id: 'floor', type: 'number', label: 'Nhà bạn ở tầng mấy?', unit: 'tầng', min: 1, max: 80, def: 5 },
      {
        id: 'light', type: 'choice', label: 'Ban công quay hướng nào?', def: 'dong', options: [
          { key: 'dong', name: 'Hướng Đông', hint: 'nắng sáng', light: 'nang-nhe', sun: 'Đông · nắng sáng' },
          { key: 'tay', name: 'Hướng Tây', hint: 'nắng chiều gắt', light: 'nang-gat', sun: 'Tây · nắng chiều' },
          { key: 'nam', name: 'Hướng Nam', hint: 'nắng cả ngày', light: 'nang-gat', sun: 'Nam · nắng cả ngày' },
          { key: 'bac', name: 'Hướng Bắc', hint: 'ít nắng', light: 'sang', sun: 'Bắc · ít nắng' },
          { key: 'mai', name: 'Có mái che, khá râm', light: 'ram' },
          { key: 'chua-ro', name: 'Không rõ hướng', light: 'nang-nhe', sun: 'Chưa rõ' },
        ],
      },
      {
        id: 'goals', type: 'multi', label: 'Bạn muốn ban công thế nào?', hint: 'chọn được nhiều', def: ['xanh'], options: [
          { key: 'xanh', name: 'Xanh mát, dễ chăm' }, { key: 'hoa', name: 'Nhiều hoa' }, { key: 'che', name: 'Che bớt nắng nóng' },
          { key: 'kin', name: 'Kín đáo, che tầm nhìn' }, { key: 'rau', name: 'Trồng rau, gia vị' },
        ],
      },
    ],
    plan: (a) => {
      const len = num(a, 'length'), depth = num(a, 'depth'), high = num(a, 'floor') >= 10, goals = arr(a, 'goals');
      const tall = high ? 150 : 180;
      const out: Zone[] = [];
      out.push({
        key: 'lan-can', title: 'Dọc lan can', note: high ? 'Tầng cao gió mạnh: đặt chậu phía trong lan can hoặc móc thật chắc, không treo chậu nặng ra ngoài.' : undefined,
        slots: [{
          id: 'lan-can', title: goals.includes('hoa') ? 'Chậu hoa lan can' : 'Chậu cây lan can', role: 'bon-hoa', qty: Math.max(1, Math.floor(len / 0.6)), unit: 'chậu', h: [20, 50], wind: high,
          why: 'Mỗi chậu cách nhau khoảng 50–60cm dọc lan can.',
        }],
      });
      if (goals.includes('che') || goals.includes('kin')) {
        out.push(high
          ? { key: 'che', title: 'Che nắng, che tầm nhìn', slots: [{ id: 'che', title: 'Hàng cây dáng thẳng', role: 'goc', qty: Math.max(1, Math.floor(len)), unit: 'chậu', h: [100, 150], wind: true, why: 'Tầng cao không nên làm giàn leo (gió dễ làm đổ giàn): dùng hàng cây chậu dáng thẳng cao 1–1,5m, cách nhau khoảng 1m.' }] }
          : { key: 'che', title: 'Giàn leo che nắng', slots: [{ id: 'leo', title: 'Dây leo', role: 'leo', qty: Math.ceil(len / 0.5), unit: 'cây', h: [50, 150], why: 'Làm giàn hoặc lưới, 1 gốc mỗi 40–50cm; sau 2–3 tháng phủ kín.' }] });
      }
      if (depth >= 1) out.push({
        key: 'goc', title: 'Góc ban công', slots: [depth >= 1.5
          ? { id: 'goc', title: 'Cây góc lớn', role: 'goc', qty: len >= 4 ? 2 : 1, unit: 'chậu', h: [120, tall], wind: high, why: `Ban công sâu từ 1,5m đặt được cây cao ${high ? '1,2–1,5m (tầng cao nên giới hạn 1,5m vì gió)' : '1,2–1,8m'} ở góc.` }
          : { id: 'goc', title: 'Cây góc vừa', role: 'goc', qty: 1, unit: 'chậu', h: [80, 120], wind: high, why: 'Ban công sâu 1–1,5m: một cây cao vừa phải ở góc, không chắn lối đi.' }],
      });
      if (len >= 2 && !high) out.push({
        key: 'treo', title: 'Chậu treo', slots: [{ id: 'treo', title: 'Cây treo, rủ', role: 'treo', qty: Math.max(1, Math.floor(len / 1.5)), unit: 'chậu', h: [20, 80], why: 'Treo dưới trần ban công, cách nhau khoảng 1,5m.' }],
      });
      if (goals.includes('rau')) out.push({
        key: 'rau', title: 'Góc rau, gia vị', note: 'Rau cần ít nhất 4 giờ nắng mỗi ngày.',
        slots: [{ id: 'rau', title: 'Hạt giống rau', role: 'rau', category: 'hat-giong', qty: Math.max(1, Math.round((len * Math.min(depth, 1)) / 0.5)), unit: 'thùng', h: null, why: 'Thùng xốp hoặc chậu chữ nhật khoảng 50×35cm, mỗi thùng một loại rau.' }],
      });
      if (depth < 1) out[0].note = [out[0].note, 'Ban công hẹp dưới 1m: chỉ nên dùng chậu lan can và chậu treo để còn lối đi.'].filter(Boolean).join(' ');
      return out;
    },
  },

  'san-vuon': {
    name: 'Cây sân vườn', hint: 'Sân trước, sân sau, sân thượng', icon: 'tree', sub: 'cay-san-vuon', service: 'garden', retail: false,
    space: (a) => (str(a, 'ground') === 'thuong' ? 'Sân thượng' : 'Sân vườn nhà phố'), area: (a) => num(a, 'area') || undefined,
    questions: [
      { id: 'area', type: 'number', label: 'Sân vườn rộng khoảng', unit: 'm²', min: 5, max: 100000, def: 50 },
      {
        id: 'ground', type: 'choice', label: 'Nền sân là gì?', def: 'dat', options: [
          { key: 'dat', name: 'Đất tự nhiên' }, { key: 'cung', name: 'Gạch, bê tông', hint: 'trồng chậu, bồn' }, { key: 'thuong', name: 'Sân thượng' },
        ],
      },
      {
        id: 'light', type: 'choice', label: 'Sân có nắng không?', def: 'nang-gat', options: [
          { key: 'nang-gat', name: 'Nắng cả ngày', sun: 'Nam · nắng cả ngày' }, { key: 'nang-nhe', name: 'Nắng nửa ngày' }, { key: 'ram', name: 'Bóng râm nhiều', hint: 'nhà cao che' },
        ],
      },
      {
        id: 'parts', type: 'multi', label: 'Muốn có những gì?', hint: 'chọn được nhiều', def: ['mat', 'co'], options: [
          { key: 'rao', name: 'Hàng rào cây' }, { key: 'mat', name: 'Cây bóng mát' }, { key: 'co', name: 'Thảm cỏ' },
          { key: 'loi', name: 'Viền lối đi, bồn hoa' }, { key: 'canh', name: 'Tiểu cảnh, góc nhấn' }, { key: 'trai', name: 'Cây ăn trái' },
        ],
      },
      { id: 'fence', type: 'number', label: 'Hàng rào dài bao nhiêu?', unit: 'm', min: 1, max: 5000, def: 10, showIf: has('parts', 'rao') },
      { id: 'lawn', type: 'number', label: 'Diện tích trồng cỏ', unit: 'm²', min: 1, max: 100000, def: 20, showIf: has('parts', 'co') },
      { id: 'path', type: 'number', label: 'Lối đi / bồn viền dài bao nhiêu?', unit: 'm', min: 1, max: 5000, def: 8, showIf: has('parts', 'loi') },
    ],
    plan: (a) => {
      const parts = arr(a, 'parts'), area = num(a, 'area'), roof = str(a, 'ground') === 'thuong';
      const out: Zone[] = [];
      if (parts.includes('rao')) out.push({
        key: 'rao', title: `Hàng rào (${num(a, 'fence')} m)`, slots: [{ id: 'rao', title: 'Cây hàng rào', role: 'hang-rao', qty: Math.ceil(num(a, 'fence') * 3.5), unit: 'cây', h: [60, 150], wind: roof, why: 'Trồng dày 3–4 cây mỗi mét; 6–12 tháng sau cắt xén thành hàng rào cao 1–1,5m.' }],
      });
      if (parts.includes('mat')) out.push({
        key: 'mat', title: 'Cây bóng mát',
        note: roof ? 'Sân thượng: trồng trong bồn sâu từ 60cm, chọn cây tán nhỏ, rễ không phá; kiểm tra chống thấm và tải trọng sàn trước khi trồng.' : undefined,
        slots: [{
          id: 'mat', title: 'Cây bóng mát', role: 'bong-mat', unit: 'cây', wind: roof,
          qty: roof ? Math.min(2, Math.max(1, Math.floor(area / 40))) : Math.min(50, Math.max(1, Math.floor(area / 30))),
          h: roof ? [150, 250] : [250, 400],
          why: roof ? 'Sân thượng nên giới hạn 1–2 cây, cao lúc trồng 1,5–2,5m.' : 'Khoảng 1 cây cho mỗi 25–40m²; trồng cách tường, móng nhà ít nhất 2–3m, tránh dây điện.',
        }],
      });
      if (parts.includes('co')) out.push({
        key: 'co', title: `Thảm cỏ (${num(a, 'lawn')} m²)`, slots: [{ id: 'co', title: 'Cỏ trồng', role: 'co', qty: Math.ceil(num(a, 'lawn') * 1.1), unit: 'm²', h: null, why: 'Tính thêm 10% hao hụt khi cắt ghép.' }],
      });
      if (parts.includes('loi')) out.push({
        key: 'loi', title: `Viền lối đi (${num(a, 'path')} m)`, slots: [{ id: 'loi', title: 'Cây bụi viền', role: 'bui', qty: Math.ceil(num(a, 'path') * 2 * 4), unit: 'bầu', h: [20, 50], why: 'Viền 2 bên lối đi, mỗi bên khoảng 4 cây mỗi mét.' }],
      });
      if (parts.includes('canh')) out.push({
        key: 'canh', title: 'Tiểu cảnh, góc nhấn', slots: [
          { id: 'canh-nhan', title: 'Cây điểm nhấn', role: 'goc', qty: 1, unit: 'cây', h: [100, 200], wind: roof, why: 'Một cây dáng đẹp làm tâm của góc tiểu cảnh.' },
          { id: 'canh-bui', title: 'Cây bụi thấp quanh gốc', role: 'bui', qty: 6, unit: 'bầu', h: [20, 40], why: 'Phủ quanh gốc cây điểm nhấn, kết hợp đá, sỏi.' },
        ],
      });
      if (parts.includes('trai')) out.push({
        key: 'trai', title: 'Cây ăn trái', slots: [{ id: 'trai', title: 'Cây ăn trái', role: 'an-trai', qty: roof ? 1 : Math.max(1, Math.floor(area / 40)), unit: 'cây', h: [100, 200], why: 'Trồng cách nhau 4–6m; chọn cây ghép để nhanh cho trái.' }],
      });
      if (str(a, 'ground') === 'cung' && out.length) out[0].note = [out[0].note, 'Nền gạch, bê tông: cây trồng trong chậu hoặc xây bồn.'].filter(Boolean).join(' ');
      return out;
    },
  },

  'cong-trinh': {
    name: 'Cây công trình', hint: 'Khu dân cư, trường học, nhà xưởng', icon: 'trees', sub: 'cay-cong-trinh', service: 'garden', retail: false,
    space: () => 'Sảnh, khu chung', area: (a) => num(a, 'shrub') + num(a, 'lawn') || undefined,
    forceSafe: (a) => str(a, 'type') === 'truong',
    questions: [
      {
        id: 'type', type: 'choice', label: 'Loại công trình', def: 'dan-cu', options: [
          { key: 'dan-cu', name: 'Khu dân cư, chung cư' }, { key: 'truong', name: 'Trường học, bệnh viện' },
          { key: 'xuong', name: 'Nhà xưởng, khu công nghiệp' }, { key: 'resort', name: 'Resort, khách sạn' }, { key: 'khac', name: 'Khác' },
        ],
      },
      { id: 'road', type: 'number', label: 'Đường cần trồng cây dài bao nhiêu?', hint: '0 nếu không có', unit: 'm', min: 0, max: 100000, def: 100 },
      {
        id: 'sides', type: 'choice', label: 'Trồng một bên hay hai bên đường?', def: 'hai', showIf: (a) => num(a, 'road') > 0,
        options: [{ key: 'mot', name: 'Một bên' }, { key: 'hai', name: 'Hai bên' }],
      },
      { id: 'shrub', type: 'number', label: 'Diện tích thảm cây bụi', hint: '0 nếu không có', unit: 'm²', min: 0, max: 100000, def: 50 },
      { id: 'lawn', type: 'number', label: 'Diện tích cỏ', hint: '0 nếu không có', unit: 'm²', min: 0, max: 1000000, def: 100 },
      { id: 'fence', type: 'number', label: 'Hàng rào cây dài bao nhiêu?', hint: '0 nếu không có', unit: 'm', min: 0, max: 100000, def: 0 },
      {
        id: 'light', type: 'choice', label: 'Khu vực có nắng không?', def: 'nang-gat', options: [
          { key: 'nang-gat', name: 'Ngoài trời, nắng nhiều' }, { key: 'nang-nhe', name: 'Có nhà cao che một phần' },
        ],
      },
    ],
    plan: (a) => {
      const out: Zone[] = [];
      const road = num(a, 'road');
      if (road > 0) out.push({
        key: 'duong', title: `Cây đường (${road} m)`, slots: [{
          id: 'duong', title: 'Cây bóng mát trồng đường', role: 'bong-mat', unit: 'cây', h: [300, 500],
          qty: (Math.floor(road / 7) + 1) * (str(a, 'sides') === 'mot' ? 1 : 2),
          why: 'Trồng cách nhau 6–8m; đường kính thân 8–15cm, bầu từ 60cm. Khoảng cách cuối cùng theo quy chuẩn của địa phương và bản vẽ.',
        }],
      });
      if (num(a, 'shrub') > 0) out.push({
        key: 'bui', title: `Thảm cây bụi (${num(a, 'shrub')} m²)`, slots: [{ id: 'bui', title: 'Cây bụi thảm', role: 'bui', qty: Math.ceil(num(a, 'shrub') * 25), unit: 'bầu', h: [20, 40], why: 'Mật độ khoảng 25 bầu mỗi m² (thay đổi theo loài).' }],
      });
      if (num(a, 'lawn') > 0) out.push({
        key: 'co', title: `Cỏ (${num(a, 'lawn')} m²)`, slots: [{ id: 'co', title: 'Cỏ trồng', role: 'co', qty: Math.ceil(num(a, 'lawn') * 1.1), unit: 'm²', h: null, why: 'Tính thêm 10% hao hụt.' }],
      });
      if (num(a, 'fence') > 0) out.push({
        key: 'rao', title: `Hàng rào (${num(a, 'fence')} m)`, slots: [{ id: 'rao', title: 'Cây hàng rào', role: 'hang-rao', qty: Math.ceil(num(a, 'fence') * 3.5), unit: 'cây', h: [60, 150], why: 'Trồng dày 3–4 cây mỗi mét.' }],
      });
      if (str(a, 'type') === 'truong' && out.length) out[0].note = 'Trường học, bệnh viện: chỉ chọn cây không gai, không nhựa độc.';
      return out;
    },
  },
};

/** Câu hỏi chung cho mọi loại không gian (bước 3). */
export const COMMON: Question[] = [
  {
    id: 'care', type: 'choice', label: 'Bạn có nhiều thời gian chăm cây không?', def: 'vua', options: [
      { key: 'it', name: 'Bận, ít thời gian', hint: '1–2 tuần mới tưới một lần' }, { key: 'vua', name: 'Tưới đều 2–3 lần mỗi tuần' }, { key: 'nhieu', name: 'Thích chăm, có nhiều thời gian' },
    ],
  },
  {
    id: 'pets', type: 'choice', label: 'Có trẻ nhỏ hoặc chó mèo hay nghịch cây không?', def: 'khong', options: [
      { key: 'khong', name: 'Không' }, { key: 'co', name: 'Có', hint: 'chỉ chọn cây an toàn' },
    ],
  },
  {
    id: 'tier', type: 'choice', label: 'Ngân sách', def: 'can-bang', options: [
      { key: 'tiet-kiem', name: 'Tiết kiệm', hint: 'cây nhỏ hơn, giá mềm' }, { key: 'can-bang', name: 'Vừa phải' }, { key: 'cao-cap', name: 'Cây đẹp, cỡ lớn' },
    ],
  },
  {
    id: 'menh', type: 'choice', label: 'Muốn chọn cây hợp mệnh?', hint: 'không bắt buộc', def: '', options: [
      { key: '', name: 'Không quan tâm' }, ...ELEMENTS.map((e) => ({ key: e.key, name: `Mệnh ${e.name}` })),
    ],
  },
];

export const TIERS = (COMMON.find((q) => q.id === 'tier') as Extract<Question, { type: 'choice' }>).options;
export type TierKey = 'tiet-kiem' | 'can-bang' | 'cao-cap';

export const visibleQuestions = (qs: Question[], a: Answers) => qs.filter((q) => !q.showIf || q.showIf(a));
export const defaults = (qs: Question[]): Answers => Object.fromEntries(qs.map((q) => [q.id, q.def]));

/** Sửa câu trả lời lạ (đọc lại từ bộ nhớ trình duyệt): số ngoài khoảng, lựa chọn không có → mặc định. */
export function cleanAnswers(qs: Question[], raw: Answers): Answers {
  const out: Answers = {};
  for (const q of qs) {
    const v = raw[q.id];
    if (q.type === 'number') { const n = Number(v); out[q.id] = Number.isFinite(n) ? Math.min(q.max, Math.max(q.min, n)) : q.def; }
    else if (q.type === 'choice') out[q.id] = q.options.some((o) => o.key === v) ? (v as string) : q.def;
    else out[q.id] = Array.isArray(v) ? v.filter((x) => q.options.some((o) => o.key === x)) : q.def;
  }
  return out;
}

const lightQ = (kind: SpaceKind) => KINDS[kind].questions.find((q) => q.id === 'light') as Extract<Question, { type: 'choice' }>;
const lightOf = (kind: SpaceKind, a: Answers): LightKey => {
  const o = lightQ(kind).options.find((x) => x.key === a.light);
  return o?.light ?? (o?.key as LightKey) ?? 'sang';
};
const darker = (a: LightKey, b: LightKey) => (LIGHT_ORDER.indexOf(a) >= LIGHT_ORDER.indexOf(b) ? a : b);
const lightOk = (plant: LightKey[], want: LightKey) => plant.includes(want) || (want === 'den' && plant.includes('ram'));
/** Lệch một mức (cây ưa sáng đặt chỗ hơi tối, hoặc ngược lại): vẫn gợi ý nhưng xếp sau và dặn thêm. */
function lightNear(plant: LightKey[], want: LightKey): string | null {
  const w = LIGHT_ORDER.indexOf(want);
  const idx = plant.map((l) => LIGHT_ORDER.indexOf(l));
  // Chỗ chỉ có đèn: cây ưa sáng tán xạ (kim tiền, monstera…) vẫn sống được nếu đưa ra chỗ sáng luân phiên
  if (idx.some((i) => i === w - 1 || (want === 'den' && i === w - 2))) {
    return want === 'den' ? 'Chỉ có đèn: nên đưa cây ra chỗ sáng 1–2 ngày mỗi tuần (thuê cây thì shop thay luân phiên)' : 'Chỗ này hơi tối với cây: đặt càng gần cửa sổ càng tốt';
  }
  if (idx.some((i) => i === w + 1)) return 'Nắng hơi gắt với cây: nên che lưới hoặc để chỗ có bóng buổi trưa';
  return null;
}

// ---- Chọn cây ------------------------------------------------------------------------------------

export type Pick = { plant: AdvisorPlant; option: number; price: number; h: [number, number] | null; notes: string[] };
export type SlotResult = Slot & { light: LightKey | null; picks: Pick[] };
export type ZoneResult = Omit<Zone, 'slots'> & { slots: SlotResult[] };
export type Ctx = { light: LightKey; care: string; safe: boolean; tier: TierKey; menh: string };

const overlap = (h: [number, number], want: [number, number]) => h[0] <= want[1] * 1.15 && h[1] >= want[0] * 0.8;

/** Tối đa 3 cây cho một chỗ, cây khớp nhất trước. `used` = cây đã đề xuất ở chỗ khác (bớt điểm để phương án đa dạng). */
export function pickFor(slot: Slot, ctx: Ctx, plants: AdvisorPlant[], used: Set<string>): Pick[] {
  const light = slot.lightCap ? darker(ctx.light, slot.lightCap) : ctx.light;
  const scored: (Pick & { score: number })[] = [];
  for (const p of plants) {
    if (p.category !== (slot.category ?? 'cay-canh')) continue;
    const notes: string[] = [];
    let score = 10;
    if (!slot.category) {
      if (!p.roles.includes(slot.role as RoleKey)) continue;
      if (p.light.length) {
        if (lightOk(p.light, light)) score += p.known.light ? 3 : 1;
        else { const near = lightNear(p.light, light); if (!near) continue; score -= 4; notes.push(near); }
      }
      else { score -= 3; notes.push('Chưa rõ nhu cầu ánh sáng, hỏi kỹ sư trước khi mua'); }
      if (!p.known.roles) score -= 1;
    }
    if (ctx.safe) {
      if (p.pet === 'doc') continue;
      if (p.pet === 'an-toan') score += 2; else { score -= 2; notes.push('Chưa ghi rõ có an toàn cho trẻ nhỏ, thú cưng'); }
    }
    if (slot.wind) { if (p.wind) score += 2; else if (p.wind === false) continue; }
    if (ctx.care === 'it') score += p.care === 'de' ? 3 : p.care === 'kho' ? -5 : 0;
    if (ctx.care === 'nhieu' && p.care === 'kho') score += 1;
    if (ctx.menh && p.menh.includes(ctx.menh as ElementKey)) { score += 2; notes.push(`Hợp mệnh ${ELEMENTS.find((e) => e.key === ctx.menh)?.name}`); }
    if (p.inStock) score += 3; else { score -= 6; notes.push('Đang hết hàng, shop sẽ báo ngày có cây'); }
    if (used.has(p.slug)) score -= 3;

    // Quy cách hợp chiều cao; chưa đọc được chiều cao thì vẫn nhận nhưng xếp sau
    const fits = p.options.map((o, i) => ({ o, i })).filter(({ o }) => !slot.h || !o.h || overlap(o.h, slot.h));
    if (!fits.length) continue;
    if (slot.h && fits.every(({ o }) => !o.h)) { score -= 2; notes.push('Chưa ghi chiều cao, hỏi kỹ sư cỡ cây'); }
    fits.sort((x, y) => x.o.price - y.o.price);
    const chosen = ctx.tier === 'tiet-kiem' ? fits[0] : ctx.tier === 'cao-cap' ? fits[fits.length - 1] : fits[Math.ceil((fits.length - 1) / 2)];
    scored.push({ plant: p, option: chosen.i, price: chosen.o.price, h: chosen.o.h, notes, score });
  }
  if (!scored.length) return [];
  // Ngân sách: cộng điểm theo vị trí giá trong nhóm cây hợp
  const prices = scored.map((s) => s.price).sort((x, y) => x - y);
  for (const s of scored) {
    const pct = prices.length > 1 ? prices.indexOf(s.price) / (prices.length - 1) : 0.5;
    s.score += ctx.tier === 'tiet-kiem' ? 3 * (1 - pct) : ctx.tier === 'cao-cap' ? 3 * pct : 3 * (1 - Math.abs(pct - 0.5) * 2);
  }
  scored.sort((x, y) => y.score - x.score || x.price - y.price || x.plant.name.localeCompare(y.plant.name, 'vi'));
  return scored.slice(0, 3).map(({ score: _s, ...pick }) => pick);
}

export function ctxOf(kind: SpaceKind, a: Answers): Ctx {
  return {
    light: lightOf(kind, a), care: str(a, 'care'), safe: str(a, 'pets') === 'co' || Boolean(KINDS[kind].forceSafe?.(a)),
    tier: (TIERS.some((t) => t.key === a.tier) ? a.tier : 'can-bang') as TierKey, menh: str(a, 'menh'),
  };
}

/** Phương án đầy đủ: các khu → các chỗ → cây đề xuất. */
export function buildPlan(kind: SpaceKind, a: Answers, plants: AdvisorPlant[]): ZoneResult[] {
  const ctx = ctxOf(kind, a);
  const used = new Set<string>();
  return KINDS[kind].plan(a).map((z) => ({
    ...z,
    slots: z.slots.filter((s) => s.qty > 0).map((s) => {
      const picks = pickFor(s, ctx, plants, used);
      if (picks[0]) used.add(picks[0].plant.slug);
      return { ...s, light: s.category ? null : s.lightCap ? darker(ctx.light, s.lightCap) : ctx.light, picks };
    }),
  })).filter((z) => z.slots.length);
}

// ---- Hiển thị, lưu phương án ---------------------------------------------------------------------

/** [120, 180] → "1,2–1,8m"; [20, 40] → "20–40cm". */
export function fmtHeight(h: [number, number]) {
  const m = (cm: number) => (cm / 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  if (h[0] >= 100) return h[0] === h[1] ? `${m(h[0])}m` : `${m(h[0])}–${m(h[1])}m`;
  return h[0] === h[1] ? `${h[0]}cm` : `${h[0]}–${h[1]}cm`;
}

export const lightName = (k: LightKey) => LIGHTS.find((l) => l.key === k)!.name;

/** Câu trả lời viết thành chữ để khách xem lại và kỹ sư đọc: "Ban công dài bao nhiêu?: 3 m". */
export function summarize(kind: SpaceKind, a: Answers): string[] {
  const lines = [`Không gian: ${KINDS[kind].name}`];
  for (const q of visibleQuestions([...KINDS[kind].questions, ...COMMON], a)) {
    const v = a[q.id];
    let text: string;
    if (q.type === 'number') text = `${Number(v).toLocaleString('vi-VN')} ${q.unit}`;
    else if (q.type === 'choice') { const o = q.options.find((x) => x.key === v); if (!o || (q.id === 'menh' && !o.key)) continue; text = o.hint ? `${o.name} (${o.hint})` : o.name; }
    else text = q.options.filter((o) => (v as string[]).includes(o.key)).map((o) => o.name).join(', ') || '—';
    lines.push(`${q.label.replace(/\?$/, '')}: ${text}`);
  }
  return lines;
}

/** Phương án gửi kèm yêu cầu khảo sát (lưu ở service_requests.plan). Giá là giá lúc khách xem — chỉ để tham khảo. */
export type PlanLine = { zone: string; title: string; qty: number; unit: string; height?: string; slug?: string; product?: string; option?: string; price?: number };
export type SavedPlan = { kind: SpaceKind; tier: TierKey; summary: string[]; lines: PlanLine[]; total: number };

export const PLAN_STORE_KEY = 'ccmt-advisor-plan';
export const ADVISOR_URL = '/tu-van-chon-cay';

export function toSavedPlan(kind: SpaceKind, a: Answers, zones: ZoneResult[], choice: Record<string, number>): SavedPlan {
  const lines: PlanLine[] = [];
  let total = 0;
  for (const z of zones) for (const s of z.slots) {
    const pk = s.picks[choice[s.id] ?? 0];
    const line: PlanLine = { zone: z.title, title: s.title, qty: s.qty, unit: s.unit, height: s.h ? fmtHeight(s.h) : undefined };
    if (pk) {
      Object.assign(line, { slug: pk.plant.slug, product: pk.plant.name, option: pk.plant.options[pk.option].label, price: pk.price });
      total += pk.price * s.qty;
    }
    lines.push(line);
  }
  return { kind, tier: ctxOf(kind, a).tier, summary: summarize(kind, a), lines, total };
}

/** Ghi sẵn các ô của form khảo sát từ phương án. */
export function quotePrefill(kind: SpaceKind, a: Answers) {
  const k = KINDS[kind];
  const sun = lightQ(kind).options.find((o) => o.key === a.light)?.sun;
  return { service: k.service, space: k.space(a), area: k.area?.(a), sun };
}
