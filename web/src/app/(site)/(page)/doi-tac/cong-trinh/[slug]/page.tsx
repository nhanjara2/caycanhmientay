import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Blocks';
import { Icon } from '@/components/Icon';
import { ShareButton } from '@/components/PostClient';
import { ProjectGallery } from '@/components/ProjectGallery';
import { ProjectCard } from '@/components/ProjectParts';
import { ServiceCta } from '@/components/LandingParts';
import { formatPhone, SALES_PHONE, ZALO_URL } from '@/lib/contact';
import { clipText } from '@/lib/format';
import { WHOLESALE_QUOTE_URL, WHOLESALE_URL } from '@/lib/partners';
import { hasProjectDetail, paragraphs, projectImageUrl, projectPath, projectTypeOf, roleName } from '@/lib/projects';
import { getCurrentUser } from '@/server/auth';
import { getProject, publishedProjects } from '@/server/projects';
import { withShare } from '@/lib/seo';
import { movedOrNotFound, redirectIfMoved, withSeo } from '@/server/seo-cms';
import { contentRobots, contentState } from '@/lib/seo-rules';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ 'xem-truoc'?: string }> };

/** Dự án theo slug; `?xem-truoc=1` cho nhân viên xem cả dự án đang ẩn (nút Xem trước trong admin). */
async function load({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const me = sp['xem-truoc'] === '1' ? await getCurrentUser() : null;
  const preview = me?.role === 'staff' || me?.role === 'admin';
  return { p: await getProject(slug, preview), preview, path: projectPath(slug) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { p, path } = await load(props);
  if (!p) return redirectIfMoved(path).then(() => ({ title: 'Không tìm thấy dự án' }));
  // Chưa viết tóm tắt thì ghép từ loại công trình, địa điểm, năm, cây đã cung cấp.
  const description = clipText(p.summary || [
    `${p.title}: ${projectTypeOf(p.type).name.toLowerCase()} do Cây Cảnh Miền Tây cung cấp cây`,
    p.location && `tại ${p.location}`, p.year && `năm ${p.year}`, p.plants.length && `gồm ${p.plants.slice(0, 5).join(', ')}`,
  ].filter(Boolean).join(', ') + '.', 170);
  return withSeo(withShare({
    title: `${p.title} — Dự án cây xanh`,
    description,
    alternates: { canonical: projectPath(p.slug) },
    // Ẩn (xem trước) → noindex; dự án chỉ có tên (chưa ảnh / mô tả…) là trang mỏng, trang Đối tác không link tới → noindex tới khi có nội dung.
    robots: contentRobots(contentState({ visible: p.published, hasDetail: hasProjectDetail(p) })),
  }, { images: p.images.map((i) => projectImageUrl(i.file, p.slug)), alt: p.title }));
}

export default async function ProjectPage(props: Props) {
  const { p, path } = await load(props);
  if (!p) return movedOrNotFound(path);
  const all = await publishedProjects();
  // Dự án khác: cùng loại công trình trước.
  const others = all.filter((x) => x.id !== p.id && x.images.length).sort((a, b) => Number(b.type === p.type) - Number(a.type === p.type)).slice(0, 3);
  const facts: [string, string][] = [
    ['Khách hàng', p.client],
    ['Địa điểm', p.location],
    ['Năm thực hiện', p.year ? String(p.year) : ''],
    ['Thời gian', p.duration],
    ['Loại công trình', projectTypeOf(p.type).name],
  ].filter((f): f is [string, string] => !!f[1]);
  const hasMain = !!(p.body || p.scope.length || p.quote);

  return (
    <div className="dn-page">
      <div className="dn-crumb">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Đối tác sỉ', href: WHOLESALE_URL }, { label: p.title }]} />
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

      <div className={p.images.length ? 'dn-wrap dn-ptop' : 'dn-wrap dn-ptop dn-ptop--noimg'}>
        <ProjectGallery images={p.images} title={p.title} slug={p.slug} />
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
            <b>Cần cây cho công trình tương tự?</b>
            <span>Gửi danh sách hoặc bảng khối lượng, shop báo giá sỉ qua Zalo.</span>
            <Link href={`${WHOLESALE_QUOTE_URL}?loai=project`} className="vx-btn vx-btn--primary">Yêu cầu báo giá sỉ</Link>
            <span className="dn-pcta__alt">
              <a href={`tel:${SALES_PHONE}`}><Icon name="phone" size={14} />{formatPhone(SALES_PHONE)}</a>
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
          </aside>
        )}
      </div> : null}

      {others.length > 0 && (
        <section className="dn-sec">
          <header className="dn-head"><h2>Dự án khác</h2></header>
          <div className="dn-grid">{others.map((x) => <ProjectCard key={x.id} p={x} />)}</div>
          <Link href={`${WHOLESALE_URL}#cong-trinh`} className="vx-btn vx-btn--outline dn-more">Xem tất cả công trình</Link>
        </section>
      )}

      <ServiceCta
        title="Cần cây xanh cho công trình của bạn?"
        text="Gửi danh sách cây, quy cách, số lượng hoặc ảnh bảng khối lượng để nhận báo giá sỉ"
        label="Yêu cầu báo giá sỉ"
        href={`${WHOLESALE_QUOTE_URL}?loai=project`}
      />
    </div>
  );
}
