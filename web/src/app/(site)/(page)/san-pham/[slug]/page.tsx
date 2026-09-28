import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb, SectionHeader } from '@/components/Blocks';
import { BuyBox } from '@/components/BuyBox';
import { Icon } from '@/components/Icon';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductGrid } from '@/components/ProductCard';
import { elementName, getCategory, type Product } from '@/lib/catalog';
import { boughtTogether, getProduct } from '@/server/catalog';
import { getCurrentUser } from '@/server/auth';
import { isWishlisted } from '@/server/wishlist';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.lead } : { title: 'Không tìm thấy' };
}

const FAQ_PLANT = [
  ['Cây có trồng trong phòng máy lạnh được không?', 'Được. Tránh đặt ngay hướng gió máy lạnh thổi, và phun sương cho lá 2–3 lần/tuần vì không khí phòng lạnh khô.'],
  ['Cây bị vàng lá sau khi nhận hàng có được đổi không?', 'Cây được bảo hành 7 ngày kể từ khi nhận. Bạn chụp ảnh cây và gửi yêu cầu bảo hành trong mục Đơn hàng, kỹ sư sẽ phản hồi trong 24 giờ.'],
  ['Bao lâu thì nên thay chậu?', 'Khoảng 12–18 tháng, hoặc khi thấy rễ mọc ra lỗ thoát nước. Nên thay vào đầu mùa mưa.'],
];
const FAQ_SUPPLY = [
  ['Pha thuốc thế nào cho đúng liều?', 'Làm đúng liều ghi trên bao bì và trong bảng thông số. Không tự tăng liều, không trộn nhiều loại thuốc khi chưa hỏi kỹ sư.'],
  ['Hàng vật tư giao trong bao lâu?', 'Nội thành giao nhanh 2 giờ; tỉnh khác 2–4 ngày qua đơn vị vận chuyển.'],
  ['Có xuất hóa đơn điện tử không?', 'Có. Bật "Yêu cầu xuất hóa đơn điện tử" ở bước thanh toán và điền thông tin công ty.'],
];

function FengShuiBlock({ f }: { f: NonNullable<Product['fengshui']> }) {
  return (
    <>
      <h3 id="phong-thuy">Ý nghĩa phong thủy</h3>
      <dl className="app-fs">
        {f.elements.length > 0 && (
          <div><dt>Hợp mệnh</dt><dd>{f.elements.map((e) => <span key={e} className={`app-fs__el app-fs__el--${e}`}>{elementName(e)}</span>)}</dd></div>
        )}
        {f.ages && <div><dt>Hợp tuổi</dt><dd>{f.ages}</dd></div>}
        {f.placement && <div><dt>Vị trí đặt</dt><dd>{f.placement}</dd></div>}
      </dl>
      {f.meaning && <p style={{ whiteSpace: 'pre-line' }}>{f.meaning}</p>}
    </>
  );
}

