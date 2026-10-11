import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { requireAccess } from '@/server/auth';
import { factorTable, listPriceRows, REVENUE_TAX_PCT, WHOLESALE_TIERS } from '@/server/price-list';

export const metadata: Metadata = { title: 'Bảng giá' };

type Props = { searchParams: Promise<{ xem?: string; q?: string }> };

const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const vnd = (v: number | null) => (v ? money(v) : '—');
/** Hệ số viết kiểu Việt Nam: × 1,3 · × 1,98 (tối đa 3 số lẻ). */
const times = (v: number) => `× ${v.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}`;

/** Bảng giá mọi quy cách theo từng nhóm khách: giá vườn → giá gốc → giá lẻ, combo → giá từng cấp đại lý. Có giá vườn nên chỉ Quản lý xem. */
export default async function AdminPriceListPage({ searchParams }: Props) {
  await requireAccess('settings');
  const sp = await searchParams;
  const all = sp.xem === 'tat-ca';
  const q = sp.q?.slice(0, 60);
  const rows = await listPriceRows({ q, onlyActive: !all });
  const low = rows.filter((r) => r.retailTooLow).length;
  const noCost = rows.filter((r) => !r.cost).length;
  const href = (xem?: string) => `/admin/bang-gia${xem ? `?xem=${xem}` : ''}`;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Bảng giá</h1>
        <span className="acts">
          {WHOLESALE_TIERS.map((t) => (
            <a key={t.key} href={`/admin/bang-gia/xuat?cap=${t.key}`} className="vx-btn vx-btn--outline">Tải bảng giá {t.label}</a>
          ))}
        </span>
      </div>

      <div className="ad-card" style={{ marginBottom: 12 }}>
        <div className="ad-card__h">Hệ số đang dùng</div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Loại giá</th><th>Cách tính</th><th className="num">Hệ số trên giá gốc</th><th className="num">Hệ số trên giá vườn</th></tr></thead>
            <tbody>
              {factorTable().map((f) => (
                <tr key={f.label}>
                  <td><b>{f.label}</b></td>
                  <td data-label="Cách tính" data-m="note">{f.how}</td>
                  <td className="num" data-label="Trên giá gốc" data-m="third">{times(f.onCost)}</td>
                  <td className="num" data-label="Trên giá vườn" data-m="third"><b>{times(f.onGarden)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="vx-note" style={{ marginBottom: 12 }}>
        <Icon name="tag" />
        <div>
          Giá sỉ ở đây để xem và báo giá cho đại lý — chưa tự áp vào giỏ hàng. Cột lãi là lãi trên tiền bán, chưa trừ thuế hộ kinh doanh (khoảng {String(REVENUE_TAX_PCT).replace('.', ',')}% doanh thu), phí giao, đóng gói.
          File tải về chỉ có giá lẻ và giá của cấp đó, không có giá vườn / giá gốc.
        </div>
      </div>
      {(low > 0 || noCost > 0) && (
        <div className="vx-note" role="alert" style={{ marginBottom: 12 }}>
          <Icon name="alert" />
          <div>
            {low > 0 && <>Có <b>{low}</b> quy cách giá lẻ đang bằng hoặc thấp hơn giá đại lý cấp 2 (dòng tô đỏ) — đại lý không còn chỗ bán lại, nên xem lại giá lẻ. </>}
            {noCost > 0 && <>Có <b>{noCost}</b> quy cách chưa có giá vườn nên chưa tính được giá sỉ.</>}
          </div>
        </div>
      )}

      <div className="ad-card">
        <div className="ad-stabs">
          <Link href={href()} aria-current={!all ? 'true' : undefined}>Đang bán</Link>
          <Link href={href('tat-ca')} aria-current={all ? 'true' : undefined}>Tất cả</Link>
        </div>
        <form className="ad-filters" action="/admin/bang-gia">
          {all && <input type="hidden" name="xem" value="tat-ca" />}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Tên cây hoặc SKU" aria-label="Tìm trong bảng giá" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Tìm</button>
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr>
                <th>Cây · quy cách</th><th className="num">Giá vườn</th><th className="num">Giá gốc</th><th className="num">Giá lẻ</th><th className="num">Combo 2 cây</th>
                {WHOLESALE_TIERS.map((t) => <th key={t.key} className="num">{t.label}</th>)}
                <th className="num">Lãi lẻ</th><th className="num">Lãi {WHOLESALE_TIERS[1].label.toLowerCase()}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const dl1 = r.tiers.dl1;
                return (
                  <tr key={`${r.slug}-${r.idx}`} style={r.retailTooLow ? { background: '#fdecea' } : undefined}>
                    <td>
                      <Link href={`/admin/san-pham/${r.slug}`} className="app-rowlink" style={{ color: 'inherit' }}>
                        <b>{r.name}</b>
                        <small>{r.label} · {r.sku}-{r.idx + 1}{r.active ? '' : ' · Đang ẩn'}</small>
                      </Link>
                    </td>
                    <td className="num" data-label="Giá vườn" data-m="third">{vnd(r.garden)}</td>
                    <td className="num" data-label="Giá gốc" data-m="third">{vnd(r.cost)}</td>
                    <td className="num" data-label="Giá lẻ" data-m="third"><b>{r.price > 0 ? money(r.price) : 'Liên hệ'}</b></td>
                    <td className="num" data-label="Combo 2 cây" data-m="third">{vnd(r.combo2)}</td>
                    {WHOLESALE_TIERS.map((t) => <td key={t.key} className="num" data-label={t.label} data-m="third">{vnd(r.tiers[t.key])}</td>)}
                    <td className="num" data-label="Lãi lẻ" data-m="third">{pct(r.retailMargin)}</td>
                    <td className="num" data-label={`Lãi ${WHOLESALE_TIERS[1].label.toLowerCase()}`} data-m="third">{pct(dl1 && r.cost ? (dl1 - r.cost) / dl1 : null)}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7 + WHOLESALE_TIERS.length} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có quy cách nào.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} quy cách · {new Set(rows.map((r) => r.slug)).size} cây</span></div>
      </div>
    </div>
  );
}
