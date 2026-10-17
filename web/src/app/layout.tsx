import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';
import { DeliverToProvider } from '@/lib/deliver-to';
import { ShippingProvider } from '@/lib/shipping-client';
import { SITE_ORIGIN } from '@/lib/site';
import { BASE_OPEN_GRAPH, SITE_NAME } from '@/lib/seo';
import '@/styles/ds/tokens.css';
import '@/styles/ds/components.css';
import '@/styles/ds/responsive.css';
import './globals.css';

const font = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  // canonical / ảnh chia sẻ ghi đường dẫn tương đối ("/san-pham/…") → Next ghép thành URL tuyệt đối trên tên miền chính.
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: 'Cây Cảnh Miền Tây — Cung cấp sỉ cây cảnh & vật tư', template: '%s | Cây Cảnh Miền Tây' },
  // Mô tả dự phòng — trang nào cũng nên tự đặt description riêng (npm run seo:metadata báo trang dùng chung).
  description: 'Cung cấp sỉ và lẻ cây cảnh, cây công trình, phân bón, chậu và vật tư từ gần 200 nhà vườn miền Nam. Giá tại vườn, giao toàn quốc.',
  applicationName: SITE_NAME,
  // Khung chia sẻ chung: og:title / og:description / twitter:* Next tự lấy từ title + description của từng trang;
  // og:url + ảnh riêng do trang công khai gắn bằng withShare() (lib/seo.ts).
  openGraph: BASE_OPEN_GRAPH,
  twitter: { card: 'summary_large_image' },
  // Cho Google hiện ảnh lớn (Google Discover, ảnh trong kết quả tìm kiếm) — thiếu thì Discover chỉ hiện ảnh nhỏ.
  // Trang tự đặt robots (noindex…) thay hẳn dòng này — không sao, trang đó không lên Google.
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  // Google Search Console: xác minh quyền sở hữu (thêm cả file public/google304493db97cae2f3.html) — đừng xóa, mất là mất quyền.
  // Bing Webmaster Tools: thẻ msvalidate.01 + file public/BingSiteAuth.xml — cũng đừng xóa.
  verification: { google: 'Xv7jKX5Z5eBRsYGX-YQT6WMmSEMk_13pualk3_Lp6fA', other: { 'msvalidate.01': '0C7A14E9D91C8BC7A848656E12CADD97' } },
  // Biểu tượng: app/favicon.ico + app/icon.png (trình duyệt — vẽ từ public/images/brand/logo-mark.png), app/apple-icon.png (iPhone), app/manifest.ts (Android).
};

// Website chỉ có giao diện sáng (BRANDBOOK) — tokens.css khai báo color-scheme: light.
export const viewport: Viewport = { themeColor: '#0f4a24', colorScheme: 'light' };

/** Khung gốc dùng chung cho website khách, admin và app nhân viên. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        <AuthProvider>
          <ShippingProvider>
            <DeliverToProvider>
              <CartProvider><WishlistProvider>{children}</WishlistProvider></CartProvider>
            </DeliverToProvider>
          </ShippingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
