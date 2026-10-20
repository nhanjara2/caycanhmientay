import type { Metadata } from 'next';
import '@/styles/disease-detail.css';
import Link from 'next/link';
import { Breadcrumb, SectionHeader } from '@/components/Blocks';
import { PartIcon } from '@/components/DiseaseArt';
import { Icon } from '@/components/Icon';
import { ProductGrid } from '@/components/ProductCard';
import { SEVERITY, causeOf, diseaseImageUrl, partName, plantName } from '@/lib/diseases';
import { clipText } from '@/lib/format';
import { getProducts } from '@/server/catalog';
import { allDiseases, getDisease } from '@/server/diseases';
import { categoryOf, postPath } from '@/lib/posts';
import { postsForDisease } from '@/server/posts';
import { withShare } from '@/lib/seo';
import { movedOrNotFound, redirectIfMoved, withSeo } from '@/server/seo-cms';
import { responsive } from '@/lib/images';
import { JsonLd } from '@/components/JsonLd';
import { diseaseLd } from '@/lib/jsonld';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDisease(slug);
  if (!d) return redirectIfMoved(`/benh-cay/${slug}`).then(() => ({ title: 'Không tìm thấy bài bệnh' }));
  return withSeo(withShare(
    { title: d.name, description: clipText(d.summary || `${d.name}: dấu hiệu nhận biết, nguyên nhân, cách xử lý và phòng bệnh.`, 170), alternates: { canonical: `/benh-cay/${d.slug}` } },
    // Ảnh chia sẻ = ảnh triệu chứng (theo thứ tự trong bài); bài chưa có ảnh dùng ảnh mặc định.
    { images: d.symptoms.map((s) => (s.image ? diseaseImageUrl(s.image, d.slug) : null)), alt: d.name },
  ));
}

/** Tên ngắn cho câu hỏi: "Thối rễ (úng rễ do nấm)" → "thối rễ". */
const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '').toLowerCase();

