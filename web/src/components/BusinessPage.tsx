import Link from 'next/link';
import { CARE_PHONE, formatPhone, LEGAL, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, ZALO_URL } from '@/lib/contact';
import { projectImageUrl, projectPath, regionsOf, type Project } from '@/lib/projects';
import { BUSINESS_IMAGE } from '@/lib/services';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { Icon, type IconName } from './Icon';
import { ProjectList } from './ProjectList';
import { ProjectShowcase } from './ProjectShowcase';
import { QUOTE_URL, ServiceCta, ServiceFaq } from './ServiceParts';

// Trang Khách doanh nghiệp (/doanh-nghiep). Nguyên tắc: chỉ đăng điều có thật — số liệu do chủ shop xác nhận (trang Giới thiệu),
// dự án / tên / logo khách lấy từ /admin/du-an (chủ shop tự nhập). Không bảng giá sỉ, không VAT / công nợ khi chưa được xác nhận.

const FACTS: { b: string; text: string }[] = [
  { b: 'Từ 2007', text: 'kinh nghiệm trong ngành trồng trọt' },
  { b: 'Từ 2019', text: 'chuyên cây cảnh công trình' },
  { b: 'Gần 200', text: 'nhà vườn liên kết ở miền Nam' },
  { b: '50+', text: 'loại cây cảnh cung ứng' },
];

const NAV: [string, string][] = [
  ['du-an', 'Dự án'],
  ['nang-luc', 'Năng lực'],
  ['giai-phap', 'Giải pháp'],
  ['quy-trinh', 'Quy trình'],
  ['lien-he', 'Gửi yêu cầu'],
  ['phap-ly', 'Pháp lý'],
  ['hoi-dap', 'Hỏi đáp'],
];

const CAPABILITIES: { icon: IconName; b: string; text: string; link?: [string, string] }[] = [
  { icon: 'trees', b: 'Nguồn cây lớn, ổn định', text: 'Mạng lưới gần 200 nhà vườn ở miền Nam và Trung Nam Bộ giúp gom đủ số lượng lớn và chọn cây đồng đều quy cách cho cả công trình.' },
  { icon: 'sprout', b: 'Vườn ươm tại Làng hoa Sa Đéc', text: 'Đại diện doanh nghiệp có thể đến xem và chọn cây trực tiếp trước khi chốt đơn số lượng lớn.', link: ['/he-thong-cua-hang', 'Xem bản đồ vườn ươm'] },
  { icon: 'leaf', b: 'Kỹ sư nông nghiệp đồng hành', text: 'Khảo sát nắng, đất, gió tại công trình; chọn cây đúng từng vị trí; hướng dẫn chăm sóc sau bàn giao.', link: ['/chinh-sach/doi-ngu-chuyen-mon', 'Đội ngũ chuyên môn'] },
  { icon: 'user', b: 'Một đầu mối phụ trách', text: 'Một người nhận yêu cầu và theo dõi xuyên suốt từ khảo sát, báo giá đến giao cây và nghiệm thu.' },
  { icon: 'receipt', b: 'Báo giá rõ từng khoản', text: 'Cây, quy cách, số lượng, vật tư, vận chuyển và nhân công tách dòng riêng để phòng mua hàng dễ đối chiếu.' },
  { icon: 'shield', b: 'Giao toàn quốc, có bảo hành', text: `Cây đóng gói chống dập khi vận chuyển; cây sống bảo hành ${WARRANTY_DAYS} ngày, điều kiện riêng của từng dự án ghi trong báo giá.`, link: ['/chinh-sach/bao-hanh-cay', 'Chính sách bảo hành'] },
];

