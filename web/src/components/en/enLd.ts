import { ORG_ID, WEBSITE_ID } from '@/lib/jsonld';
import { absoluteUrl } from '@/lib/site';

/** JSON-LD cho trang tiếng Anh: WebPage (inLanguage en) trỏ về Organization / WebSite chung + BreadcrumbList. */
export function enPageLd(o: { path: string; name: string; description: string; type?: string; crumbs?: [string, string][] }) {
  const url = absoluteUrl(o.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': o.type ?? 'WebPage', '@id': `${url}#webpage`, url, name: o.name, description: o.description,
        inLanguage: 'en', isPartOf: { '@id': WEBSITE_ID }, about: { '@id': ORG_ID }, publisher: { '@id': ORG_ID },
      },
      ...(o.crumbs ? [{
        '@type': 'BreadcrumbList',
        itemListElement: o.crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absoluteUrl(path) })),
      }] : []),
    ],
  };
}
