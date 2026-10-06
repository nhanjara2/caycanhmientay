import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { DeliverToProvider } from '@/lib/deliver-to';
import { ShippingProvider } from '@/lib/shipping-client';
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
  title: { default: 'Cây Cảnh Miền Tây — Cây khỏe từ nhà vườn miền Tây', template: '%s | Cây Cảnh Miền Tây' },
  description: 'Cây cảnh, thuốc bảo vệ thực vật, phân bón, chậu và vật tư làm vườn. Cây thuần kỹ tại vườn, kỹ sư tư vấn tận tình.',
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
              <CartProvider>{children}</CartProvider>
            </DeliverToProvider>
          </ShippingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
