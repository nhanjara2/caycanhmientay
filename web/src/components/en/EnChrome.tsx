import Link from 'next/link';
import { FACEBOOK_URL, formatPhone, GOOGLE_MAPS_URL, LEGAL, LINKEDIN_URL, SALES_PHONE, SHOP_EMAIL, YOUTUBE_URL, ZALO_URL } from '@/lib/contact';
import { pairOf } from '@/lib/i18n';

/** "0703005001" → "+84 703 005 001" (khách nước ngoài gọi từ ngoài Việt Nam). */
export const intlPhone = (p: string) => `+84 ${p.slice(1).replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3')}`;
export const intlTel = (p: string) => `tel:+84${p.slice(1)}`;
export const WHATSAPP_URL = `https://wa.me/84${SALES_PHONE.slice(1)}`;

const NAV: [string, string][] = [['Home', '/en'], ['About us', '/en/about'], ['Wholesale inquiry', '/en/wholesale']];

/** Khung trang tiếng Anh: đầu trang (logo, menu, nút Tiếng Việt), <main>, chân trang. Không dùng giỏ hàng / tài khoản. */
export function EnChrome({ path, children }: { path: string; children: React.ReactNode }) {
  const vi = pairOf(path)?.vi ?? '/';
  return (
    <div className="en-site">
      <a className="en-skip" href="#content">Skip to main content</a>
      <header className="en-head">
        <div className="en-wrap en-head__in">
          <Link className="en-logo" href="/en">
            <img src="/images/brand/logo-mark.png" alt="" width={40} height={40} />
            <span><b>Cây Cảnh Miền Tây</b><small>Plant nursery · Sa Dec, Vietnam</small></span>
          </Link>
          <nav className="en-nav" aria-label="Main">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} aria-current={href === path ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <a className="en-lang" href={vi} hrefLang="vi" lang="vi" title="Xem bằng tiếng Việt">🌐 Tiếng Việt</a>
        </div>
      </header>
      <main id="content" tabIndex={-1} className="en-main">{children}</main>
      <footer className="en-foot">
        <div className="en-wrap en-foot__grid">
          <div>
            <b>Cây Cảnh Miền Tây</b>
            <p>Plant nursery and wholesale supplier in Sa Dec Flower Village, Dong Thap, Vietnam — since 2007.</p>
            <p><a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
          </div>
          <div>
            <b>Contact</b>
            <p>Phone / WhatsApp / Zalo: <a href={intlTel(SALES_PHONE)}>{intlPhone(SALES_PHONE)}</a></p>
            <p>Email: <a href={`mailto:${SHOP_EMAIL}`}>{SHOP_EMAIL}</a></p>
            <p>Hours: 8:00 – 21:00 (GMT+7), every day</p>
          </div>
          <div>
            <b>Follow us</b>
            <p>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">Facebook</a> ·{' '}
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">YouTube</a> ·{' '}
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a> ·{' '}
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer">Zalo</a>
            </p>
            <p><a href={vi} hrefLang="vi" lang="vi">Phiên bản tiếng Việt</a></p>
          </div>
        </div>
        <p className="en-wrap en-legal">
          © 2007 – 2026 {LEGAL.name} · Business registration no. {LEGAL.regNo} · Owner: {LEGAL.owner} · Sa Dec Flower Village, Dong Thap, Vietnam · Tel {formatPhone(SALES_PHONE)}
        </p>
      </footer>
    </div>
  );
}

/** Breadcrumb tiếng Anh (bản tiếng Việt dùng <Breadcrumb> có chữ "Trang chủ"). */
export function EnCrumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav className="en-crumb" aria-label="Breadcrumb">
      <ol>
        {items.map(([label, href]) => (
          <li key={label}>{href ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
