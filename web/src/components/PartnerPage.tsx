import Link from '@/components/LocaleLink';
import type { ReactNode } from 'react';
import { formatPhone, LEGAL, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, SHOP_MAP_URL, ZALO_URL } from '@/lib/contact';
import type { PartnerType } from '@/lib/partners';
import { projectImageUrl, projectPath, regionsOf, type Project } from '@/lib/projects';
import { TREE_GUIDES, treeGuidePath } from '@/lib/tree-guides';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { Breadcrumb } from './Blocks';
import { Icon, type IconName } from './Icon';
import { ServiceFaq } from './LandingParts';
import { PartnerSignup, type SignupProfile } from './PartnerSignup';
import { WholesaleQuoteForm, type WholesaleDefaults } from './WholesaleQuoteForm';
import { responsive } from '@/lib/images';

// Trang Đối tác sỉ (/doi-tac). Từ 09/10/2026 shop thôi làm dịch vụ, chỉ cung cấp sỉ cây công trình, cây cảnh và vật tư.
// Nguyên tắc: chỉ đăng điều có thật — số liệu chủ shop đã xác nhận, công trình nhập ở /admin/du-an; không hứa VAT / công nợ /
// tồn kho / tỉ lệ sống khi chủ shop chưa xác nhận. Mọi nút "Nhận báo giá sỉ" về form ngay trong trang (#bao-gia).

const QUOTE = '#bao-gia';

const FACTS: { b: string; text: string }[] = [
  { b: 'Từ 2007', text: 'trong ngành trồng trọt' },
  { b: 'Từ 2019', text: 'chuyên cây công trình' },
  { b: 'Gần 200', text: 'nhà vườn liên kết miền Nam' },
];

const NAV: [string, string][] = [
  ['cay-cong-trinh', 'Cây công trình'],
  ['doi-tac', 'Đối tác'],
  ['quy-trinh', 'Quy trình'],
  ['nang-luc', 'Năng lực'],
  ['bao-gia', 'Báo giá'],
  ['hoi-dap', 'Hỏi đáp'],
];

const VALUES: { icon: IconName; b: string }[] = [
  { icon: 'sprout', b: 'Giá trực tiếp từ vườn' },
  { icon: 'trees', b: 'Đa dạng chủng loại cây' },
  { icon: 'receipt', b: 'Báo giá theo số lượng, quy cách' },
  { icon: 'truck', b: 'Cung ứng cây cho dự án' },
];

const WHY: { icon: IconName; b: string; text: string; link?: [string, string] }[] = [
  { icon: 'sprout', b: 'Nguồn cây trực tiếp từ vườn', text: 'Mạng lưới gần 200 nhà vườn ở miền Nam và Trung Nam Bộ, gom đủ số lượng và chọn cây đồng đều quy cách.' },
  { icon: 'trees', b: 'Nhiều nhóm cây trong một đơn', text: 'Cây bóng mát, cây hoa, cau cọ, cây bụi, cỏ và vật tư — tổng hợp trong một báo giá.' },
  { icon: 'search', b: 'Đối chiếu quy cách', text: 'Chiều cao, đường kính thân, tán, cỡ bầu theo đúng bảng khối lượng; dòng chưa có cây đúng quy cách được đề xuất cây thay thế.' },
  { icon: 'receipt', b: 'Báo giá theo khối lượng', text: 'Cây, quy cách, số lượng, vật tư, vận chuyển tách dòng riêng, dễ đối chiếu.' },
  { icon: 'pin', b: 'Xem cây tại Làng hoa Sa Đéc', text: 'Hẹn đến vườn chọn cây trước khi chốt đơn lớn; ở xa thì nhận ảnh cây thật qua Zalo.', link: ['/he-thong-cua-hang', 'Xem bản đồ vườn'] },
  { icon: 'shield', b: 'Giao hàng, bảo hành', text: `Phương án giao theo tiến độ công trình; cây sống bảo hành ${WARRANTY_DAYS} ngày, điều kiện đơn lớn ghi trong báo giá.`, link: ['/chinh-sach/bao-hanh-cay', 'Chính sách bảo hành'] },
];

