'use client';

import { Select } from '@/components/Select';
import { BUNDLE_PCT, bundlePrice, MAX_BUNDLE_PARTS, MAX_PART_QTY, partKey, type BundleChoice } from '@/lib/bundle';
import { money } from '@/lib/format';
import type { Category } from '@/lib/catalog';

/** Một món trong bộ đang sửa trên form: `key` = partKey(slug, idx), '' = chưa chọn. */
export type PartRow = { key: string; qty: string };

/** Giá bộ xem trước trên form — cùng công thức máy chủ dùng khi lưu (server/bundles.ts `bundlePricing`). */
export function previewBundle(rows: PartRow[], choices: BundleChoice[]) {
  const by = new Map(choices.map((c) => [partKey(c.slug, c.idx), c]));
  let retail = 0, cost = 0;
  for (const r of rows) {
    const c = by.get(r.key);
    const q = Number(r.qty) || 0;
    if (c && q > 0) { retail += c.price * q; cost += c.cost * q; }
  }
  const price = bundlePrice(retail);
  return { retail, price, cost, profit: price - cost, pct: price ? Math.round(((price - cost) / price) * 100) : 0 };
}

/** Chọn món + số lượng cho một quy cách là bộ (form sản phẩm admin). */
export function BundleParts({ label, rows, choices, categories, onChange }: {
  label: string; rows: PartRow[]; choices: BundleChoice[]; categories: Category[]; onChange: (rows: PartRow[]) => void;
}) {
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const groups = [...new Set(choices.map((c) => c.category))];
  const sum = previewBundle(rows, choices);
  const set = (i: number, patch: Partial<PartRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="app-bundle">
      <div className="app-bundle__rows">
        {rows.map((r, i) => (
          <div key={i} className="app-bundle__row">
            <Select className="vx-input" value={r.key} onChange={(e) => set(i, { key: e.target.value })} aria-label={`Món ${i + 1} của bộ ${label}`}>
              <option value="">— Chọn món —</option>
              {groups.map((g) => (
                <optgroup key={g} label={catName(g)}>
                  {choices.filter((c) => c.category === g).map((c) => (
                    <option key={partKey(c.slug, c.idx)} value={partKey(c.slug, c.idx)}>
                      {`${c.name} · ${c.label} — ${money(c.price)}${c.active ? '' : ' (đang ẩn)'}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <input className="vx-input" inputMode="numeric" value={r.qty} onChange={(e) => set(i, { qty: e.target.value.replace(/\D/g, '').slice(0, 2) })} aria-label={`Số lượng món ${i + 1}`} max={MAX_PART_QTY} />
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Bỏ món ${i + 1}`} disabled={rows.length <= 1}>✕</button>
          </div>
        ))}
      </div>
      {rows.length < MAX_BUNDLE_PARTS && (
        <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => onChange([...rows, { key: '', qty: '1' }])}>+ Thêm món</button>
      )}
      <dl className="app-bundle__sum">
        <div><dt>Tổng giá lẻ</dt><dd>{money(sum.retail)}</dd></div>
        <div><dt>Giá bộ (−{BUNDLE_PCT}%)</dt><dd><b>{money(sum.price)}</b></dd></div>
        <div><dt>Vốn</dt><dd>{money(sum.cost)}</dd></div>
        <div><dt>Lãi</dt><dd data-low={sum.price > 0 && sum.pct < 25 || undefined}>{money(sum.profit)} ({sum.pct}%)</dd></div>
      </dl>
    </div>
  );
}
