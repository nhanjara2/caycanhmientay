import 'server-only';
import { cheapestOption, isQuote } from '@/lib/catalog';
import { CARE_PHONE, FACEBOOK_URL, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, SUPPORT_PHONE, TIKTOK_URL, YOUTUBE_URL, ZALO_URL, formatPhone } from '@/lib/contact';
import { money } from '@/lib/format';
import { categoryOf, postPath, SECTIONS, sectionOf } from '@/lib/posts';
import { policies } from '@/lib/policies';
import { absoluteUrl } from '@/lib/site';
import { allProducts } from './catalog';
import { menuCategories } from './categories';
import { allDiseases } from './diseases';
import { publishedPosts } from './posts';
import { sitemapExcluded } from './seo-cms';

/**
 * /llms.txt + /llms-full.txt (GEO — tối ưu cho máy AI): bản chữ trơn Markdown giới thiệu shop và liệt kê trang chính,
 * theo đề xuất llmstxt.org. Trợ lý AI (ChatGPT, Claude, Perplexity, Gemini…) đọc một file là hiểu shop bán gì, giá,
 * cách liên hệ và nên dẫn khách tới trang nào. Đọc database mỗi lần (CDN giữ 1 giờ) nên luôn khớp web.
 * `full` = thêm mô tả từng sản phẩm, tóm tắt từng bệnh / bài viết. Chỉ liệt kê trang được index (giống sitemap).
 */

const line = (s: string) => s.replace(/\s+/g, ' ').trim();

export async function llmsText(full: boolean) {
  const [products, cats, diseases, posts, excluded] = await Promise.all([
    allProducts(), menuCategories(), allDiseases(), publishedPosts(), sitemapExcluded(),
  ]);
  const ok = (path: string) => !excluded.has(path);
  const out: string[] = [];
  const push = (...l: string[]) => out.push(...l);

  push(
    '# Cây Cảnh Miền Tây',
    '',
    '> Vườn ươm và nhà cung cấp sỉ, lẻ cây cảnh (cây để bàn, văn phòng, trong nhà, ban công, sân vườn, công trình), phân bón, chậu và vật tư làm vườn tại Làng Hoa Sa Đéc, Đồng Tháp. Hoạt động từ 2007, từ 2019 cung cấp cây công trình, liên kết gần 200 nhà vườn miền Nam. Giao cây toàn quốc, bảo hành cây sống 7 ngày, giá sỉ cho đối tác cảnh quan, công trình và đại lý.',
    '',
    `- Website: ${absoluteUrl('/')}`,
    `- Địa chỉ vườn: ${SHOP_ADDRESS}`,
    `- Hotline mua hàng / Zalo: ${formatPhone(SALES_PHONE)} (${ZALO_URL})`,
    `- Tư vấn chăm cây, bắt bệnh: ${formatPhone(CARE_PHONE)} · Góp ý, bảo hành: ${formatPhone(SUPPORT_PHONE)}`,
    `- Email: ${SHOP_EMAIL} · Giờ làm việc: 8:00–21:00 hằng ngày`,
    `- Mạng xã hội: ${FACEBOOK_URL} · ${YOUTUBE_URL} · ${TIKTOK_URL}`,
    '- Giá tính bằng đồng Việt Nam (đ). Mua 2 cây cùng quy cách được giá combo; giá sỉ công trình liên hệ báo giá.',
    '',
    '## Trang chính',
    '',
    `- [Tất cả sản phẩm](${absoluteUrl('/danh-muc')}): danh sách cây cảnh và vật tư đang bán`,
    `- [Đối tác sỉ](${absoluteUrl('/doi-tac')}): giá sỉ, đăng ký đối tác, công trình đã cung cấp cây`,
    `- [Gửi yêu cầu báo giá sỉ](${absoluteUrl('/bao-gia-si')})`,
    `- [Tư vấn chọn cây](${absoluteUrl('/tu-van-chon-cay')}): chọn cây theo không gian, ánh sáng, ngân sách`,
    `- [Bắt bệnh cho cây](${absoluteUrl('/benh-cay')}): thư viện bệnh cây theo triệu chứng`,
    `- [Góc chăm cây](${absoluteUrl(SECTIONS.blog.path)}): bài hướng dẫn chăm sóc, chọn cây, phân bón`,
    `- [Hệ thống cửa hàng](${absoluteUrl('/he-thong-cua-hang')})`,
    `- [Khuyến mãi](${absoluteUrl('/khuyen-mai')})`,
    '',
  );

  for (const c of cats) {
    const list = products.filter((p) => p.category === c.slug && ok(`/san-pham/${p.slug}`));
    if (!list.length) continue;
    push(`## ${c.name}`, '');
    for (const p of list) {
      const o = p.options[cheapestOption(p.options)];
      const price = !o || isQuote(o) ? 'liên hệ báo giá' : `từ ${money(o.price)}${p.unit ? ` / ${p.unit.replace(/^\/\s*/, '')}` : ''}`;
      const sizes = p.options.filter((u) => !isQuote(u)).map((u) => `${u.label} ${money(u.price)}`).join('; ');
      push(`- [${p.name}](${absoluteUrl(`/san-pham/${p.slug}`)}): ${price}${p.inStock === false ? ' (tạm hết hàng)' : ''}${full && p.lead ? ` — ${line(p.lead)}` : ''}`);
      if (full && sizes) push(`  - Quy cách: ${sizes}`);
    }
    push('');
  }

  const dz = diseases.filter((d) => ok(`/benh-cay/${d.slug}`));
  if (dz.length) {
    push('## Bệnh cây thường gặp', '');
    for (const d of dz) push(`- [${d.name}](${absoluteUrl(`/benh-cay/${d.slug}`)})${full && d.summary ? `: ${line(d.summary)}` : ''}`);
    push('');
  }

  const ps = posts.filter((p) => ok(postPath(p)));
  for (const sec of ['blog', 'news'] as const) {
    const list = ps.filter((p) => sectionOf(p.category) === sec);
    if (!list.length) continue;
    push(`## ${SECTIONS[sec].name}`, '');
    for (const p of list) {
      const cat = categoryOf(p.category)?.name;
      push(`- [${line(p.title)}](${absoluteUrl(postPath(p))})${cat ? ` (${cat})` : ''}${full && p.excerpt ? `: ${line(p.excerpt)}` : ''}`);
    }
    push('');
  }

  push('## Chính sách', '');
  for (const p of policies) push(`- [${p.title}](${absoluteUrl(`/chinh-sach/${p.slug}`)}): ${line(p.description)}`);
  push('');
  if (!full) push('## Optional', '', `- [Bản đầy đủ (mô tả, giá từng quy cách, tóm tắt bài)](${absoluteUrl('/llms-full.txt')})`, '');
  return out.join('\n');
}

export const textResponse = (body: string) => new Response(body, {
  headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    // File phụ cho máy đọc — không cần hiện trên kết quả Google.
    'X-Robots-Tag': 'noindex',
  },
});
