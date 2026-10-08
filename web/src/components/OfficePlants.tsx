import Link from 'next/link';
import { money } from '@/lib/format';
import { lowestTierPrice, termLabel } from '@/lib/office-rental';
import { productsIn } from '@/server/catalog';
import { getRentalConfig } from '@/server/office-rental';
import { Breadcrumb } from './Blocks';
import { Icon } from './Icon';
import { OfficeRentalPlanner } from './OfficeRentalPlanner';
import { ProductGrid } from './ProductCard';
import { QUOTE_URL, ServiceCta, ServiceFaq, ServiceSteps } from './ServiceParts';

const QUOTE_OFFICE = `${QUOTE_URL}?loai=van-phong`;
const SHOP_OFFICE = '/danh-muc/cay-canh/cay-van-phong';

/**
 * Trang Cho thuê cây văn phòng (/dich-vu/cho-thue-cay-van-phong) theo ServiceDetailLayout: gói thuê + tự chọn số cây (giá ở /admin/thue-cay),
 * so sánh với mua cây, các bước, cây văn phòng đang bán (nhóm "Cây văn phòng"), câu hỏi thường gặp.
 */
export async function OfficePlants() {
  const [cfg, all] = await Promise.all([getRentalConfig(), productsIn('cay-canh', 'cay-van-phong')]);
  const plants = all.slice(0, 8);
  const low = cfg.showPrices ? lowestTierPrice(cfg) : 0;
  const best = cfg.terms.reduce((m, t) => (t.discount > m.discount ? t : m), cfg.terms[0]);
  const first = cfg.terms[0];

  const facts: { icon: 'tag' | 'plant' | 'clock' | 'pin'; b: string; text: string }[] = [
    low > 0
      ? { icon: 'tag', b: `Từ ${money(low)}`, text: 'mỗi cây / tháng, đã gồm chăm sóc' }
      : { icon: 'tag', b: 'Báo giá rõ từng khoản', text: 'sau khi khảo sát' },
    { icon: 'plant', b: `Từ ${cfg.minPlants} cây`, text: `thuê tối thiểu ${termLabel(first)}` },
    cfg.showPrices && best.discount > 0
      ? { icon: 'clock', b: `Giảm ${best.discount}%`, text: `khi thuê ${termLabel(best)}` }
      : { icon: 'clock', b: 'Chăm theo lịch', text: '2 tuần / lần hoặc hằng tuần' },
    { icon: 'pin', b: 'Khảo sát miễn phí', text: 'kỹ sư gọi lại trong 2 giờ làm việc' },
  ];

  const priceFaq = cfg.showPrices && low > 0
    ? <>
        Theo cỡ cây và số cây: {cfg.tiers.filter((t) => t.price > 0).map((t) => `${t.name.toLowerCase()} ${money(t.price)}`).join(', ')} mỗi cây / tháng, đã gồm chậu và công chăm 2 tuần / lần.
        {cfg.weeklyExtra > 0 && <> Chăm hằng tuần cộng thêm {cfg.weeklyExtra}%.</>}
        {cfg.terms.filter((t) => t.discount > 0).length > 0 && <> Thuê dài được giảm: {cfg.terms.filter((t) => t.discount > 0).map((t) => `${termLabel(t)} giảm ${t.discount}%`).join(', ')}.</>}
        {' '}Đây là giá tham khảo — giá chính thức báo sau khảo sát vì còn tùy loại cây, chậu và vị trí đặt.
      </>
    : 'Theo số cây, cỡ cây và chậu, tần suất chăm sóc và thời hạn thuê. Shop báo cụ thể sau khi khảo sát.';

  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <div className="sv-crumb">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dịch vụ', href: '/dich-vu' }, { label: 'Cho thuê cây văn phòng' }]} />
      </div>

      <section className="sv-sec ort-head">
        <h1 className="sv-title">Cho thuê cây văn phòng</h1>
        <p className="sub">Cây xanh đặt tận nơi, kỹ sư đến chăm theo lịch — bạn không phải tưới, bón hay lo cây chết. Chọn gói có sẵn hoặc tự chọn số lượng cây để xem chi phí ngay.</p>
        <div className="ort-facts">
          {facts.map((f) => (
            <span key={f.b}><Icon name={f.icon} /><span><b>{f.b}</b>{f.text}</span></span>
          ))}
        </div>
        <div className="ort-jump">
          <a href="#goi-thue" className="vx-btn vx-btn--primary vx-btn--lg">Xem các gói thuê</a>
          <a href="#tinh-chi-phi" className="vx-btn vx-btn--outline vx-btn--lg">Tự chọn số lượng cây</a>
        </div>
      </section>

      <OfficeRentalPlanner cfg={cfg} />

      <ServiceSteps
        title="Cách thuê cây"
        steps={[
          { icon: 'receipt', b: 'Chọn gói hoặc số cây', text: 'Xem chi phí ước tính ngay trên trang' },
          { icon: 'phone', b: 'Gửi yêu cầu', text: 'Kỹ sư gọi lại trong 2 giờ làm việc' },
          { icon: 'pin', b: 'Khảo sát miễn phí', text: 'Xem ánh sáng, chọn cây cho từng vị trí' },
          { icon: 'chat', b: 'Báo giá chính thức', text: 'Gửi qua Zalo sau 48 giờ kể từ khảo sát' },
          { icon: 'truck', b: 'Đặt cây, chăm theo lịch', text: 'Giao, đặt cây và chăm định kỳ' },
        ]}
      />

      <section className="sv-sec">
        <div className="sv-split">
          <div className="sv-panel">
            <h2>Chuẩn bị để được báo giá nhanh</h2>
            <p>Bạn không cần biết trước tên cây. Chỉ cần cho kỹ sư biết:</p>
            <ul className="sv-check">
              <li><Icon name="camera" />Ảnh không gian cần đặt cây (form nhận tối đa 3 ảnh)</li>
              <li><Icon name="pin" />Địa chỉ và số vị trí cần đặt</li>
              <li><Icon name="spark" />Hướng nắng, có cửa sổ hay chỉ có đèn, có bật điều hòa không</li>
              <li><Icon name="plant" />Gói hoặc số cây dự kiến — chưa chắc thì để kỹ sư tư vấn</li>
              <li><Icon name="clock" />Thời hạn thuê mong muốn</li>
            </ul>
          </div>
          <div className="sv-panel">
            <h2>Chỉ cần vài chậu? Mua về tự chăm</h2>
            <p>Dưới {cfg.minPlants} cây, hoặc muốn tự chăm, bạn mua cây có sẵn của cửa hàng:</p>
            <ul className="sv-check">
              <li><Icon name="check" />Giá ghi rõ trên từng sản phẩm, mua ngay trên website</li>
              <li><Icon name="check" />Giao toàn quốc, bảo hành cây sống 7 ngày</li>
              <li><Icon name="check" />Kỹ sư tư vấn chăm cây miễn phí qua Zalo</li>
            </ul>
            <div className="acts">
              <Link href={SHOP_OFFICE} className="vx-btn vx-btn--outline"><Icon name="cart" size={16} />Xem cây văn phòng</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sv-sec">
        <div className="vx-sect">
          <h2 style={{ fontSize: '1.125rem' }}>Cây văn phòng shop đang có</h2>
          <Link className="vx-link" href={SHOP_OFFICE}>Xem tất cả <Icon name="chevron" size={16} /></Link>
        </div>
        <p className="sv-note" style={{ marginTop: -8 }}>Thích cây nào, ghi tên vào ô ghi chú khi gửi yêu cầu thuê — kỹ sư ưu tiên đưa vào phương án.</p>
        {plants.length > 0 ? (
          <ProductGrid products={plants} />
        ) : (
          <p className="sv-note">Các loại cây văn phòng đang được cập nhật. Xem <Link href={SHOP_OFFICE}>nhóm Cây văn phòng</Link> hoặc nhắn Zalo để kỹ sư gợi ý cây hợp không gian của bạn.</p>
        )}
      </section>

      <ServiceFaq
        items={[
          { q: 'Giá thuê cây tính thế nào?', a: priceFaq },
          { q: 'Thuê tối thiểu bao nhiêu cây, bao lâu?', a: `Từ ${cfg.minPlants} cây, thời hạn từ ${termLabel(first)}${cfg.terms.length > 1 ? `; có thể chọn ${cfg.terms.slice(1).map(termLabel).join(' hoặc ')}` : ''}.` },
          { q: 'Gói có đổi được không?', a: <>Được. Gói chỉ là số cây gợi ý — bạn tăng, giảm từng cỡ cây ở phần <a href="#tinh-chi-phi">Tự chọn số lượng cây</a>, hoặc nói với kỹ sư khi khảo sát. Cần thêm hay bớt cây giữa chừng thì báo shop để cập nhật hợp đồng.</> },
          { q: 'Cây yếu hoặc chết thì sao?', a: 'Kỹ sư kiểm tra cây mỗi lần đến chăm. Cây yếu hoặc hư được thay theo điều khoản ghi trong báo giá và hợp đồng.' },
          { q: 'Văn phòng ít nắng có đặt cây được không?', a: 'Được. Có nhiều loại cây chịu bóng râm và sống tốt dưới đèn; kỹ sư đánh giá ánh sáng khi khảo sát và chọn cây phù hợp cho từng vị trí.' },
          { q: 'Tôi chỉ cần mua vài chậu thì sao?', a: <>Bạn mua trực tiếp ở nhóm <Link href={SHOP_OFFICE}>Cây văn phòng</Link>, giao toàn quốc và được bảo hành cây sống. Xem <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>.</> },
        ]}
      />

      <ServiceCta
        title="Nhận báo giá thuê cây văn phòng"
        text="Gửi ảnh không gian, kỹ sư sẽ gọi lại để hẹn khảo sát miễn phí"
        label="Nhận báo giá"
        href={QUOTE_OFFICE}
      />
    </div>
  );
}
