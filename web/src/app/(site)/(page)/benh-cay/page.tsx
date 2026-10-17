import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Blocks';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CauseIcon, PartIcon, PlantMap } from '@/components/DiseaseArt';
import { Icon } from '@/components/Icon';
import {
  CAUSES, PARTS, PLANTS, SEVERITY, causeOf, coverOf, diseaseImageUrl, diseaseScore, inSeason, isCause, isPart, isPlant, partName, plantName, seasonNow,
  type CauseKey, type Disease, type PartKey, type PlantKey,
} from '@/lib/diseases';
import { responsive } from '@/lib/images';
import { pageSuffix } from '@/lib/posts';
import { CARE_PHONE, ZALO_URL, formatPhone } from '@/lib/contact';
import { WARRANTY_DAYS } from '@/lib/warranty-labels';
import { allDiseases } from '@/server/diseases';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';
import { Pager } from '@/components/Pager';
import { one, pageOf, redirectIfNotCanonical, type SearchParams } from '@/lib/url-params';
import { listingRobots } from '@/lib/seo-rules';
import '@/styles/disease.css';

const PER_PAGE = 20;

/** Triệu chứng hay gặp — lối tắt dưới ô tìm (mỗi cụm phải tìm ra bệnh trong thư viện). */
const QUICK = ['Vàng lá', 'Đốm lá', 'Cháy lá', 'Thối rễ', 'Héo', 'Rệp', 'Phấn trắng', 'Sâu ăn lá'];

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
  return withSeo(withShare({
    title: `Tìm hiểu bệnh cây trồng${nth}`,
    description: `Tra cứu bệnh cây theo bộ phận bị bệnh, nguyên nhân hoặc triệu chứng: nhận biết, cách xử lý và phòng bệnh.${nth ? pageSuffix(page, ' ') + '.' : ''}`,
    alternates: { canonical: page > 1 ? `/benh-cay?trang=${page}` : '/benh-cay' },
    robots: listingRobots(filtered),
  }));
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

/** Mức nguy hại: 5 vạch, tô theo `severity`. */
function Severity({ n }: { n: number }) {
  return (
    <span className="dz-sev" data-n={n} title={`Mức độ nguy hại: ${SEVERITY[n] ?? ''}`}>
      <span className="dz-sev__bars" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} data-on={i <= n ? '' : undefined} />)}</span>
      {SEVERITY[n]}
    </span>
  );
}

