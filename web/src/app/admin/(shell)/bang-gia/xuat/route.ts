import ExcelJS from 'exceljs';
import { formatPhone, SALES_PHONE, SHOP_ADDRESS } from '@/lib/contact';
import { todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { isTierKey, listPriceRows, WHOLESALE_TIERS } from '@/server/price-list';

/**
 * Bảng giá gửi đại lý ra Excel: /admin/bang-gia/xuat?cap=dl2 | dl1 | ct (thiếu `cap` = đủ các cấp, để dùng nội bộ).
 * Chỉ cây đang bán, quy cách có giá. KHÔNG có giá vườn / giá gốc. Chỉ Quản lý.
 */
export async function GET(req: Request) {
  await requireAccess('settings');
  const cap = new URL(req.url).searchParams.get('cap');
  const tiers = isTierKey(cap) ? WHOLESALE_TIERS.filter((t) => t.key === cap) : [...WHOLESALE_TIERS];
  const rows = (await listPriceRows({ onlyActive: true })).filter((r) => r.price > 0 && r.cost);
  const today = todayVN().split('-').reverse().join('/');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cây Cảnh Miền Tây';
  const ws = wb.addWorksheet('Bảng giá');
  const cols = 5 + tiers.length;
  ws.columns = [{ width: 6 }, { width: 14 }, { width: 30 }, { width: 28 }, { width: 14 }, ...tiers.map(() => ({ width: 16 }))];
  const font = { name: 'Arial', size: 10 };

  const title = ws.addRow([`BẢNG GIÁ ${tiers.length === 1 ? tiers[0].label.toUpperCase() : 'SỈ'} — CÂY CẢNH MIỀN TÂY`]);
  ws.mergeCells(title.number, 1, title.number, cols);
  title.font = { ...font, size: 14, bold: true };
  const sub = ws.addRow([`Áp dụng từ ${today} · ${SHOP_ADDRESS} · Đặt hàng: ${formatPhone(SALES_PHONE)} (Zalo)`]);
  ws.mergeCells(sub.number, 1, sub.number, cols);
  sub.font = font;
  const note = ws.addRow(['Giá tính trên mỗi cây, chưa gồm phí vận chuyển. Giá có thể thay đổi theo giá nhà vườn — vui lòng xác nhận lại khi đặt.']);
  ws.mergeCells(note.number, 1, note.number, cols);
  note.font = { ...font, italic: true, color: { argb: 'FF555555' } };
  ws.addRow([]);

  const head = ws.addRow(['STT', 'Mã', 'Tên cây', 'Quy cách', 'Giá lẻ (đ)', ...tiers.map((t) => `${t.label} (đ)`)]);
  head.font = { ...font, bold: true };
  head.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } }; c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; });
  ws.views = [{ state: 'frozen', ySplit: head.number }];

  rows.forEach((r, i) => {
    const row = ws.addRow([i + 1, `${r.sku}-${r.idx + 1}`, r.name, r.label, r.price, ...tiers.map((t) => r.tiers[t.key])]);
    row.font = font;
    for (let c = 5; c <= cols; c++) row.getCell(c).numFmt = '#,##0';
    for (let c = 6; c <= cols; c++) row.getCell(c).font = { ...font, bold: true };
  });

  const file = Buffer.from(await wb.xlsx.writeBuffer());
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="bang-gia-${isTierKey(cap) ? cap : 'si'}-${todayVN()}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
