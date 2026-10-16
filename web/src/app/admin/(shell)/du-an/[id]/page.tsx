import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ProjectForm, type ProjectFormValue } from '@/components/admin/ProjectForm';
import { hasAccess } from '@/lib/permissions';
import { isProjectType, projectImageUrl, projectPath, projectTypeOf } from '@/lib/projects';
import { SeoPanel } from '@/components/admin/SeoPanel';
import { seoPanelState } from '@/server/seo-cms';
import { requireAccess } from '@/server/auth';
import { getProjectAdmin } from '@/server/projects';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id === 'moi' ? 'Thêm dự án' : 'Sửa dự án' };
}

const EMPTY: ProjectFormValue = {
  title: '', type: 'van-phong', roles: ['cung-cap'], client: '', clientLogo: null, location: '', year: null, duration: '',
  summary: '', body: '', scope: [''], plants: [], metrics: [], quote: null, images: [], featured: false, published: false,
};

/** /admin/du-an/moi để thêm, /admin/du-an/<id> để sửa. */
export default async function AdminProjectPage({ params }: Props) {
  const me = await requireAccess('content');
  const { id } = await params;
  let initial = EMPTY;
  let seo: ReactNode = null;
  if (id !== 'moi') {
    const n = Number(id);
    const r = Number.isInteger(n) && n > 0 ? await getProjectAdmin(n) : undefined;
    if (!r) notFound();
    const { updatedAt: _u, createdAt: _c, updatedBy: _b, ...rest } = r;
    initial = { ...rest, type: isProjectType(rest.type) ? rest.type : 'van-phong' };
    const path = projectPath(r.slug);
    const st = await seoPanelState(path);
    seo = (
      <SeoPanel
        path={path} initial={st.initial} history={st.history} live={st.live} fields={['title', 'description', 'image']}
        canEdit={hasAccess(me, 'content', 'full')} isAdmin={me.role === 'admin'}
        auto={{ title: `${r.title} — Dự án cây xanh | Cây Cảnh Miền Tây`, description: r.summary || `${r.title}: ${projectTypeOf(r.type).name.toLowerCase()} do Cây Cảnh Miền Tây cung cấp cây…` }}
        images={r.images.map((im, i) => ({ url: projectImageUrl(im.file), label: im.caption || `Ảnh ${i + 1}` }))}
        slug={{ kind: 'project', id: r.id, value: r.slug, prefix: '/doi-tac/cong-trinh', wasPublic: r.published }}
      />
    );
  }
  return (
    <>
      <ProjectForm key={id} initial={initial} canEdit={hasAccess(me, 'content', 'full')} />
      {seo && <div className="ad-body">{seo}</div>}
    </>
  );
}