/** Thẻ bệnh: ảnh triệu chứng (chưa có ảnh thì biểu tượng bộ phận), nhóm nguyên nhân, tên, bộ phận, mức nguy hại. */
function DiseaseCard({ d, eager }: { d: Disease; eager?: boolean }) {
  const img = coverOf(d);
  const c = causeOf(d.cause);
  return (
    <li>
      <Link href={`/benh-cay/${d.slug}`} className="dz-card">
        <span className="dz-card__img">
          {img
            ? <img {...responsive(diseaseImageUrl(img, d.slug), '(max-width: 47.9375em) 46vw, (max-width: 79.9375em) 30vw, 240px', 640)} alt="" width={1000} height={750} loading={eager ? undefined : 'lazy'} />
            : <span className="dz-card__ph"><PartIcon part={d.parts[0] ?? 'la'} plain /></span>}
          {c && <span className="dz-cause" data-warm={'warm' in c ? '' : undefined}><CauseIcon cause={c.key} />{c.name}</span>}
        </span>
        <span className="dz-card__b">
          <h3>{d.name}</h3>
          <span className="dz-card__parts">{d.parts.map(partName).join(' · ')}</span>
          <Severity n={d.severity} />
        </span>
      </Link>
    </li>
  );
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
  const filtered = Object.values(cur).some(Boolean);

  // Bệnh hay gặp mùa này (chỉ ở trang đầu chưa lọc): có ảnh triệu chứng, đúng mùa trước, nặng trước.
  const season = seasonNow();
  const seasonal = filtered || page > 1 ? [] : all
    .filter((d) => coverOf(d) && inSeason(d, season.key))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 4);

  const title = [
    q && `“${q}”`,
    part && `Bệnh trên ${partName(part).toLowerCase()}`,
    cause && causeOf(cause)?.name,
    plant && plantName(plant),
  ].filter(Boolean).join(' · ') || 'Tất cả bệnh';
  const chips = [
    q && { label: `“${q}”`, href: hrefWith(cur, { q: undefined }) },
    part && { label: partName(part), href: hrefWith(cur, { bo_phan: undefined }) },
    cause && { label: causeOf(cause)?.name ?? cause, href: hrefWith(cur, { nguyen_nhan: undefined }) },
    plant && { label: plantName(plant), href: hrefWith(cur, { cay: undefined }) },
  ].filter((x): x is { label: string; href: string } => !!x);
  const images = all.reduce((n, d) => n + d.symptoms.filter((s) => s.image).length, 0);

  return (
    <div className="dz">
      <Breadcrumb items={[{ label: 'Góc chăm cây', href: '/goc-cham-cay' }, { label: 'Bệnh cây trồng' }]} />

      <section className="dz-hero">
        <div className="dz-hero__main">
          <span className="dz-eyebrow"><Icon name="bug" size={16} />Bệnh cây trồng</span>
          <h1>Bắt bệnh cho cây</h1>
          <form action="/benh-cay#danh-sach" role="search" className="dz-search">
            <Icon name="search" />
            <input name="q" type="search" defaultValue={q} maxLength={80} placeholder="Lá vàng mép, đốm nâu…" aria-label="Tìm bệnh theo triệu chứng" enterKeyHint="search" />
            <button className="vx-btn vx-btn--primary">Tìm</button>
          </form>
          <ul className="dz-quick" aria-label="Triệu chứng hay gặp">
            {QUICK.map((s) => (
              <li key={s}><Link href={hrefWith({}, { q: s })} className="dz-quick__a" rel="nofollow" aria-current={q === s ? 'true' : undefined}>{s}</Link></li>
            ))}
          </ul>
          <ul className="dz-stats">
            <li><b>{all.length}</b> bệnh</li>
            <li><b>{images}</b> ảnh triệu chứng</li>
          </ul>
        </div>
        <ul className="dz-help" aria-label="Hỏi kỹ sư">
          <li>
            <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="dz-help__a">
              <span className="dz-help__ic"><Icon name="camera" /></span>
              <span><b>Gửi ảnh cây qua Zalo</b><small>Kỹ sư bắt bệnh</small></span>
              <Icon name="chevron" size={18} />
            </a>
          </li>
          <li>
            <a href={`tel:${CARE_PHONE}`} className="dz-help__a">
              <span className="dz-help__ic"><Icon name="phone" /></span>
              <span><b>{formatPhone(CARE_PHONE)}</b><small>Gọi kỹ sư chăm cây</small></span>
              <Icon name="chevron" size={18} />
            </a>
          </li>
          <li>
            <Link href="/tai-khoan/bao-hanh" className="dz-help__a">
              <span className="dz-help__ic"><Icon name="shield" /></span>
              <span><b>Bảo hành cây {WARRANTY_DAYS} ngày</b><small>Cây mua tại vườn</small></span>
              <Icon name="chevron" size={18} />
            </Link>
          </li>
        </ul>
      </section>

      {seasonal.length > 0 && (
        <section className="dz-sec">
          <h2 className="dz-h2"><span className="dz-h2__ic"><Icon name={season.key === 'mưa' ? 'rain' : 'sun'} /></span>Hay gặp {season.name.toLowerCase()}</h2>
          <ul className="dz-grid dz-grid--season">
            {seasonal.map((d) => <DiseaseCard key={d.slug} d={d} />)}
          </ul>
        </section>
      )}

      <div className="dz-browse" id="danh-sach">
        <aside className="dz-side" aria-label="Lọc bệnh">
          <section className="dz-box">
            <h2 className="dz-box__h">Bộ phận bị bệnh</h2>
            <div className="dz-parts">
              <div className="dz-parts__art" aria-hidden="true"><PlantMap active={part} /></div>
              <ul className="dz-opts">
                {PARTS.map((p) => (
                  <li key={p.key}>
                    <Link {...filterLink(cur, { bo_phan: part === p.key ? undefined : p.key })} className="dz-opt" aria-current={part === p.key ? 'true' : undefined} scroll={false}>
                      <span className="dz-opt__ic"><PartIcon part={p.key} /></span>
                      <span className="dz-opt__t">{p.name}</span>
                      <small>{all.filter((d) => d.parts.includes(p.key)).length}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="dz-box">
            <h2 className="dz-box__h">Nguyên nhân</h2>
            <ul className="dz-opts">
              {CAUSES.map((c) => (
                <li key={c.key}>
                  <Link {...filterLink(cur, { nguyen_nhan: cause === c.key ? undefined : c.key })} className="dz-opt" data-warm={'warm' in c ? '' : undefined} aria-current={cause === c.key ? 'true' : undefined} scroll={false}>
                    <span className="dz-opt__ic"><CauseIcon cause={c.key} /></span>
                    <span className="dz-opt__t">{c.name}</span>
                    <small>{all.filter((d) => d.cause === c.key).length}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="dz-box">
            <h2 className="dz-box__h">Loại cây</h2>
            <ul className="dz-opts dz-opts--chips">
              {PLANTS.map((p) => (
                <li key={p.key}>
                  <Link {...filterLink(cur, { cay: plant === p.key ? undefined : p.key })} className="dz-opt" aria-current={plant === p.key ? 'true' : undefined} scroll={false}>
                    <span className="dz-opt__t">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="dz-main" aria-labelledby="dz-list-h">
          <div className="dz-main__head">
            <h2 id="dz-list-h" className="dz-h2">{title}<small>{list.length} bệnh</small></h2>
            {chips.length > 0 && (
              <ul className="dz-active" aria-label="Đang lọc">
                {chips.map((c) => (
                  <li key={c.label}><Link href={c.href} className="dz-active__a" scroll={false} aria-label={`Bỏ lọc ${c.label}`}>{c.label}<Icon name="close" size={14} /></Link></li>
                ))}
                {chips.length > 1 && <li><Link href="/benh-cay#danh-sach" scroll={false} className="dz-active__all">Bỏ tất cả</Link></li>}
              </ul>
            )}
          </div>
          {shown.length ? (
            <ul className="dz-grid">
              {shown.map((d, i) => <DiseaseCard key={d.slug} d={d} eager={filtered && i < 2} />)}
            </ul>
          ) : (
            <div className="dz-empty">
              <span className="dz-help__ic"><Icon name="search" /></span>
              <b>Chưa có bài bệnh phù hợp</b>
              <div className="dz-empty__act">
                <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--primary">Gửi ảnh qua Zalo</a>
                <Link href="/benh-cay#danh-sach" className="vx-btn vx-btn--ghost" scroll={false}>Xem tất cả bệnh</Link>
              </div>
            </div>
          )}
          <Pager page={page} pages={pages} href={(n) => hrefWith(cur, { trang: n > 1 ? String(n) : undefined })} nofollow={filtered} />
        </section>
      </div>
    </div>
  );
}
