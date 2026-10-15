'use client';

import { ErrorView } from '@/components/ErrorView';

/** Lỗi trong một trang khách: vẫn giữ đầu trang / chân trang (SiteChrome nằm ở layout bên trên). */
export default function SiteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView retry={retry} />;
}
