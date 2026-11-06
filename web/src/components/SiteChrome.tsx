import type { ReactNode } from 'react';
import { menuCategories } from '@/server/categories';
import { trendingSearches } from '@/server/monitor';
import { Analytics } from './Analytics';
import { RumVitals } from './RumVitals';
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
import { WebVitals } from './WebVitals';
import { getTranslations } from 'next-intl/server';

export async function SiteChrome({ children }: { children: ReactNode }) {
  const [categories, trending, t] = await Promise.all([menuCategories(), trendingSearches(), getTranslations('header')]);
  // .app-site: gốc cho các chỉnh "dễ dùng trên điện thoại" (globals.css, khối cuối) — chỉ áp cho trang khách, không đụng admin / POS / app nhân viên.
  return (
    <div className="app-site">
      {/* Điểm Tab đầu tiên: người dùng bàn phím / trình đọc màn hình nhảy qua đầu trang + menu (mục 12 checklist SEO) */}
      <a href="#noi-dung" className="app-skip">{t('skip')}</a>
      <NavProgress />
      <Header nav={<CategoryNav categories={categories} />} trending={trending} />
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
      <WebVitals />
      <RumVitals />
      <Analytics />
    </div>
  );
}
