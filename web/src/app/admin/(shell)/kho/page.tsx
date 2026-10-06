import type { Metadata } from 'next';
import Link from 'next/link';
import { StockDialog } from '@/components/admin/StockDialog';
import { Icon, Thumb } from '@/components/Icon';
import { requireAccess } from '@/server/auth';
import { expiryLevel, fmtYmd, tracksLots } from '@/lib/stock';
import { INVENTORY_TABS, inventorySummary, listInventory, listStores, MIN_STOCK, type InventoryTab } from '@/server/inventory';
import { listSupplierNames } from '@/server/receipts';

export const metadata: Metadata = { title: 'Kho & tồn kho' };

type Props = { searchParams: Promise<{ tab?: string; q?: string; kho?: string }> };

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} tr` : `${n.toLocaleString('vi-VN')}đ`);

/** AdminInventory: tồn theo từng quy cách, nhập hàng và kiểm kê có ghi lịch sử. */
export default async function AdminInventoryPage({ searchParams }: Props) {
  await requireAccess('inventory');
  const sp = await searchParams;
  const tab: InventoryTab = sp.tab && sp.tab in INVENTORY_TABS ? (sp.tab as InventoryTab) : 'tat-ca';
  const q = sp.q?.slice(0, 60);
  const [stores, suppliers] = await Promise.all([listStores(), listSupplierNames()]);
  const store = stores.find((s) => s.code === sp.kho);
  const all = await listInventory({ tab, q });
  // Lọc theo cửa hàng: cột Tồn là tồn tại cửa hàng đó
  const rows = store ? all.map((r) => ({ ...r, stock: r.byStore[store.id] ?? 0, lots: r.lots.filter((l) => l.storeId === store.id) })) : all;
  const sum = await inventorySummary();
  const maxStock = Math.max(40, ...rows.map((r) => r.stock));
  const href = (p: { tab?: string; kho?: string }) => {
    const u = new URLSearchParams();
    const t = p.tab ?? tab; const k = p.kho ?? store?.code ?? '';
    if (t !== 'tat-ca') u.set('tab', t);
    if (k) u.set('kho', k);
    if (q) u.set('q', q);
    return `/admin/kho${u.size ? `?${u}` : ''}`;
  };
  const storeOpts = stores.map(({ id, code, name }) => ({ id, code, name }));

  return (
    <div className="ad-body">
      <div className="ad-title"><h1>Kho &amp; tồn kho</h1></div>
      <datalist id="supplier-list">{suppliers.map((n) => <option key={n} value={n} />)}</datalist>
      <div className="ad-kpis">
        <div className="ad-kpi"><span><Icon name="cash" />Giá trị tồn kho (giá bán)</span><b>{short(sum.value)}</b><small>{sum.skus} quy cách</small></div>
        <div className={`ad-kpi${sum.low ? ' warn' : ''}`}><span><Icon name="alert" />Dưới mức tối thiểu</span><b>{sum.low}</b><small>Còn dưới {MIN_STOCK}</small></div>
        <div className={`ad-kpi${sum.out ? ' warn' : ''}`}><span><Icon name="close" />Hết hàng</span><b>{sum.out}</b><small>Khách không đặt được</small></div>
        <div className={`ad-kpi${sum.expired + sum.soon ? ' warn' : ''}`}><span><Icon name="clock" />Lô sắp / đã hết hạn</span><b>{sum.soon} / {sum.expired}</b><small>Thuốc, phân, hạt giống</small></div>
      </div>
      <div className="ad-card">
        <div className="ad-stabs">
          {(Object.keys(INVENTORY_TABS) as InventoryTab[]).map((t) => (
            <Link key={t} href={href({ tab: t })} aria-current={tab === t ? 'true' : undefined}>
              {INVENTORY_TABS[t]}<em>{sum.counts[t]}</em>
            </Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/kho">
          {tab !== 'tat-ca' && <input type="hidden" name="tab" value={tab} />}
          {store && <input type="hidden" name="kho" value={store.code} />}
          <span className="vx-seg" role="group" aria-label="Cửa hàng">
            <Link href={href({ kho: '' })} className="vx-chip" aria-pressed={!store}>Tất cả cửa hàng</Link>
            {stores.map((s) => (
              <Link key={s.id} href={href({ kho: s.code })} className="vx-chip" aria-pressed={store?.id === s.id} title={s.address}>{s.name}</Link>
            ))}
          </span>
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Tên hoặc SKU" aria-label="Tìm trong kho" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Tìm</button>
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Sản phẩm</th><th>Loại</th><th>{store ? `Tồn tại ${store.code}` : 'Tồn'}</th>{!store && <th>Theo cửa hàng</th>}<th>Hạn gần nhất</th><th>Tình trạng</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const level = r.stock === 0 ? 'out' : r.stock < MIN_STOCK ? 'low' : '';
                const exp = r.lots.find((l) => l.expiry)?.expiry ?? null;
                const expLv = expiryLevel(exp);
                return (
                  <tr key={`${r.slug}-${r.idx}`}>
                    <td>
                      <Link href={`/admin/san-pham/${r.slug}`} className="ad-prod" style={{ color: 'inherit' }}>
                        <span className="ad-thumb"><Thumb src={r.image} icon={r.icon} /></span>
                        <span>{r.name} · {r.label}<small>{r.sku}-{r.idx + 1}{r.active ? '' : ' · Đang ẩn'}</small></span>
                      </Link>
                    </td>
                    <td data-label="Loại">{r.pesticide ? 'Thuốc BVTV' : r.ship === 'plant' ? 'Cây sống' : r.category === 'phan-bon' ? 'Phân bón' : 'Vật tư'}</td>
                    <td data-label={store ? `Tồn tại ${store.code}` : 'Tồn'}>
                      <span className="ad-stock">
                        <b>{r.stock}</b>
                        <i><em className={level} style={{ width: `${Math.min(100, (r.stock / maxStock) * 100)}%` }} /></i>
                      </span>
                    </td>
                    {!store && (
                      <td data-label="Theo cửa hàng" data-wide style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                        {stores.map((s) => <span key={s.id} style={{ marginRight: 8 }}>{s.code} <b style={{ color: 'var(--ink)' }}>{r.byStore[s.id] ?? 0}</b></span>)}
                      </td>
                    )}
                    <td data-label="Hạn gần nhất" style={{ whiteSpace: 'nowrap' }}>
                      {exp ? (
                        <span style={{ color: expLv === 'expired' ? 'var(--danger)' : expLv === 'soon' ? 'var(--warning, #b7791f)' : undefined, fontWeight: expLv === 'ok' ? undefined : 600 }}>
                          {fmtYmd(exp)}{expLv === 'expired' ? ' · hết hạn' : expLv === 'soon' ? ' · sắp hết' : ''}
                        </span>
                      ) : <span style={{ color: 'var(--ink-muted)' }}>—</span>}
                    </td>
                    <td data-label="Tình trạng">
                      {level === 'out' ? <span className="ad-pill cancel">Hết hàng</span>
                        : level === 'low' ? <span className="ad-pill new">Dưới mức</span>
                        : <span className="ad-pill done">Đủ hàng</span>}
                    </td>
                    <td className="num" data-wide>
                      <StockDialog slug={r.slug} idx={r.idx} name={r.name} label={r.label} stock={all.find((x) => x.slug === r.slug && x.idx === r.idx)?.stock ?? r.stock}
                        lotTracked={tracksLots(r)} stores={storeOpts}
                        lots={(all.find((x) => x.slug === r.slug && x.idx === r.idx)?.lots ?? []).map(({ id, storeId, lotCode, expiry, qty }) => ({ id, storeId, lotCode, expiry, qty }))} />
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có mặt hàng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
