import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatPhone, LEGAL, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, SHOP_MAP_URL, ZALO_URL } from '@/lib/contact';
import { PARTNER_IMAGE, PARTNER_IMAGE_POS, PARTNER_INFO, PARTNER_TYPES, WHOLESALE_QUOTE_URL, type PartnerType } from '@/lib/partners';
import { projectImageUrl, projectPath, regionsOf, type Project } from '@/lib/projects';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { Breadcrumb } from './Blocks';
import { Icon, type IconName } from './Icon';
import { ServiceCta, ServiceFaq } from './LandingParts';
import { PartnerSignup, type SignupProfile } from './PartnerSignup';
import { responsive } from '@/lib/images';

// Trang Đối tác sỉ (/doi-tac). Từ 09/10/2026 shop thôi làm dịch vụ, chỉ cung cấp sỉ cho 3 nhóm đối tác (lib/partners.ts).
// Nguyên tắc giữ từ trang Khách doanh nghiệp cũ: chỉ đăng điều có thật — số liệu chủ shop đã xác nhận, công trình nhập ở /admin/du-an;
// không hứa VAT / công nợ khi chủ shop chưa xác nhận.

const FACTS: { b: string; text: string }[] = [
  { b: 'Từ 2007', text: 'kinh nghiệm trong ngành trồng trọt' },
  { b: 'Từ 2019', text: 'chuyên cây cảnh công trình' },
  { b: 'Gần 200', text: 'nhà vườn liên kết ở miền Nam' },
  { b: '50+', text: 'loại cây cảnh cung ứng' },
];

const NAV: [string, string][] = [
  ['doi-tac', 'Đối tác'],
  ['cay-cong-trinh', 'Cây công trình'],
  ['cach-mua', 'Cách mua sỉ'],
  ['dang-ky', 'Đăng ký'],
  ['nang-luc', 'Năng lực'],
  ['phap-ly', 'Pháp lý'],
  ['hoi-dap', 'Hỏi đáp'],
];

/** Mỗi nhóm đối tác: shop cung cấp gì cho họ. */
const OFFER: Record<PartnerType, string[]> = {
  landscape: ['Cây cảnh, cây bụi, lá màu, hoa theo từng công việc', 'Đất, giá thể, phân bón, chậu, vật tư', 'Lấy lẻ theo từng công trình nhỏ, không cần tồn kho'],
  project: ['Cây bóng mát, cau, cây bụi, thảm cỏ theo bảng khối lượng', 'Đồng đều chủng loại, chiều cao, đường kính gốc, cỡ bầu', 'Chia đợt giao theo tiến độ công trình'],
  trade: ['Cây cảnh, cây để bàn, cây văn phòng đủ cỡ để bán lại', 'Vật tư, phân bón, chậu đi kèm', 'Lấy hàng định kỳ, giao toàn quốc'],
};

/** Các nhóm cây công trình shop cung cấp sỉ; tên cây mở trang tìm kiếm. */
const TREE_GROUPS: { icon: IconName; b: string; use: string; trees: string[] }[] = [
  { icon: 'trees', b: 'Cây bóng mát, cây đường phố', use: 'Vỉa hè, trục đường, công viên, khu dân cư, nhà máy', trees: ['Sao đen', 'Dầu rái', 'Giáng hương', 'Lim xẹt', 'Bằng lăng', 'Phượng vĩ', 'Me tây', 'Long não', 'Sấu', 'Muồng hoàng yến', 'Xà cừ'] },
  { icon: 'leaf', b: 'Cây điểm nhấn, cây hoa', use: 'Cổng dự án, quảng trường, sảnh, resort', trees: ['Cau vua', 'Cọ dầu', 'Kèn hồng', 'Lộc vừng'] },
  { icon: 'sprout', b: 'Cây bụi, cây viền', use: 'Dải phân cách, bồn hoa, viền lối đi', trees: ['Chuỗi ngọc', 'Trang đỏ', 'Nguyệt quế', 'Vàng anh', 'Dâm bụt', 'Ắc ó'] },
  { icon: 'box', b: 'Cây thảm nền, cỏ', use: 'Bãi cỏ, taluy, sân vườn, dải xanh', trees: ['Cỏ lá gừng', 'Cỏ nhung Nhật', 'Cỏ Bermuda', 'Lan chi', 'Lẻ bạn', 'Cẩm thạch', 'Dền cảnh', 'Lá gấm'] },
];