function Content({ p }: { p: Product }) {
  const isPlant = p.ship === 'plant';
  return (
    <div className="vx-content">
      <nav className="vx-toc">
        <a href="#mo-ta" aria-current="true">Mô tả sản phẩm</a>
        {p.youtubeId && <a href="#video">Video</a>}
        {p.fengshui && <a href="#phong-thuy">Phong thủy</a>}
        <a href="#cach-dung">{isPlant ? 'Cách chăm sóc' : 'Cách sử dụng'}</a>
        <a href="#luu-y">Lưu ý</a>
        <a href="#hoi-dap">Câu hỏi thường gặp</a>
      </nav>
      <article className="vx-article">
        <h2 id="mo-ta">{p.name} là gì?</h2>
        <p>{p.lead}</p>
        {p.youtubeId && (
          <>
            <h3 id="video">Video {isPlant ? 'thực tế tại vườn' : 'hướng dẫn'}</h3>
            <div className="app-yt">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${p.youtubeId}?rel=0`}
                title={`Video ${p.name}`}
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </>
        )}
        {p.fengshui && <FengShuiBlock f={p.fengshui} />}
        <h3 id="cach-dung">{isPlant ? 'Cách chăm sóc' : 'Cách sử dụng'}</h3>
        <ul>
          {p.specs.slice(0, 4).map(([k, v]) => (
            <li key={k}><b>{k}:</b> {v}.</li>
          ))}
        </ul>
        <div className="vx-note" id="luu-y">
          <Icon name="alert" />
          <div>
            {p.pesticide ? (
              <><b>Lưu ý an toàn:</b> Đọc kỹ hướng dẫn trên bao bì, đeo găng tay và khẩu trang khi pha, để xa tầm tay trẻ em và vật nuôi. Tuân thủ thời gian cách ly trước khi thu hoạch.</>
            ) : isPlant ? (
              <><b>Lưu ý:</b> Tuần đầu để cây chỗ sáng nhẹ cho quen môi trường rồi mới chuyển ra vị trí chính.</>
            ) : (
              <><b>Lưu ý:</b> Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</>
            )}
          </div>
        </div>
        <div className="vx-expert">
          <span className="vx-avatar">KS</span>
          <div>
            <b>Kỹ sư nông nghiệp Trần Minh An</b> <span className="vx-badge vx-badge--success">Đã kiểm duyệt</span>
            <p>Tốt nghiệp ĐH Nông Lâm TP.HCM, 8 năm kinh nghiệm cây kiểng lá và bảo vệ thực vật.</p>
          </div>
        </div>
      </article>
    </div>
  );
}

/** ProductDetailLayout: breadcrumb → ProductGallery + BuyBox → ProductContent → Thường mua kèm → FAQ. */
export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [together, user] = await Promise.all([boughtTogether(p), getCurrentUser()]);
  const wishlisted = user ? await isWishlisted(user.id, p.slug) : false;
  const cat = getCategory(p.category);
  const sub = cat?.subs.find((s) => s.slug === p.sub);
  const faq = p.ship === 'plant' ? FAQ_PLANT : FAQ_SUPPLY;

  return (
    <div className="vx-pdpage app-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: cat?.name ?? '', href: `/danh-muc/${p.category}` },
          ...(sub ? [{ label: sub.name, href: `/danh-muc/${p.category}/${p.sub}` }] : []),
          { label: p.name },
        ]}
      />
      <section className="vx-pd">
        <div className="vx-gal">
          <ProductGallery p={p} />
          <p className="vx-gal__note">
            {p.ship === 'plant' ? 'Mỗi cây là một cá thể, dáng lá có thể khác đôi chút so với ảnh.' : 'Bao bì có thể thay đổi theo lô sản xuất.'}
          </p>
          <div className="vx-trust">
            <div><Icon name="truck" /><span><b>{p.ship === 'plant' ? 'Giao cây an toàn' : 'Giao nhanh 2h'}</b><small>{p.ship === 'plant' ? 'đóng khung, chống dập' : 'nội thành'}</small></span></div>
            <div><Icon name="shield" /><span><b>{p.ship === 'plant' ? 'Bảo hành 7 ngày' : 'Hàng chính hãng'}</b><small>{p.ship === 'plant' ? 'đổi cây nếu héo, bệnh' : 'có hóa đơn'}</small></span></div>
            <div><Icon name="chat" /><span><b>Kỹ sư tư vấn</b><small>miễn phí qua Zalo</small></span></div>
          </div>
        </div>
        <BuyBox product={p} wishlisted={wishlisted} />
      </section>

      <Content p={p} />

      <section className="vx-card">
        <SectionHeader icon="cart" title="Thường mua kèm" />
        <ProductGrid products={together} />
      </section>

      <section className="vx-card" id="hoi-dap">
        <h3 className="vx-card__title">Câu hỏi thường gặp</h3>
        <div className="vx-faq">
          {faq.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary><span className="q">?</span>{q}<Icon name="chevron" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="vx-card" id="danh-gia">
        <div className="vx-sect">
          <h2 style={{ fontSize: 18 }}>
            Đánh giá sản phẩm <small style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: 14 }}>({p.reviews} đánh giá)</small>
          </h2>
        </div>
        <div className="vx-review">
          <span className="vx-avatar vx-avatar--sm">NH</span>
          <div className="vx-review__body">
            <div className="vx-review__who">Ngọc Hân<span className="vx-verified">Đã mua hàng</span><small>2 ngày trước</small></div>
            <span className="vx-stars">★★★★★</span>
            <span>Hàng giao về đúng mô tả, đóng gói kỹ. Có kèm thẻ hướng dẫn rất dễ hiểu.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
