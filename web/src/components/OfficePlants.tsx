import Link from 'next/link';
import { productsIn } from '@/server/catalog';
import { Breadcrumb } from './Blocks';
import { Icon, type IconName } from './Icon';
import { ProductGrid } from './ProductCard';
import { QUOTE_URL, ServiceCta, ServiceFaq, ServiceSteps } from './ServiceParts';

const QUOTE_OFFICE = `${QUOTE_URL}?loai=van-phong`;
const SHOP_OFFICE = '/danh-muc/cay-canh/cay-van-phong';

const OPTIONS: { icon: IconName; title: string; text: string; points: string[]; cta: string; href: string; primary?: boolean }[] = [
  {
    icon: 'pot', title: 'Thuê cây',
    text: 'Cây đặt tại văn phòng, shop chăm theo lịch hai bên thống nhất. Phù hợp khi bạn muốn có cây đẹp mà không phải tự chăm.',
    points: [
      'Số cây, loại cây và chậu chọn theo không gian của bạn',
      'Tần suất chăm sóc và việc thay cây khi cây yếu ghi rõ trong báo giá',
      'Giá theo số cây và thời hạn thuê, báo cụ thể sau khi khảo sát',
    ],
    cta: 'Nhận báo giá thuê cây', href: QUOTE_OFFICE, primary: true,
  },
  {
    icon: 'cart', title: 'Mua cây',
    text: 'Chọn cây có sẵn của cửa hàng, giao tận nơi và tự chăm theo hướng dẫn của kỹ sư.',
    points: [
      'Giá ghi rõ trên từng sản phẩm, mua ngay trên website',
      'Bảo hành cây sống 7 ngày theo chính sách của shop',
      'Kỹ sư tư vấn miễn phí qua Zalo cho cây đã mua',
    ],
    cta: 'Xem cây văn phòng', href: SHOP_OFFICE,
  },
];

const QUOTE_ITEMS = [
  'Số lượng cây và vị trí đặt (bàn làm việc, sảnh, phòng họp, hành lang…)',
  'Loại cây hợp ánh sáng và điều hòa của từng vị trí',
  'Chậu, đĩa lót và phụ kiện đi kèm',
  'Tần suất chăm sóc: tưới, bón, lau lá, xử lý sâu bệnh',
  'Việc thay cây khi cây yếu hoặc hư',
  'Thời hạn thuê và cách thanh toán',
];

