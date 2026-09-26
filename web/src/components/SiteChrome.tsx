import type { ReactNode } from 'react';
import { AuthModal } from './AuthModal';
import { CookieConsent } from './CookieConsent';
import { Footer } from './Footer';
import { Header } from './Header';
import { ContactFab, Toaster } from './Overlays';

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ContactFab />
      <Toaster />
      <AuthModal />
      <CookieConsent />
    </>
  );
}
