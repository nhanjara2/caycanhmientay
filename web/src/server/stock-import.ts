import 'server-only';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import { eq } from 'drizzle-orm';
import { normalize } from '@/lib/catalog';
import { expiryLevel, todayVN, tracksLots } from '@/lib/stock';
import { getCategories } from './categories';
import { db, schema } from './db';
import { listInventory, listStores, type InventoryTab } from './inventory';
import { findReceiptByHash, lastCosts, lockHash, receiveGoods, type ReceiptMeta } from './receipts';

const { products, productOptions } = schema;

/** Nhập hàng bằng Excel: tải file mẫu (đã điền sẵn SKU) → điền số lượng/giá nhập/lô/hạn → tải lên kiểm tra → xác nhận. Mỗi lần xác nhận tạo một phiếu nhập. */

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;
const MAX_QTY = 100_000;
const MAX_COST = 100_000_000;

const SHEET = 'Nhập hàng';
const GUIDE = 'Hướng dẫn';

/** Cột của file mẫu. Khi đọc file, cột được nhận theo tên (không theo vị trí) nên người dùng đổi thứ tự cột vẫn được. */
const COLS = {
  sku: 'Mã SKU',
  name: 'Sản phẩm',
  label: 'Quy cách',
  unit: 'Đơn vị',
  origin: 'Xuất xứ',
  category: 'Danh mục',
  stock: 'Tồn hiện tại',
  lastCost: 'Giá nhập gần nhất',
  lots: 'Theo lô',
  store: 'Cửa hàng nhập',
  qty: 'Số lượng nhập',
  cost: 'Giá nhập (đ/đơn vị)',
  lot: 'Số lô',
  expiry: 'Hạn dùng',
  note: 'Ghi chú',
} as const;
type ColKey = keyof typeof COLS;
const WIDTH: Record<ColKey, number> = { sku: 16, name: 40, label: 18, unit: 10, origin: 14, category: 16, stock: 13, lastCost: 16, lots: 10, store: 15, qty: 15, cost: 19, lot: 14, expiry: 14, note: 28 };
/** Cột người dùng điền (tiêu đề xanh); còn lại chỉ để xem, khi đọc file không dùng đến. */
const INPUT_COLS: ColKey[] = ['store', 'qty', 'cost', 'lot', 'expiry', 'note'];

/** Tên cột đem so khớp: bỏ dấu, bỏ dấu *, bỏ phần ghi chú trong ngoặc. */
const headKey = (s: string) => normalize(s).replace(/\(.*?\)|\*/g, '').replace(/\s+/g, ' ').trim();
const HEAD_TO_KEY = new Map(Object.entries(COLS).map(([k, v]) => [headKey(v), k as ColKey]));

export const skuKey = (sku: string, idx: number) => `${sku}-${idx + 1}`;

// ---- File mẫu --------------------------------------------------------------------------------

export type TemplateRow = {
  sku: string; idx: number; name: string; label: string; stock: number; pesticide: boolean; category: string;
  /** Đơn vị bán (Chậu, Chai…), xuất xứ, tên danh mục, giá nhập gần nhất — chỉ để xem trong file. */
  unit: string; origin: string; categoryName: string; lastCost: number | null;
};
type StoreRef = { id: number; code: string; name: string };

export async function buildStockTemplate(tab: Extract<InventoryTab, 'tat-ca' | 'duoi-muc'>) {
  const [stores, all, cats, costs] = await Promise.all([listStores(), listInventory({ tab }), getCategories(), lastCosts()]);
  const catName = new Map(cats.map((c) => [c.slug, c.name]));
  const rows = (tab === 'tat-ca' ? all.toSorted((a, b) => a.name.localeCompare(b.name, 'vi') || a.idx - b.idx) : all).map((r): TemplateRow => ({
    sku: r.sku, idx: r.idx, name: r.name, label: r.label, stock: r.stock, pesticide: r.pesticide, category: r.category,
    unit: r.unit, origin: r.origin, categoryName: catName.get(r.category) ?? r.category, lastCost: costs.get(`${r.slug}#${r.idx}`) ?? null,
  }));
  return renderStockTemplate(rows, stores);
}

