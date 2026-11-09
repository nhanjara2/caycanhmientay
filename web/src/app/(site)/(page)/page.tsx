import type { Metadata } from 'next';
import Link from '@/components/LocaleLink';
import { FlashSale } from '@/components/FlashSale';
import { HomeCarousel, HomeHero, type Slide } from '@/components/home/HomeCarousel';
import {
  CareBoard, CategoryMosaic, HomeHead, type MosaicItem, NewsBoard, PhotoWall, QuickLinks, SeasonDiseases, TrustRow,
} from '@/components/home/HomeParts';
import { Icon } from '@/components/Icon';
import { ProductGrid } from '@/components/ProductCard';
import { ShortVideos } from '@/components/ShortVideos';
import type { Product } from '@/lib/catalog';
import { inSeason, seasonNow } from '@/lib/diseases';
import { bannerImageUrl, slotOf, type Banner } from '@/lib/home-banners';
import { responsive } from '@/lib/images';
import { PARTNER_IMAGE, PARTNER_IMAGE_POS, PARTNER_INFO, PARTNER_TYPES, WHOLESALE_QUOTE_URL, WHOLESALE_URL } from '@/lib/partners';
import { CATEGORIES, categoryOf, SECTIONS, VIDEO_PAGE } from '@/lib/posts';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { allProducts, categoryCounts, flashProducts } from '@/server/catalog';
import { menuCategories } from '@/server/categories';
import { allDiseases } from '@/server/diseases';
import { liveBanners } from '@/server/home-banners';
import { publishedPosts, publishedVideos } from '@/server/posts';
import '@/styles/home.css';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';
import { getTranslations } from 'next-intl/server';
import { currentLang } from '@/i18n/request';
import { JsonLd } from '@/components/JsonLd';
import { organizationLd, websiteLd } from '@/lib/jsonld';

// Trang chủ (từ 09/10/2026): trang giới thiệu nhiều ảnh — banner sự kiện chủ shop quản lý ở /admin/trang-chu,
// danh mục bằng ảnh, Flash sale, ảnh vườn, bệnh cây theo mùa, tin sự kiện, công trình, video. Trang chủ cũ (mỗi danh mục
// một khối sản phẩm) chuyển sang /danh-muc. Khối nào chưa có dữ liệu thật thì ẩn. Banner chỉ lấy từ bảng home_banners
// (ảnh dựng sẵn của shop đã chuyển vào bảng ở migration 0081 — trước đó viết cứng ở đây, admin không thấy và tải 1 ảnh là mất cả bộ).

// label = khóa chữ trong messages/<lang>.json → home.*
const QUICK = [
  { label: 'q_partner', icon: 'user', href: `${WHOLESALE_URL}#dang-ky` },
  { label: 'q_quote', icon: 'receipt', href: WHOLESALE_QUOTE_URL },
  { label: 'q_advisor', icon: 'spark', href: '/tu-van-chon-cay' },
  { label: 'q_disease', icon: 'bug', href: '/benh-cay' },
  { label: 'q_stores', icon: 'pin', href: '/he-thong-cua-hang' },
  { label: 'q_all', icon: 'leaf', href: '/danh-muc' },
] as const;

/** Bản tiếng Anh: chữ banner lấy từ cột `en` (ô trống → tiếng Việt). */
const fromBanner = (en: boolean) => (b: Banner): Slide => ({
  key: `b${b.id}`, title: (en && b.en?.title) || b.title, subtitle: ((en && b.en?.subtitle) || b.subtitle) || undefined,
  cta: ((en && b.en?.cta) || b.cta) || undefined, href: b.href || undefined,
  showText: b.showText, tone: b.tone, image: bannerImageUrl(b.image), imageMobile: b.imageMobile ? bannerImageUrl(b.imageMobile) : null,
  bg: b.slot === 'top' && (b.bgImage || b.bgImageMobile || b.bgColor) ? {
    image: b.bgImage ? bannerImageUrl(b.bgImage) : undefined,
    imageMobile: b.bgImageMobile ? bannerImageUrl(b.bgImageMobile) : undefined,
    color: b.bgColor ?? undefined,
  } : undefined,
});

const withImage = (list: Product[]) => list.filter((p) => p.images?.length);
const bySold = (a: Product, b: Product) => b.sold - a.sold || Number(b.inStock) - Number(a.inStock);
const pickImages = (list: Product[], n: number) => withImage(list).sort(bySold).slice(0, n).map((p) => p.images![0]);

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  description: 'Cây Cảnh Miền Tây – nhà vườn tại Làng hoa Sa Đéc từ 2007: cây cảnh, cây văn phòng, cây công trình giá tại vườn, giá sỉ cho đối tác, giao toàn quốc.',
  alternates: { canonical: '/' },
}));

