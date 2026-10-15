import type { Metadata } from 'next';

/**
 * Thẻ chia sẻ mạng xã hội (Open Graph + X/Twitter) — mục 2.2 + 2.3 checklist SEO.
 *
 * Cách chia việc (đừng viết thẻ og: riêng lẻ trong từng trang):
 *  - root layout đặt khung chung `BASE_OPEN_GRAPH` + `twitter.card`. Next tự lấy đúng <title> và description của trang
 *    điền vào og:title / og:description / twitter:title… (`inheritFromMetadata` trong next/dist/lib/metadata) nên chữ
 *    chia sẻ luôn khớp với chữ Google thấy — KHÔNG ghi `openGraph.title` / `description` ở trang (dễ lệch nhau).
 *  - trang khách công khai bọc metadata bằng `withShare(...)`: thêm og:url = canonical, ảnh của chính trang (không có thì
 *    ảnh mặc định), loại trang và ngày đăng / ngày sửa của bài viết. Next chỉ gộp nông metadata giữa các tầng
 *    (trang đặt `openGraph` là mất hết của layout) nên `withShare` tự trải lại khung chung.
 *  - trang riêng tư (giỏ, thanh toán, tài khoản…) không cần bọc: kế thừa khung chung, không có og:url.
 * Kiểm bằng `npm run seo:head -- <địa chỉ web>`.
 */

export const SITE_NAME = 'Cây Cảnh Miền Tây';

/** Ảnh chia sẻ mặc định 1200×630 (cắt từ banner thiết kế của shop) — trang không có ảnh riêng dùng ảnh này. */
export const DEFAULT_SHARE_IMAGE = {
  url: '/images/og/cay-canh-mien-tay.jpg', width: 1200, height: 630, alt: 'Cây Cảnh Miền Tây — cây cảnh, cây kiểng, hoa kiểng lá',
};

export const BASE_OPEN_GRAPH = {
  type: 'website', siteName: SITE_NAME, locale: 'vi_VN', images: [DEFAULT_SHARE_IMAGE],
} satisfies NonNullable<Metadata['openGraph']>;

type Share = {
  /** Ảnh của chính trang (đường dẫn /api/…-images/… hoặc URL tuyệt đối), ảnh đầu là ảnh chính; trống → ảnh mặc định. */
  images?: (string | null | undefined)[];
  /** Chữ mô tả ảnh (og:image:alt) — thường là tên sản phẩm / tiêu đề bài. */
  alt?: string;
  type?: 'website' | 'article' | 'video.other';
  /** Chỉ dùng với type 'article'. */
  article?: { publishedTime?: Date | null; modifiedTime?: Date | null; author?: string | null; section?: string; tags?: string[] };
};

/** Tối đa 4 ảnh — Facebook / Zalo chỉ lấy ảnh đầu, thêm nữa chỉ làm nặng <head>. */
const MAX_IMAGES = 4;

/** Gắn og:url (= canonical), ảnh chia sẻ, loại trang cho một trang khách công khai. Trang phải có `alternates.canonical`. */
export function withShare(meta: Metadata, share: Share = {}): Metadata {
  const canonical = meta.alternates?.canonical;
  const url = typeof canonical === 'string' ? canonical : canonical instanceof URL ? canonical.toString() : canonical?.url;
  const images = [...new Set(share.images?.filter((x): x is string => !!x))].slice(0, MAX_IMAGES);
  const type = share.type ?? 'website';
  const a = type === 'article' ? share.article : undefined;
  // Ngày sửa chỉ ghi khi sửa sau ngày đăng (bài vừa đăng thì hai ngày gần như trùng).
  const modified = a?.modifiedTime && (!a.publishedTime || a.modifiedTime.getTime() - a.publishedTime.getTime() > 60_000) ? a.modifiedTime : undefined;
  return {
    ...meta,
    openGraph: {
      ...BASE_OPEN_GRAPH,
      ...(url ? { url } : {}),
      images: images.length ? images.map((u) => ({ url: u, alt: share.alt })) : BASE_OPEN_GRAPH.images,
      ...(a ? {
        type: 'article',
        publishedTime: a.publishedTime?.toISOString(),
        modifiedTime: modified?.toISOString(),
        authors: a.author ? [a.author] : undefined,
        section: a.section,
        tags: a.tags?.length ? a.tags : undefined,
      } : { type }),
    },
  };
}
