import { jsonLdHtml } from '@/lib/jsonld';

/** In một khối JSON-LD (dữ liệu có cấu trúc schema.org) — dựng dữ liệu bằng các hàm trong lib/jsonld.ts. null → không in gì. */
export function JsonLd({ data }: { data: object | null | undefined }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />;
}