export default async function HomePage() {
  const [banners, products, flash, categories, counts, posts, allVideos, diseases] = await Promise.all([
    liveBanners(), allProducts(), flashProducts(), menuCategories(), categoryCounts(),
    publishedPosts(), publishedVideos(), allDiseases(),
  ]);
  // Mỗi vị trí chỉ hiện tối đa `max` ảnh đầu (BANNER_SLOTS).
  const t = await getTranslations('home');
  const en = (await currentLang()) === 'en';
  const inSlot = (slot: Banner['slot']) => banners.filter((b) => b.slot === slot).slice(0, slotOf(slot).max).map(fromBanner(en));

  // ---- Khung đầu trang: banner trong admin (cả ảnh dựng sẵn của shop) ----
  const season = seasonNow();
  const seasonName = t(season.key === 'mưa' ? 'rainy' : 'dry');
  const top = inSlot('top');
  const hero = inSlot('hero');
  // Ô Flash sale dựng từ sản phẩm đang flash sale (không có ảnh để tải nên không nằm trong admin): chèn sau ảnh lớn đầu tiên.
  const flashImgs = pickImages(flash, 3);
  if (flashImgs.length >= 2) {
    hero.splice(1, 0, {
      key: 'flash', badge: t('flashBadge'), tone: 'sale', showText: true, image: flashImgs[0], contain: flashImgs,
      title: t('flashTitle'), subtitle: t('flashSub'), cta: t('flashCta'), href: '#flash-sale',
    });
  }
  const sides = inSlot('side');
  const backdrop = banners.find((b) => b.slot === 'backdrop');
  const events = inSlot('event');

  // ---- Danh mục bằng ảnh: ảnh sản phẩm bán chạy nhất (có ảnh, không trùng ô khác) của từng nhóm.
  // Ít danh mục có hàng (< 4, như lúc chỉ bán cây cảnh) thì tách danh mục đó thành các nhóm con cho đủ ảnh.
  const usedImages = new Set<string>();
  const tileImage = (list: Product[]) => {
    const img = withImage(list).sort(bySold).map((p) => p.images![0]).find((src) => !usedImages.has(src));
    if (img) usedImages.add(img);
    return img;
  };
  // Ảnh riêng của chủ shop cho từng nhóm con Cây cảnh (public/images/danh-muc/, vuông 640px); nhóm chưa có ảnh (vd. Cây công trình) dùng ảnh sản phẩm bán chạy.
  const TILE_IMAGE: Record<string, string> = Object.fromEntries(
    ['cay-de-ban', 'cay-van-phong', 'cay-trong-nha', 'cay-ban-cong', 'cay-san-vuon', 'cay-cong-trinh'].map((s) => [`cay-canh/${s}`, `/images/danh-muc/${s}.webp`]),
  );
  const stocked = categories.filter((c) => counts[c.slug]);
  const mosaic: MosaicItem[] = stocked.flatMap((c) => {
    const subs = stocked.length < 4 ? c.subs.filter((s) => s.active && counts[`${c.slug}/${s.slug}`]) : [];
    if (subs.length < 2) return [{ key: c.slug, name: c.name, href: `/danh-muc/${c.slug}`, count: counts[c.slug], icon: c.icon, image: tileImage(products.filter((p) => p.category === c.slug)) }];
    return subs.map((s) => ({
      key: `${c.slug}/${s.slug}`, name: s.name, href: `/danh-muc/${c.slug}/${s.slug}`, count: counts[`${c.slug}/${s.slug}`], icon: c.icon,
      image: TILE_IMAGE[`${c.slug}/${s.slug}`] ?? tileImage(products.filter((p) => p.category === c.slug && (p.sub === s.slug || p.extraSubs?.includes(s.slug)))),
    }));
  }).slice(0, 9);

  // ---- Ảnh vườn: cây cảnh có ảnh, không trùng ảnh ở ô danh mục ----
  const wall = withImage(products.filter((p) => p.category === 'cay-canh')).sort(bySold).filter((p) => !usedImages.has(p.images![0])).slice(0, 9);
  const best = [...products].sort((a, b) => Number(!!b.images?.length) - Number(!!a.images?.length) || bySold(a, b)).slice(0, 10);

  // ---- Bệnh cây theo mùa ----
  const hasSeason = (d: (typeof diseases)[number]) => inSeason(d, season.key);
  const seasonal = diseases
    .filter((d) => d.symptoms.some((s) => s.image))
    .sort((a, b) => Number(hasSeason(b)) - Number(hasSeason(a)) || b.severity - a.severity)
    .slice(0, 4);

  // ---- Bài viết ----
  const news = posts.filter((p) => categoryOf(p.category)?.promo || categoryOf(p.category)?.section === 'news').slice(0, 5);
  // Video ngắn nổi bật: video admin đánh dấu Nổi bật trước, rồi mới nhất (publishedVideos đã xếp sẵn).
  const videos = allVideos.slice(0, 8);
  const care = posts.filter((p) => p.kind === 'article' && categoryOf(p.category)?.section === 'blog' && !categoryOf(p.category)?.promo).slice(0, 6);
  const careChips = CATEGORIES.filter((c) => c.section === 'blog' && posts.some((p) => p.category === c.key))
    .map((c) => ({ label: c.name, href: `${SECTIONS.blog.path}?chuyen-muc=${c.key}` }));

  return (
    <div className="hm">
      {/* Schema toàn website: tổ chức (tên, logo, hotline, mạng xã hội) + website — các trang khác trỏ về bằng @id */}
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />
      <h1 className="app-sr">{t('h1')}</h1>

      <section className="hm-hero" aria-label={t('heroAria')}>
        <HomeHero
          tops={top}
          slides={hero}
          sides={sides}
          backdrop={backdrop ? { image: bannerImageUrl(backdrop.image), imageMobile: backdrop.imageMobile ? bannerImageUrl(backdrop.imageMobile) : null } : null}
        />
        <QuickLinks items={QUICK.map((q) => ({ ...q, label: t(q.label) }))} />
      </section>

      <div className="hm-body">
        <section className="hm-sec">
          <HomeHead icon="leaf" title={t('byCategory')} href="/danh-muc" />
          <CategoryMosaic items={mosaic} />
        </section>

        {flash.length > 0 && <FlashSale products={flash} />}

        {events.length > 0 && (
          <section className="hm-sec" aria-label={t('events')}>
            <HomeCarousel slides={events} label={t('events')} className="hm-car--band" />
          </section>
        )}

        <section className="hm-partner">
          <div className="hm-partner__txt">
            <span className="hm-partner__badge">{t('partnerBadge')}</span>
            <h2>{t('partnerTitle')}</h2>
            <div className="hm-partner__acts">
              <Link href={`${WHOLESALE_URL}#dang-ky`} className="vx-btn hm-btn-sun">{t('q_partner')}</Link>
              <Link href={WHOLESALE_QUOTE_URL} className="vx-btn hm-btn-ghost">{t('q_quote')}</Link>
            </div>
          </div>
          <ul className="hm-partner__types">
            {PARTNER_TYPES.map((pt) => (
              <li key={pt}>
                <Link href={`${WHOLESALE_URL}#dang-ky`} className="hm-ptype app-plain">
                  <img {...responsive(PARTNER_IMAGE[pt], '(max-width: 47.9375em) 44vw, 400px', 640)} alt="" loading="lazy" style={{ objectPosition: PARTNER_IMAGE_POS[pt] }} />
                  <span><Icon name={PARTNER_INFO[pt].icon} /><b>{t(`pt_${pt}`)}</b></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {best.length > 0 && (
          <section className="hm-sec hm-sec--card">
            <HomeHead icon="star" title={t('best')} href="/tim-kiem?q=bán chạy" />
            <ProductGrid products={best} />
          </section>
        )}

        {wall.length === 9 && (
          <section className="hm-sec">
            <HomeHead icon="tree" title={t('wall')} href="/danh-muc/cay-canh" />
            <PhotoWall products={wall} />
          </section>
        )}

        {videos.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="camera" title={t('videos')} href={VIDEO_PAGE} />
            <ShortVideos videos={videos} layout="row" />
          </section>
        )}

        {seasonal.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="bug" title={t('diseases', { season: seasonName.toLowerCase() })} href="/benh-cay" />
            <SeasonDiseases season={seasonName} diseases={seasonal} />
          </section>
        )}

        {news.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="gift" title={t('news')} href="/khuyen-mai" />
            <NewsBoard posts={news} />
          </section>

        )}

        {care.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="sprout" title={t('care')} href={SECTIONS.blog.path} />
            <CareBoard posts={care} chips={careChips} />
          </section>
        )}

        <TrustRow items={[
          { icon: 'tag', b: t('t1'), text: t('t1s') },
          { icon: 'truck', b: t('t2'), text: t('t2s') },
          { icon: 'shield', b: t('t3', { days: WARRANTY_DAYS }), text: t('t3s') },
          { icon: 'plant', b: t('t4'), text: t('t4s') },
        ]} />
      </div>
    </div>
  );
}
