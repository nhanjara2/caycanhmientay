// Phân quyền admin theo vai trò — dùng chung trình duyệt (menu, trang Phân quyền) và server (requireAccess).
// Ma trận theo thiết kế design-system/components/AdminRoles: chức năng × vai trò, 3 mức: Toàn quyền · Chỉ xem · Ẩn.
//
// Quản lý = tài khoản `users.role = 'admin'` (toàn quyền, quản lý được nhân viên).
// Các vai trò còn lại = `users.role = 'staff'` + `users.staff_role`. Staff chưa gán vai trò được xem như CSKH.

export const STAFF_ROLES = ['manager', 'cskh', 'warehouse', 'engineer', 'delivery'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Vai trò gán được khi mời nhân viên (Quản lý = quản trị viên, cấp riêng). */
export const ASSIGNABLE_ROLES = ['cskh', 'warehouse', 'engineer', 'delivery'] as const satisfies readonly StaffRole[];

export const STAFF_ROLE_INFO: Record<StaffRole, { name: string; hint: string }> = {
  manager: { name: 'Quản lý', hint: 'Toàn quyền, quản lý nhân viên và cài đặt' },
  cskh: { name: 'CSKH', hint: 'Chăm sóc khách: đơn hàng, khách hàng, hỏi đáp, bán tại quầy' },
  warehouse: { name: 'Kho', hint: 'Kho, nhập hàng, xếp hàng lên xe giao' },
  engineer: { name: 'Kỹ sư', hint: 'Bảo hành cây, bài viết & bệnh cây, hỏi đáp, báo giá sỉ' },
  delivery: { name: 'Giao hàng', hint: 'Chỉ dùng app giao hàng của nhân viên' },
};

export type Level = 'none' | 'view' | 'full';

export const AREAS = [
  'dashboard', 'orders', 'pos', 'delivery', 'warranty', 'services', 'customers', 'promotions',
  'products', 'inventory', 'expenses', 'content', 'qna', 'reports', 'settings',
] as const;
export type Area = (typeof AREAS)[number];

const F = 'full', V = 'view', N = 'none';

/** Hàng ma trận: [Quản lý, CSKH, Kho, Kỹ sư, Giao hàng]. */
export const AREA_INFO: Record<Area, { name: string; levels: readonly [Level, Level, Level, Level, Level] }> = {
  dashboard: { name: 'Tổng quan', levels: [F, V, V, V, N] },
  orders: { name: 'Đơn hàng', levels: [F, F, V, N, N] },
  pos: { name: 'Bán tại quầy', levels: [F, F, N, N, N] },
  delivery: { name: 'Giao hàng', levels: [F, V, F, N, F] },
  warranty: { name: 'Bảo hành cây', levels: [F, V, N, F, N] },
  services: { name: 'Yêu cầu báo giá sỉ', levels: [F, F, N, F, N] },
  customers: { name: 'Khách hàng', levels: [F, F, N, V, N] },
  promotions: { name: 'Khuyến mãi', levels: [F, V, N, N, N] },
  products: { name: 'Sản phẩm & danh mục', levels: [F, V, V, V, N] },
  inventory: { name: 'Kho & nhập hàng', levels: [F, N, F, N, N] },
  expenses: { name: 'Thu chi, chi phí & lãi lỗ', levels: [F, N, N, N, N] },
  content: { name: 'Bài viết, bệnh cây, dự án & banner trang chủ', levels: [F, N, N, F, N] },
  qna: { name: 'Hỏi đáp & đánh giá', levels: [F, F, N, F, N] },
  reports: { name: 'Báo cáo', levels: [F, N, N, N, N] },
  settings: { name: 'Cài đặt (đơn sỉ & giao hàng, mẫu tin, phân quyền)', levels: [F, N, N, N, N] },
};

/** Trang admin ↔ chức năng (menu trái ẩn mục không có quyền xem). */
export const NAV_AREA: Record<string, Area> = {
  '/admin': 'dashboard',
  '/admin/bao-cao': 'reports',
  '/admin/don-hang': 'orders',
  '/admin/pos': 'pos',
  '/admin/giao-hang': 'delivery',
  '/admin/bao-hanh': 'warranty',
  '/admin/dich-vu': 'services',
  '/admin/khach-hang': 'customers',
  '/admin/khuyen-mai': 'promotions',
  '/admin/ngay-su-kien': 'promotions',
  '/admin/san-pham': 'products',
  '/admin/danh-muc': 'products',
  '/admin/bang-gia': 'settings',
  '/admin/kho': 'inventory',
  '/admin/nhap-hang': 'inventory',
  '/admin/thu-chi': 'expenses',
  '/admin/chi-phi': 'expenses',
  '/admin/doi-soat': 'expenses',
  '/admin/trang-chu': 'content',
  '/admin/noi-dung': 'content',
  '/admin/benh-cay': 'content',
  '/admin/du-an': 'content',
  '/admin/danh-gia': 'qna',
  '/admin/mau-tin-nhan': 'settings',
  '/admin/cua-hang': 'settings',
  '/admin/cai-dat-giao-hang': 'settings',
  '/admin/phan-quyen': 'settings',
  '/admin/seo': 'settings',
};

type Who = { role: 'customer' | 'staff' | 'admin'; staffRole?: StaffRole | null };

/** Vai trò hiệu lực của tài khoản nhân viên (null = không phải nhân viên). */
export function effectiveRole(u: Who): StaffRole | null {
  if (u.role === 'admin') return 'manager';
  if (u.role === 'staff') return u.staffRole && u.staffRole !== 'manager' ? u.staffRole : 'cskh';
  return null;
}

export function levelOf(u: Who, area: Area): Level {
  const r = effectiveRole(u);
  return r ? AREA_INFO[area].levels[STAFF_ROLES.indexOf(r)] : 'none';
}

export const hasAccess = (u: Who, area: Area, need: 'view' | 'full' = 'view') => {
  const l = levelOf(u, area);
  return l === 'full' || (l === 'view' && need === 'view');
};

/** Trang đầu tiên nhân viên được vào (khi bị chặn ở trang khác). */
export const homeFor = (u: Who) => (hasAccess(u, 'dashboard') ? '/admin' : '/nhan-vien/giao-hang');

export const levelsFor = (u: Who) => Object.fromEntries(AREAS.map((a) => [a, levelOf(u, a)])) as Record<Area, Level>;