const GARDEN_QUOTE = `${QUOTE_URL}?loai=san-vuon`;
const SOLUTIONS: { icon: IconName; b: string; text: string; href: string; cta: string }[] = [
  { icon: 'home', b: 'Văn phòng & tòa nhà', text: 'Cây sảnh, hành lang, phòng họp, cây để bàn. Thuê có người chăm định kỳ hoặc mua về tự chăm.', href: '/dich-vu/cho-thue-cay-van-phong', cta: 'Thuê hoặc mua cây văn phòng' },
  { icon: 'trees', b: 'Khu đô thị & bất động sản', text: 'Cây bóng mát, cây đường nội khu, cây bụi, thảm cỏ cho khuôn viên, công viên nội khu và nhà mẫu.', href: GARDEN_QUOTE, cta: 'Đặt lịch khảo sát' },
  { icon: 'palm', b: 'Khách sạn, resort, nhà hàng', text: 'Cây cảnh quan, cây chậu trang trí sảnh, hồ bơi, ban công — chọn cây hợp nắng gió từng vị trí.', href: GARDEN_QUOTE, cta: 'Đặt lịch khảo sát' },
  { icon: 'box', b: 'Nhà máy & khu công nghiệp', text: 'Cây bóng mát, hàng rào xanh, thảm cỏ cho khuôn viên và đường nội bộ, ưu tiên cây khỏe, ít chăm.', href: GARDEN_QUOTE, cta: 'Đặt lịch khảo sát' },
  { icon: 'shield', b: 'Trường học, bệnh viện', text: 'Ưu tiên cây không gai, không độc, ít rụng lá, rễ không phá nền — an toàn cho trẻ nhỏ và người bệnh.', href: GARDEN_QUOTE, cta: 'Đặt lịch khảo sát' },
  { icon: 'truck', b: 'Nhà thầu cảnh quan', text: 'Cung cấp cây theo bảng khối lượng: đúng chủng loại, chiều cao, đường kính gốc, cỡ bầu; chia đợt giao theo tiến độ.', href: '#lien-he', cta: 'Gửi bảng khối lượng' },
];

const STEPS: { icon: IconName; b: string; text: string }[] = [
  { icon: 'mail', b: 'Gửi yêu cầu', text: 'Danh sách cây, bản vẽ hoặc ảnh hiện trạng' },
  { icon: 'clock', b: 'Kỹ sư gọi lại', text: 'Trong 2 giờ làm việc để xác nhận nhu cầu' },
  { icon: 'pin', b: 'Khảo sát', text: 'Miễn phí tại công trình: nắng, đất, gió, lối vận chuyển' },
  { icon: 'receipt', b: 'Báo giá chi tiết', text: 'Gửi qua Zalo sau 48 giờ kể từ buổi khảo sát' },
  { icon: 'check', b: 'Chốt & đặt cọc', text: 'Thống nhất chủng loại, tiến độ, mức cọc theo báo giá' },
  { icon: 'truck', b: 'Giao, trồng, nghiệm thu', text: 'Theo tiến độ công trình, bàn giao kèm hướng dẫn chăm' },
];

const PREPARE = [
  'Tên dự án và địa điểm công trình',
  'Danh sách cây kèm quy cách (chiều cao, đường kính gốc hoặc tán, cỡ bầu / chậu) và số lượng — hoặc bản vẽ',
  'Thời gian cần cây, có chia đợt giao theo tiến độ không',
  'Ảnh hiện trạng nếu cần khảo sát, thi công',
  'Yêu cầu về hợp đồng, hóa đơn, thanh toán (nếu có)',
];

const MAIL_SUBJECT = 'Yêu cầu báo giá dự án cây xanh';
const MAIL_BODY = [
  'Kính gửi Cây Cảnh Miền Tây,', '', 'Đơn vị: ', 'Người liên hệ / chức vụ: ', 'Số điện thoại: ', '',
  'Tên dự án: ', 'Địa điểm công trình: ', 'Thời gian cần cây: ', '', 'Danh sách cây / bảng khối lượng: (đính kèm)', '', 'Yêu cầu khác: ',
].join('\n');
const MAILTO = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

