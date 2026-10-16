import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Blocks';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CauseIcon, PartIcon, PlantMap } from '@/components/DiseaseArt';
import { Icon } from '@/components/Icon';
import { CAUSES, PARTS, PLANTS, causeOf, isCause, isPart, isPlant, diseaseScore, partName, type CauseKey, type PartKey, type PlantKey } from '@/lib/diseases';
import { pageSuffix } from '@/lib/posts';
import { allDiseases } from '@/server/diseases';
import { withShare } from '@/lib/seo';
import { Pager } from '@/components/Pager';
import { one, pageOf, redirectIfNotCanonical, type SearchParams } from '@/lib/url-params';

const PER_PAGE = 20;

type Filters = { bo_phan?: string; nguyen_nhan?: string; cay?: string; q?: string; trang?: string };
type Props = { searchParams: Promise<SearchParams> };

/** Bộ lọc hợp lệ đang chọn (giá trị lạ bị bỏ; ô tìm gộp khoảng trắng, tối đa 80 ký tự). */
function filtersOf(sp: SearchParams): { bo_phan?: PartKey; nguyen_nhan?: CauseKey; cay?: PlantKey; q?: string } {
  const part = one(sp.bo_phan), cause = one(sp.nguyen_nhan), plant = one(sp.cay);
  return {
    bo_phan: isPart(part) ? part : undefined,
    nguyen_nhan: isCause(cause) ? cause : undefined,
    cay: isPlant(plant) ? plant : undefined,
    q: one(sp.q)?.replace(/\s+/g, ' ').trim().slice(0, 80).trim() || undefined,
  };
}

/** SEO: trang danh sách (kể cả ?trang=n) là trang chuẩn; đang lọc / tìm thì noindex, canonical về /benh-cay. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.values(filtersOf(sp)).some(Boolean);
  const page = filtered ? 1 : pageOf(sp.trang);
  const nth = pageSuffix(page);
  return withShare({
    title: `Tìm hiểu bệnh cây trồng${nth}`,
    description: `Tra cứu bệnh cây theo bộ phận bị bệnh, nguyên nhân hoặc triệu chứng: nhận biết, cách xử lý và phòng bệnh.${nth ? pageSuffix(page, ' ') + '.' : ''}`,
    alternates: { canonical: page > 1 ? `/benh-cay?trang=${page}` : '/benh-cay' },
    robots: filtered ? { index: false, follow: true } : undefined,
  });
}

/** Link giữ các bộ lọc đang chọn, đổi những gì truyền vào (undefined = bỏ lọc đó), về trang 1. */
function hrefWith(cur: Filters, patch: Filters, hash = '#danh-sach') {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...cur, trang: undefined, ...patch })) if (v) q.set(k, v);
  const s = q.toString();
  return `/benh-cay${s ? `?${s}` : ''}${hash}`;
}

/** Link bộ lọc: tổ hợp từ 2 điều kiện trở lên (hoặc kèm từ khóa tìm) dẫn tới trang noindex → nofollow, để Google không bò
 *  hết mọi tổ hợp bộ phận × nguyên nhân × loại cây; trang một bộ lọc vẫn cho lần theo (follow) tới các bài bệnh. */
function filterLink(cur: Filters, patch: Filters) {
  const next = { ...cur, ...patch };
  const n = [next.bo_phan, next.nguyen_nhan, next.cay].filter(Boolean).length;
  return { href: hrefWith(cur, patch), rel: n >= 2 || next.q ? 'nofollow' : undefined };
}