const GRAY = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } } as const;

/** Dựng file Excel từ danh sách quy cách (tách riêng để kiểm thử không cần database). */
export async function renderStockTemplate(rows: TemplateRow[], stores: Pick<StoreRef, 'code' | 'name'>[]) {
  const defaultStore = stores[0]?.code ?? '';

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cây Cảnh Miền Tây';
  const ws = wb.addWorksheet(SHEET, { views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }] });
  const keys = Object.keys(COLS) as ColKey[];
  ws.columns = keys.map((k) => ({ header: COLS[k], key: k, width: WIDTH[k] }));

  const head = ws.getRow(1);
  head.height = 24;
  head.eachCell((c, n) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_COLS.includes(keys[n - 1]) ? 'FF1F6F43' : 'FF6B7280' } };
    c.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const listFormula = `"${stores.map((s) => s.code).join(',')}"`;
  rows.forEach((r) => {
    const lots = tracksLots(r);
    const row = ws.addRow({
      sku: skuKey(r.sku, r.idx), name: r.name, label: r.label, unit: r.unit, origin: r.origin, category: r.categoryName,
      stock: r.stock, lastCost: r.lastCost, lots: lots ? 'Có' : '',
      store: defaultStore, qty: null, cost: null, lot: null, expiry: null, note: null,
    });
    for (const k of ['sku', 'name', 'label', 'unit', 'origin', 'category', 'stock', 'lastCost', 'lots'] as const) {
      const c = row.getCell(k);
      c.font = { color: { argb: 'FF6B7280' } };
      c.fill = GRAY;
    }
    row.getCell('stock').alignment = { horizontal: 'right' };
    row.getCell('lastCost').numFmt = '#,##0';
    row.getCell('lots').font = { bold: true, color: { argb: 'FFB45309' } };
    row.getCell('qty').dataValidation = {
      type: 'whole', operator: 'between', formulae: [0, MAX_QTY], allowBlank: true, showErrorMessage: true,
      errorTitle: 'Số lượng nhập', error: `Nhập số nguyên từ 1 đến ${MAX_QTY.toLocaleString('vi-VN')}`,
    };
    row.getCell('cost').numFmt = '#,##0';
    row.getCell('cost').dataValidation = {
      type: 'whole', operator: 'between', formulae: [0, MAX_COST], allowBlank: true, showErrorMessage: true,
      errorTitle: 'Giá nhập', error: `Nhập số tiền nguyên (đồng) từ 0 đến ${MAX_COST.toLocaleString('vi-VN')}`,
    };
    if (listFormula.length <= 255) {
      row.getCell('store').dataValidation = {
        type: 'list', formulae: [listFormula], allowBlank: true, showErrorMessage: true,
        errorTitle: 'Cửa hàng nhập', error: `Chọn một trong: ${stores.map((s) => s.code).join(', ')}`,
      };
    }
    row.getCell('expiry').numFmt = 'dd/mm/yyyy';
    row.getCell('lot').numFmt = '@';
    // ô cần điền (lô bắt buộc) tô vàng nhạt để dễ thấy
    if (lots) for (const k of ['lot', 'expiry'] as const) row.getCell(k).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: keys.length } };

  const g = wb.addWorksheet(GUIDE);
  g.getColumn(1).width = 26;
  g.getColumn(2).width = 90;
  const lines: [string, string][] = [
    ['Cách dùng', 'Điền cột "Số lượng nhập" cho các mặt hàng cần nhập, rồi tải file lên ở trang Nhập hàng. Hệ thống kiểm tra trước, bạn xác nhận mới ghi vào kho. Mỗi lần xác nhận tạo một phiếu nhập (PN-xxxxx).'],
    ['Cột xám (chỉ để xem)', 'Mã SKU, Sản phẩm, Quy cách, Đơn vị, Xuất xứ, Danh mục, Tồn hiện tại, Giá nhập gần nhất, Theo lô. Không sửa: khi tải lên hệ thống không đọc các cột này (trừ Mã SKU). Muốn đổi Đơn vị / Xuất xứ thì sửa ở Sản phẩm.'],
    ['Mã SKU', 'Giữ nguyên, không sửa. Mỗi dòng là một quy cách của sản phẩm (mã dạng MT-90001-1).'],
    ['Số lượng nhập', 'Số nguyên dương, tính theo cột Đơn vị / Quy cách. Để trống (hoặc 0) = bỏ qua dòng đó. Không cần xóa các dòng không nhập.'],
    ['Giá nhập (đ/đơn vị)', 'Không bắt buộc. Giá nhập của 1 đơn vị (đồng), gõ 125000 hoặc 125.000. Dùng để ghi sổ phiếu nhập (tổng tiền hàng), không đổi giá bán.'],
    ['Cửa hàng nhập', `Mã cửa hàng nhận hàng. Để trống = ${defaultStore || 'cửa hàng mặc định'}. Các mã hợp lệ ở bảng bên dưới.`],
    ['Số lô, Hạn dùng', 'Bắt buộc với dòng có chữ "Có" ở cột Theo lô (thuốc BVTV, phân bón, hạt giống). Hạn dùng nhập dd/mm/yyyy hoặc mm/yyyy (mm/yyyy = ngày cuối tháng). Lô đã hết hạn không nhập kho.'],
    ['Ghi chú', 'Tùy chọn (số phiếu, ghi chú riêng của dòng…), tối đa 200 ký tự. Được ghi vào lịch sử kho. Nhà cung cấp và số chứng từ không điền ở đây mà điền ở màn hình tải lên.'],
    ['Nhập vào lô đã có', 'Nhập đúng Số lô + Hạn dùng đang có (cùng cửa hàng) thì số lượng được CỘNG THÊM vào lô đó. Nhập hàng không bao giờ làm mất tồn cũ; muốn đặt lại số đếm thực tế thì dùng Kiểm kê ở trang Kho.'],
    ['Lô hàng mới', 'Ghi Số lô hoặc Hạn dùng khác với các lô đang có: hệ thống tạo thêm một lô mới, lô cũ giữ nguyên. Hàng không theo lô (cây, chậu…) để trống Số lô và Hạn dùng.'],
    ['Sản phẩm chưa có', 'File này không tạo được sản phẩm. Vào Sản phẩm → Thêm mới, tạo xong (hàng theo lô thì để Tồn đầu kỳ = 0), rồi quay lại Nhập hàng TẢI LẠI FILE MẪU — file tải từ trước sẽ không có sản phẩm mới.'],
    ['Nhập trùng', 'Tải lại đúng nội dung đã nhập thì hệ thống cảnh báo và chỉ nhập khi bạn tích xác nhận. Cùng SKU + cửa hàng + lô + hạn xuất hiện 2 dòng thì số lượng cộng dồn (có cảnh báo).'],
    ['Lưu ý', 'Nếu có dòng lỗi thì không dòng nào được nhập. Sửa file rồi tải lại.'],
  ];
  lines.forEach(([a, b]) => {
    const row = g.addRow([a, b]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(1).alignment = { vertical: 'top', wrapText: true };
  });
  g.addRow(['', '']);
  const storeHead = g.addRow(['Mã cửa hàng', 'Tên cửa hàng']);
  storeHead.font = { bold: true };
  storeHead.eachCell((c) => { c.fill = GRAY; });
  for (const s of stores) g.addRow([s.code, s.name]).getCell(1).font = { bold: true };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---- Đọc & kiểm tra file ---------------------------------------------------------------------

export type ImportRow = {
  /** Số dòng trong file Excel (để báo lỗi). */
  row: number;
  sku: string;
  slug: string | null;
  idx: number | null;
  name: string | null;
  label: string | null;
  storeId: number | null;
  storeCode: string | null;
  qty: number | null;
  /** Giá nhập 1 đơn vị (đồng); null = không ghi. */
  unitCost: number | null;
  lotCode: string | null;
  expiry: string | null;
  note: string | null;
  errors: string[];
  warnings: string[];
};
export type ImportParse = { ok: true; rows: ImportRow[]; skipped: number } | { ok: false; error: string };

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if ('richText' in v) return v.richText.map((t) => t.text).join('').trim();
    if ('result' in v) return v.result === undefined || v.result === null ? '' : cellText(v.result as ExcelJS.CellValue);
    if ('text' in v) return String(v.text).trim();
    return '';
  }
  return String(v).trim();
}

