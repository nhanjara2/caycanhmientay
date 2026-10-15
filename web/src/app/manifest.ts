import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/seo';

/** Biểu tượng khi khách "Thêm vào màn hình chính" trên Android (iPhone dùng app/apple-icon.png). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Cây Miền Tây',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#0f4a24',
    lang: 'vi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
