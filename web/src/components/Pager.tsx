import Link from '@/components/LocaleLink';

/** Số trang hiện: 1, …, các trang quanh trang đang xem, …, trang cuối (0 = dấu "…"). */
export function pageWindow(page: number, pages: number, around = 2): number[] {
  const out: number[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= around) out.push(n);
    else if (out[out.length - 1] !== 0) out.push(0);
  }
  return out;
}

/**
 * Phân trang bằng link <a href> thật (Google lần được tới mọi trang, không cần JavaScript): ‹ trước, số trang, sau ›.
 * Trang đầu không có "‹", trang cuối không có "›". `nofollow` cho danh sách đang lọc / sắp xếp (trang noindex).
 */
export function Pager({ page, pages, href, nofollow }: { page: number; pages: number; href: (n: number) => string; nofollow?: boolean }) {
  if (pages <= 1) return null;
  const rel = nofollow ? 'nofollow' : undefined;
  return (
    <nav className="vx-pager" aria-label="Phân trang">
      {page > 1 && <Link href={href(page - 1)} rel={rel} aria-label="Trang trước">‹</Link>}
      {pageWindow(page, pages).map((n, i) => (n === 0
        ? <span key={`gap${i}`} aria-hidden="true">…</span>
        : <Link key={n} href={href(n)} rel={rel} aria-current={n === page ? 'true' : undefined} aria-label={`Trang ${n}`}>{n}</Link>))}
      {page < pages && <Link href={href(page + 1)} rel={rel} aria-label="Trang sau">›</Link>}
    </nav>
  );
}
