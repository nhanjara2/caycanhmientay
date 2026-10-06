// Mã SKU sản phẩm mới: <tiền tố theo danh mục>-<số thứ tự riêng của tiền tố>, ví dụ TH-90001, PB-90003.

/** Tiền tố của 9 danh mục mặc định (migration 0018). `MT` giữ nguyên cho cây cảnh vì dữ liệu mẫu đã dùng. */
const PREFIX: Record<string, string> = {
  'cay-canh': 'MT',
  'hat-giong': 'HG',
  'thuoc-bvtv': 'TH',
  'phan-bon': 'PB',
  'chau': 'CH',
  'dat-gia-the': 'DG',
  'trang-tri': 'TT',
  'dung-cu': 'DC',
  'thiet-bi': 'TB',
};

/** Danh mục admin tự tạo thì lấy chữ cái đầu của đường dẫn (`hoa-tuoi` → HT, `bonsai` → BO). */
export function skuPrefix(category: string): string {
  const known = PREFIX[category];
  if (known) return known;
  const words = category.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  const p = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 3) : (words[0] ?? '').slice(0, 2);
  return p.length >= 2 ? p : 'SP';
}

/** Số bắt đầu của mã tạo từ trang admin; mã dưới mốc này là dữ liệu mẫu đặt tay. */
const SKU_BASE = 90000;

/** Mã kế tiếp của một tiền tố: số lớn nhất đang có (từ mốc 90000 trở lên) + 1. */
export function nextSku(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = SKU_BASE;
  for (const s of existing) {
    const m = re.exec(s);
    if (m && Number(m[1]) > max) max = Number(m[1]);
  }
  return `${prefix}-${max + 1}`;
}
