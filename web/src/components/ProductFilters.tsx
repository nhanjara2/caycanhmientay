'use client';

import { useRouter } from '@/components/LocaleLink';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  countWith, groupTitle, matches, selectedCount, staticOptions, withQuery,
  type FacetItem, type FilterKey, type FilterOption, type Sel,
} from '@/lib/product-filters';
import { Icon } from './Icon';

type Props = {
  /** Đường dẫn trang danh mục, không có query. */
  base: string;
  category: string;
  groups: FilterKey[];
  /** Toàn bộ sản phẩm của danh mục (chưa lọc), dạng rút gọn — để đếm trực tiếp theo lựa chọn. */
  items: FacetItem[];
  origins: FilterOption[];
  selected: Sel;
  sort?: string;
};

/**
 * Hàng nút lọc + bảng lọc: mobile là bảng trượt từ dưới lên, tablet/desktop là bảng trượt từ phải (theo FilterBar / MobileProductList).
 * Chọn trong bảng chỉ đổi bản nháp; bấm "Xem n sản phẩm" mới ghi vào đường dẫn — server lọc lại danh sách theo đường dẫn.
 */
export function ProductFilters({ base, category, groups, items, origins, selected, sort }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Sel>(selected);
  const trigger = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const sections = useRef<Partial<Record<FilterKey, HTMLElement | null>>>({});
  const pendingGroup = useRef<FilterKey | null>(null);
  const titleId = useId();

  // Giữ bản nháp khớp đường dẫn mỗi khi trang điều hướng xong (bấm ✕ ở nhãn, đổi nhóm con, nút Trước/Sau…).
  const selKey = JSON.stringify(selected);
  useEffect(() => { setDraft(selected); setOpen(false); }, [selKey]);

  const optionsOf = (g: FilterKey) => (g === 'nha-vuon' ? origins : staticOptions(g, category));
  // Một nơi xuất xứ duy nhất thì lọc cũng vô ích.
  const shown = groups.filter((g) => g !== 'nha-vuon' || origins.length > 1);
  const draftCount = useMemo(() => items.filter((f) => matches(f, draft)).length, [items, draft]);

  const openPanel = (g?: FilterKey) => {
    trigger.current = document.activeElement as HTMLElement | null;
    pendingGroup.current = g ?? null;
    setDraft(selected);
    setOpen(true);
  };
  const close = () => { setOpen(false); trigger.current?.focus?.(); };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    const g = pendingGroup.current;
    if (g) sections.current[g]?.scrollIntoView({ block: 'start' });
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = (g: FilterKey, key: string) =>
    setDraft((d) => {
      const cur = d[g] ?? [];
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      return { ...d, [g]: next.length ? next : undefined };
    });
  const apply = () => {
    setOpen(false);
    router.push(withQuery(base, draft, sort), { scroll: false });
  };

  const summary = (g: FilterKey) => {
    const names = (selected[g] ?? []).map((k) => optionsOf(g).find((o) => o.key === k)?.name ?? k);
    return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
  };
  const total = selectedCount(selected);

  return (
    <>
      <div className="app-fbar">
        <button type="button" className="vx-btn app-fbar__all" onClick={() => openPanel()}>
          <Icon name="filter" />
          Bộ lọc
          {total > 0 && <em>{total}</em>}
        </button>
        <div className="app-fbar__chips">
          {shown.map((g) => {
            const on = Boolean(selected[g]?.length);
            return (
              <button key={g} type="button" className="vx-chip" aria-pressed={on} onClick={() => openPanel(g)}>
                {on ? <>{groupTitle(g, category)}: <b>{summary(g)}</b></> : groupTitle(g, category)}
                <Icon name="chevron" className="chev" />
              </button>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="app-fp" role="presentation">
          <div className="app-fp__scrim" onClick={close} />
          <div className="app-fp__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={panel}>
            <div className="app-fp__head">
              <b id={titleId}>Bộ lọc</b>
              <button type="button" className="app-fp__x" aria-label="Đóng bộ lọc" onClick={close}><Icon name="close" /></button>
            </div>
            <div className="app-fp__body">
              {shown.map((g) => (
                <section key={g} className="app-fp__group" ref={(el) => { sections.current[g] = el; }}>
                  <h3>{groupTitle(g, category)}{g !== 'khac' && <small>chọn được nhiều</small>}</h3>
                  <div className="app-fp__opts">
                    {optionsOf(g).map((o) => {
                      const on = Boolean(draft[g]?.includes(o.key));
                      const n = countWith(items, draft, g, o.key);
                      return (
                        <button key={o.key} type="button" className="vx-chip app-fp__opt" aria-pressed={on} disabled={!on && n === 0} onClick={() => toggle(g, o.key)}>
                          {o.swatch && <i className="app-fp__sw" style={{ background: o.swatch }} />}
                          {o.name}
                          <small>{n}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="app-fp__foot">
              <button type="button" className="vx-btn vx-btn--outline" onClick={() => setDraft({})} disabled={selectedCount(draft) === 0}>Đặt lại</button>
              <button type="button" className="vx-btn vx-btn--primary" onClick={apply} disabled={draftCount === 0}>
                {draftCount === 0 ? 'Không có sản phẩm phù hợp' : `Xem ${draftCount} sản phẩm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
