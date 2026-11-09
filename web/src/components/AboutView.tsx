import Link from '@/components/LocaleLink';
import { Breadcrumb } from './Blocks';
import { formatPhone, SALES_PHONE, SUPPORT_PHONE } from '@/lib/contact';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { PolicyNav } from './PolicyNav';
import { ShareButton } from './PostClient';

/** Mốc hoạt động, mới nhất trước. `next` = dự kiến (chưa xảy ra). */
const MILESTONES: { year: string; text: string; next?: boolean }[] = [
  { year: '2026 – 2027', next: true, text: 'Dự kiến vượt mốc 1.000 cây cảnh các loại trên khắp toàn quốc, trở thành nhà cung cấp cây cảnh hàng đầu, đưa cây cảnh đến tay người tiêu dùng.' },
  { year: '10/2026', text: 'Chuyển sang chỉ cung cấp sỉ cây cảnh và vật tư cho đối tác dịch vụ cảnh quan, công trình và buôn bán.' },
  { year: '2025', text: 'Triển khai thêm mô hình cây cảnh văn phòng, cây cảnh giống.' },
  { year: '2024', text: 'Huy động được gần 200 nhà vườn gần xa ở khu vực miền Nam và Trung Nam Bộ.' },
  { year: '2023', text: 'Vượt mốc 100 khách hàng tiềm năng trong suốt quá trình hoạt động.' },
  { year: '2022', text: 'Vượt mốc 50 loại cây cảnh cung cấp cho thị trường miền Nam và các tỉnh lân cận.' },
  { year: '2021', text: 'Vượt mốc 30 loại cây cảnh cung cấp cho thị trường miền Nam.' },
  { year: '2020', text: 'Mở rộng quy mô với 10 loại cây cảnh công trình khác nhau.' },
  { year: '2019', text: 'Chính thức chuyển đổi mô hình sang cây cảnh công trình.' },
  { year: '2007', text: 'Thành lập với kinh nghiệm gần 5 năm trong ngành trồng trọt.' },
];

