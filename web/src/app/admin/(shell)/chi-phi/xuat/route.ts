import ExcelJS from 'exceljs';
import { DEFAULT_EXPENSE_RANGE, EXPENSE_RANGES, expenseRangeBounds, isExpenseRange } from '@/lib/expense-labels';
import { fmtYmd, todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { expensesForExport, listExpenseCategories, materializeRecurring, periodFinance, ymdStartMs } from '@/server/expenses';
import { listStores } from '@/server/inventory';

/** Xuất sổ chi phí ra Excel (2 sheet: Chi phí, Theo nhóm): /admin/chi-phi/xuat?ky=thang-nay&nhom=&kho=&q=. Chỉ Quản lý. */
export async function GET(req: Request) {
  await requireAccess('expenses');
  await materializeRecurring();
  const sp = new URL(req.url).searchParams;
  const ky = sp.get('ky') ?? undefined;
  const range = isExpenseRange(ky) ? ky : DEFAULT_EXPENSE_RANGE;
  const today = todayVN();
  const b = expenseRangeBounds(range, today);
  const [stores, cats] = await Promise.all([listStores(), listExpenseCategories()]);
  const category = cats.find((c) => c.slug === sp.get('nhom'))?.slug;
  const kho = sp.get('kho');
  const store = kho === 'chung' ? ('chung' as const) : stores.find((s) => String(s.id) === kho)?.id;
  const q = sp.get('q')?.trim().slice(0, 60) || undefined;
  const [rows, fin] = await Promise.all([
    expensesForExport({ from: b.from, to: b.to, category, store, q }),
    periodFinance(ymdStartMs(b.from), ymdStartMs(b.to)),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cây Cảnh Miền Tây';
  const head = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  };

  const ws = wb.addWorksheet('Chi phí');
  ws.columns = [
    { header: 'Ngày', width: 12 }, { header: 'Nhóm chi', width: 26 }, { header: 'Nội dung', width: 44 }, { header: 'Cửa hàng', width: 24 },
    { header: 'Nhà cung cấp / người nhận', width: 28 }, { header: 'Số tiền (đ)', width: 16 }, { header: 'Người ghi', width: 18 }, { header: 'Định kỳ', width: 9 },
  ];
  head(ws);
  ws.addRows(rows.map((r) => [fmtYmd(r.spentOn), r.category, r.note ?? '', r.store ?? 'Chi chung', r.supplier ?? '', r.amount, r.actor, r.recurring ? 'Có' : '']));
  ws.getColumn(6).numFmt = '#,##0';
  const total = ws.addRow(['', '', 'Tổng', '', '', rows.reduce((a, r) => a + r.amount, 0)]);
  total.font = { bold: true };

  const g = wb.addWorksheet('Theo nhóm');
  g.columns = [{ header: 'Chỉ số', width: 36 }, { header: 'Số tiền (đ)', width: 18 }];
  head(g);
  g.addRows([
    ['Kỳ', `${EXPENSE_RANGES[range]} (${fmtYmd(b.from)} → ${fmtYmd(b.to)}, không gồm ngày cuối)`],
    ['Chi phí khác', fin.expenses],
    ['Tiền mua hàng — sổ chi phí', fin.goods],
    ['Tiền mua hàng — phiếu nhập', fin.purchases - fin.goods],
    ['Tổng chi', fin.expenses + fin.purchases],
    [],
  ]);
  const h = g.addRow(['Nhóm chi', 'Số tiền (đ)']);
  h.font = { bold: true };
  g.addRows(fin.byCategory.map((c) => [c.name, c.total]));
  g.getColumn(2).numFmt = '#,##0';

  const file = Buffer.from(await wb.xlsx.writeBuffer());
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="chi-phi-${range}-${today}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
