import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Blocks';
import { Icon } from '@/components/Icon';
import { ShareButton } from '@/components/PostClient';
import { ProjectGallery } from '@/components/ProjectGallery';
import { ProjectCard } from '@/components/ProjectParts';
import { QUOTE_URL, ServiceCta } from '@/components/ServiceParts';
import { CARE_PHONE, formatPhone, ZALO_URL } from '@/lib/contact';
import { paragraphs, projectImageUrl, projectPath, projectTypeOf, roleName } from '@/lib/projects';
import { getCurrentUser } from '@/server/auth';
import { getProject, publishedProjects } from '@/server/projects';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ 'xem-truoc'?: string }> };

/** Dự án theo slug; `?xem-truoc=1` cho nhân viên xem cả dự án đang ẩn (nút Xem trước trong admin). */
async function load({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const me = sp['xem-truoc'] === '1' ? await getCurrentUser() : null;
  const preview = me?.role === 'staff' || me?.role === 'admin';
  return { p: await getProject(slug, preview), preview };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { p } = await load(props);
  if (!p) return { title: 'Không tìm thấy dự án' };
  const cover = p.images[0];
  return {
    title: `${p.title} — Dự án cây xanh`,
    description: p.summary.slice(0, 300),
    alternates: { canonical: projectPath(p.slug) },
    openGraph: { title: p.title, description: p.summary.slice(0, 300), images: cover ? [projectImageUrl(cover.file)] : undefined },
    robots: p.published ? undefined : { index: false },
  };
}

export default async function ProjectPage(props: Props) {
  const { p } = await load(props);
  if (!p) notFound();
  const all = await publishedProjects();
  // Dự án khác: cùng loại công trình trước.
  const others = all.filter((x) => x.id !== p.id).sort((a, b) => Number(b.type === p.type) - Number(a.type === p.type)).slice(0, 3);
  const facts: [string, string][] = [
    ['Khách hàng', p.client],
    ['Địa điểm', p.location],
    ['Năm thực hiện', String(p.year)],
    ['Thời gian', p.duration],
    ['Loại công trình', projectTypeOf(p.type).name],
  ].filter((f): f is [string, string] => !!f[1]);
  const hasMain = !!(p.body || p.scope.length || p.quote);

  return (
    <div className="dn-page">
      <div className="dn-crumb">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khách doanh nghiệp', href: '/doanh-nghiep' }, { label: 'Dự án', href: '/doanh-nghiep#du-an' }, { label: p.title }]} />
      </div>
      {!p.published && (
        <div className="dn-wrap"><div className="vx-callout"><Icon name="alert" /><div><b>Bản xem trước</b> — dự án đang ẩn, khách chưa thấy trang này.</div></div></div>
      )}

      <header className="dn-phead dn-wrap">
        <span className="vx-badge vx-badge--sun">{projectTypeOf(p.type).name}</span>
        <h1>{p.title}</h1>
        <p className="dn-phead__lead">{p.summary}</p>
        <div className="dn-phead__roles">
          {p.roles.map((r) => <span key={r}><Icon name="check" size={14} />{roleName(r)}</span>)}
          <ShareButton title={p.title} />
        </div>
      </header>

      <div className="dn-wrap dn-ptop">
        <ProjectGallery images={p.images} title={p.title} />
        <aside className="dn-pinfo">
          <dl>
            {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {p.metrics.length > 0 && (
            <div className="dn-nums">
              {p.metrics.map((m) => <div key={m.label}><b>{m.value}</b><span>{m.label}</span></div>)}
            </div>
          )}
          <div className="dn-pcta">
            <b>Bạn có dự án tương tự?</b>
            <span>Kỹ sư khảo sát miễn phí, gọi lại trong 2 giờ làm việc.</span>
            <Link href={QUOTE_URL} className="vx-btn vx-btn--primary">Yêu cầu báo giá</Link>
            <span className="dn-pcta__alt">
              <a href={`tel:${CARE_PHONE}`}><Icon name="phone" size={14} />{formatPhone(CARE_PHONE)}</a>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={14} />Nhắn Zalo</a>
            </span>
          </div>
        </aside>
      </div>

      {hasMain || p.plants.length > 0 ? <div className={hasMain && p.plants.length ? 'dn-wrap dn-pbody' : 'dn-wrap dn-pbody dn-pbody--solo'}>
        {hasMain && <div className="dn-pmain">
          {p.body && (
            <section>
              <h2>Về dự án</h2>
              {paragraphs(p.body).map((t, k) => <p key={k}>{t}</p>)}
            </section>
          )}
          {p.scope.length > 0 && (
            <section>
              <h2>Hạng mục đã thực hiện</h2>
              <ul className="sv-check">{p.scope.map((s) => <li key={s}><Icon name="check" />{s}</li>)}</ul>
            </section>
          )}
          {p.quote && (
            <figure className="dn-quote dn-quote--big">
              <blockquote>“{p.quote.quote}”</blockquote>
              <figcaption><b>{p.quote.name}</b>{p.quote.title && <span>{p.quote.title}</span>}</figcaption>
            </figure>
          )}
        </div>}
        {p.plants.length > 0 && (
          <aside className="dn-pplants">
            <h2>Các loại cây đã cung cấp</h2>
            <div className="dn-tags">
              {p.plants.map((t) => <Link key={t} href={`/tim-kiem?q=${encodeURIComponent(t)}`} title={`Tìm “${t}” trong cửa hàng`}>{t}</Link>)}
            </div>
            <small>Bấm tên cây để xem cây đang bán trên website.</small>
          </aside>
        )}
      </div> : null}

      {others.length > 0 && (
        <section className="dn-sec">
          <header className="dn-head"><h2>Dự án khác</h2></header>
          <div className="dn-grid">{others.map((x) => <ProjectCard key={x.id} p={x} />)}</div>
          <Link href="/doanh-nghiep#du-an" className="vx-btn vx-btn--outline dn-more">Xem tất cả dự án</Link>
        </section>
      )}

      <ServiceCta
        title="Cần cây xanh cho công trình của bạn?"
        text="Gửi yêu cầu, kỹ sư gọi lại trong 2 giờ làm việc để xác nhận nhu cầu"
        label="Yêu cầu báo giá"
        href={QUOTE_URL}
      />
    </div>
  );
}
