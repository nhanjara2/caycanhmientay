// 34 tỉnh / thành phố theo địa giới hành chính mới (từ 01/07/2025), dùng cho ô chọn "Tỉnh / Thành phố" ở form địa chỉ.
// `old` = tên các tỉnh cũ đã sáp nhập vào đó: kết quả bản đồ (OpenStreetMap) và khách gõ tay vẫn hay dùng tên cũ.

export type Province = { name: string; old: string[] };

export const PROVINCES: Province[] = [
  { name: 'TP. Hà Nội', old: [] },
  { name: 'TP. Huế', old: ['Thừa Thiên Huế'] },
  { name: 'TP. Hải Phòng', old: ['Hải Dương'] },
  { name: 'TP. Đà Nẵng', old: ['Quảng Nam'] },
  { name: 'TP. Cần Thơ', old: ['Sóc Trăng', 'Hậu Giang'] },
  { name: 'TP. Hồ Chí Minh', old: ['Sài Gòn', 'TPHCM', 'Bình Dương', 'Bà Rịa - Vũng Tàu', 'Vũng Tàu', 'Ho Chi Minh City'] },
  { name: 'An Giang', old: ['Kiên Giang'] },
  { name: 'Bắc Ninh', old: ['Bắc Giang'] },
  { name: 'Cà Mau', old: ['Bạc Liêu'] },
  { name: 'Cao Bằng', old: [] },
  { name: 'Đắk Lắk', old: ['Phú Yên'] },
  { name: 'Điện Biên', old: [] },
  { name: 'Đồng Nai', old: ['Bình Phước'] },
  { name: 'Đồng Tháp', old: ['Tiền Giang'] },
  { name: 'Gia Lai', old: ['Bình Định'] },
  { name: 'Hà Tĩnh', old: [] },
  { name: 'Hưng Yên', old: ['Thái Bình'] },
  { name: 'Khánh Hòa', old: ['Ninh Thuận'] },
  { name: 'Lai Châu', old: [] },
  { name: 'Lâm Đồng', old: ['Đắk Nông', 'Bình Thuận'] },
  { name: 'Lạng Sơn', old: [] },
  { name: 'Lào Cai', old: ['Yên Bái'] },
  { name: 'Nghệ An', old: [] },
  { name: 'Ninh Bình', old: ['Hà Nam', 'Nam Định'] },
  { name: 'Phú Thọ', old: ['Vĩnh Phúc', 'Hòa Bình'] },
  { name: 'Quảng Ngãi', old: ['Kon Tum'] },
  { name: 'Quảng Ninh', old: [] },
  { name: 'Quảng Trị', old: ['Quảng Bình'] },
  { name: 'Sơn La', old: [] },
  { name: 'Tây Ninh', old: ['Long An'] },
  { name: 'Thái Nguyên', old: ['Bắc Kạn'] },
  { name: 'Thanh Hóa', old: [] },
  { name: 'Tuyên Quang', old: ['Hà Giang'] },
  { name: 'Vĩnh Long', old: ['Bến Tre', 'Trà Vinh'] },
];

/** Bỏ dấu, chữ thường, bỏ "Thành phố / Tỉnh / TP." — để so khớp "Thành phố Hồ Chí Minh" với "TP. Hồ Chí Minh". */
export const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/\b(thanh pho|tinh|tp)\b\.?/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

const INDEX = new Map<string, Province>();
for (const p of PROVINCES) {
  INDEX.set(norm(p.name), p);
  for (const o of p.old) INDEX.set(norm(o), p);
}

/** Tìm tỉnh / thành mới theo tên (kể cả tên cũ). Không khớp → null. */
export const matchProvince = (text: string) => INDEX.get(norm(text)) ?? null;

/** Chọn "Nơi khác" trong ô Tỉnh / Thành (khách tự gõ tên). */
export const OTHER_PROVINCE = '__other';

export type AddrParts = { street: string; ward: string; province: string; other: string };

/** "Phường Tân Phong, TP. Hồ Chí Minh" → phường + tỉnh/thành (tên tỉnh cũ được đổi sang tên mới). */
export function splitArea(area: string): Omit<AddrParts, 'street'> {
  const parts = area.split(',').map((s) => s.trim()).filter(Boolean);
  const last = parts.at(-1) ?? '';
  const p = last ? matchProvince(last) : null;
  if (p) return { ward: parts.slice(0, -1).join(', '), province: p.name, other: '' };
  if (parts.length >= 2) return { ward: parts.slice(0, -1).join(', '), province: OTHER_PROVINCE, other: last };
  return { ward: area.trim(), province: '', other: '' };
}

export const provinceText = (p: Pick<AddrParts, 'province' | 'other'>) => (p.province === OTHER_PROVINCE ? p.other.trim() : p.province);

/** "Phường Tân Phong, TP. Hồ Chí Minh" (cột `area` của địa chỉ). */
export const composeArea = (p: Pick<AddrParts, 'ward' | 'province' | 'other'>) => [p.ward.trim(), provinceText(p)].filter(Boolean).join(', ');

/** "25 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh". */
export const composeFull = (p: AddrParts) => [p.street.trim(), composeArea(p)].filter(Boolean).join(', ');

/** Đủ để giao hàng: có số nhà / đường và có tỉnh / thành. */
export const addrComplete = (p: AddrParts) => p.street.trim().length >= 3 && provinceText(p).length >= 2;
