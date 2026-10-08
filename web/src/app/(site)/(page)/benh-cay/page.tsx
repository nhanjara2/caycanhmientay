import type { Metadata } from 'next';
import Link from 'next/link';
import { CauseIcon, PartIcon, PlantMap } from '@/components/DiseaseArt';
import { Icon } from '@/components/Icon';
import { CAUSES, PARTS, PLANTS, causeOf, isCause, isPart, isPlant, diseaseScore, partName } from '@/lib/diseases';
import { allDiseases } from '@/server/diseases';

export const metadata: Metadata = {
  title: 'Tìm hiểu bệnh cây trồng',
  description: 'Tra cứu bệnh cây theo bộ phận bị bệnh, nguyên nhân hoặc triệu chứng: nhận biết, cách xử lý và phòng bệnh.',
};

const PER_PAGE = 20;

type Filters = { bo_phan?: string; nguyen_nhan?: string; cay?: string; q?: string; trang?: string };
type Props = { searchParams: Promise<Filters> };

/** Link giữ các bộ lọc đang chọn, đổi những gì truyền vào (undefined = bỏ lọc đó), về trang 1. */
function hrefWith(cur: Filters, patch: Filters, hash = '#danh-sach') {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...cur, trang: undefined, ...patch })) if (v) q.set(k, v);
  const s = q.toString();
  return `/benh-cay${s ? `?${s}` : ''}${hash}`;
}

export default async function DiseaseLibraryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const part = isPart(sp.bo_phan) ? sp.bo_phan : undefined;
  const cause = isCause(sp.nguyen_nhan) ? sp.nguyen_nhan : undefined;
  const plant = isPlant(sp.cay) ? sp.cay : undefined;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const cur: Filters = { bo_phan: part, nguyen_nhan: cause, cay: plant, q };

  const all = await allDiseases();
  const list = all
    .map((d) => ({ d, score: q ? diseaseScore(d, q) : 1 }))
    .filter(({ d, score }) => score > 0 && (!part || d.parts.includes(part)) && (!cause || d.cause === cause) && (!plant || d.plants.includes(plant)))
    .sort((a, b) => b.score - a.score) // sort ổn định: cùng điểm giữ thứ tự theo tên
    .map(({ d }) => d);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.trang) || 1));
  const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const title = [
    q && `Kết quả cho “${q}”`,
    part && `Bệnh trên ${partName(part)}`,
    cause && causeOf(cause)?.name,
  ].filter(Boolean).join(' · ') || 'Tất cả bệnh';

  return (
    <div className="vx-dlib">
      <nav className="vx-crumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>/<Link href="/goc-cham-cay">Góc chăm cây</Link>/<span>Bệnh cây trồng</span>
      </nav>
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
            <Link key={p.key} href={hrefWith(cur, { bo_phan: part === p.key ? undefined : p.key })} className="vx-part" aria-current={part === p.key ? 'true' : undefined} scroll={false}>
              <span><PartIcon part={p.key} /></span>
              <span style={{ all: 'unset' }}>{p.name}<small>{all.filter((d) => d.parts.includes(p.key)).length} bệnh</small></span>
            </Link>
          ))}
        </div>
        <div className="vx-dpanel" id="danh-sach">
          <div className="vx-dpanel__head">
            <b>{title} · {list.length} bệnh</b>
            <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
              <Link href={hrefWith(cur, { cay: undefined })} className="vx-chip" aria-current={!plant ? 'true' : undefined} scroll={false}>Mọi loại cây</Link>
              {PLANTS.map((p) => (
                <Link key={p.key} href={hrefWith(cur, { cay: p.key })} className="vx-chip" aria-current={plant === p.key ? 'true' : undefined} scroll={false}>{p.name}</Link>
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
              Chưa có bài bệnh phù hợp. Thử từ khóa khác (ví dụ “vàng lá”, “đốm”, “rệp”) hoặc bỏ bớt bộ lọc.
            </p>
          )}
          {pages > 1 && (
            <nav className="vx-pager" aria-label="Phân trang">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={`${hrefWith(cur, { trang: n > 1 ? String(n) : undefined })}`} aria-current={n === page ? 'true' : undefined} scroll={false}>{n}</Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <h2 className="vx-dsec">
        <svg className="vx-ico" viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" /></svg>
        Nhóm bệnh theo nguyên nhân
      </h2>
      <div className="vx-dgrid">
        {CAUSES.map((c) => (
          <Link key={c.key} href={hrefWith(cur, { nguyen_nhan: cause === c.key ? undefined : c.key })} className="vx-dtile" aria-current={cause === c.key ? 'true' : undefined}>
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
