// Phạm vi áp dụng của mã giảm giá — dùng chung client (ước tính ở giỏ / thanh toán / trang sản phẩm) và server (chốt khi đặt).
// null hoặc rỗng = mọi sản phẩm. Có phạm vi thì đơn tối thiểu + số tiền giảm chỉ tính trên tiền của sản phẩm thuộc phạm vi.
import type { Totals } from './pricing';

/** `cats` = slug danh mục, `subs` = "danh-muc/nhom-con", `products` = slug sản phẩm. Sản phẩm khớp MỘT trong ba là thuộc phạm vi. */
export type VoucherScope = { cats: string[]; subs: string[]; products: string[] };

/** Thông tin sản phẩm để xét phạm vi: `subs` = nhóm con chính + nhóm con phụ. */
export type ScopeItem = { slug?: string; category?: string; subs?: string[]; noVoucher?: boolean };

export const isScoped = (s: VoucherScope | null | undefined): s is VoucherScope =>
  !!s && s.cats.length + s.subs.length + s.products.length > 0;

/** Sản phẩm có thuộc phạm vi của mã không (mã không giới hạn → luôn có). Không xét cờ "không áp mã" — xem `voucherAmount`. */
export function inScope(scope: VoucherScope | null | undefined, it: ScopeItem) {
  if (!isScoped(scope)) return true;
  if (it.slug && scope.products.includes(it.slug)) return true;
  if (!it.category) return false;
  return scope.cats.includes(it.category) || (it.subs ?? []).some((s) => scope.subs.includes(`${it.category}/${s}`));
}

export const productScopeItem = (p: { slug: string; category: string; sub: string; extraSubs?: string[]; noVoucher?: boolean }): ScopeItem => ({
  slug: p.slug, category: p.category, subs: [p.sub, ...(p.extraSubs ?? [])], noVoucher: p.noVoucher,
});

/** Tiền hàng (sau combo) mà mã này xét: mã không giới hạn = `voucherBase`; có phạm vi = cộng các dòng thuộc phạm vi, bỏ sản phẩm "không áp mã". */
export function voucherAmount(scope: VoucherScope | null | undefined, t: Totals) {
  if (!isScoped(scope)) return t.voucherBase;
  return t.lines.reduce((a, l) => a + (!l.item.noVoucher && inScope(scope, l.item) ? l.total : 0), 0);
}
