'use client';

import { ErrorView } from '@/components/ErrorView';

/** Lỗi ở admin / app nhân viên, hoặc khi chính khung web khách lỗi (vd. mất kết nối database). */
export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView retry={retry} />;
}