/** 4 nhóm đối tác — cùng về một form, chọn sẵn loại đối tác gần nhất của form (lib/partners.ts). */
const PARTNERS: { icon: IconName; b: string; text: string; type: PartnerType; cta: string }[] = [
  { icon: 'trees', b: 'Nhà thầu cảnh quan', text: 'Tìm cây theo bản vẽ, danh mục và quy cách.', type: 'landscape', cta: 'Gửi danh mục cây' },
  { icon: 'home', b: 'Chủ đầu tư dự án', text: 'Tổng hợp nhu cầu cây xanh theo từng khu vực dự án.', type: 'project', cta: 'Gửi yêu cầu dự án' },
  { icon: 'box', b: 'Đại lý, đối tác thương mại', text: 'Báo giá theo danh mục và số lượng lấy hàng.', type: 'trade', cta: 'Nhận bảng giá sỉ' },
  { icon: 'receipt', b: 'Đơn vị thu mua', text: 'Gửi danh sách cây cần tìm để được phản hồi.', type: 'project', cta: 'Gửi danh sách cây' },
];

const STEPS: { b: string; text: string }[] = [
  { b: 'Gửi danh mục cây', text: 'Hoặc yêu cầu, bảng khối lượng của dự án.' },
  { b: 'Xác nhận chi tiết', text: 'Loài cây, quy cách, số lượng, địa điểm giao.' },
  { b: 'Nhận báo giá', text: 'Kèm phương án cung ứng.' },
  { b: 'Chốt đơn hàng', text: 'Thống nhất tiến độ và phương án giao nhận.' },
];

const MAIL_SUBJECT = 'Yêu cầu báo giá sỉ cây công trình';
const MAIL_BODY = [
  'Kính gửi Cây Cảnh Miền Tây,', '', 'Đơn vị: ', 'Người liên hệ: ', 'Số điện thoại: ', '',
  'Nơi giao hàng: ', 'Thời gian cần hàng: ', '', 'Ghi chú (hoặc file đính kèm): ',
].join('\n');
const MAILTO = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

const HERO_IMAGE = '/images/doi-tac/lang-hoa-sa-dec.jpg';

/** Tên địa điểm là liên kết mở Google Maps, biểu tượng Google Maps đứng ngay sau chữ (không ghi "Xem trên Google Maps"). */
function MapLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="dn-maplink" href={href} target="_blank" rel="noreferrer" title="Xem trên Google Maps">
      {children}&nbsp;<img src="/images/social/google-maps.svg" alt="Xem trên Google Maps" />
    </a>
  );
}

