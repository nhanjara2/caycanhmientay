import Link from 'next/link';
import { SERVICE_INFO, type ServiceType } from '@/lib/service-labels';
import { Icon, type IconName } from './Icon';
import { phoneText, QUOTE_URL, SERVICE_PHONE, ServiceCta, ServiceFaq, ServiceHero, ServiceSteps } from './ServiceParts';

/** 4 dịch vụ khớp với 4 lựa chọn trong form Đặt lịch khảo sát (lib/service-labels). */
const SERVICES: { type: ServiceType; icon: IconName; title: string; text: string; href?: string; cta: string }[] = [
  {
    type: 'garden', icon: 'home', title: 'Thiết kế & thi công sân vườn',
    text: 'Sân vườn, ban công, sân thượng, tiểu cảnh. Kỹ sư khảo sát, đề xuất cây hợp ánh sáng và gửi phối cảnh trước khi thi công.',
    cta: 'Đặt lịch khảo sát',
  },
  {
    type: 'office', icon: 'pot', title: 'Cây văn phòng',
    text: 'Thuê hoặc mua cây đặt tận nơi, kỹ sư tư vấn loại cây hợp ánh sáng và hướng dẫn chăm sóc.',
    href: '/dich-vu/cho-thue-cay-van-phong', cta: 'Xem chi tiết',
  },
  {
    type: 'care', icon: 'drop', title: 'Chăm sóc định kỳ',
    text: 'Tưới, bón, cắt tỉa, trị bệnh tại nhà hoặc văn phòng theo lịch hai bên thống nhất.',
    cta: 'Đặt lịch khảo sát',
  },
  {
    type: 'clinic', icon: 'bug', title: 'Chữa cây tại nhà',
    text: 'Kỹ sư đến tận nơi xem cây bệnh, xử lý và hướng dẫn cách chăm lại cho cây hồi phục.',
    cta: 'Đặt lịch khảo sát',
  },
];

/** Trang Dịch vụ sân vườn (/dich-vu): viết tay, chỉ ghi những gì shop cam kết trong form khảo sát — không số liệu, giá, đánh giá mẫu. */
export function ServicesHub() {
  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <ServiceHero
        badge="Dịch vụ Cây Cảnh Miền Tây"
        title="Không gian xanh, không lo chăm sóc"
        text="Từ ban công vài mét vuông đến sân vườn và văn phòng: kỹ sư khảo sát, tư vấn cây hợp ánh sáng, thi công và chăm sóc cho bạn."
        primary={{ label: 'Đặt lịch khảo sát miễn phí', href: QUOTE_URL }}
        call={{ phone: SERVICE_PHONE, label: phoneText(SERVICE_PHONE) }}
        proof={[{ b: 'Từ 2019', text: 'làm cây cảnh công trình' }, { b: 'Gần 200', text: 'nhà vườn cùng hợp tác' }, { b: 'Miễn phí', text: 'khảo sát tại chỗ' }]}
        art="home"
        tag={{ b: 'Kỹ sư gọi lại trong 2 giờ làm việc', text: 'Báo giá gửi qua Zalo sau 48 giờ kể từ khảo sát' }}
      />

      <section className="sv-sec">
        <h2>Dịch vụ của chúng tôi</h2>
        <p className="sub">Giá tính theo hiện trạng và nhu cầu của bạn, báo cụ thể sau khi khảo sát — không có bảng giá chung.</p>
        <div className="sv-cards">
          {SERVICES.map((s) => (
            <div key={s.type} className="sv-card">
              <span className="img"><Icon name={s.icon} /></span>
              <span className="b">
                <b>{s.title}</b>
                {s.text}
                <span className="from">Khảo sát miễn phí · báo giá sau khảo sát</span>
                <Link href={s.href ?? `${QUOTE_URL}?loai=${SERVICE_INFO[s.type].param}`}>
                  {s.cta}
                  <Icon name="chevron" size={14} />
                </Link>
              </span>
            </div>
          ))}
        </div>
      </section>

      <ServiceSteps
        title="Quy trình 5 bước"
        steps={[
          { icon: 'phone', b: 'Gửi yêu cầu', text: 'Điền form (kèm tối đa 3 ảnh hiện trạng) hoặc gọi hotline' },
          { icon: 'clock', b: 'Kỹ sư gọi lại', text: 'Trong 2 giờ làm việc để xác nhận và hẹn lịch' },
          { icon: 'pin', b: 'Khảo sát', text: 'Xem hiện trạng, đo đạc, đánh giá ánh sáng' },
          { icon: 'receipt', b: 'Báo giá', text: 'Bảng cây, vật tư và chi phí gửi qua Zalo' },
          { icon: 'shield', b: 'Thực hiện & bảo hành', text: 'Thi công hoặc chăm sóc, bảo hành cây theo chính sách' },
        ]}
      />

      <ServiceFaq
        items={[
          { q: 'Khảo sát có mất phí không?', a: 'Không. Khảo sát tại chỗ miễn phí; chi phí chỉ phát sinh khi bạn đồng ý với báo giá.' },
          { q: 'Bao lâu thì được gọi lại và nhận báo giá?', a: 'Kỹ sư gọi xác nhận trong 2 giờ làm việc sau khi bạn gửi yêu cầu. Báo giá chi tiết gửi qua Zalo sau 48 giờ kể từ buổi khảo sát.' },
          { q: 'Tôi ở xa thì có dùng được dịch vụ không?', a: <>Cây sống vẫn giao toàn quốc, xem <Link href="/chinh-sach/giao-hang">Chính sách giao hàng</Link>. Với khảo sát tại chỗ, thi công và chăm sóc định kỳ, kỹ sư sẽ xác nhận có đến được địa chỉ của bạn hay không khi gọi lại.</> },
          { q: 'Có cần đặt cọc không?', a: <>Cây lớn đặt trước và công trình sân vườn có thể cần đặt cọc, mức cụ thể ghi trong báo giá. Xem <Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>.</> },
          { q: 'Cây trồng xong bị chết thì sao?', a: <>Cây sống được bảo hành theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>; điều kiện áp dụng cho từng công trình được ghi rõ trong báo giá.</> },
          { q: 'Tôi chưa biết nên chọn dịch vụ nào?', a: <>Bạn cứ gửi yêu cầu và mô tả không gian, kỹ sư sẽ tư vấn khi gọi lại. Nếu chỉ cần chọn cây, xem trước <Link href="/goc-cham-cay">Góc chăm cây</Link> hoặc <Link href="/benh-cay">Bắt bệnh cho cây</Link>.</> },
        ]}
      />

      <ServiceCta
        title="Nhận tư vấn và báo giá"
        text="Gửi ảnh không gian của bạn, kỹ sư sẽ gọi lại để hẹn khảo sát"
        label="Đặt lịch khảo sát"
        href={QUOTE_URL}
      />
    </div>
  );
}