export default async function DiseaseDetailPage({ params }: Props) {
  const { slug } = await params;
  const d = await getDisease(slug);
  if (!d) return movedOrNotFound(`/benh-cay/${slug}`);
  const all = await allDiseases();
  const live = new Set(all.map((x) => x.slug));
  const cause = causeOf(d.cause);
  // Giữ đúng thứ tự admin đã chọn; sản phẩm ẩn/ngừng bán tự bị bỏ qua.
  const [found, posts] = await Promise.all([getProducts(d.products), postsForDisease(d.slug)]);
  const products = d.products.map((s) => found.find((p) => p.slug === s)).filter((p) => p !== undefined);
  const related = all
    .filter((x) => x.slug !== d.slug && (x.cause === d.cause || x.parts.some((p) => d.parts.includes(p))))
    .sort((a, b) => Number(b.cause === d.cause) - Number(a.cause === d.cause))
    .slice(0, 8);

  const sec = (n: number, id: string, title: string) => (
    <h2 className="ddp-h" id={id}><span>{n}</span>{title}</h2>
  );
  let n = 0;
  return (
    <div className="ddp">
      <JsonLd data={diseaseLd({ ...d, images: d.symptoms.flatMap((s) => (s.image ? [diseaseImageUrl(s.image, d.slug)] : [])) })} />
      <Breadcrumb items={[
        { label: 'Góc chăm cây', href: '/goc-cham-cay' },
        { label: 'Bệnh cây trồng', href: '/benh-cay' },
        { label: shortName(d.name).replace(/^./, (c) => c.toUpperCase()) },
      ]} />

      <header className="ddp-hero">
        <span className="ddp-tags">
          {cause && <Link href={`/benh-cay?nguyen_nhan=${cause.key}#danh-sach`} className="vx-badge vx-badge--info">{cause.name}</Link>}
          <span className="vx-badge vx-badge--info">{d.parts.map(partName).join(', ')}</span>
        </span>
        <h1>{d.name}</h1>
        <p className="ddp-sum">{d.summary}</p>
        <dl className="ddp-facts">
          <div>
            <dt>Mức nguy hiểm</dt>
            <dd>{SEVERITY[d.severity]}
              <span className="dd-sev" aria-label={`${d.severity}/5`}>
                {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= d.severity ? 'on' : undefined} />)}
              </span>
            </dd>
          </div>
          <div><dt>Lây lan</dt><dd>{d.spread || '—'}</dd></div>
          <div><dt>Hay gặp ở</dt><dd>{d.plants.length ? d.plants.map(plantName).join(', ') : 'Nhiều loại cây'}</dd></div>
          <div><dt>Mùa</dt><dd>{d.season || 'Quanh năm'}</dd></div>
        </dl>
      </header>

      <div className="ddp-body">
        <article className="ddp-main">
          <section className="ddp-card">
            {sec(++n, 'trieu-chung', 'Triệu chứng')}
            <div className="dd-sym">
              {d.symptoms.map((s, i) => (
                <div key={i}>
                  <span className={s.image ? 'img img--photo' : 'img'}>
                    {s.image ? <img {...responsive(diseaseImageUrl(s.image, d.slug), '(max-width: 47.9375em) 100vw, 280px', 960)} alt={s.text} width={1000} height={750} loading={i === 0 ? undefined : 'lazy'} /> : <PartIcon part={s.part} plain />}
                    <em>{partName(s.part)}</em>
                  </span>
                  {s.text}
                </div>
              ))}
            </div>
            {d.confusions.length > 0 && (
              <div className="ddp-cmp">
                {d.confusions.map((c, i) => (
                  <div key={i}>
                    <b>Dễ nhầm với: {c.name}</b>
                    <p>{c.text}</p>
                    {c.slug && live.has(c.slug) && <Link href={`/benh-cay/${c.slug}`}>Xem bài {c.name} →</Link>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ddp-card">
            {sec(++n, 'cach-xu-ly', 'Cách xử lý')}
            <ol className="ddp-steps">
              {d.steps.map((s, i) => (
                <li key={i}><b>{s.title}</b>{s.detail && <small>{s.detail}</small>}</li>
              ))}
            </ol>
            {d.safety && (
              <div className="vx-note">
                <Icon name="alert" />
                <div><b>Lưu ý an toàn:</b> {d.safety}</div>
              </div>
            )}
          </section>

          {d.prevention.length > 0 && (
            <section className="ddp-card">
              {sec(++n, 'phong-benh', 'Phòng bệnh')}
              <ul className="ddp-prev">{d.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </section>
          )}

          {posts.length > 0 && (
            <section className="ddp-card">
              <h2 className="ddp-h2">Bài viết Góc chăm cây về bệnh này</h2>
              <div className="ddp-links">
                {posts.slice(0, 8).map((p) => (
                  <Link key={p.id} href={postPath(p)}>{p.title}<small>{p.kind === 'video' ? 'Video' : categoryOf(p.category)?.name}</small></Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="ddp-side">
          <div className="ar-cta">
            <b>Chưa chắc cây bị {shortName(d.name)}?</b>
            <span>Cây mua tại vườn dưới 7 ngày: gửi ảnh để kỹ sư xem và bảo hành.</span>
            <Link href="/tai-khoan/bao-hanh" className="vx-btn">Gửi ảnh bảo hành</Link>
            <Link href="/he-thong-cua-hang" className="app-cta-alt">Hoặc mang mẫu lá đến cửa hàng</Link>
          </div>
          {related.length > 0 && (
            <section className="ddp-card ddp-rel">
              <h2 className="ddp-h2">Bệnh liên quan</h2>
              <div className="ddp-links">
                {related.map((x) => (
                  <Link key={x.slug} href={`/benh-cay/${x.slug}`}>{x.name}<small>{causeOf(x.cause)?.name}</small></Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {products.length > 0 && (
        <section>
          <SectionHeader icon="flask" title={`Sản phẩm xử lý ${shortName(d.name)}`} />
          <ProductGrid products={products} />
        </section>
      )}
    </div>
  );
}