export function PartnerPage({ projects, profile, quote }: { projects: Project[]; profile: SignupProfile | null; quote: WholesaleDefaults }) {
  const regions = regionsOf(projects);
  // Từ 3 công trình trở lên mới đưa số công trình lên đầu trang.
  const facts = projects.length >= 3
    ? [{ b: String(projects.length), text: `công trình tại ${regions.length} tỉnh, thành` }, ...FACTS]
    : FACTS;
  const logos = [...new Map(projects.filter((p) => p.clientLogo).map((p) => [p.clientLogo!, p])).values()];
  const quotes = projects.filter((p) => p.quote).slice(0, 3);
  // Ảnh thật: công trình đã cung cấp cây (ảnh đầu mỗi công trình) + vườn Sa Đéc.
  const gallery: { src: string; alt: string; href?: string; caption: string }[] = [
    ...projects.filter((p) => p.images.length).slice(0, 4).map((p) => ({
      src: projectImageUrl(p.images[0].file, p.slug), alt: p.images[0].caption || p.title, href: projectPath(p.slug),
      caption: [p.title, p.location].filter(Boolean).join(' · '),
    })),
    { src: '/images/doi-tac/lang-hoa-sa-dec.jpg', alt: 'Vườn cây tại Làng hoa Sa Đéc', caption: 'Làng hoa Sa Đéc, Đồng Tháp' },
    { src: '/images/doi-tac/cong-trinh.jpg', alt: 'Cây công trình', caption: 'Cây công trình' },
  ].slice(0, 5);

  return (
    <div className="dn-page pt">
      <section className="pt-hero">
        <img {...responsive(HERO_IMAGE, '100vw')} alt="" className="pt-hero__bg" width={1280} height={720} fetchPriority="high" />
        <div className="pt-hero__in">
          <Breadcrumb items={[{ label: 'Đối tác sỉ' }]} />
          <p className="pt-eyebrow">Giải pháp nguồn cung cây xanh cho doanh nghiệp</p>
          <h1>Đối tác nguồn cung cây công trình — giá tận vườn, tối ưu cho từng dự án</h1>
          <p className="pt-hero__sub">Cây bóng mát, cây cảnh quan, cây bụi, cây thảm nền. Báo giá theo quy cách và số lượng thực tế của từng công trình.</p>
          <div className="pt-hero__acts">
            <a href={QUOTE} className="vx-btn vx-btn--lg pt-btn-light">Nhận báo giá sỉ</a>
            <a href="#cay-cong-trinh" className="vx-btn vx-btn--lg pt-btn-line">Tìm nguồn cây cho dự án</a>
          </div>
          <ul className="pt-hero__facts">
            {facts.map((f) => <li key={f.b}><b>{f.b}</b>{f.text}</li>)}
          </ul>
        </div>
      </section>

      <ul className="pt-values" aria-label="Giá trị cốt lõi">
        {VALUES.map((v) => (
          <li key={v.b}><span className="pt-ic"><Icon name={v.icon} /></span><b>{v.b}</b></li>
        ))}
      </ul>

      <nav className="dn-nav" aria-label="Các mục trong trang">
        <div className="dn-nav__links">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </div>
        <a href={QUOTE} className="vx-btn vx-btn--primary vx-btn--sm dn-nav__cta">Nhận báo giá sỉ</a>
      </nav>

      <section id="cay-cong-trinh" className="dn-sec dn-sec--white">
        <header className="dn-head">
          <p className="dn-eyebrow">Danh mục cây công trình</p>
          <h2>Các nhóm cây cung cấp sỉ</h2>
        </header>
        <div className="pt-cats">
          {TREE_GUIDES.map((g) => (
            <article key={g.slug} className="pt-cat">
              <Link href={treeGuidePath(g.slug)} className="pt-cat__img" tabIndex={-1} aria-hidden="true">
                <img {...responsive(g.image, '(max-width: 47.9375em) 100vw, (max-width: 63.9375em) 50vw, 400px', 960)} alt="" width={1280} height={960} loading="lazy" />
              </Link>
              <div className="pt-cat__b">
                <h3><Link href={treeGuidePath(g.slug)}>{g.title}</Link></h3>
                <p>{g.short}</p>
                <div className="pt-cat__acts">
                  <a href={`?nhom=${g.slug}${QUOTE}`} className="vx-btn vx-btn--primary vx-btn--sm">Yêu cầu báo giá</a>
                  <Link href={treeGuidePath(g.slug)} className="pt-more">Xem chi tiết <Icon name="chevron" size={14} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="nang-luc" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Vì sao hợp tác</p>
          <h2>Một đầu mối tìm nguồn cây cho nhiều hạng mục cảnh quan</h2>
          <p>Đơn vị thi công và bộ phận thu mua tổng hợp danh mục cây, quy cách và nhu cầu báo giá cho từng dự án tại một nơi.</p>
        </header>
        <div className="dn-caps">
          {WHY.map((c) => (
            <div key={c.b} className="dn-cap">
              <span className="dn-cap__ic"><Icon name={c.icon} /></span>
              <b>{c.b}</b>
              <p>{c.text}</p>
              {c.link && <Link href={c.link[0]}>{c.link[1]} <Icon name="chevron" size={14} /></Link>}
            </div>
          ))}
        </div>
      </section>

      <section id="doi-tac" className="dn-sec dn-sec--white">
        <header className="dn-head">
          <p className="dn-eyebrow">Theo nhóm đối tác</p>
          <h2>Giải pháp cho từng đối tác</h2>
        </header>
        <div className="pt-partners">
          {PARTNERS.map((p) => (
            <div key={p.b} className="pt-partner">
              <span className="pt-ic"><Icon name={p.icon} /></span>
              <h3>{p.b}</h3>
              <p>{p.text}</p>
              <a href={`?loai=${p.type}${QUOTE}`} className="pt-more">{p.cta} <Icon name="chevron" size={14} /></a>
            </div>
          ))}
        </div>
      </section>

      <section id="quy-trinh" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Quy trình hợp tác</p>
          <h2>Bốn bước từ danh mục đến giao cây</h2>
        </header>
        <ol className="pt-steps">
          {STEPS.map((s, i) => (
            <li key={s.b}>
              <span className="pt-steps__n">{i + 1}</span>
              <b>{s.b}</b>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="dn-sec dn-sec--white" aria-labelledby="pt-gallery-h">
        <header className="dn-head">
          <p className="dn-eyebrow">Hình ảnh thực tế</p>
          <h2 id="pt-gallery-h">Vườn cây và công trình đã cung cấp</h2>
        </header>
        <div className="pt-gallery" data-n={gallery.length}>
          {gallery.map((g) => {
            const body = (
              <>
                <img {...responsive(g.src, '(max-width: 47.9375em) 100vw, 600px', 960)} alt={g.alt} loading="lazy" />
                <span>{g.caption}</span>
              </>
            );
            return g.href
              ? <Link key={g.src} href={g.href} className="pt-gallery__it">{body}</Link>
              : <figure key={g.src} className="pt-gallery__it">{body}</figure>;
          })}
        </div>
        {logos.length > 0 && (
          <div className="dn-logos" aria-label="Đơn vị đã hợp tác">
            <p className="dn-eyebrow">Đơn vị đã tin chọn Cây Cảnh Miền Tây</p>
            <ul>
              {logos.map((p) => (
                <li key={p.clientLogo}>
                  <Link href={projectPath(p.slug)} title={p.client || p.title}>
                    <img src={projectImageUrl(p.clientLogo!)} alt={p.client || p.title} loading="lazy" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {quotes.length > 0 && (
          <div className="dn-quotes">
            {quotes.map((p) => (
              <figure key={p.id} className="dn-quote">
                <blockquote>“{p.quote!.quote}”</blockquote>
                <figcaption>
                  <b>{p.quote!.name}</b>
                  {p.quote!.title && <span>{p.quote!.title}</span>}
                  <Link href={projectPath(p.slug)}>{p.title}</Link>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section id="bao-gia" className="dn-sec pt-quote">
        <header className="dn-head">
          <p className="dn-eyebrow">Nhận báo giá sỉ</p>
          <h2>Bạn đang tìm nguồn cây cho dự án?</h2>
          <p>Gửi danh mục và nhu cầu để trao đổi về quy cách, số lượng, giá và phương án cung ứng.</p>
        </header>
        <div className="pt-quote__grid">
          <WholesaleQuoteForm defaults={quote} embedded />
          <aside className="pt-quote__side">
            <b>Liên hệ trực tiếp</b>
            <a href={`tel:${SALES_PHONE}`} className="pt-contact"><Icon name="phone" /><span>Kinh doanh sỉ<strong>{formatPhone(SALES_PHONE)}</strong></span></a>
            <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pt-contact"><Icon name="chat" /><span>Zalo<strong>Gửi file Excel, bản vẽ</strong></span></a>
            <a href={MAILTO} className="pt-contact"><Icon name="mail" /><span>Email<strong>{SHOP_EMAIL}</strong></span></a>
          </aside>
        </div>
      </section>

      <section id="dang-ky" className="dn-sec dn-sec--white">
        <header className="dn-head">
          <p className="dn-eyebrow">Đăng ký đối tác</p>
          <h2>Trở thành đối tác của Cây Cảnh Miền Tây</h2>
        </header>
        <PartnerSignup profile={profile} />
      </section>

      <section id="phap-ly" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Minh bạch pháp lý</p>
          <h2>Thông tin doanh nghiệp</h2>
        </header>
        <div className="dn-legal">
          <dl>
            <div><dt>Tên gọi</dt><dd>{LEGAL.name}</dd></div>
            <div><dt>Người chịu trách nhiệm</dt><dd>{LEGAL.owner}</dd></div>
            <div><dt>Số đăng ký kinh doanh</dt><dd>{LEGAL.regNo}, cấp tháng {LEGAL.regIssued}</dd></div>
            <div><dt>Cơ quan thuế quản lý</dt><dd><MapLink href={LEGAL.taxOfficeMapUrl}>{LEGAL.taxOffice}</MapLink></dd></div>
            <div><dt>Địa chỉ, vườn ươm</dt><dd><MapLink href={SHOP_MAP_URL}>{SHOP_ADDRESS}</MapLink></dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${SHOP_EMAIL}`}>{SHOP_EMAIL}</a></dd></div>
          </dl>
          <div className="dn-legal__links">
            <Link href="/chinh-sach/giay-phep-kinh-doanh"><Icon name="receipt" />Giấy phép kinh doanh</Link>
            <Link href="/chinh-sach/gioi-thieu"><Icon name="leaf" />Giới thiệu & cột mốc hoạt động</Link>
            <Link href="/chinh-sach/dat-coc"><Icon name="card" />Chính sách đặt cọc</Link>
            <Link href="/chinh-sach/bao-hanh-cay"><Icon name="shield" />Chính sách bảo hành cây</Link>
          </div>
        </div>
      </section>

      <div id="hoi-dap" className="dn-faq">
        <ServiceFaq
          items={[
            { q: 'Có cung cấp cây công trình số lượng lớn không?', a: 'Có. Cây được gom từ mạng lưới gần 200 nhà vườn miền Nam; số lượng và quy cách từng loài xác nhận khi báo giá, cây chưa đủ số lượng sẽ được báo rõ hoặc đề xuất cây thay thế.' },
            { q: 'Giá cây được tính theo những yếu tố nào?', a: 'Loài cây, quy cách (chiều cao, đường kính thân, tán, cỡ bầu), số lượng, độ đồng đều yêu cầu, nơi giao và chi phí bốc xếp, vận chuyển. Giá trên web là giá lẻ; giá sỉ công trình báo riêng theo danh sách bạn gửi.' },
            { q: 'Có thể gửi danh mục cây từ bản vẽ hoặc file Excel không?', a: <>Được. Chụp ảnh bảng khối lượng gửi qua form ở trên, hoặc gửi file Excel, bản vẽ qua <a href={ZALO_URL} target="_blank" rel="noopener noreferrer">Zalo</a> / <a href={MAILTO}>email</a>.</> },
            { q: 'Có thể yêu cầu cây theo chiều cao, đường kính thân và kích thước bầu không?', a: 'Được. Ghi quy cách từng dòng trong danh mục; dòng nào chưa có cây đúng quy cách sẽ được ghi chú và đề xuất cây gần nhất.' },
            { q: 'Có giao cây đến công trình ở các tỉnh không?', a: 'Có giao đến công trình; phương án xe, bốc xếp và chi phí vận chuyển tùy địa điểm, khối lượng và được ghi trong báo giá.' },
            { q: 'Thời gian báo giá và cung ứng được xác định thế nào?', a: 'Sau khi xác nhận đủ loài cây, quy cách, số lượng và nơi giao, shop gửi báo giá kèm thời gian cung ứng cho từng đơn; đơn lớn có thể chia đợt theo tiến độ công trình.' },
            { q: 'Điều kiện vận chuyển, nghiệm thu và bảo hành cây ra sao?', a: <>Cây sống được bảo hành theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>; điều kiện vận chuyển, nghiệm thu, đặt cọc (<Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>) cho đơn lớn ghi rõ trong báo giá.</> },
          ]}
        />
      </div>

      <section className="pt-final">
        <img {...responsive('/images/doi-tac/cay-bong-mat.webp', '100vw', 1280)} alt="" className="pt-final__bg" loading="lazy" />
        <div className="pt-final__in">
          <h2>Chuẩn bị danh mục cây cho dự án tiếp theo của bạn</h2>
          <p>Gửi danh mục cây và quy cách mong muốn để bắt đầu trao đổi phương án cung ứng.</p>
          <div className="pt-hero__acts">
            <a href={QUOTE} className="vx-btn vx-btn--lg pt-btn-light">Nhận báo giá sỉ</a>
            <a href={`tel:${SALES_PHONE}`} className="vx-btn vx-btn--lg pt-btn-line">Liên hệ tư vấn</a>
          </div>
        </div>
      </section>
    </div>
  );
}