/** Giá trị gốc của ô (số/ngày giữ nguyên kiểu), với công thức lấy kết quả. */
const raw = (v: ExcelJS.CellValue): string | number | Date | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && !(v instanceof Date)) {
    if ('result' in v) return raw(v.result as ExcelJS.CellValue);
    return cellText(v) || null;
  }
  return typeof v === 'boolean' ? String(v) : typeof v === 'string' ? v.trim() : v;
};

const ymd = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (y < 2000 || y > 2100 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
};

/** Hạn dùng: ô ngày của Excel, dd/mm/yyyy, yyyy-mm-dd, hoặc mm/yyyy (= ngày cuối tháng). null = không đọc được. */
function parseExpiry(v: string | number | Date): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : ymd(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  if (typeof v === 'number') return v > 20000 && v < 80000 ? parseExpiry(new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000)) : null;
  const s = v.trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) return ymd(+m[3], +m[2], +m[1]);
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return ymd(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[/.-](\d{4})$/))) {
    const month = +m[1];
    return month >= 1 && month <= 12 ? ymd(+m[2], month, new Date(Date.UTC(+m[2], month, 0)).getUTCDate()) : null;
  }
  return null;
}

/** Giá nhập: ô số, hoặc chữ "125000" / "125.000" / "125,000đ". Rỗng = không ghi giá. */
function parseCost(v: string | number | Date | null): { value: number | null; error?: string } {
  if (v === null || v === '') return { value: null };
  const bad = { value: null, error: 'Giá nhập phải là số tiền nguyên (đồng), ví dụ 125000 hoặc 125.000' };
  let n: number;
  if (typeof v === 'number') n = v;
  else if (typeof v === 'string') {
    const t = v.replace(/\s|đ|₫|vnd/gi, '');
    if (/^\d{1,3}([.,]\d{3})+$/.test(t)) n = Number(t.replace(/[.,]/g, ''));
    else if (/^\d+$/.test(t)) n = Number(t);
    else return bad;
  } else return bad;
  if (!Number.isInteger(n) || n < 0) return bad;
  if (n > MAX_COST) return { value: null, error: `Giá nhập tối đa ${MAX_COST.toLocaleString('vi-VN')}đ / đơn vị` };
  return { value: n };
}

