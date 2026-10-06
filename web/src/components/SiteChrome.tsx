import type { ReactNode } from 'react';
import { AuthModal } from './AuthModal';
import { CookieConsent } from './CookieConsent';
import { DeliverToDialog } from './DeliverTo';
import { Footer } from './Footer';
import { Header } from './Header';
import { ContactFab, Toaster } from './Overlays';
import { PhonePrompt } from './PhoneModal';

export function SiteChrome({ children }: { children: ReactNode }) {
  // .app-site: gốc cho các chỉnh "dễ dùng trên điện thoại" (globals.css, khối cuối) — chỉ áp cho trang khách, không đụng admin / POS / app nhân viên.
  return (
    <div className="app-site">
      <Header />
      {children}
      <Footer />
      <ContactFab />
      <Toaster />
      <AuthModal />
      <DeliverToDialog />
      <PhonePrompt />
      <CookieConsent />
    </div>
  );
}
