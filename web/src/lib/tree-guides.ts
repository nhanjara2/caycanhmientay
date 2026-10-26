import type { Section } from './policy-content';
import type { IconName } from '@/components/Icon';

// Bài viết các nhóm cây công trình, mở từ mục "Cây công trình" ở trang Đối tác sỉ (/doi-tac/cay-cong-trinh/<slug>).

export type TreeGuide = { slug: string; icon: IconName; title: string; short: string; description: string; updated: string; sections: Section[] };

const QUOTE = '[Gửi báo giá](/bao-gia-si)';

export const TREE_GUIDES: TreeGuide[] = [
  {
    slug: 'cay-bong-mat',
    icon: 'trees',
    title: 'Cây bóng mát, cây đường phố',
    short: 'Vỉa hè, trục đường, công viên, khu dân cư, nhà máy',
    description: 'Các loại cây bóng mát, cây đường phố cho công trình: sao đen, dầu rái, giáng hương, lim xẹt, bằng lăng, phượng vĩ… Cung cấp sỉ theo quy cách.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cây bóng mát dùng ở đâu',
        blocks: ['Cây bóng mát là tầng cao, khung xanh chính của công trình: trồng dọc vỉa hè, trục đường, đường nội bộ, công viên, khu dân cư, trường học và khuôn viên nhà máy.'],
      },
      {
        h: 'Các loại cây phổ biến',
        blocks: [{
          table: {
            head: ['Cây', 'Đặc điểm', 'Hợp với'],
            rows: [
              ['**Sao đen**', 'Cây gỗ lớn bản địa, thân thẳng, tán cao, tuổi thọ cao', 'Đường phố, khuôn viên rộng, nhà máy'],
              ['**Dầu rái**', 'Thân lớn, tán rộng, sống lâu năm', 'Công viên, tuyến đường có không gian phát triển'],
              ['**Giáng hương**', 'Tán đẹp, hoa vàng', 'Khu đô thị, khu dân cư, công viên'],
              ['**Lim xẹt**', 'Tán đẹp, hoa vàng, khá chịu hạn', 'Cây xanh đường phố, khu công nghiệp'],
              ['**Bằng lăng**', 'Hoa tím nổi bật', 'Đường nội bộ, trường học, khu dân cư'],
              ['**Phượng vĩ**', 'Hoa đỏ rực vào mùa hè', 'Trường học, công viên'],
            ],
          },
        }, 'Ngoài ra còn có me tây, long não, lộc vừng, sấu, muồng hoàng yến, xà cừ.'],
      },
      {
        h: 'Chọn cây theo công trình',
        blocks: [{
          table: {
            head: ['Công trình', 'Cây tham khảo'],
            rows: [
              ['Vỉa hè, đường phố', 'Sao đen, dầu rái, giáng hương, lim xẹt'],
              ['Công viên, quảng trường', 'Me tây, lộc vừng, bằng lăng'],
              ['Khu đô thị, khu dân cư', 'Giáng hương, bằng lăng, muồng hoàng yến'],
              ['Khu công nghiệp, nhà máy', 'Sao đen, dầu rái, lim xẹt'],
            ],
          },
        }],
      },
      {
        h: 'Chọn cây theo vùng',
        blocks: [{
          table: {
            head: ['Khu vực', 'Cây có thể xem xét', 'Cần lưu ý'],
            rows: [
              ['Miền Bắc', 'Sao đen, bằng lăng, giáng hương, lộc vừng, sấu', 'Mùa đông lạnh'],
              ['Bắc Trung Bộ', 'Bằng lăng, lim xẹt, giáng hương', 'Gió bão, nắng nóng, thoát nước'],
              ['Nam Trung Bộ', 'Lim xẹt và các cây chịu nắng, chịu hạn', 'Gió mạnh, đất cát, độ mặn'],
              ['Tây Nguyên', 'Sao đen, giáng hương', 'Mùa khô, đất bazan, đất dốc'],
              ['Đông Nam Bộ', 'Sao đen, dầu rái, giáng hương, bằng lăng', 'Nắng nóng, mưa lớn, đất nén chặt'],
              ['Đồng bằng sông Cửu Long', 'Lộc vừng, bằng lăng', 'Ngập úng, độ mặn, nền đất yếu'],
            ],
          },
        }],
      },
      {
        h: 'Lưu ý khi chọn cây',
        blocks: [{ ul: [
          'Kích thước tán và chiều cao khi trưởng thành.',
          'Bộ rễ so với vỉa hè, công trình ngầm và móng nhà.',
          'Khoảng cách với đường dây điện, đèn chiếu sáng.',
          'Mặt cắt đường và khoảng cách an toàn với cây trồng vỉa hè.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Tên cây', 'Chiều cao', 'Đường kính thân (ghi rõ vị trí đo)', 'Đường kính tán', 'Cỡ bầu', 'Số lượng, nơi giao, tiến độ giao'] }, `${QUOTE} kèm bảng khối lượng hoặc ảnh chụp danh sách.`],
      },
    ],
  },
  {
    slug: 'cay-diem-nhan',
    icon: 'leaf',
    title: 'Cây điểm nhấn, cây hoa',
    short: 'Cổng dự án, quảng trường, sảnh, resort',
    description: 'Cây tạo điểm nhấn cho công trình: cau vua, cọ dầu, kèn hồng, lộc vừng, giáng hương, muồng hoàng yến. Cung cấp sỉ theo quy cách.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cây điểm nhấn dùng ở đâu',
        blocks: ['Cây điểm nhấn là tầng trung, tạo màu sắc và dáng nổi bật ở cổng chính, sảnh, quảng trường, nút giao cảnh quan, hồ cảnh và khu nghỉ dưỡng.'],
      },
      {
        h: 'Các loại cây phổ biến',
        blocks: [{
          table: {
            head: ['Cây', 'Đặc điểm', 'Hợp với'],
            rows: [
              ['**Cau vua**', 'Thân thẳng, trồng thành hàng lối sang trọng', 'Khu đô thị, cổng dự án, resort'],
              ['**Cọ dầu**', 'Dáng nhiệt đới', 'Khu nghỉ dưỡng, đường phố'],
              ['**Kèn hồng**', 'Hoa hồng phủ tán', 'Tuyến đường, quảng trường'],
              ['**Lộc vừng**', 'Tán duyên dáng, hoa rủ', 'Hồ cảnh quan, sân vườn'],
              ['**Giáng hương**', 'Tán đẹp, hoa vàng', 'Sảnh, khu dân cư'],
              ['**Muồng hoàng yến**', 'Hoa vàng rực', 'Khu đô thị, công viên'],
            ],
          },
        }],
      },
      {
        h: 'Chọn cây theo công trình',
        blocks: [{
          table: {
            head: ['Công trình', 'Cây tham khảo'],
            rows: [
              ['Resort, khách sạn', 'Cau vua, cọ dầu, kèn hồng, lộc vừng'],
              ['Khu đô thị, cổng dự án', 'Cau vua, giáng hương, muồng hoàng yến'],
              ['Công viên, quảng trường', 'Lộc vừng, kèn hồng'],
            ],
          },
        }],
      },
      {
        h: 'Lưu ý khi chọn cây',
        blocks: [{ ul: [
          'Tầm nhìn tới cổng, biển hiệu và lối giao thông.',
          'Khoảng trống cho tán khi cây lớn.',
          'Đường vận chuyển, chỗ đứng xe cẩu khi trồng cây lớn.',
          'Cây trồng hàng lối cần đồng đều chiều cao và cỡ thân.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Tên cây', 'Chiều cao, chiều cao thân (với cau, cọ)', 'Đường kính thân, đường kính tán', 'Cỡ bầu', 'Số lượng, nơi giao, tiến độ giao'] }, `${QUOTE} kèm bảng khối lượng hoặc ảnh chụp danh sách.`],
      },
    ],
  },
  {
    slug: 'cay-bui-cay-vien',
    icon: 'sprout',
    title: 'Cây bụi, cây viền',
    short: 'Dải phân cách, bồn hoa, viền lối đi',
    description: 'Cây bụi, cây viền cho công trình: chuỗi ngọc, trang đỏ, nguyệt quế, vàng anh, dâm bụt, ắc ó. Cung cấp sỉ số lượng lớn.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cây bụi dùng ở đâu',
        blocks: ['Cây bụi và cây viền trồng ở dải phân cách, bồn hoa, viền lối đi, tạo ranh giới và mảng xanh tầng thấp.'],
      },
      {
        h: 'Các loại cây phổ biến',
        blocks: [{
          table: {
            head: ['Cây', 'Đặc điểm'],
            rows: [
              ['**Chuỗi ngọc**', 'Lá nhỏ, dễ cắt tỉa thành hàng rào, khối'],
              ['**Trang đỏ**', 'Hoa đỏ ra quanh năm'],
              ['**Nguyệt quế**', 'Lá xanh bóng, hoa thơm'],
              ['**Vàng anh**', 'Hoa vàng, trồng cụm'],
              ['**Dâm bụt**', 'Hoa to, nhiều màu, dễ trồng'],
              ['**Ắc ó**', 'Lá xanh đậm, trồng viền, tạo khối'],
            ],
          },
        }, 'Ngoài ra còn có lan chi, lẻ bạn và các loại cây lá màu.'],
      },
      {
        h: 'Chọn cây theo công trình',
        blocks: [{
          table: {
            head: ['Công trình', 'Cây tham khảo'],
            rows: [
              ['Dải phân cách', 'Chuỗi ngọc, trang đỏ, ắc ó'],
              ['Bồn hoa, viền lối đi', 'Nguyệt quế, trang đỏ, vàng anh'],
              ['Sân vườn, khu dân cư', 'Dâm bụt, nguyệt quế, chuỗi ngọc'],
            ],
          },
        }],
      },
      {
        h: 'Lưu ý khi chọn cây',
        blocks: [{ ul: [
          'Chiều cao trưởng thành không che tầm nhìn giao thông.',
          'Cây dễ cắt tỉa, giữ dáng.',
          'Nắng hay bóng râm tại chỗ trồng.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Tên cây', 'Chiều cao', 'Độ phủ (đường kính tán)', 'Cỡ bầu hoặc cỡ chậu', 'Số lượng hoặc diện tích và mật độ trồng'] }, `${QUOTE} kèm bảng khối lượng hoặc ảnh chụp danh sách.`],
      },
    ],
  },
  {
    slug: 'cay-tham-nen',
    icon: 'box',
    title: 'Cây thảm nền, cỏ',
    short: 'Bãi cỏ, taluy, sân vườn, dải xanh',
    description: 'Cỏ và cây phủ đất cho công trình: cỏ lá gừng, cỏ nhung Nhật, cỏ Bermuda, lan chi, lẻ bạn, cẩm thạch, dền cảnh, lá gấm.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cây thảm nền dùng ở đâu',
        blocks: ['Cỏ và cây phủ đất hoàn thiện tầng thấp: phủ xanh bãi cỏ, sân vườn, công viên, taluy, khuôn viên nhà máy, tạo viền và mảng màu ở bồn hoa.'],
      },
      {
        h: 'Các loại phổ biến',
        blocks: [{
          table: {
            head: ['Loại', 'Đặc điểm', 'Hợp với'],
            rows: [
              ['**Cỏ lá gừng**', 'Chịu nắng, chịu giẫm, dễ chăm', 'Công viên, taluy, nhà máy'],
              ['**Cỏ nhung Nhật**', 'Lá nhỏ, mịn, thảm dày', 'Sân vườn, bồn hoa, biệt thự'],
              ['**Cỏ Bermuda**', 'Chịu giẫm tốt', 'Sân thể thao, bãi cỏ rộng'],
              ['**Lan chi, lẻ bạn, cẩm thạch**', 'Lá sọc, lá màu', 'Viền bồn hoa, lối đi'],
              ['**Dền cảnh, lá gấm**', 'Lá màu, tạo hoa văn', 'Mảng màu trang trí'],
            ],
          },
        }],
      },
      {
        h: 'Lưu ý khi chọn',
        blocks: [{ ul: [
          'Nắng hay bóng râm, độ dốc của nền.',
          'Khả năng thoát nước.',
          'Mức đi lại, giẫm lên.',
          'Tần suất cắt tỉa có thể đáp ứng.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Loại cỏ, loại cây', 'Diện tích (m²)', 'Mật độ trồng hoặc dạng cung cấp (tấm, bầu, chậu)', 'Nơi giao, tiến độ giao'] }, `${QUOTE} kèm bảng khối lượng hoặc ảnh chụp danh sách.`],
      },
    ],
  },
];

export const treeGuidePath = (slug: string) => `/doi-tac/cay-cong-trinh/${slug}`;
export const getTreeGuide = (slug: string) => TREE_GUIDES.find((g) => g.slug === slug);
