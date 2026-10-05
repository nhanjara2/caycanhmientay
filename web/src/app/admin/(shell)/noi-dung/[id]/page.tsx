import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostEditor, type EditorPost } from '@/components/admin/PostEditor';
import { isCategory } from '@/lib/posts';
import { requireStaff } from '@/server/auth';
import { listDiseasesAdmin } from '@/server/diseases';
import { getPostAdmin, peopleSuggestions } from '@/server/posts';
import { listProductsAdmin } from '@/server/products-admin';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ loai?: string; chuyen_muc?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id === 'moi' ? 'Viết bài mới' : 'Sửa bài viết' };
}

/** /admin/noi-dung/moi (?loai=video) để viết bài / thêm video, /admin/noi-dung/<id> để sửa. */
export default async function AdminPostPage({ params, searchParams }: Props) {
  const me = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;

  let initial: EditorPost;
  let stats: { views: number; helpfulYes: number; helpfulNo: number } | undefined;
  if (id === 'moi') {
    initial = {
      slug: '', status: 'draft', publishedAt: null, kind: sp.loai === 'video' ? 'video' : 'article',
      category: isCategory(sp.chuyen_muc) ? sp.chuyen_muc : 'cham-soc', title: '', excerpt: '', body: [],
      coverFile: null, youtubeId: null, videoVertical: false, videoSeconds: null, authorName: me.name ?? '',
      reviewerName: '', reviewerTitle: '', diseases: [], tags: [], seoDescription: '', featured: false,
    };
  } else {
    if (!/^\d{1,9}$/.test(id)) notFound();
    const p = await getPostAdmin(Number(id));
    if (!p) notFound();
    initial = {
      id: p.id, slug: p.slug, status: p.status, publishedAt: p.publishedAt?.toISOString() ?? null, updatedAt: p.updatedAt.toISOString(),
      updatedBy: p.updatedBy, kind: p.kind, category: p.category, title: p.title, excerpt: p.excerpt, body: p.body,
      coverFile: p.coverFile, youtubeId: p.youtubeId, videoVertical: p.videoVertical, videoSeconds: p.videoSeconds,
      authorName: p.authorName, reviewerName: p.reviewerName, reviewerTitle: p.reviewerTitle, diseases: p.diseases, tags: p.tags,
      seoDescription: p.seoDescription, featured: p.featured,
    };
    stats = { views: p.views, helpfulYes: p.helpfulYes, helpfulNo: p.helpfulNo };
  }

  const [products, diseases, people] = await Promise.all([listProductsAdmin(), listDiseasesAdmin(), peopleSuggestions()]);
  return (
    <PostEditor
      key={`${id}-${initial.kind}`}
      initial={initial}
      role={me.role === 'admin' ? 'admin' : 'staff'}
      stats={stats}
      people={people}
      products={products.map((p) => ({
        slug: p.slug, name: p.name, sku: p.sku, price: p.minPrice ?? null, image: p.image,
        icon: p.icon, active: p.active, pesticide: p.pesticide,
      }))}
      diseases={diseases.filter((d) => d.active).map((d) => ({ slug: d.slug, name: d.name }))}
    />
  );
}