export type OptionRef = { slug: string; sku: string; name: string; category: string; pesticide: boolean; idx: number; label: string };

export async function parseStockImport(buf: Buffer): Promise<ImportParse> {
  const [stores, opts] = await Promise.all([
    listStores(),
    db.select({ slug: products.slug, sku: products.sku, name: products.name, category: products.category, pesticide: products.pesticide, idx: productOptions.idx, label: productOptions.label })
      .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug)).where(eq(productOptions.deleted, false)),
  ]);
  return parseStockSheet(buf, stores, opts);
}

/** Đọc & kiểm tra từng dòng của file (tách riêng để kiểm thử không cần database). */
export async function parseStockSheet(buf: Buffer, stores: StoreRef[], opts: OptionRef[], today = todayVN()): Promise<ImportParse> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);
  } catch {
    return { ok: false, error: 'Không đọc được file. Hãy dùng file .xlsx (tải file mẫu ở bước 1).' };
  }
  const ws = wb.getWorksheet(SHEET) ?? wb.worksheets[0];
  if (!ws) return { ok: false, error: 'File không có trang tính nào' };

  // Tìm dòng tiêu đề trong 5 dòng đầu, nhận cột theo tên
  const col = new Map<ColKey, number>();
  let headRow = 0;
  for (let r = 1; r <= Math.min(5, ws.rowCount) && !headRow; r++) {
    const found = new Map<ColKey, number>();
    ws.getRow(r).eachCell((c, n) => { const k = HEAD_TO_KEY.get(headKey(cellText(c.value))); if (k && !found.has(k)) found.set(k, n); });
    if (found.has('sku') && found.has('qty')) { headRow = r; for (const [k, n] of found) col.set(k, n); }
  }
  if (!headRow) return { ok: false, error: 'Không thấy cột "Mã SKU" và "Số lượng nhập". Hãy dùng đúng file mẫu, đừng đổi tên cột.' };

  const bySku = new Map(opts.map((o) => [skuKey(o.sku, o.idx).toUpperCase(), o]));
  const byStore = new Map(stores.map((s) => [s.code.toUpperCase(), s]));

  const get = (row: ExcelJS.Row, k: ColKey) => { const n = col.get(k); return n ? raw(row.getCell(n).value) : null; };
  const text = (row: ExcelJS.Row, k: ColKey) => { const n = col.get(k); return n ? cellText(row.getCell(n).value) : ''; };

  const rows: ImportRow[] = [];
  const seen = new Map<string, number>();
  let skipped = 0;
  for (let r = headRow + 1; r <= ws.rowCount; r++) {
    const xr = ws.getRow(r);
    const sku = text(xr, 'sku');
    const qtyRaw = get(xr, 'qty');
    const costRaw = get(xr, 'cost');
    const lotCode = text(xr, 'lot').toUpperCase();
    const expiryRaw = get(xr, 'expiry');
    const note = text(xr, 'note');
    if (!sku && qtyRaw === null && costRaw === null && !lotCode && expiryRaw === null && !note) continue; // dòng trống

    const qtyEmpty = qtyRaw === null || qtyRaw === '' || qtyRaw === 0 || qtyRaw === '0';
    // Dòng chỉ có sẵn mã SKU/cửa hàng (không điền gì thêm) = không nhập
    if (qtyEmpty && !lotCode && (expiryRaw === null || expiryRaw === '') && (costRaw === null || costRaw === '') && !note) { skipped++; continue; }
    if (rows.length >= MAX_IMPORT_ROWS) return { ok: false, error: `File có quá ${MAX_IMPORT_ROWS} dòng cần nhập, hãy chia nhỏ` };

    const errors: string[] = [];
    const warnings: string[] = [];
    const o = bySku.get(sku.toUpperCase());
    if (!sku) errors.push('Thiếu Mã SKU');
    else if (!o) errors.push(`Mã SKU “${sku}” chưa có trong hệ thống. Sản phẩm mới: tạo ở Sản phẩm → Thêm mới rồi tải lại file mẫu; đừng sửa Mã SKU.`);

    let qty: number | null = null;
    if (qtyEmpty) errors.push('Thiếu Số lượng nhập (phải lớn hơn 0)');
    else if (typeof qtyRaw === 'number' ? Number.isInteger(qtyRaw) : typeof qtyRaw === 'string' && /^\d+$/.test(qtyRaw)) {
      qty = Number(qtyRaw);
      if (qty < 1 || qty > MAX_QTY) { errors.push(`Số lượng nhập phải từ 1 đến ${MAX_QTY.toLocaleString('vi-VN')}`); qty = null; }
    } else errors.push('Số lượng nhập phải là số nguyên dương');

    const cost = parseCost(costRaw);
    if (cost.error) errors.push(cost.error);

    const storeText = text(xr, 'store');
    let store = stores[0];
    if (storeText) {
      const s = byStore.get(storeText.toUpperCase());
      if (s) store = s; else errors.push(`Cửa hàng “${storeText}” không có (mã hợp lệ: ${stores.map((x) => x.code).join(', ')})`);
    }

    let expiry: string | null = null;
    if (expiryRaw !== null && expiryRaw !== '') {
      expiry = parseExpiry(expiryRaw);
      if (!expiry) errors.push('Hạn dùng chưa đúng (nhập dd/mm/yyyy hoặc mm/yyyy)');
      else if (expiry < today) { errors.push('Lô đã hết hạn, không nhập kho'); }
      else if (expiryLevel(expiry, today) === 'soon') warnings.push('Hạn dùng còn dưới 60 ngày');
    }
    if (lotCode.length > 40) errors.push('Số lô tối đa 40 ký tự');
    if (note.length > 200) errors.push('Ghi chú tối đa 200 ký tự');
    if (o && tracksLots(o)) {
      if (!lotCode) errors.push('Hàng có hạn dùng: cần Số lô');
      if (expiryRaw === null || expiryRaw === '') errors.push('Hàng có hạn dùng: cần Hạn dùng');
    }

    // Cùng quy cách + cửa hàng + lô + hạn xuất hiện nhiều dòng: vẫn nhập (cộng dồn) nhưng báo để người dùng soát lại
    if (o && store && qty) {
      const key = [o.slug, o.idx, store.id, lotCode, expiry ?? ''].join('|');
      const first = seen.get(key);
      if (first) warnings.push(`Cùng SKU, cửa hàng, lô và hạn với dòng ${first}: số lượng sẽ cộng dồn`);
      else seen.set(key, r);
    }

    rows.push({
      row: r, sku, slug: o?.slug ?? null, idx: o?.idx ?? null, name: o?.name ?? null, label: o?.label ?? null,
      storeId: store?.id ?? null, storeCode: store?.code ?? null, qty, unitCost: cost.value, lotCode: lotCode || null, expiry, note: note || null, errors, warnings,
    });
  }
  return { ok: true, rows, skipped };
}

