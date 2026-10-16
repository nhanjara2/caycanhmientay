'use client';

import { ErrorView } from '@/components/ErrorView';

/** Lỗi trong một trang khách: vẫn giữ đầu trang / chân trang (SiteChrome nằm ở layout bên trên). */
export default function SiteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // Lỗi thay cả layout (page) / (shop) nên tự có <main> cho link "Bỏ qua, tới nội dung chính"
  return <main id="noi-dung" tabIndex={-1}><ErrorView retry={retry} /></main>;
}
