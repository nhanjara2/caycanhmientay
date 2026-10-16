import type { Metadata } from 'next';
import Link from 'next/link';
import { FlashSale } from '@/components/FlashSale';
import { HomeCarousel, HomeHero, type Slide } from '@/components/home/HomeCarousel';
import {
  CategoryMosaic, HomeHead, type MosaicItem, NewsBoard, PhotoWall, PostCards, QuickLinks, SeasonDiseases, TrustRow,
} from '@/components/home/HomeParts';
import { Icon } from '@/components/Icon';
import { ProductGrid } from '@/components/ProductCard';
import { ProjectCard } from '@/components/ProjectParts';
import { ShortVideos } from '@/components/ShortVideos';
import type { Product } from '@/lib/catalog';
import { bannerImageUrl, slotOf, type Banner } from '@/lib/home-banners';
import { responsive } from '@/lib/images';
import { PARTNER_IMAGE, PARTNER_IMAGE_POS, PARTNER_INFO, PARTNER_TYPES, WHOLESALE_QUOTE_URL, WHOLESALE_URL } from '@/lib/partners';
import { categoryOf, SECTIONS, VIDEO_PAGE } from '@/lib/posts';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { allProducts, categoryCounts, flashProducts } from '@/server/catalog';
import { menuCategories } from '@/server/categories';
import { allDiseases } from '@/server/diseases';
import { liveBanners } from '@/server/home-banners';
import { publishedPosts, publishedVideos } from '@/server/posts';
import { publishedProjects } from '@/server/projects';
import '@/styles/home.css';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';
import { JsonLd } from '@/components/JsonLd';
import { organizationLd, websiteLd } from '@/lib/jsonld';

// Trang chủ (từ 09/10/2026): trang giới thiệu nhiều ảnh — banner sự kiện chủ shop tự tải ở /admin/trang-chu,
// danh mục bằng ảnh, Flash sale, ảnh vườn, bệnh cây theo mùa, tin sự kiện, công trình, video. Trang chủ cũ (mỗi danh mục
// một khối sản phẩm) chuyển sang /danh-muc. Khối nào chưa có dữ liệu thật thì ẩn; banner chưa tải thì dựng từ ảnh sản phẩm.

const QUICK = [
  { label: 'Đăng ký đối tác', icon: 'user', href: `${WHOLESALE_URL}#dang-ky` },
  { label: 'Gửi báo giá sỉ', icon: 'receipt', href: WHOLESALE_QUOTE_URL },
  { label: 'Tư vấn chọn cây', icon: 'spark', href: '/tu-van-chon-cay' },
  { label: 'Bắt bệnh cho cây', icon: 'bug', href: '/benh-cay' },
  { label: 'Tìm vườn ươm', icon: 'pin', href: '/he-thong-cua-hang' },
  { label: 'Tất cả sản phẩm', icon: 'leaf', href: '/danh-muc' },
] as const;

const fromBanner = (b: Banner): Slide => ({
  key: `b${b.id}`, title: b.title, subtitle: b.subtitle || undefined, cta: b.cta || undefined, href: b.href || undefined,
  showText: b.showText, image: bannerImageUrl(b.image), imageMobile: b.imageMobile ? bannerImageUrl(b.imageMobile) : null,
  bg: b.slot === 'top' && (b.bgImage || b.bgColor) ? {
    image: b.bgImage ? bannerImageUrl(b.bgImage) : undefined,
    imageMobile: b.bgImageMobile ? bannerImageUrl(b.bgImageMobile) : undefined,
    color: b.bgColor ?? undefined,
  } : undefined,
});

const withImage = (list: Product[]) => list.filter((p) => p.images?.length);
const bySold = (a: Product, b: Product) => b.sold - a.sold || Number(b.inStock) - Number(a.inStock);
const pickImages = (list: Product[], n: number) => withImage(list).sort(bySold).slice(0, n).map((p) => p.images![0]);