/** Trang "Giới thiệu" (/chinh-sach/gioi-thieu): viết tay, nội dung do chủ shop cung cấp. */
export function AboutView({ lang = 'vi' }: { lang?: string }) {
  if (lang === 'en') return <AboutViewEn />;
  return (
    <>
      <div style={{ padding: '12px 24px 0', background: 'var(--surface)' }}>
        <Breadcrumb items={[{ label: 'Giới thiệu' }]} />
      </div>
      <div className="vx-policypage">
        <PolicyNav />
        <article className="vx-policy">
          <h1>Giới thiệu Cây Cảnh Miền Tây</h1>
          <div className="vx-policy__meta">
            <span>Cập nhật lần cuối: 09/10/2026</span>
            <span>·</span>
            <span>3 phút đọc</span>
            <span className="acts"><ShareButton title="Giới thiệu Cây Cảnh Miền Tây" /></span>
          </div>

          <h2>I. Về chúng tôi</h2>
          <div className="vx-quote">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M4 26V16c0-6 3-10 9-11l1 3c-3 1-5 3-5 7h5v11zm15 0V16c0-6 3-10 9-11l1 3c-3 1-5 3-5 7h5v11z" />
            </svg>
            <p>
              Cây Cảnh Miền Tây thành lập năm 2007 với gần 5 năm kinh nghiệm trong ngành trồng trọt. Từ năm 2019, chúng tôi
              chuyển sang mô hình cây cảnh công trình và hợp tác với gần 200 nhà vườn ở miền Nam, Trung Nam Bộ để đưa cây cảnh
              đến tay người tiêu dùng. Bên cạnh cây cảnh, chúng tôi có phân bón và vật tư làm vườn, kèm
              kỹ sư nông nghiệp tư vấn miễn phí và chính sách bảo hành cây sống.
            </p>
          </div>
          <div className="vx-facts">
            <div><b>2007</b><span>Năm thành lập</span></div>
            <div><b>Gần 200</b><span>Nhà vườn cùng hợp tác</span></div>
            <div><b>50+</b><span>Loại cây cảnh cung cấp</span></div>
            <div><b>7 ngày</b><span>Bảo hành cây sống</span></div>
          </div>
          <h3>Lĩnh vực hoạt động</h3>
          <ul>
            <li><b>Cây cảnh công trình:</b> cây cho sân vườn, khuôn viên và các công trình.</li>
            <li><b>Cây cảnh văn phòng, cây cảnh giống:</b> mô hình mới triển khai từ năm 2025.</li>
            <li><b>Phân bón, vật tư:</b> phân bón có nguồn gốc rõ ràng, chậu, đất – giá thể và dụng cụ làm vườn.</li>
            <li><b>Cung cấp sỉ cho đối tác:</b> đơn vị dịch vụ cảnh quan, nhà thầu công trình, cửa hàng và đại lý; <Link href="/doi-tac">xem trang Đối tác sỉ</Link>.</li>
            <li><b>Tư vấn chăm cây:</b> kỹ sư giải đáp miễn phí; xem thêm <Link href="/goc-cham-cay">Góc chăm cây</Link> và <Link href="/benh-cay">Bắt bệnh cho cây</Link>.</li>
          </ul>

          <h2>II. Sứ mệnh và tầm nhìn</h2>
          <p>
            <b>Sứ mệnh:</b> mang cây xanh đến gần hơn với mọi gia đình và văn phòng, kèm kiến thức chăm sóc đúng để cây sống
            khỏe lâu dài, thay vì mua về rồi bỏ.
          </p>
          <p>
            <b>Tầm nhìn:</b> trở thành nhà cung cấp cây cảnh hàng đầu, đưa cây cảnh đến tay người tiêu dùng trên khắp toàn
            quốc (xem lộ trình ở mục V).
          </p>

          <h2>III. Cam kết</h2>
          <ul>
            <li><b>Cây thật như ảnh:</b> ảnh chụp tại vườn, gửi ảnh cây trước khi giao.</li>
            <li><b>Vật tư chính hãng:</b> phân bón, chậu, giá thể có nguồn gốc rõ ràng.</li>
            <li><b>Tư vấn trọn đời:</b> hỏi kỹ sư miễn phí qua Zalo cho mọi cây đã mua.</li>
            <li><b>Giao cây toàn quốc:</b> cây sống đóng khung chống dập; xem <Link href="/chinh-sach/giao-hang">Chính sách giao hàng</Link>.</li>
            <li><b>Nội dung có kỹ sư kiểm duyệt:</b> bài chăm cây, bắt bệnh và trả lời hỏi đáp; xem <Link href="/chinh-sach/noi-dung">Chính sách nội dung</Link>.</li>
          </ul>

          <h2>IV. Bảo hành cây sống</h2>
          <div className="vx-table-wrap">
            <table className="vx-table">
              <thead>
                <tr><th>Loại</th><th>Thời gian</th><th>Điều kiện</th></tr>
              </thead>
              <tbody>
                <tr><td>Mọi loại cây sống</td><td>{WARRANTY_DAYS} ngày kể từ khi nhận</td><td>Gửi ảnh cây ở Tài khoản → Bảo hành cây; kỹ sư phản hồi trong 24 giờ</td></tr>
              </tbody>
            </table>
          </div>
          <div className="vx-callout">
            <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8v.5" />
            </svg>
            <div>
              Xem đầy đủ điều kiện tại <Link href="/chinh-sach/bao-hanh-cay">Chính sách bảo hành cây</Link>. Mọi thắc mắc vui lòng
              gọi <a href={`tel:${SUPPORT_PHONE}`}>{formatPhone(SUPPORT_PHONE)}</a> (8:00 – 21:00).
            </div>
          </div>

          <h2>V. Cột mốc hoạt động</h2>
          <ol className="ab-tl">
            {MILESTONES.map((m) => (
              <li key={m.year} className={m.next ? 'ab-tl__item ab-tl__item--next' : 'ab-tl__item'}>
                <span className="ab-tl__year">
                  {m.year}
                  {m.next && <span className="ab-tl__tag">Dự kiến</span>}
                </span>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
          <div className="vx-callout">
            <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8v.5" />
            </svg>
            <div>
              Ghé thăm chúng tôi tại Làng Hoa Sa Đéc, Đồng Tháp, hoặc gọi tư vấn mua hàng{' '}
              <a href={`tel:${SALES_PHONE}`}>{formatPhone(SALES_PHONE)}</a>. Xem thêm <Link href="/he-thong-cua-hang">Hệ thống cửa hàng & vườn</Link>.
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

const MILESTONES_EN: { year: string; text: string; next?: boolean }[] = [
  { year: '2026 – 2027', next: true, text: 'Expected to pass 1,000 ornamental plants of all kinds nationwide and become a leading plant supplier, bringing plants to consumers.' },
  { year: '10/2026', text: 'Switched to wholesale-only supply of plants and garden supplies for landscaping, construction and trade partners.' },
  { year: '2025', text: 'Added office plants and young plants to our range.' },
  { year: '2024', text: 'Brought together nearly 200 partner nurseries across southern and south-central Vietnam.' },
  { year: '2023', text: 'Passed 100 key customers over the course of our operations.' },
  { year: '2022', text: 'Passed 50 plant varieties supplied to southern Vietnam and neighbouring provinces.' },
  { year: '2021', text: 'Passed 30 plant varieties supplied to southern Vietnam.' },
  { year: '2020', text: 'Expanded to 10 different landscape plant varieties.' },
  { year: '2019', text: 'Officially switched our business to landscape plants.' },
  { year: '2007', text: 'Founded, building on nearly 5 years of experience in horticulture.' },
];

const Info = () => (
  <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.5" />
  </svg>
);

/** English version of the About page (/en/chinh-sach/gioi-thieu). */
function AboutViewEn() {
  return (
    <>
      <div style={{ padding: '12px 24px 0', background: 'var(--surface)' }}>
        <Breadcrumb items={[{ label: 'About us' }]} />
      </div>
      <div className="vx-policypage">
        <PolicyNav />
        <article className="vx-policy">
          <h1>About Cây Cảnh Miền Tây</h1>
          <div className="vx-policy__meta">
            <span>Last updated: 09/10/2026</span>
            <span>·</span>
            <span>3 min read</span>
            <span className="acts"><ShareButton title="About Cây Cảnh Miền Tây" /></span>
          </div>

          <h2>I. Who we are</h2>
          <div className="vx-quote">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M4 26V16c0-6 3-10 9-11l1 3c-3 1-5 3-5 7h5v11zm15 0V16c0-6 3-10 9-11l1 3c-3 1-5 3-5 7h5v11z" />
            </svg>
            <p>
              Cây Cảnh Miền Tây was founded in 2007, building on nearly 5 years of horticultural experience. In 2019 we moved
              into landscape plants and now work with nearly 200 nurseries across southern and south-central Vietnam to bring
              plants to consumers. Alongside plants we supply fertilisers and garden supplies, with free advice from agricultural
              engineers and a warranty on live plants.
            </p>
          </div>
          <div className="vx-facts">
            <div><b>2007</b><span>Founded</span></div>
            <div><b>Nearly 200</b><span>Partner nurseries</span></div>
            <div><b>50+</b><span>Plant varieties supplied</span></div>
            <div><b>7 days</b><span>Live-plant warranty</span></div>
          </div>
          <h3>What we do</h3>
          <ul>
            <li><b>Landscape plants:</b> plants for gardens, grounds and construction projects.</li>
            <li><b>Office plants and young plants:</b> a new range launched in 2025.</li>
            <li><b>Fertilisers and supplies:</b> fertilisers of clear origin, pots, soil and growing media, and garden tools.</li>
            <li><b>Wholesale supply for partners:</b> landscaping firms, contractors, shops and resellers; <Link href="/doi-tac">see Wholesale partners</Link>.</li>
            <li><b>Plant-care advice:</b> free answers from our engineers; see also the <Link href="/goc-cham-cay">Plant care corner</Link> and <Link href="/benh-cay">Plant disease finder</Link>.</li>
          </ul>

          <h2>II. Mission and vision</h2>
          <p>
            <b>Mission:</b> bring greenery closer to every home and office, together with the right care knowledge so plants
            thrive for years instead of being bought and abandoned.
          </p>
          <p>
            <b>Vision:</b> become a leading plant supplier, bringing ornamental plants to consumers nationwide (see the roadmap
            in section V).
          </p>

          <h2>III. Our commitments</h2>
          <ul>
            <li><b>Plants as pictured:</b> photos taken at the nursery, and a photo of your plant before delivery.</li>
            <li><b>Genuine supplies:</b> fertilisers, pots and growing media of clear origin.</li>
            <li><b>Lifetime advice:</b> ask our engineers free on Zalo about any plant you bought.</li>
            <li><b>Nationwide plant delivery:</b> live plants packed in protective frames; see the <Link href="/chinh-sach/giao-hang">Delivery policy</Link>.</li>
            <li><b>Content reviewed by engineers:</b> plant-care and disease articles and Q&A answers; see the <Link href="/chinh-sach/noi-dung">Content policy</Link>.</li>
          </ul>

          <h2>IV. Live-plant warranty</h2>
          <div className="vx-table-wrap">
            <table className="vx-table">
              <thead>
                <tr><th>Type</th><th>Period</th><th>Conditions</th></tr>
              </thead>
              <tbody>
                <tr><td>All live plants</td><td>{WARRANTY_DAYS} days from receipt</td><td>Send plant photos under Account → Plant warranty; an engineer replies within 24 hours</td></tr>
              </tbody>
            </table>
          </div>
          <div className="vx-callout">
            <Info />
            <div>
              Full conditions in the <Link href="/chinh-sach/bao-hanh-cay">Plant warranty policy</Link>. For any questions call{' '}
              <a href={`tel:${SUPPORT_PHONE}`}>{formatPhone(SUPPORT_PHONE)}</a> (8:00 – 21:00, Vietnam time).
            </div>
          </div>

          <h2>V. Milestones</h2>
          <ol className="ab-tl">
            {MILESTONES_EN.map((m) => (
              <li key={m.year} className={m.next ? 'ab-tl__item ab-tl__item--next' : 'ab-tl__item'}>
                <span className="ab-tl__year">
                  {m.year}
                  {m.next && <span className="ab-tl__tag">Planned</span>}
                </span>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
          <div className="vx-callout">
            <Info />
            <div>
              Visit us in Sa Đéc Flower Village, Đồng Tháp, or call sales on{' '}
              <a href={`tel:${SALES_PHONE}`}>{formatPhone(SALES_PHONE)}</a>. See also <Link href="/he-thong-cua-hang">Stores & nursery</Link>.
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
