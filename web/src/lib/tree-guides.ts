import type { Section } from './policy-content';
import type { IconName } from '@/components/Icon';

// Bài viết các nhóm cây công trình, mở từ mục "Cây công trình" ở trang Đối tác sỉ (/doi-tac/cay-cong-trinh/<slug>).

export type TreeGuide = {
  slug: string; icon: IconName; title: string; short: string; description: string; updated: string; sections: Section[];
  /** Ảnh thẻ trên /doi-tac (public/images/doi-tac/, 1280×960) — ghi công ở TREE_IMAGE_CREDITS. */
  image: string;
};

const QUOTE = '[Gửi báo giá](/bao-gia-si)';

export const TREE_GUIDES: TreeGuide[] = [
  {
    slug: 'cay-bong-mat',
    icon: 'trees',
    image: '/images/doi-tac/cay-bong-mat.webp',
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
    slug: 'cay-co-lon',
    icon: 'tree',
    image: '/images/doi-tac/cay-co-lon.webp',
    title: 'Cây công trình cỡ lớn',
    short: 'Cây trưởng thành có bầu, tạo tán ngay',
    description: 'Cây công trình cỡ lớn, cây trưởng thành có bầu cho dự án cần tán xanh ngay: cây bóng mát, cây hoa, cây dáng đẹp theo quy cách. Báo giá theo từng cây.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cây cỡ lớn dùng ở đâu',
        blocks: ['Cây trưởng thành có bầu dùng cho công trình cần tán xanh ngay khi bàn giao: quảng trường, sảnh, cổng chính, công viên, khu nghỉ dưỡng và các vị trí làm điểm nhấn.'],
      },
      {
        h: 'Các loại thường đặt',
        blocks: [{ ul: [
          'Cây bóng mát cỡ lớn: sao đen, dầu rái, giáng hương, lim xẹt, me tây.',
          'Cây hoa cỡ lớn: bằng lăng, kèn hồng, lộc vừng, muồng hoàng yến.',
          'Cây dáng đẹp làm điểm nhấn ở sảnh, quảng trường.',
        ] }, 'Số lượng cây cỡ lớn thay đổi theo từng thời điểm; quy cách và nguồn cây xác nhận khi báo giá.'],
      },
      {
        h: 'Lưu ý khi chọn cây',
        blocks: [{ ul: [
          'Đường vận chuyển và chỗ đứng xe cẩu tại công trình.',
          'Hố trồng theo cỡ bầu và điều kiện đất.',
          'Cọc chống, tưới đẫm và theo dõi thời gian đầu sau trồng.',
          'Khoảng cách với công trình, đường dây điện, công trình ngầm.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Tên cây', 'Chiều cao', 'Đường kính thân (ghi rõ vị trí đo)', 'Đường kính tán', 'Cỡ bầu', 'Số lượng, nơi giao, điều kiện xe vào công trình'] }, `${QUOTE} kèm bảng khối lượng, ảnh mẫu cây mong muốn hoặc ảnh chụp danh sách.`],
      },
    ],
  },
  {
    slug: 'cay-diem-nhan',
    icon: 'flower',
    image: '/images/doi-tac/cay-hoa.webp',
    title: 'Cây hoa, cây điểm nhấn',
    short: 'Tuyến đường, quảng trường, sảnh, trường học',
    description: 'Cây hoa tạo điểm nhấn cho công trình: bằng lăng, kèn hồng, muồng hoàng yến, lộc vừng, giáng hương, phượng vĩ. Cung cấp sỉ theo quy cách.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cây điểm nhấn dùng ở đâu',
        blocks: ['Cây hoa là tầng trung, tạo màu sắc nổi bật ở cổng chính, sảnh, quảng trường, nút giao cảnh quan, hồ cảnh, trường học và khu dân cư.'],
      },
      {
        h: 'Các loại cây phổ biến',
        blocks: [{
          table: {
            head: ['Cây', 'Đặc điểm', 'Hợp với'],
            rows: [
              ['**Bằng lăng**', 'Hoa tím, nở rộ mùa hè', 'Đường nội bộ, trường học, khu dân cư'],
              ['**Kèn hồng**', 'Hoa hồng phủ tán', 'Tuyến đường, quảng trường'],
              ['**Lộc vừng**', 'Tán duyên dáng, hoa rủ', 'Hồ cảnh quan, sân vườn'],
              ['**Giáng hương**', 'Tán đẹp, hoa vàng', 'Sảnh, khu dân cư'],
              ['**Muồng hoàng yến**', 'Hoa vàng rực', 'Khu đô thị, công viên'],
              ['**Phượng vĩ**', 'Hoa đỏ rực vào mùa hè', 'Trường học, công viên'],
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
              ['Tuyến đường, quảng trường', 'Kèn hồng, bằng lăng, muồng hoàng yến'],
              ['Khu đô thị, khu dân cư', 'Giáng hương, bằng lăng, muồng hoàng yến'],
              ['Trường học, công viên', 'Phượng vĩ, bằng lăng, lộc vừng'],
              ['Hồ cảnh, sân vườn', 'Lộc vừng, kèn hồng'],
            ],
          },
        }],
      },
      {
        h: 'Lưu ý khi chọn cây',
        blocks: [{ ul: [
          'Mùa hoa và màu hoa hợp với ý đồ cảnh quan.',
          'Tầm nhìn tới cổng, biển hiệu và lối giao thông.',
          'Khoảng trống cho tán khi cây lớn.',
          'Cây trồng hàng lối cần đồng đều chiều cao và cỡ thân.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Tên cây', 'Chiều cao', 'Đường kính thân, đường kính tán', 'Cỡ bầu', 'Số lượng, nơi giao, tiến độ giao'] }, `${QUOTE} kèm bảng khối lượng hoặc ảnh chụp danh sách.`],
      },
    ],
  },
  {
    slug: 'cau-co',
    icon: 'palm',
    image: '/images/doi-tac/cay-cau-co.webp',
    title: 'Cau, cọ, cây nhiệt đới',
    short: 'Cổng dự án, đường nội bộ, resort, hồ bơi',
    description: 'Cau vua, cọ dầu và cây cảnh quan nhiệt đới cho khu đô thị, resort, khách sạn. Cung cấp sỉ theo chiều cao thân và số lượng.',
    updated: '26/10/2026',
    sections: [
      {
        h: 'Cau, cọ dùng ở đâu',
        blocks: ['Cau, cọ tạo hàng lối và cảnh quan nhiệt đới ở cổng dự án, đường nội bộ khu đô thị, resort, khách sạn và quanh hồ bơi.'],
      },
      {
        h: 'Các loại phổ biến',
        blocks: [{
          table: {
            head: ['Cây', 'Đặc điểm', 'Hợp với'],
            rows: [
              ['**Cau vua**', 'Thân thẳng, cao, trồng thành hàng lối', 'Khu đô thị, cổng dự án, đường nội bộ'],
              ['**Cọ dầu**', 'Tán xòe, dáng nhiệt đới', 'Khu nghỉ dưỡng, đường phố'],
            ],
          },
        }, 'Các loại cau cảnh khác dùng cho dải phân cách, bồn cây khi vị trí phù hợp.'],
      },
      {
        h: 'Lưu ý khi chọn cây',
        blocks: [{ ul: [
          'Cây trồng hàng lối cần đồng đều chiều cao thân.',
          'Khoảng cách với đường dây điện và mái công trình.',
          'Đất thoát nước tốt; vùng ven biển cần xét gió và độ mặn.',
        ] }],
      },
      {
        h: 'Quy cách khi gửi báo giá',
        blocks: [{ ul: ['Tên cây', 'Chiều cao thân (từ gốc đến cổ lá)', 'Đường kính gốc', 'Cỡ bầu', 'Số lượng, nơi giao, tiến độ giao'] }, `${QUOTE} kèm bảng khối lượng hoặc ảnh chụp danh sách.`],
      },
    ],
  },
  {
    slug: 'cay-bui-cay-vien',
    icon: 'sprout',
    image: '/images/doi-tac/cay-bui.webp',
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
    icon: 'leaf',
    image: '/images/doi-tac/cay-tham.webp',
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

/** Ghi công ảnh thẻ nhóm cây (Wikimedia Commons, đã cắt khung 4:3 và thu nhỏ) — hiện ở /chinh-sach/nguon-anh. */
export const TREE_IMAGE_CREDITS: { what: string; author: string; license: string; url: string }[] = [
  { what: 'Hàng cây bóng mát, công viên số 1 Lý Thái Tổ, TP.HCM', author: 'MagnaFine', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:No._1_Ly_Thai_To_Park,_Ho_Chi_Minh_City_-_tree-lined_walkway_and_banners_-_2026.jpg' },
  { what: 'Cây cổ thụ, Khu di tích Kim Liên', author: 'Liftold', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Kim_Lien_Monuments_Park.JPG' },
  { what: 'Cây kèn hồng (Tabebuia rosea)', author: 'Mokkie', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Trumpet_Tree_(Tabebuia_rosea).jpg' },
  { what: 'Hàng cau vua (Roystonea regia)', author: 'Newfoundlandguy', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Roystonea_regia_in_Ghana.jpg' },
  { what: 'Hàng rào trang đỏ (Ixora)', author: 'Johnnybam', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Red_Ixora_Flower_Hedge_Along_a_Perimeter_Wall.jpg' },
  { what: 'Thảm cỏ lá gừng (Axonopus compressus)', author: 'Harry Rose', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Axonopus_compressus_habit4_(6805168672)_(2).jpg' },
];

export const treeGuidePath = (slug: string) => `/doi-tac/cay-cong-trinh/${slug}`;
export const getTreeGuide = (slug: string) => TREE_GUIDES.find((g) => g.slug === slug);