/** Mùa ở miền Tây: mưa tháng 5 – 11, khô tháng 12 – 4. */
function seasonNow() {
  const m = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric' }));
  return m >= 5 && m <= 11
    ? { key: 'mưa', name: 'Mùa mưa' }
    : { key: 'khô', name: 'Mùa khô' };
}

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  description: 'Cây Cảnh Miền Tây – nhà vườn tại Làng hoa Sa Đéc từ 2007: cây cảnh, cây văn phòng, cây công trình giá tại vườn, giá sỉ cho đối tác, giao toàn quốc.',
  alternates: { canonical: '/' },
}));

export default async function HomePage() {
  const [banners, products, flash, categories, counts, posts, allVideos, projects, diseases] = await Promise.all([
    liveBanners(), allProducts(), flashProducts(), menuCategories(), categoryCounts(),
    publishedPosts(), publishedVideos(), publishedProjects(), allDiseases(),
  ]);
  // Mỗi vị trí chỉ hiện tối đa `max` ảnh đầu (BANNER_SLOTS).
  const inSlot = (slot: Banner['slot']) => banners.filter((b) => b.slot === slot).slice(0, slotOf(slot).max).map(fromBanner);

  // ---- Khung đầu trang: ảnh chủ shop tải lên; chưa có thì dựng từ ảnh thật của shop ----
  const season = seasonNow();
  const diseaseImgs = diseases.flatMap((d) => d.symptoms).flatMap((s) => (s.image ? [s.image] : []));
  // Băng ảnh rộng dựng sẵn: không có nền riêng — nền cả khoảng trên là chính ảnh đó làm mờ (HomeHero).
  const fallbackTop: Slide[] = [
    {
      // Ảnh thiết kế đã có sẵn chữ ("Vui Xuân Tết") nên không đè chữ lên; bản điện thoại xếp riêng 12:5.
      key: 'top-tet', showText: false, image: '/images/banner/vui-xuan-tet.webp', imageMobile: '/images/banner/vui-xuan-tet-mb.webp',
      title: 'Vui Xuân Tết, rộn ràng vui xuân — xem mai, quất, đào và cây Tết', href: '/cay-tet',
    },
    // Mùa mưa: ảnh thiết kế đã có sẵn chữ "Mùa Mưa". Mùa khô chưa có ảnh riêng nên vẫn dựng bằng ảnh bệnh cây + chữ.
    season.key === 'mưa' ? {
      key: 'top-mua', showText: false, image: '/images/banner/mua-mua-phong-benh.webp', imageMobile: '/images/banner/mua-mua-phong-benh-mb.webp',
      title: 'Mùa mưa: phòng bệnh sớm, không mất cả lô cây — tra bệnh theo triệu chứng, chọn đúng thuốc, đúng liều', href: '/benh-cay',
    } : {
      key: 'top-mua', badge: season.name, tone: 'green', showText: true,
      image: diseaseImgs.length ? `/api/disease-images/${diseaseImgs[1] ?? diseaseImgs[0]}` : PARTNER_IMAGE.landscape,
      title: `${season.name}: phòng bệnh sớm, không mất cả lô cây`, subtitle: 'Tra bệnh theo triệu chứng, chọn đúng thuốc, đúng liều', cta: 'Bắt bệnh cho cây', href: '/benh-cay',
    },
    {
      // Ảnh thiết kế đã có sẵn chữ (bảng tên shop) nên không đè chữ lên; bản điện thoại cắt riêng 12:5.
      key: 'top-vuon', showText: false, image: '/images/banner/cay-canh-mien-tay.webp', imageMobile: '/images/banner/cay-canh-mien-tay-mb.webp',
      title: 'Cây Cảnh Miền Tây: cây cảnh, cây kiểng, hoa kiểng lá — xem hệ thống cửa hàng và vườn ươm', href: '/he-thong-cua-hang',
    },
  ];
  const flashImgs = pickImages(flash, 3);
  // Ảnh lớn dựng sẵn: các ảnh thiết kế đã có sẵn chữ (12:5 = đúng khung, dùng chung máy tính + tablet + điện thoại) nên không đè chữ lên.
  const fallbackHero: Slide[] = [
    {
      key: 'si', showText: false, image: '/images/banner/nguon-cung-cay-canh.webp',
      title: 'Nguồn cung cây cảnh cho công trình, cảnh quan, đại lý — đăng ký đối tác', href: `${WHOLESALE_URL}#dang-ky`,
    },
    ...(flashImgs.length >= 2 ? [{
      key: 'flash', badge: 'Flash sale giờ vàng', tone: 'sale' as const, showText: true, image: flashImgs[0], contain: flashImgs,
      title: 'Giảm sâu mỗi ngày, 3 khung giờ vàng', subtitle: '08:00 · 12:00 · 20:00 — số lượng có hạn', cta: 'Săn ngay', href: '#flash-sale',
    }] : []),
    {
      key: 'tu-van', showText: false, image: '/images/banner/chon-dung-cay.webp',
      title: 'Chọn đúng cây cho từng không gian: công trình, cảnh quan, cửa hàng, quán cafe, văn phòng — tư vấn chọn cây', href: '/tu-van-chon-cay',
    },
    {
      key: 'hoc-sinh', showText: false, image: '/images/banner/hoc-sinh-sinh-vien.webp',
      title: 'Học sinh – sinh viên tự tin trang trí: cây xinh giá rẻ, giảm đến 29% — xem cây để bàn', href: '/danh-muc/cay-canh/cay-de-ban',
    },
  ];
  const fallbackSides: Slide[] = [
    {
      // Ảnh mầm cây không có chữ nên vẫn đè tiêu đề + nút; khi cắt 12:5 đã dời mầm cây sang phải để chữ bên trái không đè lên.
      key: 'bao-gia', tone: 'green', showText: true, image: '/images/banner/bao-gia-si.webp',
      title: 'Gửi danh sách, nhận báo giá sỉ', cta: 'Gửi báo giá', href: WHOLESALE_QUOTE_URL,
    },
    {
      // Ảnh mầm hoa trên đất, cắt và dời cây sang phải như ô báo giá ở trên (hai ô xếp chồng trên máy tính, thân cây thẳng hàng).
      key: 'benh', tone: 'sale', showText: true, image: '/images/banner/tra-benh-cay.webp',
      title: 'Cây bị bệnh? Tra theo triệu chứng', cta: 'Bắt bệnh cho cây', href: '/benh-cay',
    },
  ];
  const top = inSlot('top');
  const hero = inSlot('hero');
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
    ['cay-de-ban', 'cay-van-phong', 'cay-trong-nha', 'cay-ban-cong', 'cay-san-vuon'].map((s) => [`cay-canh/${s}`, `/images/danh-muc/${s}.webp`]),
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
  const hasSeason = (d: (typeof diseases)[number]) => d.season.normalize('NFC').toLowerCase().includes(season.key);
  const seasonal = diseases
    .filter((d) => d.symptoms.some((s) => s.image))
    .sort((a, b) => Number(hasSeason(b)) - Number(hasSeason(a)) || b.severity - a.severity)
    .slice(0, 4);

  // ---- Bài viết ----
  const news = posts.filter((p) => categoryOf(p.category)?.promo || categoryOf(p.category)?.section === 'news').slice(0, 5);
  // Video ngắn nổi bật: video admin đánh dấu Nổi bật trước, rồi mới nhất (publishedVideos đã xếp sẵn).
  const videos = allVideos.slice(0, 8);
  const care = posts.filter((p) => p.kind === 'article' && categoryOf(p.category)?.section === 'blog' && !categoryOf(p.category)?.promo).slice(0, 4);
  const shownProjects = projects.filter((p) => p.images.length).slice(0, 3);

  return (
    <div className="hm">
      {/* Schema toàn website: tổ chức (tên, logo, hotline, mạng xã hội) + website — các trang khác trỏ về bằng @id */}
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />
      <h1 className="app-sr">Cây Cảnh Miền Tây — cung cấp sỉ cây cảnh, thuốc BVTV, phân bón, vật tư làm vườn</h1>

      <section className="hm-hero" aria-label="Sự kiện và ưu đãi">
        <HomeHero
          tops={top.length ? top : fallbackTop}
          slides={hero.length ? hero : fallbackHero}
          sides={(sides.length ? sides : fallbackSides).slice(0, 2)}
          backdrop={backdrop ? { image: bannerImageUrl(backdrop.image), imageMobile: backdrop.imageMobile ? bannerImageUrl(backdrop.imageMobile) : null } : null}
        />
        <QuickLinks items={[...QUICK]} />
      </section>

      <div className="hm-body">
        <section className="hm-sec">
          <HomeHead icon="leaf" title="Mua sỉ theo danh mục" href="/danh-muc" />
          <CategoryMosaic items={mosaic} />
        </section>

        {flash.length > 0 && <FlashSale products={flash} />}

        {events.length > 0 && (
          <section className="hm-sec" aria-label="Sự kiện nổi bật">
            <HomeCarousel slides={events} label="Sự kiện nổi bật" className="hm-car--band" />
          </section>
        )}

        <section className="hm-partner">
          <div className="hm-partner__txt">
            <span className="hm-partner__badge">Chương trình đối tác sỉ</span>
            <h2>Một giá sỉ chung, chiết khấu riêng cho từng đối tác</h2>
            <div className="hm-partner__acts">
              <Link href={`${WHOLESALE_URL}#dang-ky`} className="vx-btn hm-btn-sun">Đăng ký đối tác</Link>
              <Link href={WHOLESALE_QUOTE_URL} className="vx-btn hm-btn-ghost">Gửi báo giá sỉ</Link>
            </div>
          </div>
          <ul className="hm-partner__types">
            {PARTNER_TYPES.map((t) => (
              <li key={t}>
                <Link href={`${WHOLESALE_URL}#dang-ky`} className="hm-ptype app-plain">
                  <img {...responsive(PARTNER_IMAGE[t], '(max-width: 47.9375em) 44vw, 400px', 640)} alt="" loading="lazy" style={{ objectPosition: PARTNER_IMAGE_POS[t] }} />
                  <span><Icon name={PARTNER_INFO[t].icon} /><b>{PARTNER_INFO[t].label}</b></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {best.length > 0 && (
          <section className="hm-sec hm-sec--card">
            <HomeHead icon="star" title="Bán chạy ở vườn" href="/tim-kiem?q=bán chạy" />
            <ProductGrid products={best} />
          </section>
        )}

        {wall.length === 9 && (
          <section className="hm-sec">
            <HomeHead icon="tree" title="Ảnh thật từ vườn" href="/danh-muc/cay-canh" />
            <PhotoWall products={wall} />
          </section>
        )}

        {videos.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="camera" title="Video ngắn nổi bật" href={VIDEO_PAGE} />
            <ShortVideos videos={videos} layout="row" />
          </section>
        )}

        {seasonal.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="bug" title={`Bệnh cây ${season.name.toLowerCase()}`} href="/benh-cay" />
            <SeasonDiseases season={season.name} diseases={seasonal} />
          </section>
        )}

        {news.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="gift" title="Sự kiện & khuyến mãi" href="/khuyen-mai" />
            <NewsBoard posts={news} />
          </section>
        )}

        {shownProjects.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="trees" title="Công trình đã cung cấp cây" href={`${WHOLESALE_URL}#cong-trinh`} />
            <div className="hm-projects">{shownProjects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
          </section>
        )}

        {care.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="sprout" title="Góc chăm cây" href={SECTIONS.blog.path} />
            <PostCards posts={care} />
          </section>
        )}

        <TrustRow items={[
          { icon: 'tag', b: 'Giá sỉ công khai', text: 'Chiết khấu riêng cho đối tác' },
          { icon: 'truck', b: 'Giao toàn quốc', text: 'Gọi xác nhận trước khi gửi' },
          { icon: 'shield', b: `Bảo hành cây ${WARRANTY_DAYS} ngày`, text: 'Gửi ảnh, kỹ sư xem xét' },
          { icon: 'plant', b: 'Kỹ sư tư vấn', text: 'Chọn cây, bắt bệnh, dùng thuốc' },
        ]} />
      </div>
    </div>
  );
}
