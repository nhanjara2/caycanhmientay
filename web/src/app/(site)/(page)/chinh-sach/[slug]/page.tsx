import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PolicyNav } from '@/components/PolicyNav';
import { getPolicy, policies } from '@/lib/policies';
import { SEED_DISEASE_IMAGES } from '@/lib/seed-disease-images';
import { seedDiseases } from '@/lib/seed-diseases';
import { PolicyView } from '@/views/PolicyView';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getPolicy((await params).slug)?.title ?? 'Không tìm thấy' };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** Trang "Nguồn ảnh minh họa": thêm mục ghi công ảnh triệu chứng bệnh cây (lib/seed-disease-images.ts). */
function diseaseCredits() {
  const names = new Map(seedDiseases.map((d) => [d.slug, d.name]));
  return {
    id: 'anh-benh-cay',
    h: 'Ảnh triệu chứng bệnh cây',
    p: [
      'Ảnh minh họa triệu chứng trong Thư viện bệnh cây lấy từ Wikimedia Commons theo giấy phép mở, chụp trên nhiều loại cây khác nhau. Ảnh đã được cắt khung 4:3 và thu nhỏ; giấy phép CC BY-SA áp dụng cho bản đã chỉnh sửa.',
      ...SEED_DISEASE_IMAGES.map((x) => `${names.get(x.disease) ?? x.disease} — ${x.symptom}: ảnh của ${x.author}, ${x.license}, nguồn ${x.url}`),
    ],
  };
}

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
          {(p.slug === 'nguon-anh' ? [...(p.body ?? []), diseaseCredits()] : p.body)?.map((s: { id?: string; h: string; p: string[] }, i) => (
            <section key={s.h} style={{ display: 'contents' }}>
              <h2 id={s.id}>{ROMAN[i]}. {s.h}</h2>
              {s.p.map((t) => <p key={t}>{t}</p>)}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
