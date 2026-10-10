import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/PrintButton';
import { money } from '@/lib/format';
import { fmtDate, PAY_LABEL } from '@/lib/order-labels';
import { SALES_PHONE } from '@/lib/contact';
import { requireAccess } from '@/server/auth';
import { posReceipt } from '@/server/pos';

export const metadata: Metadata = { title: 'Hóa đơn', robots: { index: false } };

type Props = { params: Promise<{ code: string }> };

/** Hóa đơn bán tại quầy, khổ K80 (80mm): mở ra là tự bật hộp thoại in. */
export default async function ReceiptPage({ params }: Props) {
  await requireAccess('pos');
  const r = await posReceipt((await params).code.slice(0, 20));
  if (!r) notFound();
  const { o, items, store, cashier, payNote } = r;
  const time = `${o.createdAt.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })} ${fmtDate(o.createdAt)}`;

  return (
    <div className="app-receipt">
      <style>{`
        .app-receipt { width: 80mm; margin: 0 auto; padding: 8px 6px 24px; font: 12px/1.45 'Be Vietnam Pro', system-ui, sans-serif; color: #000; background: #fff; min-height: 100vh; }
        .app-receipt h1 { font-size: 15px; margin: 0; text-align: center; }
        .app-receipt .c { text-align: center; }
        .app-receipt hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
        .app-receipt table { width: 100%; border-collapse: collapse; }
        .app-receipt td { padding: 2px 0; vertical-align: top; }
        .app-receipt td.n { text-align: right; white-space: nowrap; padding-left: 6px; }
        .app-receipt .tot { font-size: 14px; font-weight: 700; }
        @media print { @page { size: 80mm auto; margin: 0; } .no-print { display: none !important; } .app-receipt { min-height: 0; padding: 4px; } }
      `}</style>
      <h1>Cây Cảnh Miền Tây</h1>
      <p className="c" style={{ margin: '2px 0' }}>{store?.name}{store?.address ? <><br />{store.address}</> : null}<br />ĐT {SALES_PHONE}</p>
      <hr />
      <p style={{ margin: 0 }}>
        Hóa đơn: <b>{o.code}</b><br />
        {time}<br />
        Thu ngân: {cashier}
        {o.customerName && o.customerName !== 'Khách lẻ' ? <><br />Khách: {o.customerName}{o.phone ? ` · ${o.phone}` : ''}</> : null}
      </p>
      <hr />
      <table>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}{i.label && i.label !== i.unit ? ` · ${i.label}` : ''}<br />{i.qty} x {money(i.price)}</td>
              <td className="n">{money(i.qty * i.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <table>
        <tbody>
          <tr><td>Tạm tính</td><td className="n">{money(o.subtotal)}</td></tr>
          {o.comboDiscount > 0 && <tr><td>Combo 2 cây</td><td className="n">-{money(o.comboDiscount)}</td></tr>}
          {o.voucherDiscount > 0 && <tr><td>Mã giảm giá {o.voucherCode}</td><td className="n">-{money(o.voucherDiscount)}</td></tr>}
          <tr className="tot"><td>Thành tiền</td><td className="n">{money(o.total)}</td></tr>
          <tr><td>Thanh toán</td><td className="n">{payNote.replace('Bán tại quầy · ', '') || PAY_LABEL[o.paymentMethod]}</td></tr>
        </tbody>
      </table>
      <hr />
      <p className="c" style={{ margin: 0 }}>
        Cây được bảo hành 7 ngày kể từ ngày mua (giữ hóa đơn).<br />
        Cảm ơn quý khách!
      </p>
      <PrintButton />
    </div>
  );
}