const TREE_BY_USE: [string, string][] = [
  ['Vỉa hè, đường phố', 'Sao đen, dầu rái, giáng hương, lim xẹt'],
  ['Công viên, quảng trường', 'Me tây, lộc vừng, bằng lăng, kèn hồng'],
  ['Khu đô thị, khu dân cư', 'Giáng hương, cau vua, bằng lăng, muồng hoàng yến'],
  ['Khu công nghiệp, nhà máy', 'Sao đen, dầu rái, lim xẹt'],
  ['Dải phân cách', 'Chuỗi ngọc, trang đỏ, ắc ó'],
  ['Resort, khách sạn', 'Cau vua, cọ dầu, kèn hồng, lộc vừng'],
  ['Bồn hoa, viền lối đi', 'Nguyệt quế, trang đỏ, lan chi, cỏ nhung Nhật'],
];

const CAPABILITIES: { icon: IconName; b: string; text: string; link?: [string, string] }[] = [
  { icon: 'trees', b: 'Nguồn cây lớn, ổn định', text: 'Mạng lưới gần 200 nhà vườn ở miền Nam và Trung Nam Bộ giúp gom đủ số lượng lớn và chọn cây đồng đều quy cách.' },
  { icon: 'sprout', b: 'Xem cây tại Làng hoa Sa Đéc', text: 'Đối tác có thể đến vườn ươm xem và chọn cây trước khi chốt đơn số lượng lớn; ở xa thì shop gửi ảnh cây thật qua Zalo.', link: ['/he-thong-cua-hang', 'Xem bản đồ vườn ươm'] },
  { icon: 'box', b: 'Đủ cây và vật tư một nơi', text: 'Cây cảnh, đất, giá thể, phân bón, chậu — gom một đơn, một lần giao.' },
  { icon: 'receipt', b: 'Báo giá rõ từng dòng', text: 'Cây, quy cách, số lượng, vật tư, vận chuyển tách dòng riêng để đối tác dễ đối chiếu và báo lại cho khách của mình.' },
  { icon: 'user', b: 'Một đầu mối phụ trách', text: 'Một nhân viên kinh doanh nhận yêu cầu và theo dõi đơn của bạn từ báo giá đến khi giao xong.' },
  { icon: 'shield', b: 'Giao toàn quốc, có bảo hành', text: `Cây đóng gói chống dập khi vận chuyển; cây sống bảo hành ${WARRANTY_DAYS} ngày, điều kiện riêng của đơn lớn ghi trong báo giá.`, link: ['/chinh-sach/bao-hanh-cay', 'Chính sách bảo hành'] },
];

const MAIL_SUBJECT = 'Yêu cầu báo giá sỉ cây cảnh';
const MAIL_BODY = [
  'Kính gửi Cây Cảnh Miền Tây,', '', 'Đơn vị / cửa hàng: ', 'Người liên hệ: ', 'Số điện thoại: ', '',
  'Nơi giao hàng: ', '', 'Ghi chú (hoặc file đính kèm): ',
].join('\n');
const MAILTO = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

/** Tên địa điểm là liên kết mở Google Maps, biểu tượng Google Maps đứng ngay sau chữ (không ghi "Xem trên Google Maps"). */
function MapLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="dn-maplink" href={href} target="_blank" rel="noreferrer" title="Xem trên Google Maps">
      {children}&nbsp;<img src="/images/social/google-maps.svg" alt="Xem trên Google Maps" />
    </a>
  );
}

