import type { Metadata } from 'next';

// Trang là client component nên tiêu đề + noindex đặt ở layout. Trang đặt hàng: không đưa lên Google (robots.txt cũng chặn).
export const metadata: Metadata = { title: 'Thanh toán', robots: { index: false } };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
