// Cấu hình cho scripts/gen-views.mjs: trang nào sinh từ preview nào, phần nào thay bằng component,
// link nào trỏ về đâu. Đường dẫn khớp với các route trong src/app.

export const ROUTES = {
  account: '/tai-khoan',
  orders: '/tai-khoan/don-hang',
  order: '/tai-khoan/don-hang/MT0095402',
  article: '/goc-cham-cay',
  service: '/dich-vu/cho-thue-cay-van-phong',
  quote: '/dich-vu/dat-lich-khao-sat',
  adminOrder: '/admin/don-hang',
};

/** <a> không có href, khớp nguyên văn text -> href (dùng cho mọi view). */
export const GLOBAL_LINKS = {
  'Trang chủ': '/',
  'Tài khoản': ROUTES.account,
  'Đơn hàng của tôi': ROUTES.orders,
  'Góc chăm cây': '/goc-cham-cay',
  'Bắt bệnh cây': '/goc-cham-cay',
  'Bệnh cây trồng': '/benh-cay',
  'Bắt bệnh cho cây': '/benh-cay',
  'Dịch vụ': '/dich-vu',
  'Tìm cửa hàng': '/he-thong-cua-hang',
  'Về Cây Cảnh Miền Tây': '/chinh-sach/gioi-thieu',
  'Giới thiệu Cây Cảnh Miền Tây': '/chinh-sach/gioi-thieu',
  'Xem cách chăm sóc': ROUTES.article,
  'Trả hàng – Bảo hành': '/tai-khoan/bao-hanh',
  'Cập nhật ngay': '/tai-khoan/so-dia-chi',
};

/** <button> khớp nguyên văn text -> thành <Link> giữ nguyên class. */
export const GLOBAL_BUTTON_LINKS = {
  'Bắt bệnh cho cây': '/benh-cay',
  'Bắt bệnh': '/benh-cay',
  'Đặt lịch khảo sát miễn phí': ROUTES.quote,
  'Đặt lịch khảo sát': ROUTES.quote,
  'Yêu cầu báo giá': ROUTES.quote,
  'Nhận báo giá chính thức': ROUTES.quote,
  'Chọn gói này': ROUTES.quote,
  'Chọn cây Tết ngay': '/danh-muc/cay-canh/lan',
  'Theo dõi đơn': ROUTES.order,
  'Yêu cầu bảo hành': '/tai-khoan/bao-hanh',
  'Lịch chăm': '/tai-khoan/lich-cham-cay',
  'Mua phân · 42k': '/danh-muc/phan-bon',
  'Xem chỉ đường': '/he-thong-cua-hang',
  'Nhận ưu đãi': '/flash-sale',
};

// Thẻ sản phẩm tĩnh trong preview -> ProductCard thật (tìm theo tên trong catalog).
const pcard = (n, { text }) => {
  const name = n.childNodes.find((c) => c.tagName === 'h3');
  return `<CatalogCard name=${JSON.stringify(text(name ?? n))} />`;
};

const account = (name, from, extra = {}) => ({
  name, from, root: '.vx-acctpage',
  replace: { 'aside.vx-acct': '<AccountSidebar />', 'article.vx-pcard': pcard, ...(extra.replace ?? {}) },
  imports: { '@/components/AccountSidebar': ['AccountSidebar'], '@/components/CatalogCard': ['CatalogCard'] },
  ...extra,
});

const site = (name, from, extra = {}) => ({
  name, from,
  ...extra,
  replace: { 'article.vx-pcard': pcard, ...(extra.replace ?? {}) },
  imports: { '@/components/CatalogCard': ['CatalogCard'], ...(extra.imports ?? {}) },
});

const ADMIN_ORDER_CODE = (n, { text }) =>
  `<Link className="code" href=${JSON.stringify(`${ROUTES.adminOrder}/${text(n)}`)}>${text(n)}</Link>`;

const admin = (name, from, extra = {}) => ({
  name, from, root: '.ad-main', rootInner: true,
  remove: ['.ad-top'],
  replace: { 'span.code': ADMIN_ORDER_CODE, ...(extra.replace ?? {}) },
  imports: { 'next/link': [] },
  ...extra,
});

export const views = [
  // Tài khoản — khung AccountSidebar dùng chung. Hồ sơ, đơn hàng, yêu thích, vườn, lịch chăm cây đã viết tay với dữ liệu thật.

  // Góc chăm cây (/goc-cham-cay + bài chi tiết), Truyền thông (/tin-tuc) đã viết tay: đọc bài soạn ở /admin/noi-dung.
  // Bệnh cây (/benh-cay) đã viết tay với dữ liệu thật.

  // Cửa hàng, chính sách, tin tức
  site('StoreLocatorView', 'StoreLocatorLayout'),
  site('PolicyView', 'PolicyLayout', {
    replace: { 'nav.vx-pnav': '<PolicyNav />' },
    imports: { '@/components/PolicyNav': ['PolicyNav'] },
  }),
  // Khuyến mãi (/khuyen-mai) đã viết tay với dữ liệu thật.

  // Flash sale (trang phụ), dịch vụ
  site('FlashSaleView', 'FlashSaleLayout', {
    replace: { 'div.vx-grid': '<FlashSaleGrid />' },
    imports: { '@/components/FlashSaleGrid': ['FlashSaleGrid'] },
  }),
  // Cây Tết: khung đầu trang có nền video mai vàng (TetHeroMedia thay vòng tròn minh họa).
  site('CampaignView', 'CampaignLayout', {
    replace: { 'div.cp-art': '<TetHeroMedia />' },
    imports: { '@/components/TetHeroMedia': ['TetHeroMedia'] },
  }),
  site('ServicesHubView', 'ServicesHubLayout', { links: { 'Xem chi tiết': ROUTES.service } }),
  // Trang cho thuê cây văn phòng: nút báo giá mở form Đặt lịch khảo sát chọn sẵn "Cây văn phòng".
  site('ServiceDetailView', 'ServiceDetailLayout', {
    buttonLinks: {
      'Chọn gói này': `${ROUTES.quote}?loai=van-phong`,
      'Nhận báo giá chính thức': `${ROUTES.quote}?loai=van-phong`,
      'Yêu cầu báo giá': `${ROUTES.quote}?loai=van-phong`,
    },
  }),
  // Đặt lịch khảo sát (/dich-vu/dat-lich-khao-sat) đã viết tay: lưu thật, admin xem ở /admin/dich-vu.
  site('BusinessView', 'BusinessLayout'),

  // Admin — khung AdminShell ở src/app/admin/(shell)/layout.tsx. Tổng quan, đơn hàng, khách hàng, khuyến mãi, đánh giá, yêu cầu dịch vụ, bài viết & video đã viết tay với dữ liệu thật.
  admin('AdminDeliveryView', 'AdminDelivery'),
  admin('AdminRolesView', 'AdminRoles'),
  admin('AdminShippingView', 'AdminShippingSettings'),
  admin('AdminMessagesView', 'MessageTemplates'),
  admin('AdminReportsView', 'AdminReports'),
  { name: 'AdminPOSView', from: 'AdminPOS' },

  // App nhân viên (web mobile)
  { name: 'StaffDeliveryView', from: 'StaffDeliveryApp' },
  { name: 'StaffWarehouseView', from: 'StaffWarehouseApp' },
];
