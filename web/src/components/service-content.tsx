import Link from 'next/link';
import { ZALO_URL } from '@/lib/contact';
import { CAUSES } from '@/lib/diseases';
import { ADVISOR_URL, KINDS } from '@/lib/plant-advisor';
import { SERVICE_PAGES } from '@/lib/services';
import { STYLES } from '@/lib/service-labels';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { Icon, type IconName } from './Icon';
import type { ServiceContent } from './ServiceDetail';

// Nội dung 3 trang dịch vụ viết tay (Cây văn phòng có trang riêng: OfficePlants). Nguyên tắc như trang Dịch vụ:
// chỉ ghi điều form khảo sát / chủ shop đã xác nhận (khảo sát miễn phí, gọi lại trong 2 giờ làm việc, báo giá qua Zalo sau 48 giờ,
// từ 2019 làm cây công trình, gần 200 nhà vườn) — không bảng giá, số công trình hay đánh giá mẫu.

const CALLBACK = { icon: 'clock', b: 'Kỹ sư gọi lại', text: 'Trong 2 giờ làm việc để hỏi thêm và hẹn lịch' } as const;

export const GARDEN: ServiceContent = {
  type: 'garden',
  badge: 'Thiết kế & thi công',
  intro: 'Sân vườn nhà phố, biệt thự, ban công, sân thượng, tiểu cảnh. Kỹ sư đến xem nắng, gió, đất và thoát nước tại chỗ, đề xuất cây hợp từng vị trí, gửi báo giá rõ từng khoản rồi mới thi công.',
  proof: [{ b: 'Từ 2019', text: 'làm cây cảnh công trình' }, { b: 'Gần 200', text: 'nhà vườn cùng hợp tác' }, { b: 'Miễn phí', text: 'khảo sát tại chỗ' }],
  tag: { b: 'Khảo sát miễn phí', text: 'Báo giá gửi qua Zalo sau 48 giờ kể từ khảo sát' },
  fit: {
    title: 'Nhận làm những không gian nào',
    items: [
      { icon: 'home', b: 'Sân vườn nhà phố, biệt thự', text: 'Sân trước, sân sau, lối đi, góc thư giãn, hàng rào cây xanh.' },
      { icon: 'pot', b: 'Ban công, sân thượng', text: 'Chọn cây chịu nắng gió trên cao, chậu nhẹ, thoát nước tốt, không làm thấm sàn.' },
      { icon: 'terrarium', b: 'Tiểu cảnh, góc xanh trong nhà', text: 'Góc cầu thang, giếng trời, hành lang, góc phòng khách.' },
      { icon: 'veggie', b: 'Vườn rau, cây ăn trái tại nhà', text: 'Luống, thùng trồng rau sạch, cây ăn trái trong chậu hoặc trồng đất.' },
      { icon: 'trees', b: 'Quán cà phê, nhà hàng, khuôn viên', text: 'Cây cảnh quan, cây chậu trang trí, khu ngồi ngoài trời.' },
    ],
  },
  scope: {
    title: 'Dịch vụ gồm những gì',
    sub: 'Bạn chọn làm trọn gói hoặc chỉ một phần (ví dụ chỉ cần phương án và cây, tự trồng).',
    items: [
      { icon: 'pin', b: 'Khảo sát hiện trạng', text: 'Đo kích thước, xem hướng nắng, gió, nền đất, thoát nước và lối đưa cây vào (cầu thang, thang máy).' },
      { icon: 'leaf', b: 'Phương án bố trí cây', text: 'Chọn cây hợp nắng gió từng vị trí và theo phong cách bạn thích, dễ chăm, ít rụng lá nếu cần.' },
      { icon: 'receipt', b: 'Báo giá rõ từng khoản', text: 'Cây, quy cách, số lượng, đất – giá thể, chậu, vật tư, công trồng, vận chuyển tách dòng riêng.' },
      { icon: 'trees', b: 'Cung cấp cây', text: 'Cây từ vườn ươm tại Làng hoa Sa Đéc và các nhà vườn liên kết, chọn cây đồng đều trước khi giao.' },
      { icon: 'shovel', b: 'Thi công, trồng cây', text: 'Cải tạo đất, trồng cây, đặt chậu theo phương án đã thống nhất, dọn dẹp sau khi làm.' },
      { icon: 'check', b: 'Bàn giao, hướng dẫn chăm', text: 'Hướng dẫn tưới, bón theo từng loại cây; cần người chăm thì đăng ký chăm sóc định kỳ.' },
    ],
  },
  price: {
    title: 'Báo giá tính theo',
    items: [
      'Diện tích và hiện trạng (có cần cải tạo đất, làm thoát nước không)',
      'Loại cây, chiều cao và số lượng cây',
      'Chậu, đất – giá thể, vật tư trang trí đi kèm',
      'Khoảng cách vận chuyển và lối đưa cây vào công trình',
      'Có kèm chăm sóc sau bàn giao hay không',
    ],
    note: <>Không có bảng giá chung — mỗi không gian một khác, kỹ sư báo giá sau khi khảo sát. Công trình có thể cần đặt cọc, mức cụ thể ghi trong báo giá (xem <Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>).</>,
  },
  prepare: [
    'Ảnh hiện trạng không gian (form nhận tối đa 3 ảnh)',
    'Kích thước gần đúng (dài × rộng) và hướng nắng',
    'Phong cách bạn thích: nhiệt đới, tối giản, kiểu Nhật, có góc trồng rau…',
    'Ngân sách dự kiến và thời gian muốn hoàn thành',
  ],
  steps: [
    { icon: 'phone', b: 'Gửi yêu cầu', text: 'Điền form kèm ảnh hiện trạng hoặc gọi hotline' },
    CALLBACK,
    { icon: 'pin', b: 'Khảo sát miễn phí', text: 'Đo đạc, xem nắng, đất, thoát nước tại chỗ' },
    { icon: 'receipt', b: 'Phương án & báo giá', text: 'Gửi qua Zalo sau 48 giờ kể từ khảo sát' },
    { icon: 'shovel', b: 'Thi công & bàn giao', text: 'Theo lịch đã chốt, kèm hướng dẫn chăm' },
  ],
  faq: [
    { q: 'Khảo sát có mất phí không?', a: 'Không. Khảo sát tại chỗ miễn phí; chi phí chỉ phát sinh khi bạn đồng ý với báo giá.' },
    { q: 'Ban công nhỏ vài mét vuông có làm không?', a: <>Có. Nếu chỉ cần vài chậu, bạn cũng có thể tự chọn cây bằng <Link href={`${ADVISOR_URL}?loai=ban-cong`}>Tư vấn chọn cây cho ban công</Link> rồi mua trên web, giao toàn quốc.</> },
    { q: 'Tôi chỉ cần phương án và cây, tự trồng được không?', a: 'Được. Báo giá tách riêng cây, vật tư và công trồng — bạn chọn phần cần làm.' },
    { q: 'Cây trồng xong bị chết thì sao?', a: <>Cây sống được bảo hành theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link> ({WARRANTY_DAYS} ngày với cây mua lẻ); điều kiện cho từng công trình ghi rõ trong báo giá.</> },
    { q: 'Tôi ở xa thì có làm được không?', a: 'Cây vẫn giao toàn quốc. Với khảo sát và thi công tại chỗ, kỹ sư sẽ xác nhận có đến được địa chỉ của bạn hay không khi gọi lại.' },
  ],
  cta: { title: 'Nhận phương án cho sân vườn của bạn', text: 'Gửi ảnh hiện trạng, kỹ sư sẽ gọi lại để hẹn khảo sát miễn phí' },
};

