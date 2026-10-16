import 'server-only';
import { brandOf, categoryLabel, isQuote, variantPath, type Product, type Unit } from '@/lib/catalog';
import { clipText } from '@/lib/format';
import { shippingFeeFor } from '@/lib/jsonld';
import { SITE_NAME } from '@/lib/seo';
import { seoNameOf } from '@/lib/seo-name';
import { absoluteUrl, SITE_ORIGIN } from '@/lib/site';
import { allProducts } from './catalog';
import { getCategories } from './categories';
import { sitemapExcluded } from './seo-cms';
import { getShippingConfig } from './shipping';

/**
 * File dữ liệu sản phẩm cho Google Merchant Center (`/google-merchant.xml`, RSS 2.0 + namespace g:). Khung sản phẩm có ẢNH +
 * GIÁ trên Google (Mua sắm, "Sản phẩm phổ biến", khung bên phải kết quả) lấy chủ yếu từ Merchant Center — chủ shop tạo tài
 * khoản miễn phí, khai link file này ở mục "Nguồn dữ liệu sản phẩm" (Google tải lại hằng ngày). Hướng dẫn: seo/BAN-GIAO-SEO.md.
 *
 * Mỗi QUY CÁCH CÓ GIÁ là một dòng (id = SKU-số quy cách, giống mã ở file Excel / POS), cùng `item_group_id` = SKU sản phẩm.
 * Link quy cách chọn sẵn = URL sạch, quy cách khác = ?quy-cach=<idx> — trang mở ra hiện đúng giá + schema Offer cùng giá
 * (Google đối chiếu giá trang với file, lệch là gỡ sản phẩm). Quy cách "Liên hệ báo giá", sản phẩm ẩn / đặt tay "Ẩn khỏi Google"
 * không có. Không gửi giá gạch ngang (sale_price): giá gạch chưa từng bán — Google từ chối giảm giá không có thật.
 * Phí giao (g:shipping) = cùng số với shippingDetails trong schema. Đơn tối thiểu giao hàng + chính sách đổi trả khai trong
 * tài khoản Merchant Center (file không ghi được).
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  // Ký tự điều khiển làm hỏng XML
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const tag = (name: string, v: string | number | undefined | null) => (v == null || v === '' ? '' : `<g:${name}>${esc(String(v))}</g:${name}>`);

/** Nhóm sản phẩm theo phân loại của Google (Google Product Taxonomy, bản tiếng Anh) — chỉ danh mục chắc chắn. */
const GOOGLE_CATEGORY: Record<string, string> = {
  'cay-canh': 'Home & Garden > Plants',
  'hat-giong': 'Home & Garden > Plants > Seeds',
  'phan-bon': 'Home & Garden > Lawn & Garden > Gardening > Fertilizers',
};

export type FeedItem = { p: Product; u: Unit };

export async function merchantItems(): Promise<FeedItem[]> {
  const [products, excluded] = await Promise.all([allProducts(), sitemapExcluded()]);
  return products
    .filter((p) => !excluded.has(`/san-pham/${p.slug}`))
    .flatMap((p) => p.options.filter((u) => !isQuote(u)).map((u) => ({ p, u })));
}

function itemXml({ p, u }: FeedItem, ctx: { catName: (p: Product) => string; ship: (p: Product, u: Unit) => number | undefined }) {
  const many = p.options.filter((o) => !isQuote(o)).length > 1;
  const seo = seoNameOf(p);
  // Tiêu đề: tên + quy cách trước (Google chỉ hiện ~70 ký tự đầu), rồi phần mô tả của tên chi tiết SEO.
  const tail = seo.startsWith(p.name) ? seo.slice(p.name.length).replace(/^[\s,–-]+/, '') : seo;
  const title = clipText([many ? `${p.name} – ${u.label}` : p.name, tail].filter(Boolean).join(' – '), 150);
  const description = clipText([p.lead, ...p.specs.filter(([, v]) => v.trim()).slice(0, 8).map(([k, v]) => `${k}: ${v}`)].join(' '), 5000);
  const images = (p.images ?? []).map(absoluteUrl);
  const fee = ctx.ship(p, u);
  return [
    '<item>',
    tag('id', `${p.sku}-${u.idx}`),
    many ? tag('item_group_id', p.sku) : '',
    `<title>${esc(title)}</title>`,
    `<description>${esc(description || title)}</description>`,
    `<link>${esc(absoluteUrl(variantPath(p, u)))}</link>`,
    tag('image_link', images[0]),
    ...images.slice(1, 11).map((i) => tag('additional_image_link', i)),
    tag('availability', u.soldOut ? 'out_of_stock' : 'in_stock'),
    tag('price', `${u.price} VND`),
    tag('condition', 'new'),
    tag('brand', brandOf(p) ?? SITE_NAME),
    tag('identifier_exists', 'no'),
    tag('google_product_category', GOOGLE_CATEGORY[p.category]),
    tag('product_type', ctx.catName(p)),
    many ? tag('size', u.label) : '',
    fee == null ? '' : `<g:shipping><g:country>VN</g:country><g:price>${fee} VND</g:price></g:shipping>`,
    '</item>',
  ].join('');
}

/** Toàn bộ file XML. Sản phẩm chưa có ảnh vẫn ghi (Merchant Center báo "thiếu ảnh" ngay trong tài khoản để chủ shop biết). */
export async function merchantFeedXml() {
  const [items, categories, shipping] = await Promise.all([merchantItems(), getCategories(), getShippingConfig()]);
  const catName = (p: Product) => { const l = categoryLabel(categories, p.category, p.sub); return [l.cat, l.sub].filter(Boolean).join(' > '); };
  const ship = (p: Product, u: Unit) => shippingFeeFor(p.ship, u, shipping);
  const body = items.map((it) => itemXml(it, { catName, ship })).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(SITE_NAME)}</title>
<link>${SITE_ORIGIN}/</link>
<description>${esc(`Sản phẩm đang bán tại ${SITE_NAME}`)}</description>
${body}
</channel>
</rss>
`;
}
