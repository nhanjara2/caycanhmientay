import Link from 'next/link';
import { ADVISOR_URL, KINDS, SPACE_KINDS } from '@/lib/plant-advisor';
import { SERVICES_HUB_IMAGE } from '@/lib/services';
import { Breadcrumb } from './Blocks';
import { Icon } from './Icon';
import { phoneText, QUOTE_URL, SERVICE_PHONE, ServiceCards, ServiceCta, ServiceFaq, ServiceHero, ServiceSteps, ServiceTabs } from './ServiceParts';

/** Trang Dịch vụ sân vườn (/dich-vu): viết tay, chỉ ghi những gì shop cam kết trong form khảo sát — không số liệu, giá, đánh giá mẫu. */
export function ServicesHub() {
  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <div className="sv-crumb">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dịch vụ' }]} />
      </div>
      <ServiceTabs />
      <ServiceHero
        badge="Dịch vụ Cây Cảnh Miền Tây"
        title="Không gian xanh, không lo chăm sóc"
        text="Từ ban công vài mét vuông đến sân vườn và văn phòng: kỹ sư khảo sát, tư vấn cây hợp ánh sáng, thi công và chăm sóc cho bạn."
        primary={{ label: 'Đặt lịch khảo sát miễn phí', href: QUOTE_URL }}
        call={{ phone: SERVICE_PHONE, label: phoneText(SERVICE_PHONE) }}
        proof={[{ b: 'Từ 2019', text: 'làm cây cảnh công trình' }, { b: 'Gần 200', text: 'nhà vườn cùng hợp tác' }, { b: 'Miễn phí', text: 'khảo sát tại chỗ' }]}
        art="home"
        image={{ src: SERVICES_HUB_IMAGE, alt: 'Sân hiên nhiều cây xanh nhiệt đới trồng chậu' }}
        tag={{ b: 'Kỹ sư gọi lại trong 2 giờ làm việc', text: 'Báo giá gửi qua Zalo sau 48 giờ kể từ khảo sát' }}
      />

      <section className="sv-sec">
        <h2>Dịch vụ của chúng tôi</h2>
        <p className="sub">Mỗi dịch vụ có trang riêng: phạm vi công việc, các bước, cách tính giá và câu hỏi thường gặp. Khảo sát tại chỗ miễn phí.</p>
        <ServiceCards />
      </section>

      <section className="sv-sec">
        <div className="sv-panel sv-panel--wide pa-promo">
          <h2>Chưa biết nên trồng cây gì?</h2>
          <p>
            Dùng <b>Tư vấn chọn cây</b>: chọn loại không gian, trả lời vài câu hỏi (kích thước, ánh sáng, thời gian chăm, ngân sách),
            web gợi ý loại cây, số lượng và chiều cao cho từng vị trí. Có thể thêm cả bộ vào giỏ hoặc gửi phương án cho kỹ sư khảo sát.
          </p>
          <div className="pa-promo__kinds">
            {SPACE_KINDS.map((k) => (
              <Link key={k} href={`${ADVISOR_URL}?loai=${k}`}><Icon name={KINDS[k].icon} />{KINDS[k].name}</Link>
            ))}
          </div>
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