export const CARE: ServiceContent = {
  type: 'care',
  badge: 'Chăm sóc định kỳ',
  intro: 'Kỹ sư đến chăm cây tại nhà, văn phòng, quán theo lịch hai bên thống nhất: kiểm tra cây, bón phân, cắt tỉa, phòng trừ sâu bệnh, thay đất, thay chậu — cây luôn khỏe mà bạn không phải tự lo.',
  proof: [{ b: 'Miễn phí', text: 'khảo sát, đánh giá cây' }, { b: 'Theo lịch', text: 'hằng tuần, 2 tuần hoặc hằng tháng' }, { b: '2 giờ', text: 'kỹ sư gọi lại (giờ làm việc)' }],
  tag: { b: 'Lịch chăm theo thỏa thuận', text: 'Phạm vi công việc và chi phí ghi rõ trong báo giá' },
  fit: {
    title: 'Phù hợp với',
    items: [
      { icon: 'home', b: 'Sân vườn nhà phố, biệt thự', text: 'Cắt tỉa hàng rào, cây bóng mát, thảm cỏ, cây chậu quanh nhà.' },
      { icon: 'pot', b: 'Ban công, sân thượng', text: 'Cây chậu phơi nắng gió, dễ khô đất, cần bón và thay giá thể định kỳ.' },
      { icon: 'plant', b: 'Văn phòng, sảnh tòa nhà', text: <>Cây của văn phòng bạn. Muốn thuê cây đã gồm chăm sóc, xem <Link href={SERVICE_PAGES.office.href}>Cho thuê cây văn phòng</Link>.</> },
      { icon: 'palm', b: 'Quán, nhà hàng, khách sạn', text: 'Giữ cây trang trí luôn đẹp, phát hiện sớm cây yếu để xử lý hoặc thay kịp thời.' },
    ],
  },
  scope: {
    title: 'Mỗi lần chăm gồm',
    sub: 'Kỹ sư làm theo tình trạng thực tế của từng cây; vật tư dùng thêm (phân, thuốc, giá thể, chậu) ghi rõ trong báo giá.',
    items: [
      { icon: 'search', b: 'Kiểm tra sức khỏe cây', text: 'Xem lá, thân, rễ, đất, độ ẩm; phát hiện sớm sâu bệnh, cây thiếu sáng hay úng nước.' },
      { icon: 'fertilizer', b: 'Bón phân đúng loại', text: 'Chọn phân theo loại cây, giai đoạn và mùa; không bón quá liều làm cháy rễ.' },
      { icon: 'tool', b: 'Cắt tỉa, tạo tán', text: 'Bỏ lá già, cành sâu, cành tạp; giữ dáng cây, hàng rào gọn gàng.' },
      { icon: 'pest', b: 'Phòng trừ sâu bệnh', text: 'Ưu tiên cách nhẹ nhàng (cắt bỏ phần bệnh, lau rửa, chế phẩm sinh học); dùng thuốc thì đúng nhãn và báo trước.' },
      { icon: 'soil', b: 'Xới đất, thay giá thể, thay chậu', text: 'Khi đất chai, cây chật rễ hoặc chậu nứt — làm ngay trong buổi chăm.' },
      { icon: 'drop', b: 'Tưới và dặn lịch tưới', text: 'Tưới trong buổi chăm và dặn lịch tưới, vị trí đặt cây hợp lý giữa các lần đến.' },
    ],
  },
  price: {
    title: 'Báo giá tính theo',
    items: [
      'Số cây, cỡ cây hoặc diện tích sân vườn',
      'Tần suất chăm: hằng tuần, 2 tuần / lần hay hằng tháng',
      'Vật tư (phân, thuốc, giá thể) đã gồm hay tính riêng',
      'Khoảng cách đến địa chỉ của bạn',
      'Thời hạn chăm sóc',
    ],
    note: 'Kỹ sư đánh giá cây khi khảo sát rồi gợi ý tần suất phù hợp; lịch chăm, công việc mỗi lần và chi phí ghi trong báo giá để hai bên thống nhất.',
  },
  prepare: [
    'Ảnh các cây cần chăm (form nhận tối đa 3 ảnh)',
    'Số cây gần đúng hoặc diện tích sân vườn',
    'Cây đang có vấn đề gì (vàng lá, sâu, chậm lớn…) nếu có',
    'Tần suất mong muốn và khung giờ tiện cho người đến chăm',
  ],
  steps: [
    { icon: 'phone', b: 'Gửi yêu cầu', text: 'Điền form kèm ảnh cây hoặc gọi hotline' },
    CALLBACK,
    { icon: 'search', b: 'Khảo sát, đánh giá cây', text: 'Xem từng cây, gợi ý tần suất chăm' },
    { icon: 'receipt', b: 'Báo giá & lịch chăm', text: 'Gửi qua Zalo sau 48 giờ kể từ khảo sát' },
    { icon: 'drop', b: 'Chăm theo lịch', text: 'Kỹ sư đến đúng lịch đã thống nhất' },
  ],
  faq: [
    { q: 'Cây không mua ở shop có chăm được không?', a: 'Được. Kỹ sư chăm mọi cây cảnh, cây sân vườn của bạn; cây nào cần xử lý riêng sẽ báo trước.' },
    { q: 'Giữa các lần chăm ai tưới cây?', a: 'Bạn tưới theo lịch kỹ sư dặn cho từng cây. Văn phòng nhiều cây, bật điều hòa cả ngày nên chọn chăm hằng tuần.' },
    { q: 'Có phun thuốc trong nhà, văn phòng không?', a: <>Kỹ sư ưu tiên cách nhẹ nhàng trước. Khi cần dùng thuốc sẽ báo trước, chọn loại phù hợp và làm đúng hướng dẫn trên nhãn — xem <Link href="/chinh-sach/thuoc-bvtv-an-toan">Hướng dẫn dùng thuốc BVTV an toàn</Link>.</> },
    { q: 'Tôi muốn tự chăm thì xem ở đâu?', a: <>Xem <Link href="/goc-cham-cay">Góc chăm cây</Link> và thư viện <Link href="/benh-cay">Bắt bệnh cho cây</Link>; cây mua trên web có lịch tưới, bón trong <Link href="/tai-khoan/lich-cham-cay">Lịch chăm cây</Link> của tài khoản.</> },
  ],
  cta: { title: 'Đặt lịch chăm sóc cây định kỳ', text: 'Gửi ảnh cây của bạn, kỹ sư sẽ gọi lại để hẹn khảo sát miễn phí' },
};