// ---- Ghi vào kho -----------------------------------------------------------------------------

/** Dấu vân tay của bộ dòng sẽ nhập (không phụ thuộc thứ tự dòng, tên file hay việc file được lưu lại bằng Excel). */
export function linesHash(rows: ImportRow[]) {
  const keys = rows.map((r) => [r.slug, r.idx, r.storeId, r.qty, r.unitCost ?? '', r.lotCode ?? '', r.expiry ?? ''].join('|')).sort();
  return createHash('sha256').update(keys.join('\n')).digest('hex');
}

/** Phiếu trước đó đã nhập đúng bộ dòng này, nếu có. */
export async function findDuplicateImport(rows: ImportRow[]) {
  return rows.length ? findReceiptByHash(linesHash(rows)) : null;
}

export class DuplicateImportError extends Error {
  constructor(public code: string) { super(`Nội dung này đã được nhập ở phiếu ${code}`); }
}

export type ImportMeta = { supplier: string | null; docNo: string | null; note: string | null; fileName: string | null; allowDuplicate: boolean };

/** Ghi toàn bộ dòng hợp lệ thành một phiếu nhập trong một transaction: lỗi giữa chừng thì không dòng nào được nhập. */
export async function applyStockImport(rows: ImportRow[], actor: string, meta: ImportMeta) {
  const hash = linesHash(rows);
  const receipt: ReceiptMeta = { supplier: meta.supplier, docNo: meta.docNo, note: meta.note, source: 'excel', linesHash: hash, fileName: meta.fileName };
  const done = await db.transaction(async (tx) => {
    if (!meta.allowDuplicate) {
      await lockHash(tx, hash);
      const dup = await findReceiptByHash(hash, tx);
      if (dup) throw new DuplicateImportError(dup.code);
    }
    return receiveGoods(tx, rows.map((r) => ({
      slug: r.slug!, idx: r.idx!, storeId: r.storeId!, qty: r.qty!, unitCost: r.unitCost, lotCode: r.lotCode, expiry: r.expiry, note: r.note, ref: `Dòng ${r.row}`,
    })), receipt, actor);
  });
  return { code: done.code, lines: done.lines, units: done.units };
}
