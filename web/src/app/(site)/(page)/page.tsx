import Link from 'next/link';
import { FlashSale } from '@/components/FlashSale';
import { HomeCarousel, HomeHero, type Slide } from '@/components/home/HomeCarousel';
import {
  CategoryMosaic, HomeHead, type MosaicItem, NewsBoard, PhotoWall, PostCards, QuickLinks, SeasonDiseases, TrustRow, VideoRow,
} from '@/components/home/HomeParts';
import { Icon } from '@/components/Icon';
import { ProductGrid } from '@/components/ProductCard';
import { ProjectCard } from '@/components/ProjectParts';
import type { Product } from '@/lib/catalog';
import { money } from '@/lib/format';
import { bannerImageUrl, slotOf, type Banner } from '@/lib/home-banners';
import { PARTNER_IMAGE, PARTNER_INFO, PARTNER_TYPES, WHOLESALE_QUOTE_URL, WHOLESALE_URL } from '@/lib/partners';
import { categoryOf, SECTIONS } from '@/lib/posts';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { allProducts, categoryCounts, flashProducts } from '@/server/catalog';
import { menuCategories } from '@/server/categories';
import { allDiseases } from '@/server/diseases';
import { liveBanners } from '@/server/home-banners';
import { publishedPosts } from '@/server/posts';
import { publishedProjects } from '@/server/projects';
import { getShippingConfig } from '@/server/shipping';
import '@/styles/home.css';

// Trang chủ (từ 09/10/2026): trang giới thiệu nhiều ảnh — banner sự kiện chủ shop tự tải ở /admin/trang-chu,
// danh mục bằng ảnh, Flash sale, ảnh vườn, bệnh cây theo mùa, tin sự kiện, công trình, video. Trang chủ cũ (mỗi danh mục
// một khối sản phẩm) chuyển sang /danh-muc. Khối nào chưa có dữ liệu thật thì ẩn; banner chưa tải thì dựng từ ảnh sản phẩm.

const QUICK = [
  { label: 'Đăng ký đối tác', sub: 'Nhận chiết khấu riêng', icon: 'user', href: `${WHOLESALE_URL}#dang-ky` },
  { label: 'Gửi báo giá sỉ', sub: 'Gửi danh sách cần mua', icon: 'receipt', href: WHOLESALE_QUOTE_URL },
  { label: 'Tư vấn chọn cây', sub: 'Theo từng không gian', icon: 'spark', href: '/tu-van-chon-cay' },
  { label: 'Bắt bệnh cho cây', sub: 'Tra theo triệu chứng', icon: 'bug', href: '/benh-cay' },
  { label: 'Tìm vườn ươm', sub: 'Hệ thống cửa hàng', icon: 'pin', href: '/he-thong-cua-hang' },
  { label: 'Tất cả sản phẩm', sub: 'Xem theo danh mục', icon: 'leaf', href: '/danh-muc' },
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
    ? { key: 'mưa', name: 'Mùa mưa', intro: 'Mưa nhiều, đất úng và trời nóng ẩm là lúc nấm, thối rễ, đốm lá bùng phát. Kiểm tra cây sớm, thoát nước tốt và phun phòng đúng thuốc để không mất cả lô cây.' }
    : { key: 'khô', name: 'Mùa khô', intro: 'Nắng gắt, ít mưa: nhện đỏ, bọ trĩ, rệp sáp phát triển mạnh, cây dễ cháy lá, héo đọt. Tưới đủ ẩm, che nắng cho cây non và kiểm tra mặt dưới lá thường xuyên.' };
}