export const CLINIC: ServiceContent = {
  type: 'clinic',
  badge: 'Kỹ sư đến tận nơi',
  intro: 'Cây vàng lá, thối rễ, có sâu, nấm, héo không rõ lý do? Kỹ sư đến tận nơi xem cây, tìm đúng nguyên nhân, xử lý tại chỗ và hướng dẫn cách chăm để cây hồi phục.',
  proof: [{ b: '2 giờ', text: 'kỹ sư gọi lại (giờ làm việc)' }, { b: 'Miễn phí', text: 'khám lá bệnh tại cửa hàng' }, { b: 'Thư viện', text: 'bệnh cây có ảnh để tra trước' }],
  tag: { b: 'Gửi ảnh cây trước', text: 'Kỹ sư xem ảnh, nhiều trường hợp hướng dẫn được ngay' },
  fit: {
    title: 'Khi nào nên gọi kỹ sư',
    items: [
      { icon: 'alert', b: 'Cây xuống nhanh', text: 'Vàng, rụng lá hàng loạt, héo dù vẫn tưới, thân mềm nhũn.' },
      { icon: 'bug', b: 'Sâu bệnh lan rộng', text: 'Đã thử xử lý nhưng sâu, rệp, nấm vẫn quay lại hoặc lan sang cây khác.' },
      { icon: 'tree', b: 'Cây lớn, cây quý', text: 'Mai, bonsai, cây lâu năm, cây công trình — khó mang đi, cần xem tại chỗ.' },
      { icon: 'trees', b: 'Nhiều cây cùng bị', text: 'Cả vườn, cả dãy chậu cùng có triệu chứng — thường do đất, nước hoặc nắng.' },
    ],
  },
  scope: {
    title: 'Kỹ sư làm gì khi đến',
    items: [
      { icon: 'search', b: 'Chẩn đoán tại chỗ', text: 'Xem lá, thân, rễ, đất, nước tưới, ánh sáng và cách chăm hiện tại để tìm đúng nguyên nhân.' },
      { icon: 'tool', b: 'Xử lý ngay', text: 'Cắt bỏ phần bệnh, xử lý rễ, thay đất – thay chậu, phun thuốc phù hợp khi thật cần.' },
      { icon: 'receipt', b: 'Hướng dẫn chăm lại', text: 'Lịch tưới, bón, vị trí đặt cây và cách phòng để bệnh không quay lại.' },
      { icon: 'clock', b: 'Hẹn kiểm tra lại', text: 'Bệnh nặng hoặc nhiều cây thì hẹn buổi xem lại để theo dõi cây hồi phục.' },
    ],
  },
  price: {
    title: 'Chi phí tùy theo',
    items: [
      'Khoảng cách đến địa chỉ của bạn',
      'Số cây cần xử lý và mức độ bệnh',
      'Thuốc, phân, đất – giá thể, chậu dùng thêm',
    ],
    note: 'Kỹ sư xem ảnh và mô tả khi gọi lại, báo chi phí dự kiến trước khi đến.',
  },
  prepare: [
    'Ảnh cả cây, ảnh cận chỗ bị bệnh (lá cả hai mặt, thân, gốc) — form nhận tối đa 3 ảnh',
    'Cây bị từ khi nào, có lan sang cây khác không',
    'Cách chăm gần đây: tưới bao lâu một lần, mới bón phân, phun thuốc, thay chậu hay đổi chỗ không',
    'Cây đặt trong nhà hay ngoài trời, nắng nhiều hay ít',
  ],
  steps: [
    { icon: 'camera', b: 'Gửi ảnh & mô tả', text: 'Qua form (kèm 3 ảnh) hoặc nhắn Zalo' },
    { icon: 'clock', b: 'Kỹ sư gọi lại', text: 'Trong 2 giờ làm việc, xem ảnh, báo chi phí' },
    { icon: 'pin', b: 'Đến tận nơi', text: 'Theo lịch hẹn, chẩn đoán tại chỗ' },
    { icon: 'tool', b: 'Xử lý & hướng dẫn', text: 'Xử lý ngay, dặn cách chăm lại' },
    { icon: 'check', b: 'Theo dõi', text: 'Hẹn kiểm tra lại khi cần' },
  ],
  faq: [
    { q: 'Cây mua ở shop bị bệnh sau khi nhận?', a: <>Trong {WARRANTY_DAYS} ngày kể từ khi nhận, bạn gửi <Link href="/tai-khoan/bao-hanh">yêu cầu bảo hành</Link> kèm ảnh — shop đổi cây, gửi thuốc cứu cây hoặc hoàn tiền theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành</Link>.</> },
    { q: 'Có cần kỹ sư đến không, gửi ảnh được không?', a: <>Nhiều trường hợp xem ảnh là đủ: tra thư viện <Link href="/benh-cay">Bắt bệnh cho cây</Link> hoặc <a href={ZALO_URL} target="_blank" rel="noopener noreferrer">nhắn ảnh qua Zalo</a>. Kỹ sư sẽ nói rõ khi nào cần đến tận nơi.</> },
    { q: 'Thuốc có an toàn cho trẻ nhỏ, thú cưng không?', a: <>Kỹ sư ưu tiên cách xử lý ít độc, dặn rõ thời gian cách ly và cách để thuốc khi phải dùng. Xem thêm <Link href="/chinh-sach/thuoc-bvtv-an-toan">Hướng dẫn dùng thuốc BVTV an toàn</Link>.</> },
    { q: 'Cây đã chết có cứu được không?', a: 'Còn rễ hoặc thân còn xanh thì thường còn cơ hội. Gửi ảnh gốc, rễ để kỹ sư đánh giá trước khi hẹn đến.' },
  ],
  cta: { title: 'Cây đang có vấn đề?', text: 'Gửi ảnh cây, kỹ sư sẽ gọi lại trong 2 giờ làm việc' },
};