export default async function DiseaseLibraryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cur = filtersOf(sp);
  const { bo_phan: part, nguyen_nhan: cause, cay: plant, q } = cur;
  // Mỗi tổ hợp một URL: giá trị lạ, ô rỗng, thứ tự khác, tham số thừa, ?trang=1 / 0 / abc → chuyển hẳn (308) về dạng chuẩn.
  const asked = pageOf(sp.trang);
  redirectIfNotCanonical('/benh-cay', sp, [['bo_phan', part], ['nguyen_nhan', cause], ['cay', plant], ['q', q], ['trang', asked > 1 ? asked : undefined]]);

  const all = await allDiseases();
  const list = all
    .map((d) => ({ d, score: q ? diseaseScore(d, q) : 1 }))
    .filter(({ d, score }) => score > 0 && (!part || d.parts.includes(part)) && (!cause || d.cause === cause) && (!plant || d.plants.includes(plant)))
    .sort((a, b) => b.score - a.score) // sort ổn định: cùng điểm giữ thứ tự theo tên
    .map(({ d }) => d);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  // Quá số trang → trang cuối (307: số trang đổi theo số bài).
  if (asked > pages) redirect(hrefWith(cur, { trang: pages > 1 ? String(pages) : undefined }, ''));
  const page = asked;
  const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const title = [
    q && `Kết quả cho “${q}”`,
    part && `Bệnh trên ${partName(part)}`,
    cause && causeOf(cause)?.name,
  ].filter(Boolean).join(' · ') || 'Tất cả bệnh';

  return (
    <div className="vx-dlib">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Góc chăm cây', href: '/goc-cham-cay' }, { label: 'Bệnh cây trồng' }]} />
      <h1>Tìm hiểu bệnh cây trồng</h1>
      <div className="vx-dlib__sub">
        Tra cứu theo bộ phận bị bệnh hoặc theo nguyên nhân. Cây mua tại vườn dưới 7 ngày có dấu hiệu lạ?{' '}
        <Link href="/tai-khoan/bao-hanh" className="vx-link" style={{ display: 'inline' }}>Gửi yêu cầu bảo hành</Link>
      </div>

      <form action="/benh-cay" role="search" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <label className="vx-search" style={{ border: '1px solid var(--border)' }}>
          <input name="q" defaultValue={q} maxLength={80} placeholder="Nhập triệu chứng, ví dụ: lá vàng mép, đốm nâu…" aria-label="Tìm bệnh theo triệu chứng" />
          <button className="vx-btn vx-btn--primary" aria-label="Tìm">
            <Icon name="search" />
          </button>
        </label>
      </form>

      <h2 className="vx-dsec"><PartIcon part="la" />Bộ phận của cây</h2>
      <section className="vx-pmap">
        <div className="vx-pmap__art">
          <PlantMap active={part} />
          <small>*Hình minh họa mang tính tham khảo.</small>
        </div>
        <div className="vx-parts">
          {PARTS.map((p) => (
            <Link key={p.key} {...filterLink(cur, { bo_phan: part === p.key ? undefined : p.key })} className="vx-part" aria-current={part === p.key ? 'true' : undefined} scroll={false}>
              <span><PartIcon part={p.key} /></span>
              <span style={{ all: 'unset' }}>{p.name}<small>{all.filter((d) => d.parts.includes(p.key)).length} bệnh</small></span>
            </Link>
          ))}
        </div>
        <div className="vx-dpanel" id="danh-sach">
          <div className="vx-dpanel__head">
            <b>{title} · {list.length} bệnh</b>
            <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
              <Link {...filterLink(cur, { cay: undefined })} className="vx-chip" aria-current={!plant ? 'true' : undefined} scroll={false}>Mọi loại cây</Link>
              {PLANTS.map((p) => (
                <Link key={p.key} {...filterLink(cur, { cay: p.key })} className="vx-chip" aria-current={plant === p.key ? 'true' : undefined} scroll={false}>{p.name}</Link>
              ))}
            </span>
          </div>
          {(part || cause || plant || q) && (
            <Link href="/benh-cay#danh-sach" className="vx-link" style={{ fontSize: '0.8125rem' }} scroll={false}>✕ Bỏ tất cả bộ lọc</Link>
          )}
          {shown.length ? (
            <div className="vx-dlist">
              {shown.map((d) => (
                <Link key={d.slug} href={`/benh-cay/${d.slug}`}>{d.name}<small>{causeOf(d.cause)?.name}</small></Link>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
              Chưa có bài bệnh phù hợp.
            </p>
          )}
          <Pager page={page} pages={pages} href={(n) => hrefWith(cur, { trang: n > 1 ? String(n) : undefined })} nofollow={Object.values(cur).some(Boolean)} />
        </div>
      </section>

      <h2 className="vx-dsec">
        <svg className="vx-ico" viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" /></svg>
        Nhóm bệnh theo nguyên nhân
      </h2>
      <div className="vx-dgrid">
        {CAUSES.map((c) => (
          <Link key={c.key} {...filterLink(cur, { nguyen_nhan: cause === c.key ? undefined : c.key })} className="vx-dtile" aria-current={cause === c.key ? 'true' : undefined}>
            <span className={'warm' in c ? 'warm' : ''}><CauseIcon cause={c.key} /></span>
            <b>{c.name}</b>
            <small>{all.filter((d) => d.cause === c.key).length} bệnh</small>
            <p>{c.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