export function BusinessPage({ projects }: { projects: Project[] }) {
  const featured = projects.find((p) => p.featured && p.images.length) ?? projects.find((p) => p.images.length);
  const withPhotos = projects.filter((p) => p.images.length);
  const listOnly = projects.filter((p) => !p.images.length);
  const regions = regionsOf(projects);
  // Từ 3 công trình trở lên mới đưa số công trình lên đầu trang.
  const facts = projects.length >= 3
    ? [{ b: String(projects.length), text: `công trình tiêu biểu tại ${regions.length} tỉnh, thành` }, ...FACTS]
    : FACTS;
  const logos = [...new Map(projects.filter((p) => p.clientLogo).map((p) => [p.clientLogo!, p])).values()];
  const quotes = projects.filter((p) => p.quote).slice(0, 3);

  return (
    <div className="dn-page">
      <section className="dn-hero">
        <div className="dn-hero__text">
          <span className="vx-badge vx-badge--sun">Giải pháp cây xanh cho doanh nghiệp</span>
          <h1>Đối tác cây xanh cho dự án, văn phòng và công trình</h1>
          <p>
            Cung ứng cây số lượng lớn, đồng đều quy cách từ mạng lưới gần 200 nhà vườn miền Nam. Kỹ sư nông nghiệp khảo sát, chọn cây
            và một người phụ trách theo sát dự án của bạn từ báo giá đến bàn giao.
          </p>
          <div className="acts">
            <Link href={QUOTE_URL} className="vx-btn vx-btn--lg vx-btn--light">Yêu cầu báo giá</Link>
            {projects.length > 0
              ? <a href="#du-an" className="vx-btn vx-btn--lg vx-btn--line">Xem dự án đã triển khai</a>
              : <a href={`tel:${SALES_PHONE}`} className="vx-btn vx-btn--lg vx-btn--line"><Icon name="phone" size={16} />{formatPhone(SALES_PHONE)}</a>}
          </div>
          <ul className="dn-hero__facts">
            {facts.map((f) => <li key={f.b}><b>{f.b}</b>{f.text}</li>)}
          </ul>
        </div>
        {featured ? (
          <Link href={projectPath(featured.slug)} className="dn-hero__media">
            <img src={projectImageUrl(featured.images[0].file)} alt={featured.images[0].caption || featured.title} />
            <span className="dn-hero__tag"><b>Dự án tiêu biểu</b>{featured.title}{featured.location && ` · ${featured.location}`}</span>
          </Link>
        ) : (
          <div className="sv-art sv-art--img dn-hero__art">
            <img src={BUSINESS_IMAGE} alt="Khuôn viên trồng hàng cau vua, thảm cỏ và bồn cây cảnh quan" width={960} height={720} fetchPriority="high" />
            <span className="tag"><b>Kỹ sư gọi lại trong 2 giờ làm việc</b>Khảo sát miễn phí tại công trình</span>
          </div>
        )}
      </section>

      <nav className="dn-nav" aria-label="Các mục trong trang">
        <div className="dn-nav__links">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </div>
        <Link href={QUOTE_URL} className="vx-btn vx-btn--primary vx-btn--sm dn-nav__cta">Yêu cầu báo giá</Link>
      </nav>

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

      <section id="du-an" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Hồ sơ năng lực</p>
          <h2>Dự án đã triển khai</h2>
          <p>
            {projects.length > 0 && <>{projects.length} công trình tại {regions.length} tỉnh, thành phố. </>}
            {withPhotos.length > 0 && 'Hình ảnh chụp tại công trình. '}
            Tên chủ đầu tư chỉ được ghi khi khách hàng đồng ý công khai.
          </p>
        </header>
        {withPhotos.length > 0 && <ProjectShowcase projects={withPhotos} />}
        {listOnly.length > 0 && (
          <div className="dn-listbox">
            {withPhotos.length > 0 && <h3>Các công trình khác đã tham gia</h3>}
            <ProjectList projects={listOnly} />
            <p className="dn-note">
              Cần hình ảnh thực tế hoặc thông tin tham khảo của một công trình cụ thể (cho hồ sơ mời thầu, trình duyệt nội bộ)?{' '}
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer">Nhắn Zalo</a> hoặc <a href={MAILTO}>gửi email</a> để được gửi trực tiếp.
            </p>
          </div>
        )}
        {!projects.length && (
          <div className="dn-empty">
            <span className="dn-empty__ic"><Icon name="camera" /></span>
            <b>Hồ sơ dự án đang được cập nhật lên website</b>
            <p>Doanh nghiệp cần danh sách công trình tham khảo và hình ảnh thực tế (cho hồ sơ mời thầu, trình duyệt nội bộ…), vui lòng liên hệ để được gửi trực tiếp.</p>
            <div className="acts">
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--primary">Nhắn Zalo</a>
              <a href={MAILTO} className="vx-btn vx-btn--outline">Gửi email</a>
            </div>
          </div>
        )}
      </section>

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

      <section id="nang-luc" className="dn-sec dn-sec--white">
        <header className="dn-head">
          <p className="dn-eyebrow">Năng lực cung ứng</p>
          <h2>Vì sao doanh nghiệp chọn Cây Cảnh Miền Tây</h2>
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

      <section id="giai-phap" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Giải pháp</p>
          <h2>Cây xanh cho từng loại công trình</h2>
        </header>
        <div className="dn-sols">
          {SOLUTIONS.map((s) => (
            <div key={s.b} className="dn-sol">
              <span className="dn-sol__ic"><Icon name={s.icon} /></span>
              <div>
                <b>{s.b}</b>
                <p>{s.text}</p>
                <Link href={s.href}>{s.cta} <Icon name="chevron" size={14} /></Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="quy-trinh" className="dn-sec dn-sec--white">
        <header className="dn-head">
          <p className="dn-eyebrow">Quy trình</p>
          <h2>Làm việc rõ ràng từ đầu đến khi bàn giao</h2>
        </header>
        <div className="sv-steps dn-steps">
          {STEPS.map((s, i) => (
            <div key={s.b} className="sv-step">
              <span><Icon name={s.icon} /></span>
              <div className="t">
                <b><small className="dn-steps__n">{i + 1}.</small> {s.b}</b>
                {s.text}
              </div>
            </div>
          ))}
        </div>
        <p className="dn-note">Cây lớn và công trình thường cần đặt cọc — xem <Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>.</p>
      </section>

      <section id="lien-he" className="dn-sec">
        <header className="dn-head">
          <p className="dn-eyebrow">Gửi yêu cầu</p>
          <h2>Chọn cách thuận tiện nhất cho bạn</h2>
          <p>Kỹ sư gọi lại trong 2 giờ làm việc để xác nhận nhu cầu.</p>
        </header>
        <div className="dn-ways">
          <div className="dn-way dn-way--main">
            <span className="dn-way__ic"><Icon name="receipt" /></span>
            <b>Điền form yêu cầu báo giá</b>
            <p>Khoảng 2 phút: chọn dịch vụ, mô tả nhu cầu, gửi kèm tối đa 3 ảnh hiện trạng và chọn luôn lịch khảo sát.</p>
            <Link href={QUOTE_URL} className="vx-btn vx-btn--primary">Mở form yêu cầu</Link>
          </div>
          <div className="dn-way">
            <span className="dn-way__ic"><Icon name="mail" /></span>
            <b>Gửi hồ sơ qua email</b>
            <p>Phù hợp khi có bảng khối lượng (BOQ), bản vẽ hoặc hồ sơ mời thầu. Email mở sẵn mẫu thông tin cần điền.</p>
            <a href={MAILTO} className="vx-btn vx-btn--outline">{SHOP_EMAIL}</a>
          </div>
          <div className="dn-way">
            <span className="dn-way__ic"><Icon name="phone" /></span>
            <b>Gọi hoặc nhắn Zalo</b>
            <p>
              Mua cây số lượng lớn: <a href={`tel:${SALES_PHONE}`}>{formatPhone(SALES_PHONE)}</a>
              <br />Khảo sát, thi công, chăm sóc: <a href={`tel:${CARE_PHONE}`}>{formatPhone(CARE_PHONE)}</a>
            </p>
            <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--outline">Nhắn Zalo</a>
          </div>
        </div>
        <div className="dn-prep">
          <b>Để báo giá nhanh và sát, bạn nên chuẩn bị:</b>
          <ul className="sv-check">
            {PREPARE.map((t) => <li key={t}><Icon name="check" />{t}</li>)}
          </ul>
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
            <div><dt>Cơ quan thuế quản lý</dt><dd>{LEGAL.taxOffice}</dd></div>
            <div><dt>Địa chỉ, vườn ươm</dt><dd>{SHOP_ADDRESS}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${SHOP_EMAIL}`}>{SHOP_EMAIL}</a></dd></div>
          </dl>
          <div className="dn-legal__links">
            <Link href="/chinh-sach/giay-phep-kinh-doanh"><Icon name="receipt" />Giấy phép kinh doanh</Link>
            <Link href="/chinh-sach/gioi-thieu"><Icon name="leaf" />Giới thiệu & cột mốc hoạt động</Link>
            <Link href="/chinh-sach/doi-ngu-chuyen-mon"><Icon name="user" />Đội ngũ chuyên môn</Link>
            <Link href="/chinh-sach/dat-coc"><Icon name="card" />Chính sách đặt cọc</Link>
            <Link href="/chinh-sach/bao-hanh-cay"><Icon name="shield" />Chính sách bảo hành cây</Link>
          </div>
        </div>
      </section>

      <div id="hoi-dap" className="dn-faq">
        <ServiceFaq
          items={[
            { q: 'Có mức mua tối thiểu không?', a: 'Không có mức tối thiểu cố định, bạn mua lẻ vẫn được. Với số lượng lớn hoặc công trình, gửi yêu cầu để được báo giá riêng.' },
            { q: 'Có được xem cây trước khi đặt số lượng lớn không?', a: <>Được. Bạn có thể hẹn đến <Link href="/he-thong-cua-hang">vườn ươm tại Làng hoa Sa Đéc</Link> để xem và chọn cây; ở xa thì shop gửi ảnh cây thật qua Zalo trước khi giao.</> },
            { q: 'Shop có nhận báo giá theo bảng khối lượng (BOQ) hoặc hồ sơ mời thầu không?', a: <>Có. Gửi file qua <a href={MAILTO}>{SHOP_EMAIL}</a> hoặc Zalo; kỹ sư báo giá theo từng dòng, dòng nào chưa có cây đúng quy cách sẽ ghi chú và đề xuất cây thay thế để bạn chọn.</> },
            { q: 'Có cần đặt cọc không?', a: <>Cây lớn đặt trước và công trình thường cần đặt cọc, mức cụ thể ghi trong báo giá. Xem <Link href="/chinh-sach/dat-coc">Chính sách đặt cọc</Link>.</> },
            { q: 'Bao lâu có báo giá?', a: 'Kỹ sư gọi lại trong 2 giờ làm việc để xác nhận yêu cầu; báo giá chi tiết gửi qua Zalo, với yêu cầu cần khảo sát là sau 48 giờ kể từ buổi khảo sát.' },
            { q: 'Hợp đồng, hóa đơn và thanh toán thế nào?', a: 'Hãy nêu yêu cầu về hợp đồng, hóa đơn và cách thanh toán ngay khi gửi yêu cầu; điều khoản cụ thể được thống nhất trong báo giá và hợp đồng của từng dự án.' },
            { q: 'Cây giao có được bảo hành không?', a: <>Cây sống được bảo hành theo <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>; điều kiện cho từng dự án ghi rõ trong báo giá.</> },
            { q: 'Tôi muốn thuê cây văn phòng có người chăm?', a: <>Xem <Link href="/dich-vu/cho-thue-cay-van-phong">Cây văn phòng: thuê hoặc mua</Link> hoặc gửi yêu cầu để kỹ sư tư vấn.</> },
          ]}
        />
      </div>

      <ServiceCta
        title="Gửi yêu cầu, nhận báo giá chi tiết"
        text="Kỹ sư gọi lại trong 2 giờ làm việc để xác nhận nhu cầu của doanh nghiệp bạn"
        label="Yêu cầu báo giá"
        href={QUOTE_URL}
      />
    </div>
  );
}
