import { SiteChrome } from '@/components/SiteChrome';

/** Website khách: Header, Footer, nút liên hệ, toast, đăng nhập, cookie. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
