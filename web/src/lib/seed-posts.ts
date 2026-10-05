// Bài Góc chăm cây mẫu — nạp một lần khi bảng `posts` còn trống (npm run db:setup).
// Shop sửa / gỡ / xóa ở /admin/noi-dung. Không có kỹ sư kiểm duyệt (không ghi tên người thật khi chưa có).
import type { CategoryKey, PostBlock } from './posts';

export type SeedPost = {
  slug: string; category: CategoryKey; title: string; excerpt: string; seoDescription: string;
  tags: string[]; diseases: string[]; body: PostBlock[];
};

export const seedPosts: SeedPost[] = [
  {
    slug: '5-dau-hieu-thoi-re-mua-mua',
    category: 'bat-benh',
    title: '5 dấu hiệu cây kiểng lá bị thối rễ mùa mưa và cách cứu kịp',
    excerpt: 'Mùa mưa độ ẩm cao, chậu thoát nước kém là nguyên nhân hàng đầu khiến kiểng lá thối rễ. Nhận biết sớm giúp cứu cây trong 1–2 tuần.',
    seoDescription: 'Lá vàng mềm, cây héo dù đất ẩm, gốc thâm: 5 dấu hiệu kiểng lá thối rễ mùa mưa và các bước cứu cây, phòng bệnh tại nhà.',
    tags: ['Kiểng lá', 'Thối rễ', 'Mùa mưa'],
    diseases: ['thoi-re'],
    body: [
      { type: 'p', text: 'Mùa mưa ở miền Nam, chậu đặt ngoài ban công hứng mưa nhiều ngày liền, đất không kịp khô. Rễ ngâm nước lâu sẽ thiếu không khí, yếu đi và bị nấm trong đất tấn công. Thối rễ diễn ra **bên dưới mặt đất** nên thường bị phát hiện muộn — khi lá đã vàng hàng loạt.' },
      { type: 'h2', text: 'Dấu hiệu nhận biết' },
      { type: 'h3', text: '1. Lá vàng từ dưới lên, mềm oặt' },
      { type: 'p', text: 'Lá già phía dưới vàng đều, cầm vào thấy mềm, không giòn như khi thiếu nước. Rễ đã không hút được nước dù đất vẫn ẩm.' },
      { type: 'h3', text: '2. Cây héo dù đất vẫn ẩm' },
      { type: 'p', text: 'Đây là dấu hiệu dễ nhầm nhất: thấy cây héo, nhiều người tưới thêm nước khiến bệnh nặng hơn. Luôn **kiểm tra độ ẩm đất trước khi tưới**.' },
      { type: 'h3', text: '3. Đất có mùi chua, hôi' },
      { type: 'p', text: 'Đất ngập nước lâu ngày bốc mùi chua hoặc mùi úng, mặt đất có thể đóng rêu xanh.' },
      { type: 'h3', text: '4. Gốc thân mềm, thâm đen' },
      { type: 'p', text: 'Ấn nhẹ vào phần thân sát mặt đất thấy mềm, vỏ chuyển màu nâu đen. Bệnh đã lan từ rễ lên gốc, cần xử lý ngay.' },
      { type: 'h3', text: '5. Rễ nâu đen, tuột vỏ khi kéo nhẹ' },
      { type: 'p', text: 'Nhấc cây khỏi chậu để xem: rễ khỏe màu trắng hoặc vàng nhạt, chắc tay; rễ thối màu nâu đen, nhũn, kéo nhẹ là tuột lớp vỏ ngoài.' },
      { type: 'h2', text: 'Cách cứu cây bị thối rễ' },
      {
        type: 'list', ordered: true, items: [
          'Ngừng tưới, đưa chậu vào chỗ có mái che, thoáng gió.',
          'Nhấc cây khỏi chậu, rũ bỏ phần đất cũ bám quanh rễ.',
          'Dùng kéo sạch (lau cồn) cắt bỏ hết rễ thối, cắt đến phần rễ trắng chắc. Cắt bớt vài lá già nếu bộ rễ còn lại quá ít.',
          'Ngâm hoặc tưới đẫm bộ rễ bằng chế phẩm Trichoderma pha đúng liều ghi trên nhãn.',
          'Trồng lại vào chậu có lỗ thoát nước với giá thể mới, tơi xốp. Không dùng lại đất cũ.',
          'Đặt nơi sáng nhẹ, tránh nắng gắt 1–2 tuần. Chỉ tưới lại khi mặt đất khô 2–3 cm.',
        ],
      },
      { type: 'products', title: 'Dùng trong bài này', slugs: ['trichoderma-tri-nam-thoi-re', 'dat-tron-san-kieng-la'] },
      { type: 'note', title: 'Lưu ý an toàn', text: 'Đeo găng tay khi pha và tưới chế phẩm, rửa tay sạch sau khi làm. Pha đúng liều trên nhãn, không tự ý tăng liều. Để xa tầm tay trẻ em và vật nuôi.' },
      { type: 'h2', text: 'Phòng thối rễ mùa mưa' },
      {
        type: 'list', ordered: false, items: [
          'Chậu phải có lỗ thoát nước; lót một lớp sỏi hoặc đá lót chậu dưới đáy.',
          'Dùng giá thể tơi xốp (đất trộn xơ dừa, trấu hun, đá perlite), tránh đất thịt nén chặt.',
          'Kê chậu cao, không để nước đọng trong đĩa lót.',
          'Mưa nhiều ngày liền: dời chậu vào chỗ có mái che.',
          'Tưới theo độ ẩm của đất, không tưới theo lịch cố định.',
          'Trong mùa mưa, tưới bổ sung Trichoderma khoảng 1 tháng/lần để phòng nấm hại rễ.',
        ],
      },
      { type: 'p', text: 'Đã cắt hơn nửa bộ rễ mà cây vẫn héo? Xem thêm bài [Thối rễ trong thư viện bệnh cây](/benh-cay/thoi-re) hoặc mang mẫu cây đến cửa hàng gần nhất để được xem giúp.' },
    ],
  },
  {
    slug: 'tuoi-cay-trong-nha-dung-cach',
    category: 'cham-soc',
    title: 'Tưới cây trong nhà đúng cách: bao lâu tưới một lần?',
    excerpt: 'Tưới quá nhiều — không phải quá ít — mới là lý do cây trong nhà chết nhiều nhất. Cách biết chính xác lúc nào cây cần nước.',
    seoDescription: 'Không có lịch tưới chung cho mọi cây. Cách thử độ ẩm đất, tưới bao nhiêu là đủ và nhu cầu nước của từng nhóm cây trong nhà.',
    tags: ['Kiểng lá', 'Tưới nước', 'Cây văn phòng'],
    diseases: [],
    body: [
      { type: 'p', text: 'Không có lịch “2 ngày tưới một lần” dùng chung cho mọi cây. Lượng nước cây cần thay đổi theo **loại cây, cỡ chậu, ánh sáng và mùa**: cùng một chậu trầu bà, đặt cạnh cửa sổ nắng sẽ khô nhanh gấp đôi so với đặt trong phòng máy lạnh.' },
      { type: 'h2', text: 'Cách biết lúc nào cần tưới' },
      {
        type: 'list', ordered: false, items: [
          '**Thử bằng ngón tay:** ấn sâu 2–3 cm vào đất, thấy khô thì tưới, còn ẩm thì chờ thêm.',
          '**Nhấc chậu:** chậu nhẹ hẳn so với lúc vừa tưới là đất đã khô.',
          '**Que tre:** cắm que xuống gần đáy chậu, rút lên thấy đất ẩm bám vào thì chưa cần tưới.',
        ],
      },
      { type: 'h2', text: 'Tưới bao nhiêu là đủ' },
      { type: 'p', text: 'Tưới chậm, đều quanh gốc đến khi nước chảy ra lỗ thoát dưới đáy chậu để cả bầu rễ được ướt. Sau 15–20 phút, đổ bỏ nước đọng trong đĩa lót.\n\nTưới mỗi lần một chút làm rễ chỉ mọc ở lớp đất mặt, trong khi đáy chậu vẫn khô — cây yếu và dễ héo khi trời nóng.' },
      { type: 'h2', text: 'Nhu cầu nước theo nhóm cây' },
      {
        type: 'table', rows: [
          ['Nhóm cây', 'Khi nào tưới', 'Ví dụ'],
          ['Ưa ẩm', 'Mặt đất vừa khô 1–2 cm', 'Dương xỉ, lan ý (bạch môn)'],
          ['Kiểng lá thông thường', 'Đất khô 2–3 cm', 'Monstera, trầu bà, Philodendron'],
          ['Chịu hạn', 'Đất khô gần hết chậu', 'Lưỡi hổ, kim tiền, sen đá, xương rồng'],
        ],
      },
      { type: 'h2', text: 'Những lỗi hay gặp' },
      {
        type: 'list', ordered: false, items: [
          'Tưới theo lịch cố định mà không kiểm tra đất.',
          'Trồng trong chậu không có lỗ thoát nước, nước đọng dưới đáy làm thối rễ.',
          'Tưới buổi tối và để lá ướt qua đêm — dễ sinh nấm. Nên tưới vào buổi sáng.',
          'Phòng máy lạnh làm mép lá khô nhưng đất lại khô rất chậm: đừng tưới thêm chỉ vì thấy lá khô mép.',
        ],
      },
      { type: 'products', title: 'Giúp tưới đúng hơn', slugs: ['chau-tu-tuoi-thong-minh', 'dat-tron-san-kieng-la'] },
      { type: 'p', text: 'Cây vẫn vàng lá dù đã tưới đúng? Xem [5 dấu hiệu cây kiểng lá bị thối rễ](/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua).' },
    ],
  },
  {
    slug: 'trong-rau-muong-thung-xop',
    category: 'rau-sach',
    title: 'Trồng rau muống thùng xốp tại nhà: khoảng 25 ngày có rau ăn',
    excerpt: 'Rau muống là loại rau dễ trồng nhất cho người mới: hạt lên nhanh, ít sâu bệnh, cắt xong lại ra đọt mới.',
    seoDescription: 'Hướng dẫn trồng rau muống trong thùng xốp: chuẩn bị đất, ngâm ủ hạt, gieo, tưới, bón phân và cách cắt để thu hoạch nhiều lứa.',
    tags: ['Rau sạch ban công', 'Gieo hạt'],
    diseases: [],
    body: [
      { type: 'p', text: 'Chỉ cần một thùng xốp và chỗ có nắng, bạn có rau muống sạch ăn quanh năm. Một thùng cắt được nhiều lứa, mỗi lứa cách nhau chừng 2 tuần.' },
      { type: 'h2', text: 'Chuẩn bị' },
      {
        type: 'list', ordered: false, items: [
          'Thùng xốp khoảng 60×40 cm, cao 20–25 cm; đục 6–8 lỗ ở đáy để thoát nước.',
          'Đất: trộn đất sạch với phân trùn quế theo tỉ lệ khoảng 7:3, thêm ít xơ dừa cho tơi.',
          'Hạt giống rau muống.',
          'Chỗ đặt thùng có nắng trực tiếp ít nhất 4–5 giờ mỗi ngày.',
        ],
      },
      { type: 'h2', text: 'Gieo hạt' },
      {
        type: 'list', ordered: true, items: [
          'Ngâm hạt trong nước ấm (2 phần nước sôi, 3 phần nước lạnh) khoảng 4–6 giờ.',
          'Vớt hạt ra, ủ trong khăn ẩm đến khi hạt nứt nanh (thường sau khoảng 1 ngày).',
          'Rạch hàng cách nhau 10–15 cm, gieo hạt cách nhau 3–5 cm, phủ một lớp đất mỏng khoảng 1 cm.',
          'Tưới nhẹ bằng bình phun sương cho hạt không bị trôi, giữ đất luôn ẩm đều.',
        ],
      },
      { type: 'h2', text: 'Chăm sóc' },
      { type: 'p', text: 'Tưới mỗi ngày vào sáng sớm hoặc chiều mát; những ngày nắng nóng có thể tưới 2 lần. Khi cây có 3–4 lá thật, tỉa bớt cây yếu cho thưa. Khoảng 10 ngày sau gieo, rải thêm một lớp phân trùn quế mỏng quanh gốc rồi tưới nước.' },
      { type: 'note', title: 'Mẹo nhỏ', text: 'Rau trồng tại nhà không cần phun thuốc: thấy sâu ăn lá thì bắt bằng tay hoặc ngắt bỏ lá bị sâu.' },
      { type: 'h2', text: 'Thu hoạch' },
      { type: 'p', text: 'Khoảng 20–25 ngày sau khi gieo, cây cao 25–30 cm là cắt được. Cắt cách gốc 3–5 cm để gốc tiếp tục ra đọt mới, rải thêm ít phân trùn quế sau mỗi lần cắt — 10–15 ngày sau lại có lứa tiếp theo.' },
      { type: 'products', title: 'Dùng trong bài này', slugs: ['hat-giong-rau-muong', 'phan-trun-que'] },
    ],
  },
];
