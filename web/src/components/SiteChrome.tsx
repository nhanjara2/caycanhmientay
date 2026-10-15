import type { ReactNode } from 'react';
import { menuCategories } from '@/server/categories';
import { AuthModal } from './AuthModal';
import { CategoryNav } from './CategoryNav';
import { CookieConsent } from './CookieConsent';
import { DeliverToDialog } from './DeliverTo';
import { Footer } from './Footer';
import { Header } from './Header';
import { ImageFallback } from './ImageFallback';
import { NavProgress } from './NavProgress';
import { ContactFab, Toaster } from './Overlays';
import { PhonePrompt } from './PhoneModal';
import { ScrollReveal } from './ScrollReveal';

export async function SiteChrome({ children }: { children: ReactNode }) {
  const categories = await menuCategories();
  // .app-site: gốc cho các chỉnh "dễ dùng trên điện thoại" (globals.css, khối cuối) — chỉ áp cho trang khách, không đụng admin / POS / app nhân viên.
  return (
    <div className="app-site">
      <NavProgress />
      <Header nav={<CategoryNav categories={categories} />} />
      {children}
      <Footer />
      <ContactFab />
      <Toaster />
      <AuthModal />
      <DeliverToDialog />
      <PhonePrompt />
      <CookieConsent />
      <ScrollReveal />
      <ImageFallback />
    </div>
  );
}