export function PartnerPage({ projects, profile }: { projects: Project[]; profile: SignupProfile | null }) {
  const featured = projects.find((p) => p.featured && p.images.length) ?? projects.find((p) => p.images.length);
  const regions = regionsOf(projects);
  // Từ 3 công trình trở lên mới đưa số công trình lên đầu trang.
  const facts = projects.length >= 3
    ? [{ b: String(projects.length), text: `công trình đã cung cấp cây tại ${regions.length} tỉnh, thành` }, ...FACTS]
    : FACTS;
  const logos = [...new Map(projects.filter((p) => p.clientLogo).map((p) => [p.clientLogo!, p])).values()];
  const quotes = projects.filter((p) => p.quote).slice(0, 3);

  return (
    <div className="dn-page">
      <div className="dn-crumb">
        <Breadcrumb items={[{ label: 'Đối tác sỉ' }]} />
      </div>
      <section className="dn-hero">
        <div className="dn-hero__text">
          <span className="vx-badge vx-badge--sun">Chuyên cung cấp sỉ</span>
          <h1>Cây cảnh &amp; vật tư giá sỉ cho đối tác</h1>
          <p>
            Cây Cảnh Miền Tây cung cấp sỉ cây cảnh, cây công trình, phân bón và vật tư cho đơn vị dịch vụ cảnh quan,
            nhà thầu công trình và cửa hàng, đại lý buôn bán — nguồn cây từ gần 200 nhà vườn miền Nam.
          </p>
          <div className="acts">
            <Link href={WHOLESALE_QUOTE_URL} className="vx-btn vx-btn--lg vx-btn--light">Gửi báo giá</Link>
          </div>
          <ul className="dn-hero__facts">
            {facts.map((f) => <li key={f.b}><b>{f.b}</b>{f.text}</li>)}
          </ul>
        </div>
        {featured ? (
          <Link href={projectPath(featured.slug)} className="dn-hero__media">
            <img {...responsive(projectImageUrl(featured.images[0].file, featured.slug), '(max-width: 63.9375em) 100vw, 600px')} alt={featured.images[0].caption || featured.title} fetchPriority="high" />
            <span className="dn-hero__tag"><b>Công trình tiêu biểu</b>{featured.title}{featured.location && ` · ${featured.location}`}</span>
          </Link>
        ) : (
          <div className="sv-art sv-art--img dn-hero__art">
            <img src="/images/doi-tac/lang-hoa-sa-dec.jpg" alt="Làng hoa Sa Đéc" width={1280} height={720} fetchPriority="high" />
            <span className="tag"><b>Giá sỉ công trình</b>Gửi báo giá, shop liên hệ</span>
          </div>
        )}
      </section>

      <nav className="dn-nav" aria-label="Các mục trong trang">
        <div className="dn-nav__links">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </div>
        <Link href={WHOLESALE_QUOTE_URL} className="vx-btn vx-btn--primary vx-btn--sm dn-nav__cta">Gửi báo giá</Link>
      </nav>

      <section id="doi-tac" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Đối tác của chúng tôi</p>
          <h2>Chúng tôi cung cấp sỉ cho</h2>
          <p>Shop không nhận thi công, chăm sóc hay cho thuê cây — chỉ cung cấp cây và vật tư để đối tác làm việc của mình.</p>
        </header>
        <div className="sv-cards" data-n="3">
          {PARTNER_TYPES.map((t) => (
            <div key={t} className="sv-card">
              <span className="img"><img {...responsive(PARTNER_IMAGE[t], '(max-width: 47.9375em) 100vw, 400px', 640)} alt="" width={960} height={720} loading="lazy" style={{ objectPosition: PARTNER_IMAGE_POS[t] }} /></span>
              <span className="b">
                <b>{PARTNER_INFO[t].label}</b>
                {PARTNER_INFO[t].hint}
                <ul className="sv-check app-pt-offer">
                  {OFFER[t].map((x) => <li key={x}><Icon name="check" />{x}</li>)}
                </ul>
                <Link href={`${WHOLESALE_QUOTE_URL}?loai=${t}`}>
                  Gửi báo giá
                  <Icon name="chevron" size={14} />
                </Link>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="cay-cong-trinh" className="dn-sec dn-sec--white">
        <header className="dn-head">
          <p className="dn-eyebrow">Cây công trình</p>
          <h2>Các loại cây công trình cung cấp sỉ</h2>
        </header>
        <div className="dn-caps dn-trees">
          {TREE_GROUPS.map((g) => (
            <div key={g.b} className="dn-cap">
              <span className="dn-cap__ic"><Icon name={g.icon} /></span>
              <b>{g.b}</b>
              <p>{g.use}</p>
              <ul className="dn-chips">
                {g.trees.map((t) => <li key={t}><Link href={`/tim-kiem?q=${encodeURIComponent(t)}`}>{t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="dn-tablewrap">
          <table className="dn-table">
            <thead><tr><th>Công trình</th><th>Cây tham khảo</th></tr></thead>
            <tbody>
              {TREE_BY_USE.map(([u, t]) => (
                <tr key={u}><td className="t"><b>{u}</b></td><td data-label="Cây">{t}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href={WHOLESALE_QUOTE_URL} className="vx-btn vx-btn--primary dn-trees__cta">Gửi báo giá cây công trình</Link>
      </section>

      <section id="cach-mua" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Cách mua sỉ</p>
          <h2>Đặt ngay trên web hoặc gửi danh sách</h2>
        </header>
        <div className="dn-ways">
          <div className="dn-way dn-way--main">
            <span className="dn-way__ic"><Icon name="cart" /></span>
            <b>Đặt hàng trên web</b>
            <p>
              Mua 2 cây có giá combo. Đối tác được <b>chiết khấu thêm</b>, tự trừ trong giỏ.
            </p>
            <Link href="/danh-muc/cay-canh" className="vx-btn vx-btn--primary">Xem sản phẩm</Link>
          </div>
          <div className="dn-way">
            <span className="dn-way__ic"><Icon name="receipt" /></span>
            <b>Gửi báo giá</b>
            <p>Số lượng lớn, quy cách đặc biệt, cây chưa có trên web hoặc có bảng khối lượng (BOQ): ghi chú hoặc chụp ảnh gửi lên, shop báo giá qua Zalo.</p>
            <Link href={WHOLESALE_QUOTE_URL} className="vx-btn vx-btn--outline">Gửi báo giá</Link>
          </div>
          <div className="dn-way">
            <span className="dn-way__ic"><Icon name="phone" /></span>
            <b>Gọi, Zalo hoặc email</b>
            <p>
              Kinh doanh sỉ: <a href={`tel:${SALES_PHONE}`}>{formatPhone(SALES_PHONE)}</a>
              <br />Gửi file BOQ, hồ sơ mời thầu: <a href={MAILTO}>email</a> hoặc Zalo.
            </p>
            <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--outline">Nhắn Zalo</a>
          </div>
        </div>
      </section>

      <section id="dang-ky" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Đăng ký đối tác</p>
          <h2>Trở thành đối tác của Cây Cảnh Miền Tây</h2>
          <p>Đăng ký một lần để shop ghi nhận đơn vị của bạn. Sau khi duyệt, mức chiết khấu riêng (nếu có) được áp dụng tự động cho mọi đơn đặt trên web.</p>
        </header>
        <PartnerSignup profile={profile} />
      </section>

      {logos.length > 0 && (
        <section className="dn-sec dn-logos" aria-label="Đơn vị đã hợp tác">
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
        </section>
      )}

      {quotes.length > 0 && (
        <section className="dn-sec" aria-labelledby="dn-quotes-h">
          <header className="dn-head"><h2 id="dn-quotes-h">Khách hàng nói về chúng tôi</h2></header>
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
        </section>
      )}

      <section id="nang-luc" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Năng lực cung ứng</p>
          <h2>Vì sao đối tác chọn Cây Cảnh Miền Tây</h2>
        </header>
        <div className="dn-caps">
          {CAPABILITIES.map((c) => (
            <div key={c.b} className="dn-cap">
              <span className="dn-cap__ic"><Icon name={c.icon} /></span>
              <b>{c.b}</b>
              <p>{c.text}</p>
              {c.link && <Link href={c.link[0]}>{c.link[1]} <Icon name="chevron" size={14} /></Link>}
            </div>
          ))}
        </div>
      </section>

      <section id="phap-ly" className="dn-sec dn-sec--white">
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
            { q: 'Có mức mua tối thiểu không?', a: 'Đơn giao hàng đặt trên web có mức tiền hàng tối thiểu (ghi ở giỏ hàng và Chính sách giao hàng); nhận tại vườn thì mua 1 cây cũng được. Đơn số lượng lớn cho công trình hoặc quy cách đặc biệt thì gửi yêu cầu báo giá sỉ.' },
            { q: 'Giá trên web là giá lẻ hay giá sỉ?', a: 'Giá hiện trên web là giá lẻ; mua 2 cây cùng quy cách có giá combo, đơn từ 1 triệu dùng được mã giảm giá. Giá sỉ công trình báo riêng theo danh sách bạn gửi. Đối tác đã đăng ký và được duyệt có thể được chiết khấu thêm; chiết khấu tự trừ trong giỏ hàng khi bạn đăng nhập.' },
            { q: 'Shop có nhận thi công, chăm sóc hay cho thuê cây không?', a: 'Không. Shop chỉ cung cấp cây và vật tư cho các đơn vị làm dịch vụ cảnh quan, công trình và buôn bán.' },
            { q: 'Có được xem cây trước khi đặt số lượng lớn không?', a: <>Được. Bạn có thể hẹn đến <Link href="/he-thong-cua-hang">vườn ươm tại Làng hoa Sa Đéc</Link> để xem và chọn cây; ở xa thì shop gửi ảnh cây thật qua Zalo trước khi giao.</> },
            { q: 'Shop có nhận báo giá theo bảng khối lượng (BOQ) không?', a: <>Có. Gửi qua <Link href={WHOLESALE_QUOTE_URL}>form báo giá</Link> (ảnh bảng khối lượng), email <a href={MAILTO}>{SHOP_EMAIL}</a> hoặc Zalo; dòng nào chưa có cây đúng quy cách sẽ được ghi chú và đề xuất cây thay thế.</> },
            { q: 'Có cần đặt cọc không?', a: <>Cây lớn đặt trước và đơn công trình thường cần đặt cọc, mức cụ thể ghi trong báo giá. Xem <Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>.</> },
            { q: 'Hợp đồng, hóa đơn và thanh toán thế nào?', a: 'Hãy nêu yêu cầu về hợp đồng, hóa đơn và cách thanh toán khi gửi yêu cầu; điều khoản cụ thể được thống nhất trong báo giá của từng đơn.' },
            { q: 'Cây giao có được bảo hành không?', a: <>Cây sống được bảo hành theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>; điều kiện cho đơn lớn ghi rõ trong báo giá.</> },
          ]}
        />
      </div>

      <ServiceCta
        title="Gửi báo giá sỉ"
        text="Ghi chú hoặc chụp ảnh bảng khối lượng"
        label="Gửi báo giá"
        href={WHOLESALE_QUOTE_URL}
      />
    </div>
  );
}
