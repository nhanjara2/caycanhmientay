import { requireAccess } from '@/server/auth';
import { todayVN } from '@/lib/stock';
import { buildStockTemplate } from '@/server/stock-import';

/** File Excel mẫu nhập hàng: ?loai=duoi-muc chỉ lấy hàng dưới mức tồn tối thiểu, bỏ trống = mọi quy cách. */
export async function GET(req: Request) {
  await requireAccess('inventory');
  const lowOnly = new URL(req.url).searchParams.get('loai') === 'duoi-muc';
  const file = await buildStockTemplate(lowOnly ? 'duoi-muc' : 'tat-ca');
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="mau-nhap-hang${lowOnly ? '-duoi-muc' : ''}-${todayVN()}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
