import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb, SectionHeader } from '@/components/Blocks';
import { PartIcon } from '@/components/DiseaseArt';
import { ProductGrid } from '@/components/ProductCard';
import { SEVERITY, causeOf, diseaseImageUrl, partName, plantName } from '@/lib/diseases';
import { getProducts } from '@/server/catalog';
import { allDiseases, getDisease } from '@/server/diseases';
import { categoryOf, postPath } from '@/lib/posts';
import { postsForDisease } from '@/server/posts';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDisease((await params).slug);
  return d ? { title: d.name, description: d.summary } : { title: 'Không tìm thấy bài bệnh' };
}

/** Tên ngắn cho câu hỏi: "Thối rễ (úng rễ do nấm)" → "thối rễ". */
const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '').toLowerCase();

export default async function DiseaseDetailPage({ params }: Props) {
  const d = await getDisease((await params).slug);
  if (!d) notFound();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 24px 32px', background: 'var(--surface)' }}>
      <div className="dd-hero">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Breadcrumb items={[
            { label: 'Bệnh cây trồng', href: '/benh-cay' },
            { label: partName(d.parts[0]), href: `/benh-cay?bo_phan=${d.parts[0]}#danh-sach` },
            { label: shortName(d.name).replace(/^./, (c) => c.toUpperCase()) },
          ]} />
          <h1>{d.name}</h1>
          <span className="ad-tags">
            {cause && <Link href={`/benh-cay?nguyen_nhan=${cause.key}#danh-sach`} className="vx-badge vx-badge--info">{cause.name}</Link>}
            <span className="vx-badge vx-badge--info">{d.parts.map(partName).join(', ')}</span>
            {d.season && <span className="vx-badge vx-badge--info">{d.season}</span>}
          </span>
          <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 15, lineHeight: '24px' }}>{d.summary}</p>
          <div className="dd-facts">
            <div>
              Mức nguy hiểm<b>{SEVERITY[d.severity]}</b>
              <span className="dd-sev" aria-label={`${d.severity}/5`}>
                {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= d.severity ? 'on' : undefined} />)}
              </span>
            </div>
            <div>Lây lan<b>{d.spread || '—'}</b></div>
            <div>Hay gặp ở<b>{d.plants.length ? d.plants.map(plantName).join(', ') : 'Nhiều loại cây'}</b></div>
            <div>Mùa<b>{d.season || 'Quanh năm'}</b></div>
          </div>
        </div>
        <div className="ar-cta">
          <b>Chưa chắc cây bị {shortName(d.name)}?</b>
          <span>So sánh với các bệnh dễ nhầm bên dưới. Cây mua tại vườn dưới 7 ngày: gửi ảnh để kỹ sư xem và bảo hành.</span>
          <Link href="/tai-khoan/bao-hanh" className="vx-btn">Gửi ảnh bảo hành</Link>
          <Link href="/he-thong-cua-hang" className="app-cta-alt">Hoặc mang mẫu lá đến cửa hàng gần bạn</Link>
        </div>
      </div>

      <h2 style={{ margin: '8px 0 0', fontSize: 20 }}>Triệu chứng</h2>
      <div className="dd-sym">
        {d.symptoms.map((s, i) => (
          <div key={i}>
            <span className={s.image ? 'img img--photo' : 'img'}>
              {s.image ? <img src={diseaseImageUrl(s.image)} alt={s.text} loading="lazy" /> : <PartIcon part={s.part} plain />}
              <em>{partName(s.part)}</em>
            </span>
            {s.text}
          </div>
        ))}
      </div>
      {d.confusions.length > 0 && (
        <div className="dd-cmp">
          {d.confusions.map((c, i) => (
            <div key={i}>
              <b>Dễ nhầm với: {c.name}</b>
              {c.text}
              {c.slug && live.has(c.slug) && <> <Link href={`/benh-cay/${c.slug}`}>Xem bài →</Link></>}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ margin: '8px 0 0', fontSize: 20 }}>Cách xử lý</h2>
      <div className="dd-steps">
        {d.steps.map((s, i) => (
          <div key={i} className="dd-step">
            <b className="n">{i + 1}</b>
            <span><b>{s.title}</b>{s.detail && <small>{s.detail}</small>}</span>
          </div>
        ))}
      </div>
      {d.safety && (
        <div className="vx-note">
          <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></svg>
          <div><b>Lưu ý an toàn:</b> {d.safety}</div>
        </div>
      )}

      {d.prevention.length > 0 && (
        <>
          <h2 style={{ margin: '8px 0 0', fontSize: 20 }}>Phòng bệnh</h2>
          <ul className="dd-prev">{d.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </>
      )}

      {products.length > 0 && (
        <section>
          <SectionHeader icon="flask" title={`Sản phẩm xử lý ${shortName(d.name)}`} />
          <ProductGrid products={products} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="vx-dpanel">
          <div className="vx-dpanel__head"><b>Bài viết Góc chăm cây về bệnh này</b></div>
          <div className="vx-dlist">
            {posts.slice(0, 8).map((p) => (
              <Link key={p.id} href={postPath(p)}>{p.title}<small>{p.kind === 'video' ? 'Video' : categoryOf(p.category)?.name}</small></Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="vx-dpanel">
          <div className="vx-dpanel__head"><b>Bệnh liên quan</b></div>
          <div className="vx-dlist">
            {related.map((x) => (
              <Link key={x.slug} href={`/benh-cay/${x.slug}`}>{x.name}<small>{causeOf(x.cause)?.name}</small></Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
