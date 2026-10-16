import ExcelJS from 'exceljs';
import { gradeText } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { consignDetail, consignSummary, MONTH_RE, thisMonth } from '@/server/consign';

/**
 * Bảng đối soát gửi nhà vườn: /admin/doi-soat/xuat?ncc=<id>&thang=YYYY-MM — cây ký gửi đã bán trong tháng (theo giá vườn của lô),
 * công nợ lũy kế, cây còn ở vườn. Chỉ có giá vườn của chính nhà vườn đó (không có giá bán / giá gốc). Chỉ Quản lý.
 */
export async function GET(req: Request) {
  await requireAccess('expenses');
  const sp = new URL(req.url).searchParams;
  const month = MONTH_RE.test(sp.get('thang') ?? '') ? sp.get('thang')! : thisMonth();
  const id = Number(sp.get('ncc')) || 0;
  const [d, rows] = await Promise.all([consignDetail(id, month), consignSummary(month)]);
  if (!d) return new Response('Không tìm thấy nhà vườn', { status: 404 });
  const sum = rows.find((r) => r.id === id);
  const mm = `${month.slice(5)}/${month.slice(0, 4)}`;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cây Cảnh Miền Tây';
  const ws = wb.addWorksheet('Đối soát');
  ws.columns = [{ width: 12 }, { width: 14 }, { width: 32 }, { width: 24 }, { width: 8 }, { width: 14 }, { width: 16 }];
  const font = { name: 'Arial', size: 10 };
  const title = ws.addRow([`BẢNG ĐỐI SOÁT CÂY KÝ GỬI — ${d.supplier.name.toUpperCase()} — THÁNG ${mm}`]);
  ws.mergeCells(title.number, 1, title.number, 7);
  title.font = { ...font, size: 13, bold: true };
  ws.addRow([]);
  const head = ws.addRow(['Ngày', 'Đơn', 'Cây', 'Quy cách · hạng', 'SL', 'Giá vườn (đ)', 'Thành tiền (đ)']);
  head.font = { ...font, bold: true };
  head.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } }; });
  let total = 0;
  for (const m of d.sold) {
    const amount = m.unitCost == null ? null : m.qty * m.unitCost;
    total += amount ?? 0;
    const r = ws.addRow([
      new Date(m.at.getTime() + 7 * 3_600_000).toISOString().slice(0, 10).split('-').reverse().join('/'), m.code ?? '', m.name ?? '',
      [m.label, gradeText(m.grade)].filter(Boolean).join(' · '), m.qty, m.unitCost, amount,
    ]);
    r.font = font;
    r.getCell(6).numFmt = '#,##0';
    r.getCell(7).numFmt = '#,##0';
  }
  const t = ws.addRow(['', '', 'Tổng tiền cây bán trong tháng', '', d.sold.reduce((s, m) => s + m.qty, 0), '', total]);
  t.font = { ...font, bold: true };
  t.getCell(7).numFmt = '#,##0';
  ws.addRow([]);
  for (const [label, v] of [['Phải trả lũy kế', sum?.owed ?? 0], ['Đã trả', sum?.paid ?? 0], ['Còn nợ', (sum?.owed ?? 0) - (sum?.paid ?? 0)]] as const) {
    const r = ws.addRow(['', '', label, '', '', '', v]);
    r.font = { ...font, bold: label === 'Còn nợ' };
    r.getCell(7).numFmt = '#,##0';
  }

  const st = wb.addWorksheet('Cây còn ở vườn');
  st.columns = [{ width: 32 }, { width: 24 }, { width: 10 }, { width: 14 }];
  const sh = st.addRow(['Cây', 'Quy cách · hạng', 'Còn', 'Giá vườn (đ)']);
  sh.font = { ...font, bold: true };
  for (const l of d.stock) {
    const r = st.addRow([l.name ?? '', [l.label, gradeText(l.grade)].filter(Boolean).join(' · '), l.qty, l.unitCost]);
    r.font = font;
    r.getCell(4).numFmt = '#,##0';
  }

  const file = Buffer.from(await wb.xlsx.writeBuffer());
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="doi-soat-ncc${id}-${month}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
