'use client';

import { useMemo, useState } from 'react';
import { Breadcrumb } from './Blocks';
import { Icon, type IconName } from './Icon';
import { normalize } from '@/lib/catalog';
import { thumbUrl } from '@/lib/images';
import { FILTER_GROUPS, pad2, type PickerItem } from '@/lib/plant-picker';

/** Biểu tượng cho từng nhóm lọc. */
const GROUP_ICON: Record<string, IconName> = { place: 'pin', light: 'sun', size: 'gauge', form: 'leaf', wall: 'trees' };

/** Bảng cây (/bang-chon-cay): xem ảnh + thông tin cây, lọc theo vị trí đặt, ánh sáng, kích thước, dạng cây. */
export function PlantPicker({ items }: { items: PickerItem[] }) {
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const query = normalize(q.trim());
  const shown = useMemo(() => items.filter((p) => {
    if (query && !normalize(p.name).includes(query)) return false;
    return FILTER_GROUPS.every((g) => {
      const on = filters[g.key];
      return !on?.length || g.opts.some(([k, , fn]) => on.includes(k) && fn(p));
    });
  }), [items, query, filters]);
  const activeCount = Object.values(filters).reduce((s, v) => s + v.length, 0) + (query ? 1 : 0);

  const toggle = (g: string, k: string) => setFilters((f) => {
    const cur = f[g] ?? [];
    return { ...f, [g]: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] };
  });
  const clear = () => { setQ(''); setFilters({}); };

  return (
    <div className="app-pk">
      <Breadcrumb items={[{ label: 'Bảng cây' }]} />
      <h1>{items.length} loại cây có sẵn tại vườn</h1>

      <section className="app-pk-filter" aria-label="Bộ lọc cây">
        <label className="app-pk-search">
          <Icon name="search" size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên cây" aria-label="Tìm tên cây" />
        </label>
        <div className="app-pk-groups">
          {FILTER_GROUPS.map((g) => (
            <fieldset key={g.key} className="app-pk-group">
              <legend><Icon name={GROUP_ICON[g.key] ?? 'plant'} size={16} />{g.label}</legend>
              <div className="app-pk-chips">
                {g.opts.map(([k, label, fn]) => {
                  const on = filters[g.key]?.includes(k) ?? false;
                  return (
                    <button key={k} type="button" className="app-pk-chip" aria-pressed={on} onClick={() => toggle(g.key, k)}>
                      {on && <Icon name="check" size={14} />}{label}<span>{items.filter(fn).length}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="app-pk-result">
          <span aria-live="polite"><b>{shown.length}</b> / {items.length} cây</span>
          {activeCount > 0 && <button type="button" className="app-pk-clear" onClick={clear}><Icon name="close" size={14} />Xóa lọc ({activeCount})</button>}
        </div>
      </section>

      <ul className="app-pk-grid">
        {shown.map((p) => (
          <li key={p.n} className="app-pk-card">
            <div className="app-pk-ph">
              {p.photo
                ? <img src={thumbUrl(p.photo, 480)} alt={p.name} loading="lazy" decoding="async" width={480} height={480} />
                : <span className="app-pk-none"><Icon name="plant" size={34} />Đang cập nhật ảnh</span>}
              <span className="app-pk-no">{pad2(p.n)}</span>
              {p.photo && <span className={p.real ? 'app-pk-badge app-pk-badge--real' : 'app-pk-badge'}>{p.real ? 'Ảnh tại vườn' : 'Ảnh minh họa'}</span>}
            </div>
            <div className="app-pk-body">
              <h2>{p.name}</h2>
              <p className="app-pk-meta">{p.size} · {p.form}</p>
              <p className="app-pk-place"><Icon name="pin" size={14} />{p.place}</p>
              <div className="app-pk-tags">
                <span className="app-pk-tag"><Icon name="sun" size={12} />{p.light}</span>
                {p.wall !== 'Không' && <span className={p.wall === 'Có' ? 'app-pk-tag app-pk-tag--wall' : 'app-pk-tag app-pk-tag--cond'}>
                  {p.wall === 'Có' ? 'Tường nhiệt đới' : 'Tường nhiệt đới (có điều kiện)'}
                </span>}
              </div>
            </div>
          </li>
        ))}
        {!shown.length && <li className="app-pk-empty">Không có cây nào khớp bộ lọc</li>}
      </ul>

      {items.some((p) => p.credit && !p.real) && (
        <details className="app-pk-credits">
          <summary>Nguồn ảnh minh họa</summary>
          <ul>
            {items.filter((p) => p.credit && !p.real).map((p) => (
              <li key={p.n}>{pad2(p.n)} {p.name}: <a href={p.credit!.page} target="_blank" rel="noopener noreferrer">{p.credit!.author}</a>, {p.credit!.license}, Wikimedia Commons</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
