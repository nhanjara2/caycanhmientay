import type { Metadata } from 'next';

// Trang là client component nên tiêu đề + noindex đặt ở layout. Giỏ hàng riêng từng khách: không đưa lên Google (robots.txt cũng chặn).
export const metadata: Metadata = { title: 'Giỏ hàng', robots: { index: false } };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
