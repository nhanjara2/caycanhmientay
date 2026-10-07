import Link from 'next/link';
import { SALES_PHONE } from '@/lib/contact';
import { Icon, type IconName } from './Icon';
import { phoneText, QUOTE_URL, ServiceCta, ServiceFaq, ServiceHero, ServiceSteps } from './ServiceParts';

const PERKS: { icon: IconName; b: string; text: string }[] = [
  { icon: 'plant', b: 'Cây cảnh công trình', text: 'Cây cho sân vườn, khuôn viên và công trình, số lượng theo từng dự án.' },
  { icon: 'pot', b: 'Cây văn phòng', text: 'Cây để bàn, cây trong nhà, cây sảnh: thuê có người chăm hoặc mua về tự chăm.' },
  { icon: 'box', b: 'Cây giống & vật tư', text: 'Cây giống, chậu, đất – giá thể, phân bón và thuốc BVTV cho vườn ươm, trang trại, công trình.' },
  { icon: 'user', b: 'Người phụ trách riêng', text: 'Một đầu mối nhận yêu cầu, theo dõi từ lúc khảo sát, báo giá đến khi triển khai.' },
];

/** Trang Khách doanh nghiệp (/doanh-nghiep): viết tay — không bảng giá sỉ, logo khách hàng hay hồ sơ năng lực mẫu; mọi nút dẫn về form Đặt lịch khảo sát đã lưu thật. */
export function BusinessPage() {
  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <ServiceHero
        badge="Cây Cảnh Miền Tây Doanh nghiệp"
        title="Cây xanh cho văn phòng, công trình và dự án"
        text="Nhận cây số lượng lớn từ mạng lưới gần 200 nhà vườn, có kỹ sư khảo sát, tư vấn và một người phụ trách theo dõi yêu cầu của doanh nghiệp bạn."
        primary={{ label: 'Yêu cầu báo giá', href: `${QUOTE_URL}?loai=van-phong` }}
        call={{ phone: SALES_PHONE, label: phoneText(SALES_PHONE) }}
        art="home"
        tag={{ b: 'Kỹ sư gọi lại trong 2 giờ làm việc', text: 'Báo giá chi tiết gửi qua Zalo' }}
      />

      <section className="sv-sec">
        <h2>Chúng tôi cung cấp</h2>
        <div className="bz-perks">
          {PERKS.map((p) => (
            <div key={p.b}>
              <span><Icon name={p.icon} /></span>
              <b>{p.b}</b>
              {p.text}
            </div>
          ))}
        </div>
      </section>

      <section className="sv-sec" style={{ paddingTop: 0 }}>
        <div className="sv-panel sv-panel--wide">
          <h2>Giá theo từng yêu cầu</h2>
          <p>
            Shop không niêm yết bảng giá sỉ chung: giá phụ thuộc loại cây, kích thước, số lượng, địa điểm giao và thời gian cần. Bạn gửi
            danh sách (hoặc mô tả nhu cầu), kỹ sư lập bảng báo giá từng khoản để bạn đối chiếu. Nếu cần hóa đơn, hợp đồng hay cách thanh
            toán riêng, hãy nêu ngay khi gửi yêu cầu để được trao đổi.
          </p>
          <div className="acts">
            <Link href={`${QUOTE_URL}?loai=van-phong`} className="vx-btn vx-btn--primary">Báo giá cây văn phòng</Link>
            <Link href={`${QUOTE_URL}?loai=san-vuon`} className="vx-btn vx-btn--outline">Báo giá công trình, sân vườn</Link>
          </div>
        </div>
      </section>

      <ServiceSteps
        title="Cách làm việc"
        steps={[
          { icon: 'mail', b: 'Gửi yêu cầu', text: 'Danh sách cây hoặc mô tả nhu cầu, địa điểm, ảnh hiện trạng' },
          { icon: 'clock', b: 'Kỹ sư gọi lại', text: 'Trong 2 giờ làm việc để xác nhận và hẹn lịch' },
          { icon: 'pin', b: 'Khảo sát', text: 'Tại chỗ nếu cần, đánh giá ánh sáng và vị trí đặt cây' },
          { icon: 'receipt', b: 'Báo giá', text: 'Bảng cây, vật tư, chi phí gửi qua Zalo' },
          { icon: 'truck', b: 'Giao & triển khai', text: 'Cây lớn, công trình có thể cần đặt cọc trước khi giao' },
        ]}
      />

      <ServiceFaq
        items={[
          { q: 'Có mức mua tối thiểu không?', a: 'Không có mức tối thiểu cố định, bạn mua lẻ vẫn được. Với số lượng lớn hoặc công trình, gửi yêu cầu để được báo giá riêng.' },
          { q: 'Có cần đặt cọc không?', a: <>Cây lớn đặt trước và công trình thường cần đặt cọc, mức cụ thể ghi trong báo giá. Xem <Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>.</> },
          { q: 'Bao lâu có báo giá?', a: 'Kỹ sư gọi lại trong 2 giờ làm việc để xác nhận yêu cầu; báo giá chi tiết gửi qua Zalo, với yêu cầu cần khảo sát là sau 48 giờ kể từ buổi khảo sát.' },
          { q: 'Cây giao có được bảo hành không?', a: <>Cây sống được bảo hành theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>; điều kiện cho từng dự án ghi rõ trong báo giá.</> },
          { q: 'Tôi muốn thuê cây văn phòng có người chăm?', a: <>Xem <Link href="/dich-vu/cho-thue-cay-van-phong">Cây văn phòng: thuê hoặc mua</Link> hoặc gửi yêu cầu để kỹ sư tư vấn.</> },
        ]}
      />

      <ServiceCta
        title="Gửi yêu cầu, nhận báo giá chi tiết"
        text="Kỹ sư gọi lại trong 2 giờ làm việc để xác nhận nhu cầu của doanh nghiệp bạn"
        label="Yêu cầu báo giá"
        href={`${QUOTE_URL}?loai=van-phong`}
      />
    </div>
  );
}
