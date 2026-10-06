import ExcelJS from 'exceljs';
import { PAY_LABEL, STATUS_LABEL } from '@/lib/order-labels';
import { todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { buildReport, DEFAULT_RANGE, isReportRange, ordersInRange, REPORT_RANGES } from '@/server/reports';

const DELIVERY = { ship: 'Giao tận nơi', pickup: 'Nhận tại vườn' } as const;

/** Xuất báo cáo ra Excel (3 sheet: Tổng quan, Sản phẩm bán chạy, Đơn hàng): /admin/bao-cao/xuat?ky=6-thang. Chỉ quản trị viên. */
export async function GET(req: Request) {
  await requireAccess('reports');
  const ky = new URL(req.url).searchParams.get('ky') ?? undefined;
  const range = isReportRange(ky) ? ky : DEFAULT_RANGE;
  const [r, orders] = await Promise.all([buildReport(range), ordersInRange(range)]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cây Cảnh Miền Tây';
  const head = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  };

  const ov = wb.addWorksheet('Tổng quan');
  ov.columns = [{ header: 'Chỉ số', width: 34 }, { header: 'Kỳ này', width: 18 }, { header: 'Kỳ trước', width: 18 }];
  head(ov);
  const ymd = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10);
  ov.addRows([
    ['Kỳ báo cáo', REPORT_RANGES[range], `${ymd(r.from)} → ${ymd(r.to - 86_400_000)}`],
    ['Doanh thu (đ)', r.revenue, r.prevRevenue],
    ['Số đơn', r.orders, r.prevOrders],
    ['Số khách mua', r.buyers, r.prevBuyers],
    ['Khách đã mua trước kỳ (quay lại)', r.returning.back, r.returning.prev.back],
    ['Yêu cầu bảo hành', r.warranty.claims, ''],
    ['Cây sống đã giao', r.warranty.plantItems, ''],
    ['Đơn dùng mã giảm giá', r.voucherOrders, ''],
    ['Tổng tiền đã giảm bằng mã (đ)', r.voucherDiscount, ''],
    ['Câu hỏi mới', r.care.questions, ''],
    ['Câu hỏi đã trả lời trong 2 giờ', r.care.fast, ''],
    ['Đánh giá đang hiện', r.care.reviews, ''],
  ]);
  ov.addRow([]);
  const hr = ov.addRow([r.daily ? 'Doanh thu theo ngày' : 'Doanh thu theo tháng', 'Doanh thu (đ)', r.daily ? 'Kỳ trước cùng thứ tự ngày (đ)' : 'Cùng tháng năm trước (đ)']);
  hr.font = { bold: true };
  for (const p of r.chart) ov.addRow([p.key, p.revenue, p.before]);
  ov.getColumn(2).numFmt = '#,##0';
  ov.getColumn(3).numFmt = '#,##0';

  const top = wb.addWorksheet('Sản phẩm bán chạy');
  top.columns = [{ header: 'Sản phẩm', width: 44 }, { header: 'Mã (slug)', width: 30 }, { header: 'Đã bán', width: 10 }, { header: 'Doanh thu hàng hóa (đ)', width: 22 }];
  head(top);
  top.addRows(r.top.map((t) => [t.name, t.slug, t.qty, t.revenue]));
  top.getColumn(4).numFmt = '#,##0';

  const od = wb.addWorksheet('Đơn hàng');
  od.columns = [
    { header: 'Mã đơn', width: 14 }, { header: 'Ngày đặt', width: 17 }, { header: 'Khách', width: 24 }, { header: 'SĐT', width: 14 },
    { header: 'Trạng thái', width: 14 }, { header: 'Thanh toán', width: 26 }, { header: 'Đã thu tiền', width: 12 }, { header: 'Nhận hàng', width: 14 },
    { header: 'Tiền hàng (đ)', width: 14 }, { header: 'Phí giao (đ)', width: 12 }, { header: 'Giảm mã (đ)', width: 12 }, { header: 'Mã giảm giá', width: 14 },
    { header: 'Tổng (đ)', width: 14 },
  ];
  head(od);
  od.addRows(orders.map((o) => [
    o.code, o.created, o.customer, o.phone, STATUS_LABEL[o.status as keyof typeof STATUS_LABEL] ?? o.status,
    PAY_LABEL[o.method as keyof typeof PAY_LABEL] ?? o.method, o.paid ? 'Đã thu' : 'Chưa', DELIVERY[o.delivery as keyof typeof DELIVERY] ?? o.delivery,
    o.subtotal, o.ship, o.discount, o.voucher ?? '', o.total,
  ]));
  for (const c of [9, 10, 11, 13]) od.getColumn(c).numFmt = '#,##0';
  // SĐT giữ dạng chữ để Excel không bỏ số 0 đầu.
  od.getColumn(4).numFmt = '@';

  const file = Buffer.from(await wb.xlsx.writeBuffer());
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="bao-cao-${range}-${todayVN()}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
