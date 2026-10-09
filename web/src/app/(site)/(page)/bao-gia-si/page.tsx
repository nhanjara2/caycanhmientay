import type { Metadata } from 'next';
import Link from 'next/link';
import { WholesaleQuoteForm } from '@/components/WholesaleQuoteForm';
import { formatPhone, SALES_PHONE, SHOP_EMAIL, ZALO_URL } from '@/lib/contact';
import { PARTNER_TYPES, WHOLESALE_URL, type PartnerType } from '@/lib/partners';
import { listAddresses } from '@/server/addresses';
import { accountPhone, getCurrentUser } from '@/server/auth';
import { getPartnerProfile } from '@/server/partners';

export const metadata: Metadata = {
  title: 'Yêu cầu báo giá sỉ',
  description: 'Gửi danh sách cây cảnh, vật tư cần mua số lượng lớn — Cây Cảnh Miền Tây báo giá sỉ cho đối tác dịch vụ cảnh quan, công trình và buôn bán.',
};

type Props = { searchParams: Promise<{ loai?: string; 'phuong-an'?: string }> };

/** Form báo giá sỉ bên trái (điền sẵn nếu đã đăng nhập; ?loai=landscape|project|trade chọn sẵn loại đối tác), cách liên hệ khác bên phải. */
export default async function Page({ searchParams }: Props) {
  const [{ loai, 'phuong-an': fromAdvisor }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const [addr, profile] = await Promise.all([
    user ? listAddresses(user.id).then((l) => l[0]) : undefined,
    user ? getPartnerProfile(user.id) : null,
  ]);
  const type = PARTNER_TYPES.includes(loai as PartnerType) ? (loai as PartnerType) : profile?.type ?? undefined;

  return (
    <div className="qf">
      <WholesaleQuoteForm
        fromAdvisor={fromAdvisor === '1'}
        defaults={{
          type,
          company: profile?.company ?? '',
          name: user?.name ?? '',
          phone: (user && accountPhone(user)) ?? '',
          address: addr ? `${addr.street}, ${addr.area}` : profile?.area ?? '',
        }}
      />
      <aside className="qf-side">
        <div className="ar-cta">
          <b>Báo giá theo số lượng</b>
          <span>Nhân viên gọi xác nhận danh sách, quy cách, nơi giao rồi gửi báo giá sỉ qua Zalo.</span>
        </div>
        <div className="nw-box app-qf-ways">
          <h3>Cách khác</h3>
          <p>Gọi / Zalo: <a href={`tel:${SALES_PHONE}`}>{formatPhone(SALES_PHONE)}</a></p>
          <p><a href={ZALO_URL} target="_blank" rel="noreferrer">Gửi file BOQ qua Zalo</a> hoặc email <a href={`mailto:${SHOP_EMAIL}`}>{SHOP_EMAIL}</a></p>
          <p>Hàng có sẵn giá trên web: thêm vào giỏ và đặt luôn. <Link href={WHOLESALE_URL}>Xem điều kiện đối tác</Link></p>
        </div>
      </aside>
    </div>
  );
}
