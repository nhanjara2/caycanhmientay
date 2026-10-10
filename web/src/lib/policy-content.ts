// Nội dung các trang chính sách / giới thiệu (PolicyLayout) — render ở components/PolicyArticle.tsx.
// Chữ trong đoạn: `**đậm**`, `[chữ](/duong-dan)` (nội bộ, https:// hoặc tel:) và địa chỉ https:// trần được tự thành link.
// Số liệu có trong hệ thống (số ngày bảo hành, phí giao, ngưỡng miễn phí, vùng giao, khung giờ) lấy từ cùng nguồn với giỏ hàng / thanh toán
// nên đổi ở Cài đặt giao hàng là trang này đổi theo. Ghi nhớ khi sửa: chỉ viết điều hệ thống thật sự làm.
import { CARE_PHONE, formatPhone, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, SUPPORT_PHONE, ZALO_URL } from './contact';
import { money } from './format';
import { SLOT_CLOSE_BEFORE_END_MIN, slotTime, type ShippingConfig } from './shipping';
import { WARRANTY_DAYS } from './warranty-labels';

export type Block =
  | string // đoạn văn
  | { ul: string[] }
  | { ol: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { note: string }; // hộp lưu ý (vx-callout)

export type Section = { id?: string; h: string; blocks: Block[] };

/** Dữ liệu đọc lúc dựng trang, cho các trang có số liệu lấy từ cài đặt (giao hàng). */
export type PolicyContext = { shipping: ShippingConfig };

type Body = Section[] | ((ctx: PolicyContext) => Section[]);

const phone = (p: string) => `[${formatPhone(p)}](tel:${p})`;
const zalo = `[Zalo ${formatPhone(SALES_PHONE)}](${ZALO_URL})`;
const HOURS = '8:00 – 21:00';

/** Hộp liên hệ ở cuối trang. */
const contact = (who: 'sales' | 'care' | 'support' = 'support'): Block => ({
  note: who === 'sales'
    ? `Cần tư vấn mua hàng? Gọi ${phone(SALES_PHONE)} (Nhân) hoặc nhắn ${zalo}, ${HOURS}.`
    : who === 'care'
      ? `Cần tư vấn chăm cây, bắt bệnh? Gọi ${phone(CARE_PHONE)} (Thịnh) hoặc nhắn ${zalo}, ${HOURS}.`
      : `Cần hỗ trợ, góp ý hoặc khiếu nại? Gọi ${phone(SUPPORT_PHONE)} (Trâm), nhắn ${zalo} hoặc gửi email ${SHOP_EMAIL}, ${HOURS}.`,
});

// ---- Giấy phép kinh doanh ------------------------------------------------------------------------------------

const GIAY_PHEP: Section[] = [
  { h: 'Thông tin đăng ký kinh doanh', blocks: [
    'Cây Cảnh Miền Tây công bố thông tin đăng ký kinh doanh để bạn yên tâm khi mua hàng.',
    { table: { head: ['Thông tin', 'Nội dung'], rows: [
      ['Tên gọi', 'Cây Cảnh Miền Tây'],
      ['Người chịu trách nhiệm', 'Lê Hoài Nhân'],
      ['Số đăng ký kinh doanh (ĐKKD)', '087096010726, cấp tháng 04/2026'],
      ['Cơ quan thuế quản lý', 'Thuế cơ sở 6 tỉnh Đồng Tháp'],
      ['Địa chỉ', SHOP_ADDRESS],
      ['Điện thoại', `${phone(SALES_PHONE)} (tư vấn mua hàng)`],
      ['Email', SHOP_EMAIL],
    ] } },
  ] },
  { h: 'Lĩnh vực kinh doanh', blocks: [
    { ul: [
      '**Cây cảnh:** cây cảnh công trình, cây cảnh văn phòng, cây cảnh giống.',
      '**Thuốc bảo vệ thực vật, phân bón, vật tư làm vườn:** chậu, đất – giá thể, dụng cụ, hạt giống.',
      '**Cung cấp sỉ:** cây cảnh và vật tư cho đối tác dịch vụ cảnh quan, công trình và buôn bán ([trang Đối tác sỉ](/doi-tac)). Từ tháng 10/2026 shop không còn nhận thi công, chăm sóc hay cho thuê cây.',
    ] },
  ] },
  { h: 'Giấy phép chuyên ngành', blocks: [
    '**Thuốc bảo vệ thực vật.** Cây Cảnh Miền Tây đủ điều kiện buôn bán thuốc bảo vệ thực vật. Mọi sản phẩm thuốc trên website đều ghi số đăng ký, hoạt chất, liều pha và thời gian cách ly; thuốc chưa đủ thông tin này không được đăng bán.',
    '**Website thương mại điện tử.** Website đã được thông báo với Bộ Công Thương theo quy định.',
    { note: `Cần đối chiếu bản giấy tờ gốc? Gọi ${phone(SUPPORT_PHONE)} hoặc ghé Vườn ươm tại ${SHOP_ADDRESS} ([xem bản đồ và giờ mở cửa](/he-thong-cua-hang)).` },
  ] },
  { h: 'Nơi đọc thêm', blocks: [
    { ul: [
      '[Quy chế hoạt động](/chinh-sach/quy-che-hoat-dong): quy trình giao dịch, an toàn thanh toán, giải quyết khiếu nại.',
      '[Chính sách bảo mật dữ liệu cá nhân](/chinh-sach/bao-mat): cách chúng tôi dùng và bảo vệ dữ liệu của bạn.',
    ] },
  ] },
];

// ---- Quy chế hoạt động ---------------------------------------------------------------------------------------

const QUY_CHE: Section[] = [
  { h: 'Nguyên tắc chung', blocks: [
    'Quy chế này áp dụng cho website **caycanhmientay.com** (sau đây gọi là "website") do **Cây Cảnh Miền Tây** (sau đây gọi là "shop") vận hành, người chịu trách nhiệm là ông Lê Hoài Nhân. Thông tin đăng ký kinh doanh xem tại [Giấy phép kinh doanh](/chinh-sach/giay-phep-kinh-doanh).',
    { ul: [
      'Website là nơi shop **bán sỉ** cây cảnh, thuốc bảo vệ thực vật (BVTV), phân bón, vật tư làm vườn cho đối tác (đơn vị dịch vụ cảnh quan, công trình, cửa hàng / đại lý) và nhận yêu cầu báo giá sỉ. Hàng hóa trên website do shop bán; website không phải sàn cho người bán khác.',
      'Các điểm cung cấp của đối tác trong trang [Hệ thống cửa hàng & vườn](/he-thong-cua-hang) chỉ để bạn tham khảo địa chỉ, không bán qua website này.',
      'Shop hoạt động theo pháp luật Việt Nam về thương mại điện tử, bảo vệ quyền lợi người tiêu dùng, bảo vệ thực vật và bảo vệ dữ liệu cá nhân.',
    ] },
  ] },
  { h: 'Quy định chung khi sử dụng website', blocks: [
    { ul: [
      'Bạn xem sản phẩm và đặt hàng không cần tài khoản. Các chức năng như viết đánh giá, đặt câu hỏi, lưu yêu thích, gửi yêu cầu bảo hành hay xem Vườn của tôi cần đăng nhập bằng số điện thoại (mã OTP) hoặc tài khoản Google.',
      'Thông tin bạn cung cấp (họ tên, số điện thoại, địa chỉ) phải đúng sự thật để shop giao hàng và hỗ trợ bạn.',
      'Không được: đặt hàng giả; lập nhiều tài khoản để lấy quà, mã giảm giá nhiều lần; gửi nội dung quảng cáo, chứa số điện thoại hoặc đường link, xúc phạm, sai sự thật; can thiệp trái phép vào hệ thống hoặc thu thập dữ liệu hàng loạt.',
      'Shop có quyền từ chối phục vụ, hủy đơn hoặc khóa tài khoản khi phát hiện vi phạm.',
    ] },
    'Chi tiết xem [Điều khoản sử dụng](/chinh-sach/dieu-khoan).',
  ] },
  { h: 'Quy trình giao dịch', blocks: [
    { ol: [
      '**Chọn hàng:** chọn sản phẩm, quy cách, số lượng rồi bấm **Thêm vào giỏ** hoặc **Mua ngay**.',
      '**Thanh toán:** vào Giỏ hàng, nhập họ tên, số điện thoại, chọn **Giao tận nơi** (kèm địa chỉ) hoặc **Nhận tại vườn**, nhập mã giảm giá nếu có và chọn phương thức thanh toán. Đơn có thuốc BVTV cần xác nhận đã đọc hướng dẫn an toàn.',
      '**Đặt hàng:** hệ thống tạo đơn và mã đơn. Giá, phí giao hàng, mã giảm giá và tồn kho được tính lại ngay lúc này; số tiền cuối cùng hiện trước khi bạn bấm xác nhận.',
      '**Shop xác nhận:** shop gọi hoặc nhắn xác nhận đơn trong 30 phút (' + HOURS + '). Đơn có hiệu lực khi shop xác nhận.',
      '**Chuẩn bị và giao:** shop chuẩn bị hàng, gửi ảnh cây thật trước khi giao với cây sống, rồi giao tận nơi hoặc giữ hàng chờ bạn nhận tại vườn.',
      '**Nhận hàng:** kiểm tra hàng, thanh toán (nếu chọn tiền mặt), nhận điểm thưởng. Cây sống được [bảo hành](/chinh-sach/bao-hanh-cay) ' + WARRANTY_DAYS + ' ngày.',
    ] },
    'Bạn theo dõi đơn ở **Tài khoản → Đơn hàng** qua các bước: Đặt hàng → Xác nhận → Chuẩn bị cây → Đang giao → Đã giao. Có thay đổi quan trọng, bạn nhận thông báo trên website (biểu tượng chuông) và có thể qua Zalo hoặc email.',
    { ul: [
      'Shop có thể từ chối hoặc hủy đơn khi hết hàng, thông tin giá hiển thị sai do lỗi hệ thống, không liên lạc được với bạn hoặc nghi ngờ gian lận. Đơn đã thanh toán sẽ được hoàn tiền.',
      'Bạn muốn hủy đơn: liên hệ shop trước khi đơn chuyển sang "Đang giao". Xem [Chính sách đổi trả](/chinh-sach/doi-tra).',
    ] },
  ] },
  { h: 'Giá, thanh toán, giao nhận, bảo hành', blocks: [
    { ul: [
      'Giá niêm yết bằng đồng Việt Nam. Sản phẩm hiển thị đúng chủng loại, quy cách, giá; với thuốc BVTV có thêm số đăng ký, hoạt chất, liều pha, thời gian cách ly.',
      'Ảnh minh họa (nếu có) được ghi nguồn tại [Nguồn ảnh minh họa](/chinh-sach/nguon-anh).',
      'Phương thức thanh toán: [Chính sách thanh toán](/chinh-sach/thanh-toan). Phí và thời gian giao: [Chính sách giao hàng](/chinh-sach/giao-hang).',
      'Cây sống bảo hành ' + WARRANTY_DAYS + ' ngày: [Chính sách bảo hành cây](/chinh-sach/bao-hanh-cay). Vật tư, thuốc, phân bón: [Chính sách đổi trả](/chinh-sach/doi-tra).',
      'Cây lớn đặt trước và công trình sân vườn: [Chính sách đặt cọc](/chinh-sach/dat-coc).',
    ] },
  ] },
  { h: 'Bảo đảm an toàn giao dịch', blocks: [
    { ul: [
      'Tài khoản được xác thực bằng số điện thoại (mã OTP dùng một lần, hết hạn sau 5 phút) hoặc bằng tài khoản Google; phiên đăng nhập được bảo vệ bằng cookie riêng.',
      'Website không thu thập và không lưu số thẻ, mã CVV, mật khẩu hay mã OTP của ngân hàng. Shop không bao giờ nhờ bạn cung cấp những thông tin đó.',
      'Ảnh bạn gửi để bảo hành, xin báo giá chỉ bạn và nhân viên xử lý mới xem được.',
      'Nhân viên shop chỉ truy cập được phần việc của mình (chăm sóc khách hàng, kho, kỹ sư, giao hàng) theo phân quyền.',
      'Bạn nên đăng xuất khi dùng máy chung. Nghi ngờ tài khoản bị người khác dùng, hãy gọi ngay hotline bên dưới.',
    ] },
  ] },
  { h: 'Bảo vệ thông tin cá nhân', blocks: [
    'Shop chỉ thu thập thông tin cần cho việc bán hàng, giao hàng, bảo hành và chăm sóc khách hàng; không bán dữ liệu cá nhân của bạn. Xem đầy đủ tại [Chính sách bảo mật dữ liệu cá nhân](/chinh-sach/bao-mat).',
  ] },
  { h: 'Giải quyết khiếu nại, tranh chấp', blocks: [
    { ol: [
      `**Gửi phản ánh:** gọi ${phone(SUPPORT_PHONE)} (Trâm), nhắn ${zalo} hoặc gửi email ${SHOP_EMAIL} (${HOURS}), kèm mã đơn và ảnh nếu có. Với cây sống bị hư, dùng **Tài khoản → Bảo hành cây** để kỹ sư phản hồi trong 24 giờ.`,
      '**Shop xem xét:** nhân viên liên hệ bạn để làm rõ sự việc và đề xuất hướng xử lý (đổi hàng, hỗ trợ, hoàn tiền hoặc giải thích lý do từ chối).',
      '**Chưa thống nhất:** hai bên tiếp tục thương lượng trên tinh thần thiện chí. Nếu vẫn không thống nhất, bạn có quyền gửi khiếu nại tới cơ quan quản lý nhà nước có thẩm quyền hoặc khởi kiện tại Tòa án theo quy định của pháp luật Việt Nam.',
    ] },
    contact('support'),
  ] },
  { h: 'Hiệu lực và sửa đổi', blocks: [
    'Quy chế có hiệu lực từ ngày đăng trên website. Khi cần sửa đổi, shop đăng bản mới tại trang này kèm ngày cập nhật; bạn tiếp tục sử dụng website sau thời điểm đó nghĩa là đồng ý với bản mới.',
  ] },
];

// ---- Đội ngũ chuyên môn --------------------------------------------------------------------------------------

const DOI_NGU: Section[] = [
  { h: 'Ai đứng sau Cây Cảnh Miền Tây', blocks: [
    'Cây Cảnh Miền Tây là cơ sở của ông **Lê Hoài Nhân** (người chịu trách nhiệm nội dung website), hoạt động từ năm 2007 tại Làng Hoa Sa Đéc, Đồng Tháp, cùng gần 200 nhà vườn ở miền Nam và Trung Nam Bộ ([đọc phần Giới thiệu](/chinh-sach/gioi-thieu)).',
    'Mỗi nhu cầu có một đầu mối riêng để bạn không phải chờ chuyển máy:',
    { table: { head: ['Bạn cần', 'Gọi', 'Phụ trách'], rows: [
      ['Tư vấn mua hàng', phone(SALES_PHONE), 'Nhân'],
      ['Tư vấn chăm cây, bắt bệnh', phone(CARE_PHONE), 'Thịnh'],
      ['Góp ý, khiếu nại, bảo hành', phone(SUPPORT_PHONE), 'Trâm'],
    ] } },
    `Giờ làm việc ${HOURS}. Bạn cũng nhắn được qua ${zalo}.`,
  ] },
  { h: 'Kỹ sư kiểm duyệt nội dung', blocks: [
    'Mọi nội dung chăm cây, bắt bệnh và hướng dẫn dùng thuốc trên website đều được kỹ sư nông nghiệp kiểm duyệt trước khi đăng. Bài đã kiểm duyệt có nhãn **Đã kiểm duyệt** kèm tên kỹ sư.',
    { ul: [
      '[Góc chăm cây](/goc-cham-cay): bài hướng dẫn và video chăm sóc từng loại cây.',
      '[Bắt bệnh cho cây](/benh-cay): thư viện triệu chứng, nguyên nhân và cách xử lý.',
      '[Hướng dẫn dùng thuốc BVTV an toàn](/chinh-sach/thuoc-bvtv-an-toan).',
    ] },
    'Quy định kiểm duyệt chi tiết xem tại [Chính sách nội dung](/chinh-sach/noi-dung).',
  ] },
  { h: 'Bạn nhận tư vấn bằng cách nào', blocks: [
    { ul: [
      '**Hỏi trên trang sản phẩm:** đặt câu hỏi ở mục Hỏi đáp, kỹ sư trả lời trong 2 giờ làm việc và báo cho bạn khi có trả lời.',
      '**Hỏi qua Zalo:** kỹ sư giải đáp miễn phí cho mọi cây bạn đã mua.',
      '**Cây bị bệnh, héo, rụng lá:** gửi ảnh ở **Tài khoản → Bảo hành cây** (trong ' + WARRANTY_DAYS + ' ngày kể từ khi nhận), kỹ sư phản hồi trong 24 giờ.',
      '**Mua số lượng lớn, công trình:** [gửi yêu cầu báo giá sỉ](/bao-gia-si) kèm danh sách cây hoặc ảnh bảng khối lượng.',
      '**Đến tận nơi:** mang mẫu lá hoặc ảnh cây tới Vườn ươm để kỹ sư xem ([địa chỉ và giờ mở cửa](/he-thong-cua-hang)).',
    ] },
    contact('care'),
  ] },
];

// ---- Giao hàng (số liệu lấy từ Cài đặt giao hàng) ------------------------------------------------------------

function giaoHang({ shipping: s }: PolicyContext): Section[] {
  const zone = s.plantZoneEnabled
    ? `**Cây sống** giao tận nơi trong bán kính **${s.plantZoneKm} km** quanh cửa hàng gần nhất. Địa chỉ ở xa hơn, bạn chọn **Nhận tại vườn** hoặc liên hệ shop để được tư vấn.`
    : '**Cây sống** giao tận nơi **toàn quốc**, đóng khung chống dập.';
  const days = s.daysAhead <= 1 ? 'trong ngày hôm nay' : `trong ${s.daysAhead} ngày tới`;
  return [
    { h: 'Phạm vi giao hàng', blocks: [
      { ul: [
        zone,
        '**Thuốc BVTV, phân bón, chậu, đất – giá thể, dụng cụ, hạt giống** giao tận nơi toàn quốc.',
        `**Nhận tại vườn:** chọn **Nhận tại vườn** ở bước thanh toán, không tính phí giao. Vườn ươm Cây Cảnh Miền Tây tại ${SHOP_ADDRESS} ([bản đồ, giờ mở cửa](/he-thong-cua-hang)). Shop giữ hàng 3 ngày và nhắn Zalo khi cây sẵn sàng.`,
      ] },
    ] },
    { h: 'Giá lẻ, combo 2 cây, giá sỉ công trình', blocks: [
      'Mua 1 cây cũng đặt được, tính **giá lẻ**. Mỗi 2 cây cùng quy cách tính **giá combo 2 cây** — giỏ hàng tự tính, không cần nhập mã. Đơn có giá trị lớn dùng được [mã giảm giá đang áp dụng](/khuyen-mai) (nhập ở bước thanh toán, mỗi đơn một mã). Cần số lượng lớn cho công trình hoặc quy cách đặc biệt, [gửi yêu cầu báo giá sỉ](/bao-gia-si).',
    ] },
    { h: 'Phí giao hàng', blocks: [
      { table: { head: ['Nhóm hàng', 'Phí giao', 'Miễn phí khi tiền hàng từ'], rows: [
        ['Cây sống', money(s.plant.fee), money(s.plant.freeFrom)],
        ['Vật tư (thuốc BVTV, phân bón, chậu, đất, dụng cụ, hạt giống)', money(s.supply.fee), money(s.supply.freeFrom)],
        ['Nhận tại vườn', 'Miễn phí', '—'],
      ] } },
      { ul: [
        'Đơn có cả cây sống và vật tư: phí tính riêng cho từng nhóm, mỗi nhóm đủ mức miễn phí thì nhóm đó không mất phí.',
        'Mức miễn phí tính trên tiền hàng của nhóm đó, trước khi trừ mã giảm giá.',
        'Phí hiển thị ở giỏ hàng và trang thanh toán trước khi bạn bấm đặt hàng; không phát sinh thêm phí ẩn.',
      ] },
    ] },
    { h: 'Thời gian giao hàng', blocks: [
      s.slotsEnabled
        ? `Ở bước thanh toán, bạn chọn ngày giao ${days} và một trong các khung giờ sau. Khung đã đủ đơn hiển thị **Đã kín**; mỗi khung đóng nhận đơn trước giờ kết thúc ${SLOT_CLOSE_BEFORE_END_MIN / 60} tiếng.`
        : `Shop gọi hoặc nhắn xác nhận đơn trong 30 phút (${HOURS}) và báo thời gian dự kiến nhận hàng. Thời gian thực tế phụ thuộc khoảng cách và đơn vị vận chuyển; shop không hẹn khung giờ cố định cho từng đơn.`,
      ...(s.slotsEnabled ? [{ ul: s.slots.map((x) => slotTime(x)) } as Block] : []),
    ] },
    { h: 'Đóng gói và giao cây sống', blocks: [
      { ul: [
        'Cây được đóng khung chống dập khi vận chuyển.',
        'Shop gửi **ảnh cây thật** trước khi giao để bạn xem; cây giao đúng loại và quy cách bạn đã chọn.',
        'Cây lớn giao bằng xe tải nhỏ có người khiêng và đặt đúng vị trí (xem [Chính sách đặt cọc](/chinh-sach/dat-coc) với cây lớn đặt trước).',
      ] },
    ] },
    { h: 'Kiểm tra khi nhận hàng', blocks: [
      { ul: [
        'Nên **quay video hoặc chụp ảnh lúc mở hàng**, nhất là với cây sống. Đây là căn cứ để kỹ sư xử lý nhanh nếu cây dập, gãy hay khác với đơn.',
        'Cây dập, gãy lúc nhận: gửi yêu cầu ở **Tài khoản → Bảo hành cây** ngay trong ngày nhận ([Chính sách bảo hành](/chinh-sach/bao-hanh-cay)).',
        'Giao sai, thiếu hoặc hư hỏng vật tư: xem [Chính sách đổi trả](/chinh-sach/doi-tra).',
        'Chọn tiền mặt khi nhận hàng thì thanh toán cho người giao sau khi bạn kiểm tra hàng.',
      ] },
    ] },
    { h: 'Theo dõi đơn, thay đổi và giao không thành công', blocks: [
      { ul: [
        'Theo dõi đơn ở **Tài khoản → Đơn hàng**: Đặt hàng → Xác nhận → Chuẩn bị cây → Đang giao → Đã giao. Khi đơn bắt đầu giao và khi người giao đến nơi, tài khoản của bạn nhận thông báo.',
        'Cần đổi địa chỉ hoặc thời gian nhận: gọi shop **trước khi đơn chuyển sang "Đang giao"**.',
        'Người giao gọi mà không liên lạc được hoặc không có người nhận: đơn quay về shop, nhân viên liên hệ bạn để hẹn lại.',
      ] },
      contact('sales'),
    ] },
  ];
}

// ---- Bảo hành cây --------------------------------------------------------------------------------------------

const BAO_HANH: Section[] = [
  { h: 'Phạm vi và thời hạn', blocks: [
    { ul: [
      `Bảo hành áp dụng cho **cây sống** mua tại Cây Cảnh Miền Tây, trong **${WARRANTY_DAYS} ngày** kể từ khi đơn chuyển sang "Đã giao".`,
      'Thuốc BVTV, phân bón, chậu, đất, dụng cụ và các vật tư khác không thuộc chính sách này; xem [Chính sách đổi trả](/chinh-sach/doi-tra).',
      'Mỗi cây có một yêu cầu bảo hành đang xử lý tại một thời điểm.',
    ] },
  ] },
  { h: 'Trường hợp được bảo hành', blocks: [
    'Cây có một trong các biểu hiện sau sau khi nhận:',
    { ul: ['Lá vàng bất thường', 'Lá mềm, rũ, héo', 'Đốm nâu trên lá', 'Rụng lá', 'Thối gốc', 'Có sâu, rệp', 'Dập, gãy khi nhận'] },
    'Kỹ sư xem ảnh để xác định nguyên nhân. Nếu cây hư do chăm sóc sau khi nhận (ví dụ tưới úng, cháy nắng, đặt nơi không phù hợp) hoặc do yếu tố bên ngoài (thời tiết cực đoan, thú cưng phá), kỹ sư có thể từ chối bảo hành và **nêu rõ lý do** cho bạn.',
  ] },
  { h: 'Cách gửi yêu cầu', blocks: [
    { ol: [
      'Đăng nhập bằng số điện thoại đã đặt hàng, vào **Tài khoản → [Bảo hành cây](/tai-khoan/bao-hanh)**.',
      'Chọn cây cần bảo hành (chỉ hiện cây còn trong thời hạn).',
      'Chụp **3 ảnh** theo gợi ý: toàn cây (cả chậu), cận lá bệnh (mặt trên và mặt dưới), gốc và mặt đất. Cần ít nhất 1 ảnh. Sau đó chọn biểu hiện và mô tả thêm.',
      'Bấm **Gửi yêu cầu**. Bạn nhận mã yêu cầu dạng BH-0012 và theo dõi kết quả ngay trong trang này.',
    ] },
    { note: 'Giữ nguyên cây, chưa cắt lá bệnh hay thay đất trước khi kỹ sư xem ảnh. Nên giữ lại video, ảnh lúc nhận hàng.' },
  ] },
  { h: 'Kỹ sư xử lý và các hướng giải quyết', blocks: [
    'Kỹ sư xem ảnh và **phản hồi trong 24 giờ**. Kết quả là một trong bốn hướng:',
    { table: { head: ['Hướng xử lý', 'Bạn nhận được'], rows: [
      ['Đổi cây mới', 'Shop tạo đơn đổi 0đ, giao lại cùng địa chỉ cho bạn.'],
      ['Cứu cây', 'Hướng dẫn cứu cây từng bước, kèm vật tư tặng (chế phẩm sinh học Trichoderma) trong đơn 0đ.'],
      ['Hoàn tiền', 'Shop ghi nhận số tiền hoàn, chuyển khoản cho bạn và báo khi đã hoàn tất.'],
      ['Từ chối', 'Kỹ sư ghi rõ lý do để bạn hiểu và chăm cây đúng cách.'],
    ] } },
    'Mỗi thay đổi về yêu cầu của bạn đều có thông báo trên website (biểu tượng chuông), và qua Zalo hoặc email khi có cấu hình.',
  ] },
  { h: 'Lưu ý', blocks: [
    { ul: [
      'Hoàn tiền thực hiện theo [Chính sách thanh toán](/chinh-sach/thanh-toan).',
      'Cần trao đổi trực tiếp, bạn mang cây hoặc hóa đơn tới Vườn ươm để được hỗ trợ ([xem địa chỉ](/he-thong-cua-hang)).',
    ] },
    contact('support'),
  ] },
];

// ---- Đổi trả -------------------------------------------------------------------------------------------------

const DOI_TRA: Section[] = [
  { h: 'Phạm vi', blocks: [
    { ul: [
      '**Vật tư:** thuốc BVTV, phân bón, chậu, đất – giá thể, dụng cụ, hạt giống, sản phẩm trang trí.',
      '**Cây sống:** hư hỏng, héo, bệnh được xử lý theo [Chính sách bảo hành cây](/chinh-sach/bao-hanh-cay) (' + WARRANTY_DAYS + ' ngày). Vì là hàng tươi sống, shop không nhận đổi trả cây đã giao vì lý do đổi ý.',
    ] },
  ] },
  { h: 'Điều kiện đổi trả vật tư', blocks: [
    'Bạn được đổi trả trong **7 ngày** kể từ khi nhận hàng nếu:',
    { ul: [
      'Sản phẩm còn nguyên tem, nhãn, chưa mở bao bì và chưa sử dụng.',
      'Có mã đơn hàng (hoặc hóa đơn) để shop đối chiếu.',
      'Sản phẩm đã mở hoặc đã dùng chỉ được xử lý khi do lỗi của sản phẩm (mục tiếp theo).',
    ] },
  ] },
  { h: 'Giao sai, thiếu, hàng lỗi', blocks: [
    'Với các trường hợp sau, bạn báo shop **ngay khi nhận hàng** (kèm ảnh, video mở hàng và mã đơn):',
    { ul: [
      'Giao sai sản phẩm hoặc quy cách so với đơn đặt.',
      'Thiếu hàng so với đơn.',
      'Sản phẩm hư hỏng, rách bao bì, hết hạn dùng hoặc không đúng như thông tin trên website.',
    ] },
    'Shop đổi sản phẩm đúng hoặc hoàn tiền, và chịu phí vận chuyển đổi trả khi lỗi thuộc về shop.',
  ] },
  { h: 'Cách gửi yêu cầu', blocks: [
    { ol: [
      `Nhắn ${zalo} hoặc gọi ${phone(SUPPORT_PHONE)} (Trâm), nêu mã đơn và gửi ảnh sản phẩm.`,
      'Nhân viên xác nhận yêu cầu và hướng dẫn cách gửi hàng về hoặc đổi trực tiếp.',
      'Bạn cũng có thể mang sản phẩm và hóa đơn tới Vườn ươm để đổi trả ([địa chỉ, giờ mở cửa](/he-thong-cua-hang)).',
      'Shop kiểm tra hàng nhận lại, rồi đổi sản phẩm hoặc hoàn tiền.',
    ] },
  ] },
  { h: 'Hoàn tiền', blocks: [
    { ul: [
      'Hoàn tiền theo hình thức bạn đã thanh toán; đơn trả tiền mặt khi nhận hàng được hoàn bằng chuyển khoản vào tài khoản bạn cung cấp.',
      'Thời gian hoàn tiền **3–5 ngày làm việc** kể từ khi shop xác nhận hoàn.',
    ] },
  ] },
  { h: 'Hủy đơn', blocks: [
    { ul: [
      'Bạn gọi shop để hủy đơn **trước khi đơn chuyển sang "Đang giao"**. Hàng đã giao cho đơn vị vận chuyển thì xử lý như trả hàng.',
      'Đơn đã thanh toán được hoàn tiền trong 3–5 ngày làm việc kể từ khi hủy.',
      'Shop hủy đơn khi hết hàng hoặc không liên lạc được với bạn; shop báo trước và hoàn tiền nếu bạn đã thanh toán.',
    ] },
    contact('support'),
  ] },
];

// ---- Thanh toán ----------------------------------------------------------------------------------------------

const THANH_TOAN: Section[] = [
  { h: 'Phương thức thanh toán', blocks: [
    { table: { head: ['Phương thức', 'Cách thực hiện', 'Lưu ý'], rows: [
      ['Tiền mặt khi nhận hàng', 'Trả trực tiếp cho người giao hàng sau khi kiểm tra hàng.', 'Không áp dụng cho đơn có sản phẩm Flash sale.'],
      ['Chuyển khoản ngân hàng (QR)', 'Chuyển khoản theo hướng dẫn của nhân viên khi xác nhận đơn.', 'Đơn ghi nhận "Đã thanh toán" khi shop nhận được tiền.'],
      ['Ví MoMo, ZaloPay', 'Thanh toán theo hướng dẫn của nhân viên khi xác nhận đơn.', 'Như trên.'],
      ['Thẻ quốc tế (Visa, Mastercard, JCB)', 'Thanh toán theo hướng dẫn của nhân viên khi xác nhận đơn.', 'Như trên.'],
    ] } },
    'Với các hình thức thanh toán trước, sau khi bạn đặt hàng, nhân viên liên hệ trong 30 phút (' + HOURS + ') để xác nhận đơn và hướng dẫn thanh toán. Khi shop xác nhận đã nhận tiền, bạn nhận thông báo "Đã nhận thanh toán".',
    'Mua trực tiếp tại cửa hàng, bạn thanh toán bằng tiền mặt, chuyển khoản QR hoặc thẻ.',
  ] },
  { h: 'Giá và giảm giá', blocks: [
    { ul: [
      'Giá hiện trên website là **giá lẻ**, bằng đồng Việt Nam; mua 2 cây cùng quy cách tính **giá combo 2 cây**. Giá sỉ công trình báo riêng theo [yêu cầu báo giá](/bao-gia-si). Giá, phí giao hàng, chiết khấu đối tác và mã giảm giá được tính lại lúc bạn bấm Đặt hàng; số tiền cần thanh toán hiện rõ trước khi xác nhận.',
      'Đối tác đã đăng ký và được shop duyệt ở [trang Đối tác sỉ](/doi-tac) có thể được chiết khấu riêng theo % tiền hàng; chiết khấu tự trừ khi đăng nhập và đặt hàng.',
      'Mã giảm giá nhập ở bước thanh toán, xem được số tiền giảm ngay. Mỗi mã có điều kiện riêng (đơn tối thiểu, số lượt, thời hạn, lượt dùng cho mỗi khách).',
      'Sản phẩm Flash sale có số lượng và thời gian giới hạn.',
      'Điểm thưởng: xem [Thể lệ tích điểm](/chinh-sach/tich-diem).',
    ] },
  ] },
  { h: 'Hoàn tiền', blocks: [
    { ul: [
      'Hoàn tiền cho đơn bị hủy, đơn đổi trả hoặc yêu cầu bảo hành chọn hoàn tiền, theo [Chính sách đổi trả](/chinh-sach/doi-tra) và [Chính sách bảo hành cây](/chinh-sach/bao-hanh-cay).',
      'Tiền được hoàn bằng chuyển khoản vào tài khoản bạn cung cấp, trong 3–5 ngày làm việc kể từ khi shop xác nhận hoàn. Shop báo cho bạn khi đã chuyển.',
    ] },
  ] },
  { h: 'Thanh toán an toàn', blocks: [
    { ul: [
      'Website không thu thập và không lưu số thẻ, mã CVV, mật khẩu hay mã OTP ngân hàng của bạn.',
      'Shop không bao giờ nhờ bạn cung cấp số thẻ, mật khẩu hay mã OTP ngân hàng qua điện thoại hoặc tin nhắn.',
      'Chỉ chuyển tiền theo thông tin do nhân viên shop gửi qua hotline, Zalo hoặc email chính thức ghi ở trang này. Nghi ngờ lừa đảo, hãy gọi hotline để xác minh.',
    ] },
  ] },
  { h: 'Khi thanh toán gặp sự cố', blocks: [
    'Chuyển nhầm, bị trừ tiền hai lần hoặc đã chuyển mà đơn chưa ghi nhận: gọi shop kèm mã đơn và ảnh chụp giao dịch, nhân viên kiểm tra và xử lý cho bạn.',
    contact('support'),
  ] },
];

// ---- Đặt cọc -------------------------------------------------------------------------------------------------

const DAT_COC: Section[] = [
  { h: 'Khi nào cần đặt cọc', blocks: [
    { ul: [
      '**Cần đặt cọc:** cây lớn đặt trước và công trình sân vườn.',
      '**Không cần đặt cọc:** cây có sẵn tại vườn và vật tư mua qua giỏ hàng; bạn thanh toán theo [Chính sách thanh toán](/chinh-sach/thanh-toan).',
    ] },
  ] },
  { h: 'Mức cọc và phần còn lại', blocks: [
    { ul: [
      'Mức cọc là **30% giá trị đơn** (hoặc giá trị công trình theo báo giá).',
      'Phần còn lại thanh toán khi nhận cây hoặc khi nghiệm thu công trình.',
    ] },
  ] },
  { h: 'Quy trình', blocks: [
    { ol: [
      'Liên hệ shop qua hotline, Zalo hoặc [gửi yêu cầu báo giá sỉ](/bao-gia-si) kèm danh sách cây / bảng khối lượng; shop gửi báo giá qua Zalo.',
      'Shop xác nhận cây, quy cách, số lượng, giá và thời gian giao bằng báo giá hay tin nhắn.',
      'Bạn chuyển khoản tiền cọc; shop xác nhận khi đã nhận tiền.',
      'Shop chuẩn bị cây hoặc triển khai công trình theo đúng thỏa thuận.',
      'Bạn thanh toán phần còn lại khi nhận cây hoặc nghiệm thu.',
    ] },
  ] },
  { h: 'Thay đổi hoặc hủy sau khi cọc', blocks: [
    'Điều kiện hoàn hoặc không hoàn tiền cọc, và việc đổi cây hay hạng mục, được ghi trong báo giá hoặc tin nhắn xác nhận đặt cọc của từng đơn. Shop nói rõ các điều kiện này **trước khi bạn chuyển cọc**.',
  ] },
  { h: 'Lưu ý an toàn', blocks: [
    { note: `Chỉ chuyển cọc theo thông tin do nhân viên shop gửi qua hotline ${phone(SALES_PHONE)}, ${zalo} hoặc email ${SHOP_EMAIL}. Nghi ngờ lừa đảo, hãy gọi hotline để xác minh trước khi chuyển tiền.` },
    contact('sales'),
  ] },
];

// ---- Bảo mật dữ liệu cá nhân ---------------------------------------------------------------------------------

const BAO_MAT: Section[] = [
  { h: 'Ai xử lý dữ liệu của bạn', blocks: [
    `Dữ liệu cá nhân trên website **caycanhmientay.com** do **Cây Cảnh Miền Tây** (người chịu trách nhiệm: ông Lê Hoài Nhân, ${SHOP_ADDRESS}) thu thập và xử lý. Liên hệ về dữ liệu cá nhân: ${SHOP_EMAIL} hoặc ${phone(SUPPORT_PHONE)}.`,
    'Chính sách này áp dụng khi bạn truy cập website, đăng nhập, mua hàng, gửi bảo hành, đặt lịch dịch vụ hay đăng nội dung.',
  ] },
  { h: 'Dữ liệu chúng tôi thu thập', blocks: [
    { table: { head: ['Nhóm dữ liệu', 'Gồm', 'Khi nào'], rows: [
      ['Tài khoản', 'Số điện thoại (xác thực bằng mã OTP), họ tên, email, ảnh đại diện nếu bạn đăng nhập Google', 'Khi đăng nhập, cập nhật hồ sơ'],
      ['Giao nhận', 'Tên người nhận, số điện thoại, địa chỉ, vị trí ghim trên bản đồ, ghi chú cho người giao', 'Khi đặt hàng hoặc lưu sổ địa chỉ'],
      ['Giao dịch', 'Đơn hàng, sản phẩm đã mua, phương thức thanh toán, mã giảm giá, điểm thưởng', 'Khi đặt hàng. Website không lưu số thẻ'],
      ['Ảnh và nội dung bạn gửi', 'Ảnh bảo hành, ảnh hiện trạng sân vườn, ảnh và nội dung đánh giá, câu hỏi, câu trả lời', 'Khi bạn gửi'],
      ['Cây của bạn', 'Danh sách cây đã mua, lịch chăm, ảnh bạn tự cập nhật trong Vườn của tôi', 'Sau khi đơn đã giao'],
      ['Kỹ thuật', 'Loại thiết bị, trình duyệt, địa chỉ IP, trang đã xem do hệ thống máy chủ ghi nhận; cookie (xem mục Cookie)', 'Khi truy cập'],
    ] } },
    { ul: [
      '**Vị trí hiện tại:** chỉ khi bạn bấm "Dùng vị trí hiện tại" hoặc "Gần bạn" và cho phép trình duyệt. Với "Gần bạn", vị trí chỉ dùng trong trình duyệt để sắp cửa hàng theo khoảng cách. Khi dùng để điền địa chỉ, vị trí chỉ được lưu nếu bạn lưu địa chỉ đó.',
      'Địa chỉ bạn gõ hoặc ghim trên bản đồ được gửi tới dịch vụ bản đồ để hiển thị bản đồ và gợi ý địa chỉ.',
    ] },
  ] },
  { h: 'Mục đích sử dụng', blocks: [
    { ul: [
      'Xử lý đơn hàng, thanh toán, giao hàng, bảo hành, đổi trả và hoàn tiền.',
      'Liên hệ bạn về đơn hàng, bảo hành, câu hỏi và đánh giá (thông báo trên website, qua Zalo hoặc email).',
      'Nhắc lịch chăm cây và tư vấn sau bán hàng; tiếp nhận yêu cầu báo giá sỉ, đăng ký đối tác.',
      'Chống gian lận và lạm dụng ưu đãi; bảo đảm an toàn hệ thống.',
      'Cải thiện website, khi bạn cho phép dữ liệu phân tích.',
      'Thực hiện nghĩa vụ theo quy định của pháp luật (chứng từ giao dịch, yêu cầu của cơ quan nhà nước).',
    ] },
    'Shop chỉ gửi tin khuyến mãi khi bạn đồng ý nhận.',
  ] },
  { h: 'Chia sẻ dữ liệu', blocks: [
    'Chúng tôi **không bán** dữ liệu cá nhân của bạn. Dữ liệu chỉ được chia sẻ trong các trường hợp sau:',
    { ul: [
      '**Đơn vị vận chuyển, người giao hàng:** tên, số điện thoại, địa chỉ nhận và nội dung đơn để giao hàng.',
      '**Nhà cung cấp dịch vụ kỹ thuật** giúp vận hành website: lưu trữ máy chủ và cơ sở dữ liệu, gửi tin nhắn Zalo / email, đăng nhập bằng Google, bản đồ và tìm địa chỉ. Họ chỉ nhận dữ liệu cần thiết cho dịch vụ và phải bảo mật.',
      '**Cơ quan nhà nước có thẩm quyền** khi có yêu cầu theo quy định của pháp luật.',
    ] },
    { note: 'Một số nhà cung cấp dịch vụ kỹ thuật đặt máy chủ ngoài lãnh thổ Việt Nam, nên dữ liệu của bạn có thể được lưu và xử lý ở nước ngoài.' },
    'Tên hiển thị trong hồ sơ của bạn (không kèm số điện thoại hay email) hiện cùng đánh giá, câu hỏi và câu trả lời bạn đăng công khai. Bạn đổi tên hiển thị trong **Tài khoản → Thông tin cá nhân**.',
  ] },
  { h: 'Cookie', blocks: [
    'Lần đầu vào website, bạn được hỏi về cookie và chọn từng nhóm:',
    { table: { head: ['Nhóm', 'Dùng để', 'Có thể tắt'], rows: [
      ['Cần thiết', 'Đăng nhập, giỏ hàng, thanh toán, bảo mật', 'Không (luôn bật)'],
      ['Cá nhân hóa', 'Gợi ý cây theo sở thích và lịch sử xem', 'Có'],
      ['Phân tích', 'Đo lượt truy cập để cải thiện website', 'Có'],
      ['Quảng cáo', 'Hiện quảng cáo phù hợp trên mạng xã hội', 'Có'],
    ] } },
    'Mã phân tích và quảng cáo chỉ được dùng khi bạn đã cho phép. Muốn chọn lại, bạn xóa dữ liệu trang web trong trình duyệt để hộp lựa chọn hiện lại. Website cũng lưu nơi giao hàng bạn chọn ("Giao đến") ngay trên trình duyệt của bạn.',
  ] },
  { h: 'Thời gian lưu trữ', blocks: [
    'Dữ liệu được lưu trong thời gian bạn còn sử dụng tài khoản và theo thời hạn pháp luật yêu cầu đối với chứng từ giao dịch (đơn hàng, thanh toán, bảo hành). Khi hết mục đích sử dụng hoặc bạn yêu cầu xóa hợp lệ, chúng tôi xóa hoặc ẩn danh dữ liệu, trừ phần pháp luật bắt buộc phải giữ.',
  ] },
  { h: 'Quyền của bạn', blocks: [
    { ul: [
      '**Xem và chỉnh sửa:** hồ sơ ở Tài khoản → Thông tin cá nhân; địa chỉ ở Tài khoản → Sổ địa chỉ.',
      '**Rút lại đồng ý:** thay đổi lựa chọn cookie, ngừng nhận tin khuyến mãi bất cứ lúc nào.',
      '**Yêu cầu truy cập, xóa, hạn chế hoặc phản đối xử lý** dữ liệu của bạn: gửi email hoặc gọi hotline ở đầu trang này; chúng tôi xác minh danh tính và phản hồi trong thời hạn pháp luật quy định.',
      '**Khiếu nại:** nếu cho rằng dữ liệu bị xử lý sai, bạn liên hệ chúng tôi theo [Quy chế hoạt động](/chinh-sach/quy-che-hoat-dong) hoặc gửi cơ quan nhà nước có thẩm quyền.',
    ] },
  ] },
  { h: 'Biện pháp bảo mật', blocks: [
    { ul: [
      'Kết nối tới website được mã hóa (HTTPS).',
      'Mã OTP chỉ dùng một lần, lưu dạng mã hóa và hết hạn sau 5 phút; phiên đăng nhập dùng cookie riêng, không đọc được bằng mã chạy trên trang.',
      'Ảnh bảo hành, ảnh gửi kèm yêu cầu báo giá chỉ chủ tài khoản và nhân viên xử lý xem được.',
      'Nhân viên chỉ truy cập dữ liệu thuộc phần việc của mình theo phân quyền.',
      'Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng dữ liệu của bạn, chúng tôi sẽ thông báo và xử lý theo quy định của pháp luật.',
    ] },
  ] },
  { h: 'Thay đổi chính sách', blocks: [
    'Khi thay đổi, chúng tôi đăng bản mới tại trang này kèm ngày cập nhật. Thay đổi quan trọng (mục đích sử dụng mới, chia sẻ cho đối tượng mới) sẽ được thông báo rõ trên website.',
  ] },
];

// ---- Chính sách nội dung -------------------------------------------------------------------------------------

const NOI_DUNG: Section[] = [
  { h: 'Bài viết, video', blocks: [
    { ul: [
      'Bài chăm cây, bắt bệnh và hướng dẫn dùng thuốc ở [Góc chăm cây](/goc-cham-cay), [Bắt bệnh cho cây](/benh-cay) do shop biên soạn và được kỹ sư nông nghiệp kiểm duyệt trước khi đăng. Bài đã kiểm duyệt có nhãn **Đã kiểm duyệt** và tên kỹ sư.',
      'Bài nhắc tới thuốc BVTV luôn kèm lưu ý an toàn ([hướng dẫn dùng thuốc an toàn](/chinh-sach/thuoc-bvtv-an-toan)).',
      'Nội dung mang tính tham khảo chung; điều kiện từng vườn khác nhau. Cây có bệnh nặng hoặc không rõ nguyên nhân, hãy hỏi kỹ sư. Xem [Đội ngũ chuyên môn](/chinh-sach/doi-ngu-chuyen-mon).',
    ] },
  ] },
  { h: 'Hỏi đáp và đánh giá của khách', blocks: [
    { ul: [
      'Bạn cần đăng nhập để đặt câu hỏi, trả lời hoặc viết đánh giá.',
      'Shop trả lời câu hỏi; khách đã mua cũng có thể chia sẻ kinh nghiệm. Câu trả lời của khách chỉ để tham khảo, không thay thế tư vấn của kỹ sư, nhất là với thuốc BVTV.',
      'Nội dung chứa quảng cáo, số điện thoại, đường link, thông tin cá nhân của người khác, lời xúc phạm, sai sự thật hoặc vi phạm pháp luật có thể bị ẩn hoặc xóa. Shop không xóa đánh giá chỉ vì chê sản phẩm hay dịch vụ.',
      'Bạn đồng ý cho shop hiển thị nội dung và ảnh bạn đăng (kèm tên hiển thị) trên website. Ảnh bảo hành và ảnh gửi kèm yêu cầu báo giá không bao giờ công khai.',
    ] },
  ] },
  { h: 'Ảnh và video trên website', blocks: [
    { ul: [
      'Ảnh sản phẩm do shop chụp có đóng dấu chữ chìm; vui lòng không sao chép, đăng lại vào mục đích thương mại khi chưa được shop đồng ý.',
      'Ảnh, video minh họa lấy từ nguồn mở được ghi công tại [Nguồn ảnh minh họa](/chinh-sach/nguon-anh).',
    ] },
  ] },
  { h: 'Báo nội dung sai hoặc vi phạm', blocks: [
    'Bạn thấy nội dung sai sự thật, vi phạm bản quyền hay cần chỉnh sửa, hãy báo cho shop để được xem xét và xử lý.',
    contact('support'),
  ] },
];

// ---- Điều khoản sử dụng --------------------------------------------------------------------------------------

const DIEU_KHOAN: Section[] = [
  { h: 'Chấp nhận điều khoản', blocks: [
    'Khi truy cập website **caycanhmientay.com**, đăng nhập hoặc đặt hàng, bạn đồng ý với Điều khoản sử dụng này, [Chính sách bảo mật dữ liệu cá nhân](/chinh-sach/bao-mat) và [Quy chế hoạt động](/chinh-sach/quy-che-hoat-dong) của Cây Cảnh Miền Tây ("shop"). Nếu không đồng ý, vui lòng ngừng sử dụng website.',
    'Điều khoản áp dụng cho mọi khách truy cập và mua hàng tại website.',
  ] },
  { h: 'Tài khoản', blocks: [
    { ul: [
      'Bạn đăng nhập bằng số điện thoại (mã OTP) hoặc tài khoản Google. Số điện thoại và thông tin bạn khai phải đúng sự thật.',
      'Bạn giữ bí mật thiết bị và tài khoản của mình, và chịu trách nhiệm cho hoạt động thực hiện bằng tài khoản đó. Phát hiện bị dùng trái phép, hãy báo shop ngay.',
      'Mỗi người nên dùng một tài khoản. Việc lập nhiều tài khoản để nhận quà hoặc mã giảm giá nhiều lần bị coi là vi phạm.',
    ] },
  ] },
  { h: 'Đặt hàng, giá và khuyến mãi', blocks: [
    { ul: [
      'Đơn hàng có hiệu lực khi shop xác nhận (thường qua điện thoại hoặc Zalo trong 30 phút, ' + HOURS + ').',
      'Shop có thể từ chối hoặc hủy đơn khi hết hàng, hiển thị sai giá hay thông tin do lỗi hệ thống, không liên lạc được với bạn hoặc nghi ngờ gian lận. Đơn đã thanh toán được hoàn tiền.',
      'Mã giảm giá và quà tặng dùng theo điều kiện đi kèm (đơn tối thiểu, số lượt, thời hạn, lượt dùng cho mỗi tài khoản hoặc số điện thoại nhận hàng) và không quy đổi thành tiền mặt.',
      'Sản phẩm Flash sale có số lượng và thời gian giới hạn, không thanh toán tiền mặt khi nhận hàng.',
      'Đơn có thuốc BVTV cần xác nhận đã đọc hướng dẫn an toàn trước khi đặt.',
      'Điểm thưởng theo [Thể lệ tích điểm](/chinh-sach/tich-diem).',
    ] },
    'Chi tiết: [Chính sách thanh toán](/chinh-sach/thanh-toan), [giao hàng](/chinh-sach/giao-hang), [bảo hành cây](/chinh-sach/bao-hanh-cay), [đổi trả](/chinh-sach/doi-tra).',
  ] },
  { h: 'Nội dung do bạn đăng', blocks: [
    { ul: [
      'Bạn chịu trách nhiệm về đánh giá, câu hỏi, câu trả lời và ảnh bạn gửi. Không đăng nội dung quảng cáo, chứa số điện thoại hoặc đường link, xúc phạm, sai sự thật hoặc vi phạm pháp luật.',
      'Bạn cho phép shop hiển thị nội dung đó (kèm tên hiển thị của bạn) trên website. Shop có quyền chỉnh sửa, ẩn hoặc xóa nội dung vi phạm.',
      'Ảnh bảo hành và ảnh hiện trạng sân vườn chỉ dùng để xử lý yêu cầu của bạn, không công khai.',
    ] },
    'Chi tiết: [Chính sách nội dung](/chinh-sach/noi-dung).',
  ] },
  { h: 'Thông tin chăm cây và thuốc BVTV', blocks: [
    'Nội dung chăm cây, bắt bệnh và liều dùng thuốc chỉ mang tính tham khảo chung vì điều kiện từng vườn khác nhau. Luôn đọc kỹ nhãn thuốc, dùng đúng liều, đúng thời gian cách ly và bảo hộ khi pha, phun ([xem hướng dẫn](/chinh-sach/thuoc-bvtv-an-toan)). Câu trả lời của khách khác trong mục Hỏi đáp chỉ để tham khảo, không thay thế tư vấn của kỹ sư.',
  ] },
  { h: 'Quyền sở hữu trí tuệ', blocks: [
    'Logo, hình ảnh, bài viết, video, thiết kế và dữ liệu trên website thuộc Cây Cảnh Miền Tây hoặc được dùng theo giấy phép của chủ sở hữu (xem [Nguồn ảnh minh họa](/chinh-sach/nguon-anh)). Không sao chép, đăng lại hoặc dùng cho mục đích thương mại khi chưa được shop đồng ý bằng văn bản.',
  ] },
  { h: 'Giới hạn trách nhiệm', blocks: [
    'Shop cố gắng để website hoạt động ổn định nhưng không bảo đảm không bao giờ gián đoạn (bảo trì, sự cố mạng, trường hợp bất khả kháng). Shop không chịu trách nhiệm với thiệt hại gián tiếp phát sinh từ việc sử dụng website, trừ trường hợp pháp luật có quy định khác.',
    'Điều khoản này không làm mất quyền lợi của bạn theo chính sách bảo hành, đổi trả của shop và theo pháp luật về bảo vệ quyền lợi người tiêu dùng.',
  ] },
  { h: 'Luật áp dụng, tranh chấp và thay đổi', blocks: [
    { ul: [
      'Điều khoản chịu sự điều chỉnh của pháp luật Việt Nam.',
      'Tranh chấp được ưu tiên giải quyết bằng thương lượng theo [Quy chế hoạt động](/chinh-sach/quy-che-hoat-dong); nếu không được, đưa ra Tòa án có thẩm quyền.',
      'Shop có thể cập nhật điều khoản; bản mới đăng tại trang này kèm ngày cập nhật. Bạn tiếp tục sử dụng website sau đó nghĩa là đồng ý với bản mới.',
    ] },
    contact('support'),
  ] },
];

// ---- Nguồn ảnh minh họa --------------------------------------------------------------------------------------

const NGUON_ANH: Section[] = [
  { h: 'Ảnh minh họa', blocks: [
    'Một số sản phẩm đang dùng ảnh minh họa từ Wikimedia Commons theo giấy phép mở (Creative Commons hoặc phạm vi công cộng), không phải ảnh chụp sản phẩm thực tế. Sản phẩm giao cho khách có thể khác ảnh; ảnh sẽ được thay bằng ảnh shop tự chụp.',
  ] },
  { h: 'Tác giả và giấy phép', blocks: [
    { ul: [
      'Philodendron Birkin chậu sứ Ø15: ảnh của Yercaud-elango, CC BY 4.0, nguồn https://commons.wikimedia.org/wiki/File:Philodendron_birkin-5-R.M.Nagar-bengaluru-India.jpg',
      'Trầu bà Nam Mỹ chậu treo: ảnh của Ra Boe, CC BY-SA 3.0 de, nguồn https://commons.wikimedia.org/wiki/File:Wikipedia_13._Fotoworkshop_Botanischer_Garten_Erlangen_2013_by-RaBoe_137.jpg',
      'Kim tiền chậu men xanh: ảnh của Dbwolfe, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Zamioculcas_zamiifolia_Chameleon_1.jpg',
      'Lan hồ điệp 2 cành màu trắng: ảnh của Alvesgaspar, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Phalaenopsis_July_2020-2.jpg',
      'Combo sen đá mix 6 chậu mini: ảnh của brewbooks from near Seattle, USA, CC BY-SA 2.0, nguồn https://commons.wikimedia.org/wiki/File:Flickr_-_brewbooks_-_Succulent_Pot.jpg',
      'Chế phẩm sinh học Trichoderma trị nấm, thối rễ: ảnh của Vicenny, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Trichoderma_asperellum.jpg',
      'Thuốc trừ nấm bệnh Mancozeb 80WP: ảnh của Safapalanadan94, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Knapsack_sprayer.jpg',
      'Dầu khoáng trừ rệp sáp, nhện đỏ: ảnh của Theornamentalist, CC BY-SA 3.0, nguồn https://commons.wikimedia.org/wiki/File:Wikibooks_planting-water.jpg',
      'Phân bón lá kích hoa cho lan: ảnh của PumpkinSky, CC BY-SA 3.0, nguồn https://commons.wikimedia.org/wiki/File:White_Orchid_1_NBG.jpg',
      'Phân tan chậm NPK 14-14-14 cho kiểng lá: ảnh của Rasbak, CC BY-SA 3.0, nguồn https://commons.wikimedia.org/wiki/File:Kalkammonsalpeter.jpg',
      'Phân trùn quế nguyên chất: ảnh của Red58bill, CC BY 3.0, nguồn https://commons.wikimedia.org/wiki/File:Worm.casts.jpg',
      'Đất trộn sẵn chuyên kiểng lá, thoát nước tốt: ảnh của Không rõ tác giả, phạm vi công cộng, nguồn https://commons.wikimedia.org/wiki/File:Pro-Mix_Potting_Soil.jpg',
      'Viên nén xơ dừa ươm hạt (100 viên): ảnh của MatiasMiika, CC BY 3.0, nguồn https://commons.wikimedia.org/wiki/File:Brick_of_coco_coir.JPG',
      'Kéo cắt tỉa cành lưỡi thép SK5: ảnh của KoS, phạm vi công cộng, nguồn https://commons.wikimedia.org/wiki/File:Secateur_ouvert.jpg',
      'Hạt giống rau muống lá tre: ảnh của Wee Hong, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Ipomoea_aquatica_at_Organic_Unit,_FP,_UPM.jpg',
      'Video nền mai vàng ở trang Cây Tết: video của Lê Hoàng Khanh Lê, giấy phép Pexels (dùng miễn phí), nguồn https://www.pexels.com/video/close-up-on-yellow-flowers-11142501/',
    ] },
  ] },
];

// ---- Các trang ngắn chưa viết lại (giữ nguyên nội dung cũ) ---------------------------------------------------

const BVTV_AN_TOAN: Section[] = [
  { h: 'Tóm tắt nhanh', blocks: [
    'Thuốc bảo vệ thực vật (BVTV) giúp cứu cây khi sâu bệnh nặng, nhưng dùng sai có thể làm cây chết, gây hại cho người, thú cưng và môi trường. Trang này tóm tắt những điều cần nhớ khi dùng thuốc cho cây cảnh, rau trồng tại nhà và vườn nhỏ.',
    { note: '**Nhớ 6 điều:** chỉ dùng thuốc khi biết đúng vấn đề của cây · đọc kỹ nhãn trước khi pha · làm đúng "4 đúng" · đeo găng tay, khẩu trang khi pha và phun · giữ xa trẻ em, thú cưng, thực phẩm · không đổ thuốc thừa xuống nguồn nước. Khi nhãn của thuốc khác với hướng dẫn chung ở đây, **làm theo nhãn**.' },
  ] },
  { h: 'Trước khi mua và trước khi dùng', blocks: [
    { ul: [
      '**Xác định đúng vấn đề.** Lá vàng, héo, rụng lá thường do tưới sai, thiếu sáng hoặc đất úng, không phải lúc nào cũng là sâu bệnh — phun thuốc trong trường hợp này không giúp ích mà còn hại cây. Xem thư viện [Bắt bệnh cho cây](/benh-cay) hoặc gửi ảnh cho kỹ sư của shop trước khi mua.',
      '**Làm các việc nhẹ trước:** cắt bỏ lá và cành bệnh, tách cây bệnh ra xa các cây khác, cho cây thoáng gió và thoát nước tốt. Chỉ dùng thuốc khi sâu bệnh còn lan rộng hoặc các cách trên chưa đủ.',
      '**Chỉ mua thuốc có nguồn gốc rõ ràng** thuộc danh mục thuốc BVTV được phép sử dụng tại Việt Nam: bao bì còn nguyên, có nhãn tiếng Việt, ghi số đăng ký, tên hoạt chất và hạn sử dụng. Không mua thuốc không nhãn, thuốc đã bị chia chai, thuốc hết hạn, và không dùng thuốc nằm ngoài danh mục.',
      '**Tại Cây Cảnh Miền Tây,** mỗi sản phẩm thuốc ghi sẵn Số đăng ký, Hoạt chất, Liều pha và Thời gian cách ly ngay trên trang sản phẩm; khi trong giỏ hàng có thuốc, bạn được nhắc xác nhận đã đọc hướng dẫn an toàn trước khi đặt hàng. Xem [Tra cứu thuốc BVTV](/danh-muc/thuoc-bvtv).',
    ] },
  ] },
  { h: 'Nguyên tắc "4 đúng"', blocks: [
    'Đây là nguyên tắc cơ bản mà ngành bảo vệ thực vật hướng dẫn người trồng cây áp dụng mỗi lần dùng thuốc.',
    { table: { head: ['Nguyên tắc', 'Nghĩa là', 'Lỗi hay gặp'], rows: [
      ['**Đúng thuốc**', 'Chọn thuốc đúng với sâu bệnh đang gặp và đúng loại cây được ghi trên nhãn.', 'Thấy lá vàng là phun thuốc trị nấm, trong khi cây chỉ bị úng nước hoặc thiếu sáng.'],
      ['**Đúng lúc**', 'Phun khi sâu bệnh mới xuất hiện hoặc đúng thời điểm nhãn hướng dẫn; phun lúc sáng sớm hoặc chiều mát.', 'Phun giữa trưa nắng gắt (dễ cháy lá), hoặc phun ngay trước cơn mưa (thuốc bị rửa trôi).'],
      ['**Đúng nồng độ, liều lượng**', 'Đong chính xác thuốc và nước theo nhãn, không tự tăng liều.', 'Tăng liều "cho chắc": cây dễ cháy lá, sâu bệnh nhờn thuốc, tồn dư thuốc nhiều hơn.'],
      ['**Đúng cách**', 'Dùng bình phun phù hợp, phun đều cả mặt dưới lá, đúng số lần và khoảng cách giữa các lần phun.', 'Phun một lần rồi bỏ, hoặc trộn nhiều loại thuốc vào một bình khi nhãn không cho phép.'],
    ] } },
    '**Tránh nhờn thuốc:** dùng đi dùng lại một loại hoạt chất làm sâu bệnh quen thuốc, lần sau thuốc kém tác dụng. Nếu phải phun nhiều đợt, hỏi kỹ sư để luân phiên thuốc khác nhóm hoạt chất.',
  ] },
  { h: 'Đọc nhãn thuốc', blocks: [
    'Trước khi mở nắp, tìm đủ các thông tin sau trên nhãn:',
    { ul: [
      '**Tên thuốc và hoạt chất**, hạn sử dụng, số lô.',
      '**Cây trồng và đối tượng sâu bệnh** mà thuốc được đăng ký (thuốc trị nấm không trị được sâu, và ngược lại).',
      '**Liều lượng và lượng nước** cho mỗi bình hoặc mỗi diện tích, số lần phun, khoảng cách giữa các lần.',
      '**Thời gian cách ly:** số ngày tối thiểu từ lần phun cuối đến khi thu hoạch và ăn. Với rau ăn lá, rau gia vị, cây ăn trái trồng tại nhà thì bắt buộc phải đợi đủ số ngày này.',
      '**Biểu tượng và từ cảnh báo** (ví dụ "Nguy hiểm", "Cảnh báo"), cách sơ cứu khi dính thuốc, cách bảo quản.',
    ] },
  ] },
  { h: 'Chuẩn bị và pha thuốc', blocks: [
    { ol: [
      '**Mặc đồ bảo hộ trước khi mở thuốc:** găng tay chống hóa chất, khẩu trang loại dùng cho thuốc BVTV (khẩu trang vải thường không đủ), kính che mắt, áo dài tay, quần dài, ủng hoặc giày kín.',
      'Pha ở nơi thoáng, xa nguồn nước ăn uống, xa trẻ em và thú cưng. Không ăn, uống, hút thuốc khi đang pha và phun.',
      'Đong thuốc bằng ống đong hoặc nắp đong riêng, không ước chừng bằng mắt, không dùng chung với đồ ăn uống.',
      'Cho khoảng một nửa lượng nước vào bình, cho thuốc vào, khuấy bằng que riêng (không dùng tay trần), rồi thêm đủ nước. Không tự trộn nhiều loại thuốc trong một bình nếu nhãn không cho phép — trộn sai có thể cháy lá hoặc mất tác dụng.',
      'Chỉ pha lượng vừa đủ dùng hết trong ngày.',
    ] },
  ] },
  { h: 'Khi phun', blocks: [
    { ul: [
      'Phun lúc sáng sớm hoặc chiều mát; tránh nắng gắt, gió mạnh và lúc trời sắp mưa.',
      'Đứng xuôi chiều gió, phun đều cả hai mặt lá, không phun quá ướt đến mức thuốc chảy ròng xuống gốc.',
      '**Cây trong nhà, ban công:** mang cây ra nơi thoáng để phun, để lá khô hẳn rồi mới đưa vào. Không phun trong phòng kín, phòng đang bật điều hòa, hay gần khu bếp và nơi ăn uống.',
      'Giữ trẻ em và thú cưng ra xa trong lúc phun và cho đến khi cây khô; chuyển bát nước, thức ăn của thú cưng đi chỗ khác.',
      'Nếu thấy chóng mặt, buồn nôn, cay mắt, rát da thì dừng ngay, ra nơi thoáng và xử lý theo mục "Khi bị dính thuốc hoặc nghi ngộ độc" bên dưới.',
    ] },
  ] },
  { h: 'Sau khi phun', blocks: [
    { ul: [
      'Tháo găng tay, khẩu trang rồi rửa tay bằng xà phòng; tắm, gội đầu và thay quần áo. Giặt đồ bảo hộ riêng, không giặt chung với đồ cả nhà.',
      'Rửa bình phun và dụng cụ ở nơi xa ao, hồ, giếng, kênh rạch. Nước thừa không đổ xuống cống hay nguồn nước; pha vừa đủ ngay từ đầu để không còn nhiều thuốc thừa.',
      '**Ghi lại ngày phun và tên thuốc** (vào sổ hoặc ghi chú trên điện thoại) để biết khi nào đủ thời gian cách ly và khi nào phun lại.',
      'Với cây ăn được: đợi đủ thời gian cách ly rồi mới thu hoạch, rửa kỹ trước khi ăn.',
    ] },
  ] },
  { h: 'Bảo quản và xử lý bao bì', blocks: [
    { ul: [
      'Giữ thuốc trong chai, gói **nguyên nhãn**; không rót sang chai nước ngọt, chai nước suối hay đồ đựng thực phẩm.',
      'Cất nơi khô ráo, thoáng mát, tránh nắng, **có khóa hoặc để trên cao**, xa tầm tay trẻ em, thú cưng, thực phẩm và thức ăn chăn nuôi.',
      'Bao bì thuốc sau khi dùng là chất thải nguy hại: súc rửa vỏ chai ba lần (đổ nước súc vào bình phun để dùng tiếp), rồi bỏ vào nơi thu gom bao bì thuốc BVTV của địa phương. Không đốt, không chôn bừa bãi, không bỏ xuống ao hồ và không dùng lại vỏ chai.',
      'Thuốc hết hạn hoặc không còn dùng: không đổ đi; hỏi cửa hàng bán thuốc hoặc cán bộ nông nghiệp địa phương nơi tiếp nhận.',
    ] },
  ] },
  { h: 'Khi bị dính thuốc hoặc nghi ngộ độc', blocks: [
    { ol: [
      'Đưa người bị nạn ra nơi thoáng, tránh xa chỗ vừa phun; người cứu hộ cũng phải đeo găng tay.',
      '**Dính vào da:** cởi ngay quần áo dính thuốc, rửa da bằng nhiều nước sạch và xà phòng. **Vào mắt:** rửa mắt bằng nước sạch chảy nhẹ trong ít nhất 15 phút.',
      '**Hít phải:** để người bệnh nằm nghỉ ở nơi thoáng. **Nuốt phải:** súc miệng; không tự ý gây nôn trừ khi nhãn thuốc hoặc nhân viên y tế hướng dẫn.',
      'Gọi cấp cứu **115** hoặc đưa ngay đến cơ sở y tế gần nhất, **mang theo nhãn hoặc bao bì thuốc** để bác sĩ biết hoạt chất. Với trẻ em và thú cưng, không đợi có triệu chứng mới đi khám.',
    ] },
    { note: 'Trang này tóm tắt nguyên tắc chung để bạn tham khảo, không thay thế nhãn của từng loại thuốc, hướng dẫn của cơ quan chức năng hay chỉ dẫn của bác sĩ.' },
  ] },
  { h: 'Cần hỏi thêm?', blocks: [
    { ul: [
      'Chưa chắc cây bị gì hoặc nên dùng thuốc nào: nhắn ảnh cho kỹ sư qua Zalo hoặc gọi, ' + HOURS + '.',
      'Đọc thêm bài hướng dẫn ở [Góc chăm cây · Thuốc & Phân bón](/goc-cham-cay?chuyen-muc=thuoc-phan-bon).',
      'Đổi trả thuốc, phân bón: xem [Chính sách đổi trả](/chinh-sach/doi-tra).',
    ] },
    contact('care'),
  ] },
];
const HUONG_DAN_MUA: Section[] = [
  { h: 'Các bước', blocks: ['Chọn sản phẩm → Giỏ hàng → Thanh toán: chọn hình thức nhận, địa chỉ, phương thức thanh toán → Đặt hàng.'] },
];
const TICH_DIEM: Section[] = [
  { h: 'Tích điểm', blocks: ['Mỗi 10.000đ thanh toán được 1 điểm, cộng sau khi nhận hàng.'] },
];

const BODIES: Record<string, Body> = {
  'giay-phep-kinh-doanh': GIAY_PHEP,
  'quy-che-hoat-dong': QUY_CHE,
  'doi-ngu-chuyen-mon': DOI_NGU,
  'giao-hang': giaoHang,
  'bao-hanh-cay': BAO_HANH,
  'doi-tra': DOI_TRA,
  'thanh-toan': THANH_TOAN,
  'dat-coc': DAT_COC,
  'bao-mat': BAO_MAT,
  'noi-dung': NOI_DUNG,
  'thuoc-bvtv-an-toan': BVTV_AN_TOAN,
  'huong-dan-mua-hang': HUONG_DAN_MUA,
  'tich-diem': TICH_DIEM,
  'dieu-khoan': DIEU_KHOAN,
  'nguon-anh': NGUON_ANH,
};

/** Nội dung trang `slug`; undefined nếu chưa có (trang Giới thiệu viết tay ở AboutView). */
export function policyBody(slug: string, ctx: PolicyContext): Section[] | undefined {
  const b = BODIES[slug];
  return typeof b === 'function' ? b(ctx) : b;
}

/** Trang này có cần số liệu cài đặt (giao hàng) không — để page.tsx chỉ truy vấn khi cần. */
export const policyNeedsShipping = (slug: string) => typeof BODIES[slug] === 'function';
