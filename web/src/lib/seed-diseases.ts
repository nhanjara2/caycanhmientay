// Bài bệnh cây mẫu — nạp vào bảng `diseases` khi bảng còn trống (src/server/db/seed.ts).
// Sau đó sửa trong admin /admin/benh-cay. Sản phẩm gợi ý là slug trong src/lib/seed-products.ts.
import type { Disease } from './diseases';

type Seed = Omit<Disease, 'active' | 'aliases' | 'confusions' | 'prevention' | 'safety' | 'products'> &
  Partial<Pick<Disease, 'aliases' | 'confusions' | 'prevention' | 'safety' | 'products'>>;

/** Lưu ý chung khi dùng thuốc BVTV. */
const SPRAY_SAFETY =
  'Đeo găng tay, khẩu trang khi pha và phun thuốc. Phun lúc sáng sớm hoặc chiều mát, tránh xa trẻ em, thú cưng và ao cá. Rau, quả: chờ đủ thời gian cách ly ghi trên bao bì rồi mới thu hoạch.';
const TOOL_SAFETY = 'Lau kéo bằng cồn sau mỗi lần cắt cây bệnh để không lây sang cây khỏe.';

export const seedDiseases: Seed[] = [
  // ---- Nấm ----
  {
    slug: 'thoi-re', name: 'Thối rễ (úng rễ do nấm)', aliases: ['úng rễ', 'thối gốc', 'rễ đen'],
    cause: 'nam', parts: ['re', 'goc'], plants: ['kieng-la', 'lan', 'sen-da', 'hoa'], severity: 4,
    spread: 'Qua đất, nước tưới', season: 'Mùa mưa, nồm ẩm',
    summary: 'Nấm (thường là Pythium, Phytophthora, Fusarium) tấn công bộ rễ khi đất ẩm kéo dài và thiếu thoáng khí. Rễ thối không hút được nước nên cây héo dù đất vẫn ướt.',
    symptoms: [
      { part: 'la', text: 'Lá dưới vàng, mềm, rũ; lan dần lên lá non' },
      { part: 'goc', text: 'Gốc thâm, mềm, ấn vào lõm; có thể có mùi hôi' },
      { part: 're', text: 'Rễ nâu đen, nhũn, vỏ rễ tuột khi kéo nhẹ' },
    ],
    confusions: [
      { name: 'Thiếu nước', slug: 'heo-thieu-nuoc', text: 'Thiếu nước lá giòn, đất khô; thối rễ lá mềm, đất ẩm.' },
      { name: 'Thiếu đạm', slug: 'vang-la-thieu-dam', text: 'Thiếu đạm vàng đều, gốc và rễ trắng khỏe.' },
    ],
    steps: [
      { title: 'Ngừng tưới, nhấc cây khỏi chậu', detail: 'Gỡ bớt đất cũ, rửa nhẹ bộ rễ dưới vòi nước' },
      { title: 'Cắt bỏ rễ thối', detail: 'Dùng kéo sạch, cắt đến phần rễ trắng chắc' },
      { title: 'Ngâm rễ bằng chế phẩm Trichoderma', detail: 'Pha theo hướng dẫn trên bao bì, ngâm 15–20 phút' },
      { title: 'Trồng lại bằng giá thể thoát nước', detail: 'Lót đá đáy chậu, tưới lại sau 3–5 ngày' },
    ],
    prevention: ['Chỉ tưới khi mặt đất khô 2–3 cm', 'Dùng chậu có lỗ thoát nước, không để nước đọng ở đĩa lót', 'Trộn Trichoderma vào đất khi thay chậu'],
    safety: TOOL_SAFETY,
    products: ['trichoderma-tri-nam-thoi-re', 'dat-tron-san-kieng-la', 'chau-tu-tuoi-thong-minh', 'keo-cat-tia-canh'],
  },
  {
    slug: 'dom-la-nam', name: 'Đốm lá do nấm', aliases: ['đốm nâu', 'đốm lá', 'lá bị đốm'],
    cause: 'nam', parts: ['la'], plants: ['kieng-la', 'lan', 'hoa', 'rau'], severity: 2,
    spread: 'Qua nước bắn, gió', season: 'Mùa mưa',
    summary: 'Nhiều loài nấm gây đốm tròn hoặc bất định trên lá khi lá ướt lâu và cây trồng dày. Bệnh ít làm chết cây nhưng lá rụng nhiều, cây yếu dần.',
    symptoms: [
      { part: 'la', text: 'Đốm tròn nâu hoặc đen, thường có quầng vàng bao quanh' },
      { part: 'la', text: 'Các đốm lan rộng, nối nhau thành mảng khô, lá vàng rồi rụng' },
      { part: 'toan-cay', text: 'Bệnh bắt đầu ở lá già phía dưới, lan dần lên trên' },
    ],
    confusions: [
      { name: 'Đốm lá vi khuẩn', slug: 'chay-la-vi-khuan', text: 'Đốm vi khuẩn úng nước, mép đốm có viền dầu, lan rất nhanh khi mưa.' },
      { name: 'Cháy lá do nắng', slug: 'chay-la-do-nang', text: 'Cháy nắng thành mảng lớn ở phía hứng nắng, không có quầng vàng.' },
    ],
    steps: [
      { title: 'Cắt bỏ lá bệnh', detail: 'Gom vào bao đem bỏ, không để lá bệnh dưới gốc' },
      { title: 'Phun thuốc trừ nấm Mancozeb', detail: 'Pha đúng liều trên bao bì, phun ướt đều hai mặt lá' },
      { title: 'Phun lại sau 7–10 ngày', detail: 'Phun 2–3 lần đến khi không thấy đốm mới' },
    ],
    prevention: ['Tưới vào gốc, tránh tưới lên lá vào buổi chiều tối', 'Tỉa bớt lá cho thoáng, không đặt chậu sát nhau'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-nam-mancozeb', 'keo-cat-tia-canh'],
  },
  {
    slug: 'than-thu', name: 'Thán thư', aliases: ['anthracnose', 'cháy lá thán thư'],
    cause: 'nam', parts: ['la', 'qua', 'than'], plants: ['kieng-la', 'lan', 'an-trai'], severity: 3,
    spread: 'Qua nước mưa, dụng cụ', season: 'Mùa mưa, nóng ẩm',
    summary: 'Nấm Colletotrichum gây vết cháy lõm trên lá, quả và cành non. Bệnh phát mạnh khi mưa nhiều, cây bị vết thương hoặc bón thừa đạm.',
    symptoms: [
      { part: 'la', text: 'Vết cháy nâu xám ở mép hoặc chóp lá, có vòng đồng tâm' },
      { part: 'qua', text: 'Vết lõm đen trên quả, sau có chấm hồng cam (bào tử)' },
      { part: 'than', text: 'Cành non khô đen từ ngọn xuống' },
    ],
    confusions: [
      { name: 'Cháy lá do nắng', slug: 'chay-la-do-nang', text: 'Cháy nắng không có vòng đồng tâm và không lan sang lá trong bóng râm.' },
    ],
    steps: [
      { title: 'Cắt bỏ lá, quả, cành bệnh', detail: 'Cắt lấn vào phần khỏe 2–3 cm' },
      { title: 'Phun thuốc trừ nấm', detail: 'Mancozeb theo liều trên bao bì, 7 ngày một lần, 2–3 lần' },
      { title: 'Giảm đạm, tăng kali', detail: 'Ngưng phân đạm cao trong thời gian cây bệnh' },
    ],
    prevention: ['Không tưới phun lên lá', 'Vệ sinh vườn, dọn lá rụng thường xuyên'],
    safety: `${SPRAY_SAFETY} ${TOOL_SAFETY}`,
    products: ['thuoc-tru-nam-mancozeb', 'keo-cat-tia-canh'],
  },
  {
    slug: 'phan-trang', name: 'Phấn trắng', aliases: ['nấm phấn', 'bột trắng trên lá'],
    cause: 'nam', parts: ['la', 'hoa'], plants: ['hoa', 'rau', 'an-trai'], severity: 2,
    spread: 'Qua gió', season: 'Mùa khô, đêm lạnh ngày nóng',
    summary: 'Nấm phát triển trên bề mặt lá thành lớp bột trắng như rắc phấn. Khác nhiều bệnh nấm khác, phấn trắng phát mạnh khi không khí khô, ngày nóng đêm mát.',
    symptoms: [
      { part: 'la', text: 'Lớp bột trắng xám trên mặt lá, lau được bằng tay' },
      { part: 'la', text: 'Lá non quăn, biến dạng, sau vàng và khô' },
      { part: 'hoa', text: 'Nụ, hoa bị phủ phấn, không nở hoặc rụng sớm' },
    ],
    confusions: [
      { name: 'Rệp sáp', slug: 'rep-sap', text: 'Rệp sáp là những cục bông trắng, chọc vào thấy con rệp; phấn trắng là lớp bột mịn phủ đều.' },
    ],
    steps: [
      { title: 'Ngắt bỏ lá bị nặng', detail: 'Cho vào bao kín để bào tử không bay' },
      { title: 'Phun thuốc trừ nấm', detail: 'Dùng thuốc có ghi trị phấn trắng trên nhãn, phun kỹ mặt lá' },
      { title: 'Đưa cây ra chỗ thoáng, đủ nắng', detail: 'Nấm phấn trắng kém phát triển khi có nắng trực tiếp' },
    ],
    prevention: ['Trồng thưa, cắt tỉa cho thoáng', 'Tránh bón thừa đạm làm lá non mọc dày'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-nam-mancozeb'],
  },
  {
    slug: 'gi-sat', name: 'Gỉ sắt', aliases: ['rỉ sắt', 'bệnh gỉ'],
    cause: 'nam', parts: ['la'], plants: ['hoa', 'rau', 'an-trai'], severity: 2,
    spread: 'Qua gió, nước', season: 'Đầu mùa mưa',
    summary: 'Nấm tạo các ụ bào tử màu cam, nâu đỏ như gỉ sắt ở mặt dưới lá. Lá bệnh nặng vàng và rụng hàng loạt.',
    symptoms: [
      { part: 'la', text: 'Mặt dưới lá có ụ nhỏ màu cam hoặc nâu đỏ, quệt tay thấy bụi màu' },
      { part: 'la', text: 'Mặt trên lá tương ứng có đốm vàng nhạt' },
      { part: 'toan-cay', text: 'Lá rụng nhiều, cây còi, ít hoa' },
    ],
    steps: [
      { title: 'Ngắt bỏ lá bệnh', detail: 'Không để lá rụng dưới gốc' },
      { title: 'Phun thuốc trừ nấm Mancozeb', detail: 'Phun kỹ mặt dưới lá, 7–10 ngày một lần' },
    ],
    prevention: ['Tưới gốc, giữ lá khô', 'Bón cân đối, bổ sung kali'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-nam-mancozeb'],
  },
  {
    slug: 'thoi-goc-nam-hach', name: 'Thối gốc nấm hạch (nấm trắng)', aliases: ['nấm trắng gốc', 'lở cổ rễ', 'héo rũ gốc mốc trắng'],
    cause: 'nam', parts: ['goc', 'than'], plants: ['rau', 'kieng-la', 'an-trai'], severity: 4,
    spread: 'Qua đất, hạch nấm tồn tại lâu', season: 'Nóng ẩm, đầu mùa mưa',
    summary: 'Nấm Sclerotium rolfsii bao gốc cây bằng tơ trắng như bông, kèm hạt nhỏ tròn như hạt cải (hạch nấm). Gốc thối khiến cây héo rũ đột ngột.',
    symptoms: [
      { part: 'goc', text: 'Tơ nấm trắng như sợi bông bám quanh gốc và mặt đất' },
      { part: 'goc', text: 'Hạt tròn nhỏ màu trắng rồi nâu như hạt cải trên tơ nấm' },
      { part: 'toan-cay', text: 'Cây héo rũ nhanh dù đủ nước, nhổ lên gốc mục' },
    ],
    confusions: [
      { name: 'Héo xanh vi khuẩn', slug: 'heo-xanh-vi-khuan', text: 'Héo xanh không có tơ trắng ở gốc; cắt thân ngâm nước thấy dòng dịch trắng đục.' },
    ],
    steps: [
      { title: 'Nhổ bỏ cây bệnh nặng cùng đất quanh gốc', detail: 'Cho vào bao đem đi xa, không bỏ vào đống ủ phân' },
      { title: 'Rắc hoặc tưới Trichoderma quanh gốc cây còn lại', detail: 'Theo liều trên bao bì, lặp lại sau 10–15 ngày' },
      { title: 'Vun gốc cao, thoát nước tốt', detail: 'Không để đất đọng nước quanh cổ rễ' },
    ],
    prevention: ['Bón phân hữu cơ đã ủ hoai kèm Trichoderma', 'Không để cỏ rác mục quanh gốc'],
    products: ['trichoderma-tri-nam-thoi-re', 'phan-trun-que'],
  },
  {
    slug: 'muoi-den', name: 'Muội đen (bồ hóng)', aliases: ['bồ hóng', 'nấm muội đen', 'lá đen như than'],
    cause: 'nam', parts: ['la', 'qua'], plants: ['an-trai', 'kieng-la', 'hoa'], severity: 1,
    spread: 'Theo côn trùng chích hút', season: 'Quanh năm',
    summary: 'Nấm đen mọc trên chất mật do rệp, rầy, rệp sáp tiết ra. Nấm không hút chất của cây nhưng che kín lá làm cây quang hợp kém. Phải trị côn trùng thì mới hết muội đen.',
    symptoms: [
      { part: 'la', text: 'Lớp đen như bồ hóng phủ mặt lá, lau được' },
      { part: 'la', text: 'Mặt lá dính, bóng do mật côn trùng' },
      { part: 'qua', text: 'Quả bám đen, mất thẩm mỹ' },
    ],
    confusions: [
      { name: 'Đốm lá do nấm', slug: 'dom-la-nam', text: 'Đốm nấm ăn vào mô lá, không lau đi được.' },
    ],
    steps: [
      { title: 'Tìm và trị côn trùng tiết mật', detail: 'Kiểm tra rệp sáp, rệp muội, rầy phấn ở mặt dưới lá và đọt non' },
      { title: 'Phun dầu khoáng', detail: 'Dầu khoáng vừa diệt côn trùng vừa làm bong lớp muội' },
      { title: 'Rửa lá bằng nước sạch', detail: 'Lau nhẹ hoặc xịt nước sau 3–5 ngày' },
    ],
    prevention: ['Kiểm soát kiến — kiến tha và bảo vệ rệp'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-rep-sap-dau-khoang'],
  },

  // ---- Vi khuẩn ----
  {
    slug: 'chay-la-vi-khuan', name: 'Cháy lá, đốm lá vi khuẩn', aliases: ['đốm dầu', 'cháy bìa lá', 'đốm vi khuẩn'],
    cause: 'vi-khuan', parts: ['la'], plants: ['rau', 'kieng-la', 'lan'], severity: 3,
    spread: 'Qua nước bắn, vết thương', season: 'Mùa mưa, mưa bão',
    summary: 'Vi khuẩn xâm nhập qua lỗ khí và vết thương trên lá khi trời mưa. Đốm lan rất nhanh sau những trận mưa lớn và khó trị hơn bệnh nấm.',
    symptoms: [
      { part: 'la', text: 'Đốm nhỏ úng nước như vết dầu, sau chuyển nâu đen' },
      { part: 'la', text: 'Viền đốm có quầng vàng; mép lá cháy lan theo gân' },
      { part: 'la', text: 'Trời ẩm có thể thấy giọt dịch nhầy trên vết bệnh' },
    ],
    confusions: [
      { name: 'Đốm lá do nấm', slug: 'dom-la-nam', text: 'Đốm nấm khô, thường có vòng đồng tâm hoặc chấm đen (bào tử), không úng nước.' },
    ],
    steps: [
      { title: 'Cắt bỏ ngay lá bệnh', detail: 'Làm lúc lá khô, sát trùng kéo sau mỗi lần cắt' },
      { title: 'Ngừng tưới lên lá', detail: 'Chỉ tưới vào gốc, che mưa nếu có thể' },
      { title: 'Hỏi kỹ sư chọn thuốc gốc đồng', detail: 'Thuốc trừ nấm thông thường ít tác dụng với vi khuẩn' },
    ],
    prevention: ['Không cắt tỉa khi trời mưa', 'Giữ khoảng cách giữa các chậu'],
    safety: TOOL_SAFETY,
    products: ['keo-cat-tia-canh'],
  },
  {
    slug: 'thoi-nhun', name: 'Thối nhũn vi khuẩn', aliases: ['thối nhũn', 'thối ướt', 'thối đọt'],
    cause: 'vi-khuan', parts: ['than', 'goc', 'la'], plants: ['lan', 'sen-da', 'rau'], severity: 4,
    spread: 'Qua nước, vết thương, côn trùng', season: 'Mùa mưa, nóng ẩm',
    summary: 'Vi khuẩn Erwinia (Pectobacterium) làm mô cây nhũn nước và bốc mùi hôi. Bệnh lan rất nhanh, lan hồ điệp và sen đá có thể chết trong 2–3 ngày.',
    symptoms: [
      { part: 'la', text: 'Vết úng nước trong suốt, lan nhanh, lá nhũn như bị luộc' },
      { part: 'than', text: 'Thân, đọt mềm nhũn, chảy dịch' },
      { part: 'goc', text: 'Có mùi hôi thối đặc trưng' },
    ],
    confusions: [
      { name: 'Thối rễ do nấm', slug: 'thoi-re', text: 'Thối rễ bắt đầu từ dưới rễ và chậm hơn; thối nhũn vi khuẩn lan nhanh từ vết thương, rất hôi.' },
    ],
    steps: [
      { title: 'Cách ly cây bệnh ngay', detail: 'Để xa cây khác, không tưới chung' },
      { title: 'Cắt sạch phần nhũn', detail: 'Cắt lấn vào mô khỏe, sát trùng dao sau mỗi nhát' },
      { title: 'Để vết cắt khô', detail: 'Để nơi thoáng, không tưới 5–7 ngày; lan có thể chấm vôi hoặc keo liền sẹo' },
    ],
    prevention: ['Tưới buổi sáng để lá, đọt khô trước tối', 'Không để nước đọng ở nách lá, đọt lan'],
    safety: TOOL_SAFETY,
    products: ['keo-cat-tia-canh'],
  },
  {
    slug: 'heo-xanh-vi-khuan', name: 'Héo xanh vi khuẩn', aliases: ['héo rũ', 'héo xanh', 'chết nhanh'],
    cause: 'vi-khuan', parts: ['toan-cay', 're'], plants: ['rau', 'hoa'], severity: 5,
    spread: 'Qua đất, nước, dụng cụ', season: 'Nóng ẩm',
    summary: 'Vi khuẩn Ralstonia làm tắc mạch dẫn nước, cây héo rũ khi lá còn xanh. Hay gặp trên cà chua, ớt, cà tím, gừng. Hiện chưa có thuốc chữa khỏi cây đã bị.',
    symptoms: [
      { part: 'toan-cay', text: 'Cây héo rũ đột ngột buổi trưa, lá vẫn còn xanh' },
      { part: 'than', text: 'Cắt ngang thân thấy mạch nâu; ngâm vào cốc nước thấy dòng dịch trắng đục chảy ra' },
      { part: 're', text: 'Rễ thâm, nhưng không có tơ nấm trắng' },
    ],
    confusions: [
      { name: 'Thối gốc nấm hạch', slug: 'thoi-goc-nam-hach', text: 'Nấm hạch có tơ trắng và hạt tròn như hạt cải ở gốc.' },
      { name: 'Thiếu nước', slug: 'heo-thieu-nuoc', text: 'Thiếu nước tưới xong cây tươi lại; héo xanh tưới cũng không hồi.' },
    ],
    steps: [
      { title: 'Nhổ bỏ cây bệnh cùng đất quanh rễ', detail: 'Cho vào bao, đem đi xa, không ủ làm phân' },
      { title: 'Không trồng lại cây cùng họ ở chỗ cũ', detail: 'Luân canh ít nhất 1–2 vụ với cây khác họ (ngô, rau muống…)' },
      { title: 'Sát trùng dụng cụ, chậu', detail: 'Rửa chậu, kéo bằng xà phòng rồi lau cồn' },
    ],
    prevention: ['Dùng đất mới, sạch bệnh khi trồng rau chậu', 'Bổ sung phân hữu cơ và vi sinh đối kháng'],
    safety: TOOL_SAFETY,
    products: ['dat-tron-san-kieng-la', 'phan-trun-que', 'trichoderma-tri-nam-thoi-re'],
  },

  // ---- Virus ----
  {
    slug: 'kham-la', name: 'Khảm lá (virus)', aliases: ['lá khảm', 'lá loang lổ', 'virus khảm'],
    cause: 'virus', parts: ['la', 'toan-cay'], plants: ['rau', 'hoa', 'lan'], severity: 4,
    spread: 'Qua rệp, bọ trĩ, dụng cụ cắt', season: 'Mùa khô (nhiều côn trùng)',
    summary: 'Virus làm lá loang lổ xanh đậm xanh nhạt như bức khảm, cây còi cọc. Không có thuốc trị virus — chỉ loại bỏ cây bệnh và diệt côn trùng truyền bệnh.',
    symptoms: [
      { part: 'la', text: 'Lá loang lổ mảng xanh đậm xen xanh nhạt hoặc vàng' },
      { part: 'la', text: 'Lá nhăn, gồ ghề, nhỏ hơn bình thường' },
      { part: 'toan-cay', text: 'Cây lùn, ít hoa, quả méo' },
    ],
    confusions: [
      { name: 'Thiếu sắt', slug: 'vang-la-thieu-sat', text: 'Thiếu sắt vàng giữa các gân nhưng gân vẫn xanh đều, có quy luật; khảm loang lổ không đều.' },
    ],
    steps: [
      { title: 'Nhổ bỏ cây bệnh', detail: 'Không có thuốc chữa; để lại sẽ lây cho cả vườn' },
      { title: 'Diệt rệp, bọ trĩ quanh vườn', detail: 'Phun dầu khoáng lên các cây còn lại' },
      { title: 'Sát trùng tay và kéo', detail: 'Virus lây qua nhựa cây dính trên dụng cụ' },
    ],
    prevention: ['Mua giống sạch bệnh', 'Kiểm soát côn trùng chích hút từ sớm'],
    safety: `${SPRAY_SAFETY} ${TOOL_SAFETY}`,
    products: ['thuoc-tru-rep-sap-dau-khoang', 'keo-cat-tia-canh'],
  },
  {
    slug: 'xoan-la-virus', name: 'Vàng xoăn lá (virus)', aliases: ['xoăn lá', 'xoắn đọt', 'lá cuộn'],
    cause: 'virus', parts: ['la'], plants: ['rau'], severity: 4,
    spread: 'Qua bọ phấn trắng', season: 'Mùa khô',
    summary: 'Virus do bọ phấn trắng truyền, hay gặp trên cà chua, ớt, bí. Lá non xoăn, vàng mép, cây ngừng lớn.',
    symptoms: [
      { part: 'la', text: 'Lá non xoăn lên, cuộn mép, nhỏ lại' },
      { part: 'la', text: 'Mép và gân lá vàng' },
      { part: 'toan-cay', text: 'Đọt chùn lại, cây ngưng phát triển, rụng hoa' },
    ],
    confusions: [
      { name: 'Nhện đỏ, bọ trĩ', slug: 'bo-tri', text: 'Bọ trĩ, nhện làm lá cong nhưng soi mặt dưới sẽ thấy côn trùng và vết chích bạc.' },
    ],
    steps: [
      { title: 'Nhổ bỏ cây bệnh nặng', detail: 'Cho vào bao kín để bọ phấn không bay ra' },
      { title: 'Diệt bọ phấn trắng', detail: 'Phun dầu khoáng kỹ mặt dưới lá, 5–7 ngày một lần' },
    ],
    prevention: ['Dùng lưới chắn côn trùng cho rau', 'Treo bẫy dính vàng để phát hiện bọ phấn sớm'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-rep-sap-dau-khoang'],
  },

  // ---- Nhện, rệp, bọ trĩ ----
  {
    slug: 'rep-sap', name: 'Rệp sáp', aliases: ['rệp bông', 'bông trắng', 'rệp trắng'],
    cause: 'nhen-rep', parts: ['la', 'than', 're'], plants: ['kieng-la', 'sen-da', 'an-trai', 'lan'], severity: 3,
    spread: 'Theo kiến, cây mới mua', season: 'Mùa khô',
    summary: 'Côn trùng nhỏ phủ lớp sáp trắng như bông, bám ở nách lá, mặt dưới lá, thân và cả rễ để chích hút nhựa. Lớp sáp khiến thuốc khó thấm, cần phun kỹ và lặp lại.',
    symptoms: [
      { part: 'la', text: 'Cục bông trắng ở nách lá, gân lá; chọc vào có dịch hồng hoặc vàng' },
      { part: 'la', text: 'Lá vàng, dính mật, sau bị muội đen' },
      { part: 're', text: 'Sen đá, xương rồng: rệp bám rễ như mốc trắng khi nhổ cây lên' },
    ],
    confusions: [
      { name: 'Phấn trắng', slug: 'phan-trang', text: 'Phấn trắng là lớp bột mịn phủ đều mặt lá, không có con.' },
    ],
    steps: [
      { title: 'Lau sạch ổ rệp', detail: 'Dùng tăm bông nhúng cồn hoặc nước xà phòng loãng' },
      { title: 'Phun dầu khoáng', detail: 'Phun ướt kỹ nách lá, mặt dưới lá theo liều trên bao bì' },
      { title: 'Lặp lại 3 lần, mỗi lần cách 5–7 ngày', detail: 'Để diệt cả lứa rệp non mới nở' },
      { title: 'Rệp rễ: rửa rễ, thay đất mới', detail: 'Ngâm rễ trong dung dịch dầu khoáng rồi trồng lại' },
    ],
    prevention: ['Cách ly cây mới mua 1–2 tuần', 'Diệt kiến quanh chậu'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-rep-sap-dau-khoang', 'dat-tron-san-kieng-la'],
  },
  {
    slug: 'nhen-do', name: 'Nhện đỏ', aliases: ['nhện', 'lá bạc', 'tơ nhện trên lá'],
    cause: 'nhen-rep', parts: ['la'], plants: ['kieng-la', 'hoa', 'rau'], severity: 3,
    spread: 'Qua gió, tay người', season: 'Mùa khô, phòng máy lạnh',
    summary: 'Nhện rất nhỏ (như hạt bụi đỏ) sống mặt dưới lá, chích hút làm lá lấm tấm trắng bạc. Bùng phát khi không khí khô nóng, trong phòng máy lạnh.',
    symptoms: [
      { part: 'la', text: 'Mặt lá lấm tấm chấm trắng li ti, lá mất màu, bạc dần' },
      { part: 'la', text: 'Mặt dưới lá có tơ mảnh, chấm đỏ nhỏ di chuyển' },
      { part: 'la', text: 'Lá vàng, khô, rụng' },
    ],
    confusions: [
      { name: 'Bọ trĩ', slug: 'bo-tri', text: 'Bọ trĩ để vết bạc thành vệt kèm chấm đen (phân), không có tơ.' },
    ],
    steps: [
      { title: 'Xịt nước mạnh mặt dưới lá', detail: 'Làm trôi bớt nhện và tơ' },
      { title: 'Phun dầu khoáng', detail: 'Phun kỹ mặt dưới lá, 5–7 ngày một lần, 2–3 lần' },
      { title: 'Tăng độ ẩm quanh cây', detail: 'Phun sương, đặt khay nước gần chậu' },
    ],
    prevention: ['Phun sương cho lá cây trong phòng máy lạnh', 'Kiểm tra mặt dưới lá mỗi tuần'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-rep-sap-dau-khoang'],
  },
  {
    slug: 'bo-tri', name: 'Bọ trĩ (bù lạch)', aliases: ['bù lạch', 'thrips', 'lá bạc vệt'],
    cause: 'nhen-rep', parts: ['la', 'hoa'], plants: ['lan', 'hoa', 'rau'], severity: 3,
    spread: 'Bay theo gió', season: 'Mùa khô, nắng nóng',
    summary: 'Côn trùng nhỏ thon dài (1–2 mm) ẩn trong nụ, đọt non, chích hút làm lá và cánh hoa có vệt bạc, biến dạng. Bọ trĩ còn truyền virus.',
    symptoms: [
      { part: 'la', text: 'Vệt bạc, trắng xám trên lá, kèm chấm đen nhỏ (phân bọ trĩ)' },
      { part: 'hoa', text: 'Cánh hoa có vệt, lốm đốm, nụ thui không nở' },
      { part: 'la', text: 'Đọt non cong queo, lá mới nhỏ' },
    ],
    confusions: [
      { name: 'Nhện đỏ', slug: 'nhen-do', text: 'Nhện đỏ để chấm trắng li ti đều và có tơ mảnh.' },
    ],
    steps: [
      { title: 'Ngắt bỏ nụ, hoa bị nặng', detail: 'Bọ trĩ trú nhiều trong nụ' },
      { title: 'Phun dầu khoáng vào đọt, nụ', detail: '5–7 ngày một lần, 3 lần liên tiếp' },
      { title: 'Treo bẫy dính xanh dương hoặc vàng', detail: 'Bắt bọ trưởng thành, biết mật độ để phun kịp' },
    ],
    prevention: ['Tưới phun sương vào mùa khô', 'Làm sạch cỏ dại quanh vườn'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-rep-sap-dau-khoang'],
  },
  {
    slug: 'rep-muoi', name: 'Rệp muội (rệp mềm)', aliases: ['rệp xanh', 'rệp đen', 'rầy mềm'],
    cause: 'nhen-rep', parts: ['la', 'hoa'], plants: ['hoa', 'rau', 'an-trai'], severity: 2,
    spread: 'Theo kiến, bay', season: 'Đầu mùa khô',
    summary: 'Rệp nhỏ thân mềm màu xanh, đen hoặc vàng bám thành đám ở đọt non và nụ. Sinh sản rất nhanh, tiết mật gây muội đen.',
    symptoms: [
      { part: 'la', text: 'Đám rệp nhỏ bám đọt non, mặt dưới lá non' },
      { part: 'la', text: 'Lá non xoăn, cuộn lại, dính mật' },
      { part: 'hoa', text: 'Nụ bị bám, hoa nở méo hoặc rụng' },
    ],
    steps: [
      { title: 'Xịt nước hoặc vuốt bỏ đám rệp', detail: 'Làm được ngay khi mới thấy' },
      { title: 'Phun dầu khoáng', detail: 'Phun trúng đám rệp, 5–7 ngày một lần' },
    ],
    prevention: ['Không bón thừa đạm (đọt non mềm hút rệp)', 'Diệt kiến quanh cây'],
    safety: SPRAY_SAFETY,
    products: ['thuoc-tru-rep-sap-dau-khoang'],
  },

  // ---- Sâu hại ----
  {
    slug: 'sau-an-la', name: 'Sâu ăn lá', aliases: ['sâu xanh', 'sâu róm', 'lá thủng lỗ'],
    cause: 'sau-hai', parts: ['la'], plants: ['rau', 'hoa', 'kieng-la'], severity: 2,
    spread: 'Bướm đẻ trứng', season: 'Đầu mùa mưa',
    summary: 'Ấu trùng của bướm, ngài cắn phá lá thành lỗ hoặc ăn trụi cả lá. Sâu hay ăn đêm và ẩn mặt dưới lá ban ngày.',
    symptoms: [
      { part: 'la', text: 'Lá thủng lỗ, khuyết mép, có khi chỉ còn gân' },
      { part: 'la', text: 'Phân sâu dạng viên đen nhỏ trên lá hoặc mặt đất' },
      { part: 'la', text: 'Ổ trứng hoặc sâu non ở mặt dưới lá' },
    ],
    confusions: [
      { name: 'Ốc sên', slug: 'oc-sen', text: 'Ốc sên để lại vệt nhớt bóng, không có phân viên.' },
    ],
    steps: [
      { title: 'Bắt sâu bằng tay', detail: 'Kiểm tra mặt dưới lá lúc sáng sớm hoặc chiều tối' },
      { title: 'Ngắt bỏ lá có ổ trứng', detail: 'Trứng thường xếp thành cụm' },
      { title: 'Sâu nhiều: dùng thuốc trừ sâu sinh học', detail: 'Hỏi cửa hàng chọn thuốc phù hợp rau ăn' },
    ],
    prevention: ['Dùng lưới chắn côn trùng cho rau', 'Kiểm tra vườn 2–3 lần mỗi tuần'],
    safety: SPRAY_SAFETY,
  },
  {
    slug: 'sau-duc-than', name: 'Sâu đục thân, cành', aliases: ['sâu đục cành', 'mọt thân', 'xén tóc'],
    cause: 'sau-hai', parts: ['than'], plants: ['an-trai', 'hoa'], severity: 3,
    spread: 'Con trưởng thành bay đẻ trứng', season: 'Quanh năm',
    summary: 'Sâu non đục vào trong thân, cành ăn phần ruột làm cành héo, dễ gãy. Nhìn bên ngoài chỉ thấy lỗ nhỏ và mạt cưa.',
    symptoms: [
      { part: 'than', text: 'Lỗ nhỏ trên thân, cành, có mạt cưa hoặc phân sâu đùn ra' },
      { part: 'than', text: 'Cành héo đột ngột từ chỗ lỗ đục trở lên' },
      { part: 'toan-cay', text: 'Cây suy, lá vàng, cành dễ gãy' },
    ],
    steps: [
      { title: 'Cắt bỏ cành bị đục', detail: 'Cắt dưới lỗ đục, chẻ cành ra để bắt sâu' },
      { title: 'Luồn dây thép vào lỗ đục', detail: 'Chọc chết sâu non trong thân lớn không cắt được' },
      { title: 'Bịt lỗ đục', detail: 'Hỏi cửa hàng chọn thuốc bơm vào lỗ rồi bịt bằng đất sét hoặc keo liền sẹo' },
    ],
    prevention: ['Quét vôi gốc cây ăn trái', 'Kiểm tra thân cây thường xuyên để phát hiện mạt cưa'],
    safety: TOOL_SAFETY,
    products: ['keo-cat-tia-canh'],
  },

  // ---- Tuyến trùng ----
  {
    slug: 'tuyen-trung-sung-re', name: 'Tuyến trùng sưng rễ', aliases: ['u rễ', 'bướu rễ', 'rễ sần'],
    cause: 'tuyen-trung', parts: ['re'], plants: ['rau', 'kieng-la', 'an-trai'], severity: 4,
    spread: 'Qua đất, nước, cây giống', season: 'Quanh năm',
    summary: 'Giun tròn rất nhỏ sống trong đất chui vào rễ, tạo các u bướu. Rễ bị u không hút được nước và dinh dưỡng, cây còi, vàng, héo lúc trưa.',
    symptoms: [
      { part: 're', text: 'Rễ có nhiều u sưng tròn hoặc chuỗi hạt, không gỡ ra được' },
      { part: 'la', text: 'Lá vàng, nhỏ, héo vào buổi trưa rồi tươi lại chiều mát' },
      { part: 'toan-cay', text: 'Cây còi cọc dù được bón phân đầy đủ' },
    ],
    confusions: [
      { name: 'Thiếu đạm', slug: 'vang-la-thieu-dam', text: 'Thiếu đạm rễ bình thường, bón phân vào là cây xanh lại.' },
    ],
    steps: [
      { title: 'Nhổ lên kiểm tra rễ', detail: 'Cây trong chậu: rửa rễ, cắt bỏ phần u nặng' },
      { title: 'Thay đất mới hoàn toàn', detail: 'Không dùng lại đất cũ; phơi nắng hoặc bỏ đi' },
      { title: 'Bón phân hữu cơ, phân trùn quế', detail: 'Tăng vi sinh vật có ích, hạn chế tuyến trùng' },
    ],
    prevention: ['Dùng đất trộn sẵn sạch bệnh', 'Luân canh rau với cây ít nhiễm (hành, ngô)'],
    products: ['dat-tron-san-kieng-la', 'phan-trun-que'],
  },

  // ---- Ốc sên ----
  {
    slug: 'oc-sen', name: 'Ốc sên, sên nhớt ăn lá', aliases: ['ốc', 'sên', 'sên trần', 'vệt nhớt'],
    cause: 'oc-sen', parts: ['la', 'hoa'], plants: ['rau', 'lan', 'kieng-la', 'sen-da'], severity: 2,
    spread: 'Bò từ đất, chậu ẩm', season: 'Mùa mưa',
    summary: 'Ốc sên và sên trần ăn đêm, cắn lá non, rễ khí sinh và nụ lan. Ban ngày trốn dưới đáy chậu, chỗ ẩm tối.',
    symptoms: [
      { part: 'la', text: 'Lá bị ăn khuyết lỗ lớn, mép không đều' },
      { part: 'la', text: 'Vệt nhớt bóng lấp lánh trên lá, chậu' },
      { part: 'hoa', text: 'Nụ, đầu rễ lan bị ăn cụt' },
    ],
    confusions: [
      { name: 'Sâu ăn lá', slug: 'sau-an-la', text: 'Sâu để lại phân viên đen, không có vệt nhớt.' },
    ],
    steps: [
      { title: 'Bắt bằng tay buổi tối', detail: 'Soi đèn lúc 8–9 giờ tối, kiểm tra đáy chậu' },
      { title: 'Đặt bẫy', detail: 'Úp vỏ bưởi, lá rau dưới gốc, sáng ra gom ốc' },
      { title: 'Rắc vòng tro, vỏ trứng nghiền quanh chậu', detail: 'Ốc ngại bò qua bề mặt khô ráp' },
    ],
    prevention: ['Kê chậu cao khỏi mặt đất', 'Dọn lá mục, gạch đá ẩm quanh vườn'],
  },

  // ---- Dinh dưỡng ----
  {
    slug: 'vang-la-thieu-dam', name: 'Vàng lá do thiếu đạm', aliases: ['thiếu đạm', 'thiếu N', 'vàng lá già'],
    cause: 'dinh-duong', parts: ['la'], plants: ['kieng-la', 'rau', 'hoa', 'an-trai'], severity: 1,
    spread: 'Không lây', season: 'Quanh năm, sau mưa nhiều',
    summary: 'Cây thiếu đạm (N) chuyển đạm từ lá già sang lá non nên lá già phía dưới vàng đều trước. Hay gặp ở cây lâu không bón phân hoặc đất bị rửa trôi sau mưa.',
    symptoms: [
      { part: 'la', text: 'Lá già phía dưới vàng đều cả phiến, kể cả gân' },
      { part: 'la', text: 'Lá non nhỏ, xanh nhạt' },
      { part: 'toan-cay', text: 'Cây chậm lớn, ít đâm chồi' },
    ],
    confusions: [
      { name: 'Thiếu sắt', slug: 'vang-la-thieu-sat', text: 'Thiếu sắt vàng ở lá non, gân vẫn xanh.' },
      { name: 'Thối rễ', slug: 'thoi-re', text: 'Thối rễ lá vàng mềm, rũ; rễ nâu nhũn.' },
    ],
    steps: [
      { title: 'Kiểm tra rễ trước', detail: 'Rễ trắng khỏe thì mới bón phân' },
      { title: 'Bón phân tan chậm NPK', detail: 'Rắc quanh mép chậu theo liều trên bao bì' },
      { title: 'Bổ sung phân hữu cơ', detail: 'Phân trùn quế 1–2 tháng một lần giữ đất tơi, giàu dinh dưỡng' },
    ],
    prevention: ['Bón phân tan chậm định kỳ 2–3 tháng', 'Thay đất mới 12–18 tháng một lần'],
    products: ['phan-tan-cham-npk-14-14-14', 'phan-trun-que'],
  },
  {
    slug: 'vang-la-thieu-sat', name: 'Vàng lá gân xanh do thiếu sắt', aliases: ['thiếu sắt', 'vàng gân', 'lá non vàng'],
    cause: 'dinh-duong', parts: ['la'], plants: ['kieng-la', 'hoa', 'an-trai'], severity: 2,
    spread: 'Không lây', season: 'Quanh năm',
    summary: 'Thiếu sắt (hoặc đất kiềm làm cây không hút được sắt) khiến lá non vàng nhưng gân lá vẫn xanh như mạng lưới. Hay gặp ở cây tưới nước máy lâu ngày, đất bón nhiều vôi.',
    symptoms: [
      { part: 'la', text: 'Lá non vàng nhạt hoặc trắng, gân vẫn xanh rõ' },
      { part: 'la', text: 'Lá già phía dưới vẫn xanh bình thường' },
      { part: 'toan-cay', text: 'Nặng: lá non gần trắng, mép khô' },
    ],
    confusions: [
      { name: 'Thiếu đạm', slug: 'vang-la-thieu-dam', text: 'Thiếu đạm vàng cả gân và bắt đầu từ lá già.' },
      { name: 'Khảm lá virus', slug: 'kham-la', text: 'Khảm loang lổ không theo gân, lá nhăn biến dạng.' },
    ],
    steps: [
      { title: 'Phun phân bón lá có vi lượng', detail: 'Chọn loại có sắt (Fe), phun mặt dưới lá 7 ngày một lần' },
      { title: 'Giảm độ kiềm của đất', detail: 'Để nước máy qua đêm trước khi tưới; không bón vôi' },
      { title: 'Thay đất tơi, giàu hữu cơ', detail: 'Nếu đất trong chậu đã cũ, nén chặt' },
    ],
    prevention: ['Dùng đất trộn có hữu cơ', 'Bón phân có vi lượng định kỳ'],
    products: ['phan-bon-la-kich-hoa-lan', 'dat-tron-san-kieng-la'],
  },

  // ---- Sinh lý – môi trường ----
  {
    slug: 'chay-la-do-nang', name: 'Cháy lá do nắng gắt', aliases: ['cháy nắng', 'cháy mép lá', 'lá bị bỏng'],
    cause: 'sinh-ly', parts: ['la'], plants: ['kieng-la', 'lan', 'sen-da'], severity: 1,
    spread: 'Không lây', season: 'Mùa khô, tháng 3–5',
    summary: 'Cây ưa bóng đưa ra nắng trực tiếp đột ngột, hoặc nắng chiều xuyên kính, làm mô lá bị bỏng. Vết cháy không lan sang lá khác.',
    symptoms: [
      { part: 'la', text: 'Mảng trắng bạc hoặc nâu khô ở phần lá hứng nắng' },
      { part: 'la', text: 'Mép, chóp lá khô giòn, ranh giới rõ' },
      { part: 'toan-cay', text: 'Lá phía trong, phía khuất nắng vẫn xanh' },
    ],
    confusions: [
      { name: 'Thán thư', slug: 'than-thu', text: 'Thán thư có vòng đồng tâm và lan sang cả lá trong bóng râm.' },
    ],
    steps: [
      { title: 'Dời cây vào chỗ sáng gián tiếp', detail: 'Hoặc che lưới 50–70% cho cây ngoài trời' },
      { title: 'Cắt bỏ phần cháy nếu mất thẩm mỹ', detail: 'Phần đã cháy không xanh lại' },
      { title: 'Tưới đủ nước buổi sáng', detail: 'Không tưới lúc nắng gắt buổi trưa' },
    ],
    prevention: ['Tập cho cây quen nắng dần trong 1–2 tuần', 'Tránh đặt sát cửa kính hướng Tây'],
  },
  {
    slug: 'heo-thieu-nuoc', name: 'Héo, lá quăn do thiếu nước', aliases: ['khô hạn', 'lá rũ', 'héo'],
    cause: 'sinh-ly', parts: ['la', 'toan-cay'], plants: ['kieng-la', 'hoa', 'rau'], severity: 1,
    spread: 'Không lây', season: 'Mùa khô',
    summary: 'Cây mất nước nhanh hơn rễ hút được: đất khô, chậu nhỏ, nắng gió hoặc máy lạnh. Tưới kịp thì cây hồi lại trong vài giờ.',
    symptoms: [
      { part: 'la', text: 'Lá rũ, cuộn hoặc quăn, sờ thấy mỏng và giòn' },
      { part: 'la', text: 'Mép lá khô nâu, lá già rụng' },
      { part: 'goc', text: 'Đất khô, co lại, tách khỏi thành chậu' },
    ],
    confusions: [
      { name: 'Thối rễ', slug: 'thoi-re', text: 'Thối rễ cũng làm cây héo nhưng đất vẫn ẩm, lá mềm.' },
    ],
    steps: [
      { title: 'Ngâm cả chậu vào chậu nước 15–30 phút', detail: 'Đến khi hết sủi bọt khí, rồi để ráo' },
      { title: 'Để cây nơi mát 1–2 ngày', detail: 'Tránh nắng gắt khi cây đang phục hồi' },
      { title: 'Cân nhắc chậu lớn hơn hoặc chậu tự tưới', detail: 'Khi cây phải tưới mỗi ngày mà vẫn héo' },
    ],
    prevention: ['Kiểm tra đất bằng ngón tay trước khi tưới', 'Phủ mặt chậu bằng xơ dừa, sỏi để giữ ẩm'],
    products: ['chau-tu-tuoi-thong-minh', 'dat-tron-san-kieng-la'],
  },
  {
    slug: 'rung-la-soc-moi-truong', name: 'Rụng lá hàng loạt do sốc môi trường', aliases: ['sốc cây', 'rụng lá sau khi mua', 'cây mới về rụng lá'],
    cause: 'sinh-ly', parts: ['toan-cay', 'la'], plants: ['kieng-la'], severity: 1,
    spread: 'Không lây', season: 'Sau khi đổi chỗ, mua mới',
    summary: 'Cây đổi từ vườn ươm nhiều nắng vào nhà, hoặc bị dời chỗ, gió máy lạnh thổi trực tiếp sẽ rụng bớt lá để thích nghi. Thường ổn lại sau 2–4 tuần.',
    symptoms: [
      { part: 'la', text: 'Lá vàng rồi rụng nhiều trong 1–2 tuần sau khi đổi chỗ' },
      { part: 'la', text: 'Lá rụng còn xanh (hay gặp ở cây si, bàng Singapore)' },
      { part: 'toan-cay', text: 'Rễ và đọt non vẫn khỏe' },
    ],
    confusions: [
      { name: 'Thối rễ', slug: 'thoi-re', text: 'Thối rễ lá rụng kèm gốc mềm, rễ nâu nhũn.' },
    ],
    steps: [
      { title: 'Giữ cây một chỗ cố định', detail: 'Không dời đi dời lại, không thay chậu ngay' },
      { title: 'Đặt nơi sáng, tránh gió máy lạnh', detail: 'Cách cửa sổ 1–2 m là vừa' },
      { title: 'Tưới vừa phải, chưa bón phân', detail: 'Chờ cây ra lá mới rồi mới bón' },
    ],
    prevention: ['Chọn chỗ đặt trước khi mua cây', 'Cây mới mua dưới 7 ngày có dấu hiệu lạ: gửi yêu cầu bảo hành'],
  },

  // ---- Ngộ độc ----
  {
    slug: 'chay-re-do-phan', name: 'Cháy rễ do bón phân quá liều', aliases: ['ngộ độc phân', 'xót phân', 'cháy rễ'],
    cause: 'ngo-doc', parts: ['re', 'la'], plants: ['kieng-la', 'lan', 'rau', 'hoa'], severity: 3,
    spread: 'Không lây', season: 'Sau khi bón phân',
    summary: 'Bón phân quá nhiều, bón sát gốc hoặc bón khi đất khô làm nồng độ muối trong đất cao, rễ bị "rút nước" và cháy. Triệu chứng xuất hiện vài ngày sau khi bón.',
    symptoms: [
      { part: 'la', text: 'Mép và chóp lá cháy nâu đều trên nhiều lá cùng lúc' },
      { part: 're', text: 'Đầu rễ nâu khô, teo lại' },
      { part: 'goc', text: 'Mặt đất có lớp muối trắng hoặc phân chưa tan' },
    ],
    confusions: [
      { name: 'Cháy lá do nắng', slug: 'chay-la-do-nang', text: 'Cháy nắng chỉ ở phía hứng nắng; cháy phân đều cả lá trong bóng râm.' },
    ],
    steps: [
      { title: 'Gỡ bỏ phân còn trên mặt chậu', detail: 'Cào bỏ lớp đất mặt 1–2 cm' },
      { title: 'Tưới xả nhiều nước', detail: 'Tưới gấp 3–4 lần thể tích chậu cho nước chảy qua lỗ thoát, rửa trôi muối' },
      { title: 'Ngưng bón phân 4–6 tuần', detail: 'Chờ cây ra rễ, lá mới' },
    ],
    prevention: ['Bón đúng liều trên bao bì — thà ít hơn còn hơn nhiều', 'Tưới ẩm đất trước khi bón, rắc phân cách gốc'],
    products: ['phan-tan-cham-npk-14-14-14', 'dat-tron-san-kieng-la'],
  },
];
