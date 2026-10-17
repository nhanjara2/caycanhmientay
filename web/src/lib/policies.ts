// Danh sách trang giới thiệu, chính sách, hướng dẫn (PolicyLayout): tiêu đề, nhóm, ngày cập nhật.
// Nội dung từng trang nằm ở lib/policy-content.ts (tách ra để menu PolicyNav — component client — không phải tải cả nội dung).
// Trang "Giới thiệu" viết tay ở components/AboutView.tsx.

export type Policy = {
  slug: string;
  title: string;
  group: string;
  /** Ngày cập nhật nội dung, dd/mm/yyyy — đổi nội dung thì đổi ngày. */
  updated: string;
  /** Mô tả ngắn cho thẻ meta (Google, chia sẻ link). */
  description: string;
};

export const POLICY_GROUPS = ['VỀ CÂY CẢNH MIỀN TÂY', 'CHÍNH SÁCH', 'HƯỚNG DẪN & ĐIỀU KHOẢN'] as const;

export const policies: Policy[] = [
  { slug: 'gioi-thieu', title: 'Giới thiệu Cây Cảnh Miền Tây', group: POLICY_GROUPS[0], updated: '17/10/2026', description: 'Cây Cảnh Miền Tây thành lập năm 2007: cung cấp sỉ cây cảnh công trình, cây văn phòng, phân bón, vật tư cho đối tác dịch vụ cảnh quan, công trình và buôn bán.' },
  { slug: 'giay-phep-kinh-doanh', title: 'Giấy phép kinh doanh', group: POLICY_GROUPS[0], updated: '09/10/2026', description: 'Thông tin đăng ký kinh doanh, ngành hàng và giấy phép chuyên ngành của Cây Cảnh Miền Tây.' },
  { slug: 'quy-che-hoat-dong', title: 'Quy chế hoạt động', group: POLICY_GROUPS[0], updated: '17/10/2026', description: 'Quy chế hoạt động website bán hàng Cây Cảnh Miền Tây: quy trình đặt hàng, an toàn giao dịch, giải quyết khiếu nại.' },
  { slug: 'doi-ngu-chuyen-mon', title: 'Đội ngũ chuyên môn', group: POLICY_GROUPS[0], updated: '09/10/2026', description: 'Ai kiểm duyệt nội dung chăm cây, ai tư vấn cho bạn và cách liên hệ kỹ sư Cây Cảnh Miền Tây.' },
  { slug: 'giao-hang', title: 'Chính sách giao hàng', group: POLICY_GROUPS[1], updated: '15/10/2026', description: 'Phạm vi giao, phí giao hàng, thời gian, cách đóng gói cây sống và nhận hàng tại vườn của Cây Cảnh Miền Tây.' },
  { slug: 'bao-hanh-cay', title: 'Chính sách bảo hành cây', group: POLICY_GROUPS[1], updated: '11/10/2026', description: 'Cây sống bảo hành 7 ngày: trường hợp được bảo hành, cách gửi yêu cầu bằng ảnh và các hướng xử lý.' },
  { slug: 'doi-tra', title: 'Chính sách đổi trả', group: POLICY_GROUPS[1], updated: '07/10/2026', description: 'Điều kiện đổi trả vật tư, thuốc BVTV, phân bón; hàng giao sai, thiếu, lỗi; hoàn tiền và hủy đơn.' },
  { slug: 'thanh-toan', title: 'Chính sách thanh toán', group: POLICY_GROUPS[1], updated: '17/10/2026', description: 'Các phương thức thanh toán, hoàn tiền và cách thanh toán an toàn tại Cây Cảnh Miền Tây.' },
  { slug: 'dat-coc', title: 'Chính sách đặt cọc', group: POLICY_GROUPS[1], updated: '15/10/2026', description: 'Khi nào cần đặt cọc, mức cọc và quy trình đặt cọc cho đơn đặt trên website, cây lớn đặt trước và công trình sân vườn.' },
  { slug: 'bao-mat', title: 'Chính sách bảo mật dữ liệu cá nhân', group: POLICY_GROUPS[1], updated: '16/10/2026', description: 'Cây Cảnh Miền Tây thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân của bạn như thế nào; cookie và quyền của bạn.' },
  { slug: 'noi-dung', title: 'Chính sách nội dung', group: POLICY_GROUPS[1], updated: '13/10/2026', description: 'Cách Cây Cảnh Miền Tây kiểm duyệt bài viết, hỏi đáp và đánh giá; quy định khi bạn đăng nội dung.' },
  { slug: 'thuoc-bvtv-an-toan', title: 'Hướng dẫn sử dụng thuốc BVTV an toàn', group: POLICY_GROUPS[2], updated: '17/10/2026', description: 'Nguyên tắc 4 đúng, cách đọc nhãn, pha và phun thuốc bảo vệ thực vật an toàn, xử lý bao bì và sơ cứu khi dính thuốc — cho bạn, người thân và thú cưng.' },
  { slug: 'dieu-khoan', title: 'Điều khoản sử dụng', group: POLICY_GROUPS[2], updated: '17/10/2026', description: 'Điều khoản khi truy cập website và mua hàng tại Cây Cảnh Miền Tây: tài khoản, đặt hàng, nội dung, trách nhiệm.' },
  { slug: 'nguon-anh', title: 'Nguồn ảnh minh họa', group: POLICY_GROUPS[2], updated: '13/10/2026', description: 'Tác giả và giấy phép của ảnh triệu chứng bệnh cây đang dùng trên website Cây Cảnh Miền Tây.' },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
