import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectForm, type ProjectFormValue } from '@/components/admin/ProjectForm';
import { hasAccess } from '@/lib/permissions';
import { isProjectType } from '@/lib/projects';
import { requireAccess } from '@/server/auth';
import { getProjectAdmin } from '@/server/projects';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id === 'moi' ? 'Thêm dự án' : 'Sửa dự án' };
}

const EMPTY: ProjectFormValue = {
  title: '', type: 'van-phong', roles: ['cung-cap'], client: '', clientLogo: null, location: '', year: new Date().getFullYear(), duration: '',
  summary: '', body: '', scope: [''], plants: [], metrics: [], quote: null, images: [], featured: false, published: false,
};

/** /admin/du-an/moi để thêm, /admin/du-an/<id> để sửa. */
export default async function AdminProjectPage({ params }: Props) {
  const me = await requireAccess('content');
  const { id } = await params;
  let initial = EMPTY;
  if (id !== 'moi') {
    const n = Number(id);
    const r = Number.isInteger(n) && n > 0 ? await getProjectAdmin(n) : undefined;
    if (!r) notFound();
    const { updatedAt: _u, createdAt: _c, updatedBy: _b, ...rest } = r;
    initial = { ...rest, type: isProjectType(rest.type) ? rest.type : 'van-phong' };
  }
  return <ProjectForm key={id} initial={initial} canEdit={hasAccess(me, 'content', 'full')} />;
}
