import 'server-only';
import ExcelJS from 'exceljs';
import { eq } from 'drizzle-orm';
import { normalize } from '@/lib/catalog';
import { expiryLevel, todayVN, tracksLots } from '@/lib/stock';
import { db, schema } from './db';
import { applyStock, listInventory, listStores, type InventoryTab } from './inventory';

const { products, productOptions } = schema;

/** Nhập hàng bằng Excel: tải file mẫu (đã điền sẵn SKU) → điền số lượng/lô/hạn → tải lên kiểm tra → xác nhận. */

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;
const MAX_QTY = 100_000;

const SHEET = 'Nhập hàng';
const GUIDE = 'Hướng dẫn';

/** Cột của file mẫu. Khi đọc file, cột được nhận theo tên (không theo vị trí) nên người dùng đổi thứ tự cột vẫn được. */
const COLS = {
  sku: 'Mã SKU',
  name: 'Sản phẩm',
  label: 'Quy cách',
  stock: 'Tồn hiện tại',
  lots: 'Theo lô',
  store: 'Cửa hàng nhập',
  qty: 'Số lượng nhập',
  lot: 'Số lô',
  expiry: 'Hạn dùng',
  note: 'Ghi chú',
} as const;
type ColKey = keyof typeof COLS;
const WIDTH: Record<ColKey, number> = { sku: 16, name: 40, label: 18, stock: 13, lots: 10, store: 15, qty: 15, lot: 14, expiry: 14, note: 28 };

/** Tên cột đem so khớp: bỏ dấu, bỏ dấu *, bỏ phần ghi chú trong ngoặc. */
const headKey = (s: string) => normalize(s).replace(/\(.*?\)|\*/g, '').replace(/\s+/g, ' ').trim();
const HEAD_TO_KEY = new Map(Object.entries(COLS).map(([k, v]) => [headKey(v), k as ColKey]));

export const skuKey = (sku: string, idx: number) => `${sku}-${idx + 1}`;

// ---- File mẫu --------------------------------------------------------------------------------

export type TemplateRow = { sku: string; idx: number; name: string; label: string; stock: number; pesticide: boolean; category: string };
type StoreRef = { id: number; code: string; name: string };