/** Trang Cây văn phòng (/dich-vu/cho-thue-cay-van-phong): viết tay — không bảng giá, máy tính chi phí hay thẻ sản phẩm giả; cây đang bán lấy từ nhóm "Cây văn phòng". */
export async function OfficePlants() {
  const plants = (await productsIn('cay-canh', 'cay-van-phong')).slice(0, 8);

  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <div className="sv-crumb">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dịch vụ', href: '/dich-vu' }, { label: 'Cây văn phòng' }]} />
      </div>

      <section className="sv-sec" style={{ paddingTop: 0 }}>
        <h1 className="sv-title">Cây văn phòng: thuê hoặc mua</h1>
        <p className="sub">Cây xanh cho bàn làm việc, sảnh và phòng họp. Kỹ sư tư vấn loại cây hợp ánh sáng, bạn chọn thuê có người chăm hoặc mua về tự chăm.</p>
        <div className="sv-two">
          {OPTIONS.map((o) => (
            <div key={o.title} className="sv-opt">
              <span className="sv-opt__ic"><Icon name={o.icon} /></span>
              <b>{o.title}</b>
              <p>{o.text}</p>
              <ul className="sv-check">
                {o.points.map((t) => <li key={t}><Icon name="check" />{t}</li>)}
              </ul>
              <Link href={o.href} className={o.primary ? 'vx-btn vx-btn--primary vx-btn--block' : 'vx-btn vx-btn--outline vx-btn--block'}>{o.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="sv-sec" style={{ paddingTop: 0 }}>
        <div className="sv-split">
          <div className="sv-panel">
            <h2>Báo giá thuê cây gồm những gì</h2>
            <p>Mỗi khoản được ghi riêng trong bảng báo giá để bạn đối chiếu và thống nhất trước khi bắt đầu:</p>
            <ul className="sv-check">
              {QUOTE_ITEMS.map((t) => <li key={t}><Icon name="check" />{t}</li>)}
            </ul>
          </div>
          <div className="sv-panel">
            <h2>Chuẩn bị để được báo giá nhanh</h2>
            <p>Bạn không cần biết trước tên cây. Chỉ cần cho kỹ sư biết:</p>
            <ul className="sv-check">
              <li><Icon name="camera" />Ảnh không gian cần đặt cây (form nhận tối đa 3 ảnh)</li>
              <li><Icon name="pin" />Địa chỉ và số vị trí cần đặt</li>
              <li><Icon name="spark" />Hướng nắng, có cửa sổ hay chỉ có đèn, có bật điều hòa không</li>
              <li><Icon name="plant" />Số cây dự kiến — chưa chắc thì để kỹ sư tư vấn</li>
              <li><Icon name="clock" />Thời hạn thuê mong muốn</li>
            </ul>
          </div>
        </div>
      </section>

      <ServiceSteps
        title="Cách thuê cây"
        steps={[
          { icon: 'phone', b: 'Gửi yêu cầu', text: 'Điền form, chọn sẵn "Cây văn phòng"' },
          { icon: 'clock', b: 'Kỹ sư gọi lại', text: 'Trong 2 giờ làm việc, hẹn lịch khảo sát' },
          { icon: 'pin', b: 'Khảo sát', text: 'Xem không gian, đánh giá ánh sáng, chọn vị trí' },
          { icon: 'receipt', b: 'Báo giá', text: 'Gửi qua Zalo sau 48 giờ kể từ khảo sát' },
          { icon: 'truck', b: 'Đặt cây', text: 'Giao và đặt cây tại văn phòng theo lịch đã chốt' },
        ]}
      />

      <section className="sv-sec">
        <div className="vx-sect">
          <h2 style={{ fontSize: '1.125rem' }}>Cây văn phòng đang bán</h2>
          <Link className="vx-link" href={SHOP_OFFICE}>Xem tất cả <Icon name="chevron" size={16} /></Link>
        </div>
        {plants.length > 0 ? (
          <ProductGrid products={plants} />
        ) : (
          <p className="sv-note">Các loại cây văn phòng đang được cập nhật. Xem <Link href={SHOP_OFFICE}>nhóm Cây văn phòng</Link> hoặc nhắn Zalo để kỹ sư gợi ý cây hợp không gian của bạn.</p>
        )}
      </section>

      <ServiceFaq
        items={[
          { q: 'Giá thuê cây tính thế nào?', a: 'Theo số cây, loại cây và chậu, tần suất chăm sóc và thời hạn thuê. Shop báo cụ thể sau khi khảo sát, không có bảng giá chung vì mỗi văn phòng một khác.' },
          { q: 'Cây yếu hoặc chết thì sao?', a: 'Việc thay cây được ghi rõ trong báo giá để hai bên thống nhất trước khi bắt đầu.' },
          { q: 'Văn phòng ít nắng có đặt cây được không?', a: 'Được. Có nhiều loại cây chịu bóng râm; kỹ sư đánh giá ánh sáng khi khảo sát và chọn loại cây phù hợp cho từng vị trí.' },
          { q: 'Tôi chỉ cần mua vài chậu thì sao?', a: <>Bạn mua trực tiếp ở nhóm <Link href={SHOP_OFFICE}>Cây văn phòng</Link>, giao toàn quốc và được bảo hành cây sống. Xem <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>.</> },
        ]}
      />

      <ServiceCta
        title="Nhận báo giá cây văn phòng"
        text="Gửi ảnh không gian, kỹ sư sẽ gọi lại để hẹn khảo sát"
        label="Nhận báo giá"
        href={QUOTE_OFFICE}
      />
    </div>
  );
}
