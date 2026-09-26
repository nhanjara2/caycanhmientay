// Cấu hình cho scripts/gen-views.mjs: trang nào sinh từ preview nào, phần nào thay bằng component,
// link nào trỏ về đâu. Đường dẫn khớp với các route trong src/app.

export const ROUTES = {
  account: '/tai-khoan',
  orders: '/tai-khoan/don-hang',
  order: '/tai-khoan/don-hang/MT0095402',
  article: '/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua',
  disease: '/benh-cay/thoi-re',
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
  replace: { 'article.vx-pcard': pcard, ...(extra.replace ?? {}) },
  imports: { '@/components/CatalogCard': ['CatalogCard'], ...(extra.imports ?? {}) },
  ...extra,
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
  // Tài khoản — khung AccountSidebar dùng chung. Hồ sơ và đơn hàng đã viết tay với dữ liệu thật.
  account('MyGardenView', 'MyGardenLayout'),
  account('CareScheduleView', 'CareScheduleLayout'),
  account('WishlistView', 'WishlistLayout'),

  // Góc chăm cây, bệnh cây
  site('BlogView', 'BlogLayout', {
    linkByClass: { 'vx-hero__main': ROUTES.article, 'vx-hitem': ROUTES.article, 'vx-feat': ROUTES.article, 'vx-bfeat__main': ROUTES.article, 'vx-promo-card': '/khuyen-mai' },
    linkInside: { '.vx-blog__main': ROUTES.article },
  }),
  site('ArticleView', 'ArticleDetailLayout', { linkInside: { '.ar-side': ROUTES.article } }),
  site('DiseaseLibraryView', 'DiseaseLibraryLayout', {
    linkByClass: { 'vx-part': '/benh-cay', 'vx-dtile': '/benh-cay' },
    linkInside: { '.vx-dlist': ROUTES.disease },
  }),
  site('DiseaseDetailView', 'DiseaseDetailLayout', { links: { 'Rễ': '/benh-cay' } }),

  // Cửa hàng, chính sách, tin tức
  site('StoreLocatorView', 'StoreLocatorLayout'),
  site('PolicyView', 'PolicyLayout', {
    replace: { 'nav.vx-pnav': '<PolicyNav />' },
    imports: { '@/components/PolicyNav': ['PolicyNav'] },
  }),
  site('NewsView', 'NewsCategoryLayout', { linkByClass: { 'nw-hero__main': ROUTES.article, 'nw-sitem': ROUTES.article, 'nw-card': ROUTES.article } }),
  site('PromoNewsView', 'PromoNewsLayout', { linkByClass: { 'nw-hero__main': '/flash-sale', 'nw-sitem': '/flash-sale', 'nw-card': '/flash-sale' } }),

  // Khuyến mãi, dịch vụ
  site('FlashSaleView', 'FlashSaleLayout', {
    replace: { 'div.vx-grid': '<FlashSaleGrid />' },
    imports: { '@/components/FlashSaleGrid': ['FlashSaleGrid'] },
  }),
  site('CampaignView', 'CampaignLayout'),
  site('ServicesHubView', 'ServicesHubLayout', { links: { 'Xem chi tiết': ROUTES.service } }),
  site('ServiceDetailView', 'ServiceDetailLayout'),
  site('QuoteView', 'QuoteRequestForm'),
  site('BusinessView', 'BusinessLayout'),

  // Admin — khung AdminShell ở src/app/admin/(shell)/layout.tsx. Tổng quan và đơn hàng đã viết tay với dữ liệu thật.
  admin('AdminDeliveryView', 'AdminDelivery'),
  admin('AdminCustomersView', 'AdminCustomers'),
  admin('AdminPromotionsView', 'AdminPromotions'),
  admin('AdminPurchasingView', 'AdminPurchasing'),
  admin('AdminContentView', 'AdminContent'),
  admin('AdminReviewsView', 'AdminReviews'),
  admin('AdminRolesView', 'AdminRoles'),
  admin('AdminServiceRequestsView', 'AdminServiceRequests'),
  admin('AdminShippingView', 'AdminShippingSettings'),
  admin('AdminMessagesView', 'MessageTemplates'),
  admin('AdminReportsView', 'AdminReports'),
  { name: 'AdminPOSView', from: 'AdminPOS' },

  // App nhân viên (web mobile)
  { name: 'StaffDeliveryView', from: 'StaffDeliveryApp' },
  { name: 'StaffWarehouseView', from: 'StaffWarehouseApp' },
];