export default async function HomePage() {
  const [banners, products, flash, categories, counts, posts, projects, diseases, cfg] = await Promise.all([
    liveBanners(), allProducts(), flashProducts(), menuCategories(), categoryCounts(),
    publishedPosts(), publishedProjects(), allDiseases(), getShippingConfig(),
  ]);
  // Mỗi vị trí chỉ hiện tối đa `max` ảnh đầu (BANNER_SLOTS).
  const inSlot = (slot: Banner['slot']) => banners.filter((b) => b.slot === slot).slice(0, slotOf(slot).max).map(fromBanner);
  const minOrder = cfg.minOrder > 0 ? `Đơn từ ${money(cfg.minOrder)}` : 'Không giới hạn đơn tối thiểu';

  // ---- Khung đầu trang: ảnh chủ shop tải lên; chưa có thì dựng từ ảnh thật của shop ----
  const season = seasonNow();
  const diseaseImgs = diseases.flatMap((d) => d.symptoms).flatMap((s) => (s.image ? [s.image] : []));
  const diseaseImg = diseaseImgs[0];
  // Băng ảnh rộng dựng sẵn: mỗi ảnh một màu nền riêng (ảnh làm mờ phủ lên) để nền cả khoảng trên đổi theo.
  const fallbackTop: Slide[] = [
    {
      key: 'top-tet', badge: 'Mùa cây Tết 2027', tone: 'sun', showText: true, image: '/videos/mai-vang.jpg', bg: { color: '#7f1d1d', blur: true },
      title: 'Mai, quất, cây Tết — đặt sớm, giữ hàng giá sỉ', subtitle: 'Cho cửa hàng, công trình, quà tặng doanh nghiệp', cta: 'Xem cây Tết', href: '/cay-tet',
    },
    {
      key: 'top-mua', badge: season.name, tone: 'green', showText: true, bg: { color: season.key === 'mưa' ? '#134e5e' : '#7c4a03', blur: true },
      image: diseaseImgs.length ? `/api/disease-images/${diseaseImgs[1] ?? diseaseImgs[0]}` : PARTNER_IMAGE.landscape,
      title: `${season.name}: phòng bệnh sớm, không mất cả lô cây`, subtitle: 'Tra bệnh theo triệu chứng, chọn đúng thuốc, đúng liều', cta: 'Bắt bệnh cho cây', href: '/benh-cay',
    },
    {
      key: 'top-vuon', badge: 'Vườn ươm miền Tây', tone: 'green', showText: true, image: PARTNER_IMAGE.landscape, bg: { color: '#14532d', blur: true },
      title: 'Xem cây tận vườn trước khi lấy sỉ', subtitle: 'Hệ thống vườn ươm, cửa hàng khắp miền Tây', cta: 'Tìm vườn gần bạn', href: '/he-thong-cua-hang',
    },
  ];
  const ofSub = (sub: string) => products.filter((p) => p.sub === sub || p.extraSubs?.includes(sub));
  const flashImgs = pickImages(flash, 3);
  const officeImgs = pickImages(ofSub('cay-van-phong'), 3);
  const fallbackHero: Slide[] = [
    {
      key: 'si', badge: 'Giá sỉ cho đối tác', tone: 'green', showText: true, image: PARTNER_IMAGE.project,
      title: 'Cây xanh giá sỉ cho công trình, cảnh quan, đại lý',
      subtitle: `${minOrder} · đăng ký đối tác để nhận chiết khấu riêng`, cta: 'Đăng ký đối tác', href: `${WHOLESALE_URL}#dang-ky`,
    },
    ...(flashImgs.length >= 2 ? [{
      key: 'flash', badge: 'Flash sale giờ vàng', tone: 'sale' as const, showText: true, image: flashImgs[0], contain: flashImgs,
      title: 'Giảm sâu mỗi ngày, 3 khung giờ vàng', subtitle: '08:00 · 12:00 · 20:00 — số lượng có hạn', cta: 'Săn ngay', href: '#flash-sale',
    }] : []),
    ...(officeImgs.length >= 2 ? [{
      key: 'tu-van', badge: 'Miễn phí', tone: 'green' as const, showText: true, image: officeImgs[0], contain: officeImgs,
      title: 'Chọn đúng cây cho từng không gian', subtitle: 'Trả lời vài câu hỏi — gợi ý loại cây, số lượng, dự toán', cta: 'Tư vấn chọn cây', href: '/tu-van-chon-cay',
    }] : []),
  ];
  const fallbackSides: Slide[] = [
    {
      key: 'bao-gia', tone: 'green', showText: true, image: PARTNER_IMAGE.trade,
      title: 'Gửi danh sách, nhận báo giá sỉ', cta: 'Gửi báo giá', href: WHOLESALE_QUOTE_URL,
    },
    {
      key: 'benh', tone: 'sale', showText: true, image: diseaseImg ? `/api/disease-images/${diseaseImg}` : PARTNER_IMAGE.landscape,
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
  const stocked = categories.filter((c) => counts[c.slug]);
  const mosaic: MosaicItem[] = stocked.flatMap((c) => {
    const subs = stocked.length < 4 ? c.subs.filter((s) => s.active && counts[`${c.slug}/${s.slug}`]) : [];
    if (subs.length < 2) return [{ key: c.slug, name: c.name, href: `/danh-muc/${c.slug}`, count: counts[c.slug], icon: c.icon, image: tileImage(products.filter((p) => p.category === c.slug)) }];
    return subs.map((s) => ({
      key: `${c.slug}/${s.slug}`, name: s.name, href: `/danh-muc/${c.slug}/${s.slug}`, count: counts[`${c.slug}/${s.slug}`], icon: c.icon,
      image: tileImage(products.filter((p) => p.category === c.slug && (p.sub === s.slug || p.extraSubs?.includes(s.slug)))),
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
  const videos = posts.filter((p) => p.youtubeId).slice(0, 6);
  const care = posts.filter((p) => !p.youtubeId && categoryOf(p.category)?.section === 'blog' && !categoryOf(p.category)?.promo).slice(0, 4);
  const shownProjects = projects.filter((p) => p.images.length).slice(0, 3);

  return (
    <div className="hm">
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
          <HomeHead icon="leaf" title="Mua sỉ theo danh mục" sub="Ảnh thật từng nhóm hàng — bấm vào để xem giá sỉ, quy cách" href="/danh-muc" more="Tất cả sản phẩm" />
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
            <p>{minOrder}. Đặt qua giỏ hàng hoặc gửi danh sách cây — shop báo giá, giữ hàng và giao chia đợt theo tiến độ công trình.</p>
            <div className="hm-partner__acts">
              <Link href={`${WHOLESALE_URL}#dang-ky`} className="vx-btn hm-btn-sun">Đăng ký đối tác</Link>
              <Link href={WHOLESALE_QUOTE_URL} className="vx-btn hm-btn-ghost">Gửi báo giá sỉ</Link>
            </div>
          </div>
          <ul className="hm-partner__types">
            {PARTNER_TYPES.map((t) => (
              <li key={t}>
                <Link href={`${WHOLESALE_URL}#dang-ky`} className="hm-ptype app-plain">
                  <img src={PARTNER_IMAGE[t]} alt="" loading="lazy" />
                  <span><Icon name={PARTNER_INFO[t].icon} /><b>{PARTNER_INFO[t].label}</b></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {best.length > 0 && (
          <section className="hm-sec hm-sec--card">
            <HomeHead icon="star" title="Bán chạy ở vườn" sub="Xếp theo số lượng đã bán" href="/tim-kiem?q=bán chạy" />
            <ProductGrid products={best} />
          </section>
        )}

        {wall.length === 9 && (
          <section className="hm-sec">
            <HomeHead icon="tree" title="Ảnh thật từ vườn" sub="Cây chụp tại vườn ươm — bấm vào ảnh để xem giá sỉ, quy cách" href="/danh-muc/cay-canh" />
            <PhotoWall products={wall} />
          </section>
        )}

        {seasonal.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="bug" title={`Bệnh cây ${season.name.toLowerCase()}`} sub="Nhận biết sớm, xử lý đúng thuốc" href="/benh-cay" />
            <SeasonDiseases season={season.name} intro={season.intro} diseases={seasonal} />
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
            <HomeHead icon="trees" title="Công trình đã cung cấp cây" sub="Năng lực thật của vườn — ảnh chụp tại công trình" href={`${WHOLESALE_URL}#cong-trinh`} />
            <div className="hm-projects">{shownProjects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
          </section>
        )}

        {videos.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="camera" title="Video ngắn" href={`${SECTIONS.blog.path}?loai=video`} />
            <VideoRow posts={videos} />
          </section>
        )}

        {care.length > 0 && (
          <section className="hm-sec">
            <HomeHead icon="sprout" title="Góc chăm cây" sub="Kinh nghiệm trồng, chăm, trị bệnh từ kỹ sư" href={SECTIONS.blog.path} />
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
