import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PolicyNav } from '@/components/PolicyNav';
import { getPolicy, policies } from '@/lib/policies';
import { PolicyView } from '@/views/PolicyView';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getPolicy((await params).slug)?.title ?? 'Không tìm thấy' };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** PolicyLayout: trang Giới thiệu dùng nguyên bài của design system, các trang khác dựng từ lib/policies. */
export default async function Page({ params }: Props) {
  const p = getPolicy((await params).slug);
  if (!p) notFound();
  if (p.slug === 'gioi-thieu') return <PolicyView />;

  return (
    <>
      <div style={{ padding: '12px 24px 0', background: 'var(--surface)' }}>
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<Link href="/chinh-sach/gioi-thieu">Về Cây Cảnh Miền Tây</Link>/<span>{p.title}</span>
        </div>
      </div>
      <div className="vx-policypage">
        <PolicyNav />
        <article className="vx-policy">
          <h1>{p.title}</h1>
          <div className="vx-policy__meta"><span>Cập nhật 26/09/2026</span></div>
          {p.body?.map((s, i) => (
            <section key={s.h} style={{ display: 'contents' }}>
              <h2>{ROMAN[i]}. {s.h}</h2>
              {s.p.map((t) => <p key={t}>{t}</p>)}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
