import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = { title: { default: 'App nhân viên', template: '%s · Nhân viên' }, robots: { index: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

/** Web mobile cho tài xế và kho: một cột, canh giữa trên màn lớn. */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-staff">{children}</div>;
}