// ——— Phần riêng của từng trang ———

/** Sân vườn: tự lên phương án trước bằng Tư vấn chọn cây + phong cách nhận làm. */
export function GardenExtras() {
  const kinds = (['ban-cong', 'san-vuon', 'cong-trinh'] as const);
  return (
    <section className="sv-sec">
      <div className="sv-panel sv-panel--wide pa-promo">
        <h2>Muốn hình dung trước?</h2>
        <p>
          Dùng <b>Tư vấn chọn cây</b>: nhập kích thước, hướng nắng, thời gian chăm và ngân sách, web gợi ý loại cây, số lượng, chiều cao cho từng vị trí.
          Gửi phương án đó kèm yêu cầu khảo sát để kỹ sư làm tiếp.
        </p>
        <div className="pa-promo__kinds">
          {kinds.map((k) => <Link key={k} href={`${ADVISOR_URL}?loai=${k}`}><Icon name={KINDS[k].icon} />{KINDS[k].name}</Link>)}
        </div>
        <p style={{ marginTop: 4 }}>Phong cách thường làm: {STYLES.join(' · ')}.</p>
      </div>
    </section>
  );
}

/** Chăm sóc: gợi ý tần suất (kỹ sư chốt khi khảo sát). */
export function CareExtras() {
  const FREQ: { icon: IconName; b: string; text: string }[] = [
    { icon: 'clock', b: 'Hằng tuần', text: 'Văn phòng, sảnh nhiều cây, bật điều hòa cả ngày; cây trang trí quán cần luôn đẹp.' },
    { icon: 'drop', b: '2 tuần / lần', text: 'Nhà phố, ban công có nhiều chậu; cây đã ổn định, chủ nhà tự tưới được.' },
    { icon: 'trees', b: 'Hằng tháng', text: 'Sân vườn trồng đất đã ổn định: cắt tỉa, bón phân, kiểm tra sâu bệnh định kỳ.' },
  ];
  return (
    <section className="sv-sec">
      <h2>Chọn tần suất chăm</h2>
      <p className="sub">Gợi ý chung — kỹ sư xem cây thực tế rồi tư vấn tần suất phù hợp nhất.</p>
      <div className="sd-fit sd-fit--3">
        {FREQ.map((x) => (
          <div key={x.b} className="sd-fit__i">
            <span className="sd-ic"><Icon name={x.icon} /></span>
            <span><b>{x.b}</b>{x.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Chữa cây: cách nhanh, miễn phí trước khi đặt lịch + các nhóm nguyên nhân (nối sang thư viện bệnh cây). */
export function ClinicExtras() {
  const QUICK: { icon: IconName; b: string; text: string; href: string; ext?: boolean }[] = [
    { icon: 'search', b: 'Tra thư viện bệnh cây', text: 'Có ảnh triệu chứng, cách xử lý, sản phẩm gợi ý', href: '/benh-cay' },
    { icon: 'chat', b: 'Nhắn ảnh qua Zalo', text: 'Gửi ảnh cây cho kỹ sư xem trước', href: ZALO_URL, ext: true },
    { icon: 'pin', b: 'Mang lá bệnh đến cửa hàng', text: 'Khám lá bệnh miễn phí tại cửa hàng', href: '/he-thong-cua-hang' },
    { icon: 'shield', b: `Cây mua ở shop dưới ${WARRANTY_DAYS} ngày`, text: 'Gửi yêu cầu bảo hành cây', href: '/tai-khoan/bao-hanh' },
  ];
  return (
    <>
      <section className="sv-sec">
        <h2>Thử cách nhanh, miễn phí trước</h2>
        <div className="sd-quick">
          {QUICK.map((q) => {
            const inner = <><span className="sd-ic"><Icon name={q.icon} /></span><span><b>{q.b}</b>{q.text}</span><Icon name="chevron" size={16} /></>;
            return q.ext
              ? <a key={q.b} href={q.href} target="_blank" rel="noopener noreferrer" className="sd-quick__i">{inner}</a>
              : <Link key={q.b} href={q.href} className="sd-quick__i">{inner}</Link>;
          })}
        </div>
      </section>
      <section className="sv-sec sd-white">
        <h2>Những vấn đề kỹ sư thường xử lý</h2>
        <p className="sub">Bấm từng nhóm để xem các bệnh cụ thể kèm ảnh trong thư viện Bắt bệnh cho cây.</p>
        <div className="sd-causes">
          {CAUSES.map((c) => (
            <Link key={c.key} href={`/benh-cay?nguyen_nhan=${c.key}#danh-sach`} className="sd-cause">
              <b>{c.name}</b>
              <span>{c.hint}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