export async function buildStockTemplate(tab: Extract<InventoryTab, 'tat-ca' | 'duoi-muc'>) {
  const [stores, all] = await Promise.all([listStores(), listInventory({ tab })]);
  const rows = tab === 'tat-ca' ? all.toSorted((a, b) => a.name.localeCompare(b.name, 'vi') || a.idx - b.idx) : all;
  return renderStockTemplate(rows, stores);
}

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
    const input = keys[n - 1] === 'store' || keys[n - 1] === 'qty' || keys[n - 1] === 'lot' || keys[n - 1] === 'expiry' || keys[n - 1] === 'note';
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: input ? 'FF1F6F43' : 'FF6B7280' } };
    c.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const listFormula = `"${stores.map((s) => s.code).join(',')}"`;
  rows.forEach((r) => {
    const lots = tracksLots(r);
    const row = ws.addRow({
      sku: skuKey(r.sku, r.idx), name: r.name, label: r.label, stock: r.stock, lots: lots ? 'Có' : '',
      store: defaultStore, qty: null, lot: null, expiry: null, note: null,
    });
    for (const k of ['sku', 'name', 'label', 'stock', 'lots'] as const) {
      const c = row.getCell(k);
      c.font = { color: { argb: 'FF6B7280' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    }
    row.getCell('stock').alignment = { horizontal: 'right' };
    row.getCell('lots').font = { bold: true, color: { argb: 'FFB45309' } };
    row.getCell('qty').dataValidation = {
      type: 'whole', operator: 'between', formulae: [0, MAX_QTY], allowBlank: true, showErrorMessage: true,
      errorTitle: 'Số lượng nhập', error: `Nhập số nguyên từ 1 đến ${MAX_QTY.toLocaleString('vi-VN')}`,
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
    ['Cách dùng', 'Điền cột "Số lượng nhập" cho các mặt hàng cần nhập, rồi tải file lên ở trang Nhập hàng. Hệ thống kiểm tra trước, bạn xác nhận mới ghi vào kho.'],
    ['Mã SKU', 'Giữ nguyên, không sửa. Mỗi dòng là một quy cách của sản phẩm (mã dạng MT-90001-1).'],
    ['Số lượng nhập', 'Số nguyên dương. Để trống (hoặc 0) = bỏ qua dòng đó. Không cần xóa các dòng không nhập.'],
    ['Cửa hàng nhập', `Mã cửa hàng nhận hàng. Để trống = ${defaultStore || 'cửa hàng mặc định'}. Các mã hợp lệ ở bảng bên dưới.`],
    ['Số lô, Hạn dùng', 'Bắt buộc với dòng có chữ "Có" ở cột Theo lô (thuốc BVTV, phân bón, hạt giống). Hạn dùng nhập dd/mm/yyyy hoặc mm/yyyy (mm/yyyy = ngày cuối tháng). Lô đã hết hạn không nhập kho.'],
    ['Ghi chú', 'Tùy chọn (nhà cung cấp, số phiếu…), tối đa 200 ký tự. Được ghi vào lịch sử kho.'],
    ['Lưu ý', 'Nếu có dòng lỗi thì không dòng nào được nhập. Sửa file rồi tải lại.'],
    ['', ''],
    ['Mã cửa hàng', 'Tên cửa hàng'],
    ...stores.map((s): [string, string] => [s.code, s.name]),
  ];
  lines.forEach(([a, b], i) => {
    const row = g.addRow([a, b]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(1).alignment = { vertical: 'top' };
    if (i === 8) row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; });
  });

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

export type OptionRef = { slug: string; sku: string; name: string; category: string; pesticide: boolean; idx: number; label: string };

export async function parseStockImport(buf: Buffer): Promise<ImportParse> {
  const [stores, opts] = await Promise.all([
    listStores(),
    db.select({ slug: products.slug, sku: products.sku, name: products.name, category: products.category, pesticide: products.pesticide, idx: productOptions.idx, label: productOptions.label })
      .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug)),
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
  let skipped = 0;
  for (let r = headRow + 1; r <= ws.rowCount; r++) {
    const xr = ws.getRow(r);
    const sku = text(xr, 'sku');
    const qtyRaw = get(xr, 'qty');
    const lotCode = text(xr, 'lot').toUpperCase();
    const expiryRaw = get(xr, 'expiry');
    const note = text(xr, 'note');
    if (!sku && qtyRaw === null && !lotCode && expiryRaw === null && !note) continue; // dòng trống

    const qtyEmpty = qtyRaw === null || qtyRaw === '' || qtyRaw === 0 || qtyRaw === '0';
    // Dòng chỉ có sẵn mã SKU/cửa hàng (không điền gì thêm) = không nhập
    if (qtyEmpty && !lotCode && (expiryRaw === null || expiryRaw === '') && !note) { skipped++; continue; }
    if (rows.length >= MAX_IMPORT_ROWS) return { ok: false, error: `File có quá ${MAX_IMPORT_ROWS} dòng cần nhập, hãy chia nhỏ` };

    const errors: string[] = [];
    const warnings: string[] = [];
    const o = bySku.get(sku.toUpperCase());
    if (!sku) errors.push('Thiếu Mã SKU');
    else if (!o) errors.push(`Không có mã SKU “${sku}” (giữ nguyên Mã SKU trong file mẫu)`);

    let qty: number | null = null;
    if (qtyEmpty) errors.push('Thiếu Số lượng nhập (phải lớn hơn 0)');
    else if (typeof qtyRaw === 'number' ? Number.isInteger(qtyRaw) : typeof qtyRaw === 'string' && /^\d+$/.test(qtyRaw)) {
      qty = Number(qtyRaw);
      if (qty < 1 || qty > MAX_QTY) { errors.push(`Số lượng nhập phải từ 1 đến ${MAX_QTY.toLocaleString('vi-VN')}`); qty = null; }
    } else errors.push('Số lượng nhập phải là số nguyên dương');

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

    rows.push({
      row: r, sku, slug: o?.slug ?? null, idx: o?.idx ?? null, name: o?.name ?? null, label: o?.label ?? null,
      storeId: store?.id ?? null, storeCode: store?.code ?? null, qty, lotCode: lotCode || null, expiry, note: note || null, errors, warnings,
    });
  }
  return { ok: true, rows, skipped };
}

// ---- Ghi vào kho -----------------------------------------------------------------------------

/** Ghi toàn bộ dòng hợp lệ trong một transaction: lỗi giữa chừng thì không dòng nào được nhập. */
export async function applyStockImport(rows: ImportRow[], actor: string) {
  // Khóa quy cách theo thứ tự cố định để hai lượt nhập cùng lúc không bế tắc
  const sorted = rows.toSorted((a, b) => a.slug!.localeCompare(b.slug!) || a.idx! - b.idx!);
  await db.transaction(async (tx) => {
    for (const r of sorted) {
      const after = await applyStock(tx, r.slug!, r.idx!, r.qty!, 'import', actor, r.note ? `Excel · ${r.note}` : 'Nhập từ Excel', {
        storeId: r.storeId!, lotCode: r.lotCode, expiry: r.expiry,
      });
      if (after === null) throw new Error(`Dòng ${r.row}: không tìm thấy quy cách ${r.sku}`);
    }
  });
  return { lines: rows.length, units: rows.reduce((s, r) => s + r.qty!, 0) };
}
