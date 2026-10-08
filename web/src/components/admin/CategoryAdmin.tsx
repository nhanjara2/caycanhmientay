'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  deleteCategoryAction, deleteSubcategoryAction, moveCategoryAction, moveSubcategoryAction, saveCategoryAction,
  saveSubcategoryAction, setCategoryActiveAction, setSubcategoryActiveAction,
} from '@/app/actions/categories';
import { Art, type IconName } from '@/components/Icon';
import { CATEGORY_ICONS, ICON_LABELS, toSlug, type SpecField } from '@/lib/catalog';
import { Select } from '@/components/Select';

const FAIL = { ok: false as const, error: 'Có lỗi, vui lòng thử lại' };

// ---- Nút trong bảng danh sách ---------------------------------------------------------------

/** Bật/tắt "Hiện trên menu" của danh mục (`sub` bỏ trống) hoặc nhóm con. */
export function MenuToggle({ category, sub, active, disabled }: { category: string; sub?: string; active: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const flip = () => start(async () => {
    await (sub ? setSubcategoryActiveAction(category, sub, !active) : setCategoryActiveAction(category, !active)).catch(() => FAIL);
    router.refresh();
  });
  return (
    <span className="app-mtoggle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button type="button" className="vx-switch" role="switch" aria-checked={active} disabled={pending || disabled} onClick={flip}
        aria-label={active ? 'Đang hiện trên menu — bấm để ẩn' : 'Đang ẩn khỏi menu — bấm để hiện'} />
      <small style={{ display: 'inline' }}>{active ? 'Đang hiện' : 'Ẩn'}</small>
    </span>
  );
}

/** ↑ ↓ đổi thứ tự trên menu. */
export function MoveButtons({ category, sub, first, last }: { category: string; sub?: string; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (dir: -1 | 1) => start(async () => {
    await (sub ? moveSubcategoryAction(category, sub, dir) : moveCategoryAction(category, dir)).catch(() => FAIL);
    router.refresh();
  });
  return (
    <span className="app-catmove">
      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending || first} onClick={() => move(-1)} aria-label="Lên trên">↑</button>
      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending || last} onClick={() => move(1)} aria-label="Xuống dưới">↓</button>
    </span>
  );
}

// ---- Bộ thông số ----------------------------------------------------------------------------

type Row = { name: string; required: boolean };
const toRows = (specs: SpecField[]): Row[] => specs.map((f) => ({ name: f.name, required: Boolean(f.required) }));

/** Danh sách thông số: tên + bắt buộc, đổi thứ tự, xóa, thêm. */
function SpecFieldsEditor({ rows, onChange, disabled }: { rows: Row[]; onChange: (r: Row[]) => void; disabled?: boolean }) {
  const upd = (i: number, patch: Partial<Row>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const swap = (i: number, j: number) => { const r = [...rows]; [r[i], r[j]] = [r[j], r[i]]; onChange(r); };
  return (
    <div className="app-specfields">
      {rows.map((r, i) => (
        <div key={i} className="app-specfield">
          <input className="vx-input" value={r.name} onChange={(e) => upd(i, { name: e.target.value })} maxLength={60} placeholder="Tên thông số, ví dụ: Chiều cao" aria-label={`Tên thông số ${i + 1}`} disabled={disabled} />
          <label className="vx-check" style={{ flexDirection: 'row', fontWeight: 400, alignItems: 'center' }}>
            <input type="checkbox" checked={r.required} onChange={(e) => upd(i, { required: e.target.checked })} disabled={disabled} /> Bắt buộc
          </label>
          <span className="app-catmove">
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={disabled || i === 0} onClick={() => swap(i, i - 1)} aria-label="Lên trên">↑</button>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={disabled || i === rows.length - 1} onClick={() => swap(i, i + 1)} aria-label="Xuống dưới">↓</button>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={disabled} onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Xóa thông số ${r.name}`}>✕</button>
          </span>
        </div>
      ))}
      {!rows.length && <span className="hint">Chưa có thông số nào.</span>}
      {!disabled && (
        <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...rows, { name: '', required: false }])}>
          + Thêm thông số
        </button>
      )}
    </div>
  );
}

/** Bỏ dòng chưa đặt tên trước khi gửi. */
const cleanRows = (rows: Row[]) => rows.map((r) => ({ name: r.name.trim(), required: r.required })).filter((r) => r.name);

// ---- Form danh mục --------------------------------------------------------------------------

export type CategoryValues = { slug: string; name: string; icon: IconName; active: boolean; specs: SpecField[] };

/** Thêm (initial = null) hoặc sửa danh mục: tên, đường dẫn, biểu tượng, hiện trên menu, bộ thông số chung. */
export function CategoryForm({ initial, system, productCount, canEdit }: {
  initial: CategoryValues | null;
  /** Lý do là danh mục hệ thống (không xóa được), null = danh mục thường. */
  system: string | null;
  productCount: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const creating = !initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [icon, setIcon] = useState<IconName>(initial?.icon ?? 'leaf');
  const [active, setActive] = useState(initial?.active ?? true);
  const [rows, setRows] = useState<Row[]>(toRows(initial?.specs ?? []));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const shownSlug = creating ? (slugTouched ? slug : toSlug(name)) : initial.slug;
  const dirty = () => setMsg(null);

  const save = () => start(async () => {
    setMsg(null);
    const r = await saveCategoryAction({
      mode: creating ? 'create' : 'update', slug: creating ? (slugTouched ? slug.trim() : '') : initial.slug,
      name, icon, active, specs: cleanRows(rows),
    }).catch(() => FAIL);
    if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
    if (creating) { router.push(`/admin/danh-muc/${r.slug}`); return; }
    setMsg({ ok: true, text: 'Đã lưu' });
    router.refresh();
  });

  const remove = () => {
    if (!initial || !confirm(`Xóa danh mục “${initial.name}” và các nhóm con của nó?\nKhông thể hoàn tác.`)) return;
    start(async () => {
      const r = await deleteCategoryAction(initial.slug).catch(() => FAIL);
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      router.push('/admin/danh-muc');
      router.refresh();
    });
  };

  return (
    <>
      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'contents' }}>
        <div className="ad-card">
          <div className="ad-card__h">Thông tin danh mục</div>
          <div className="ad-card__b">
            {system && <div className="app-catnote"><b>Danh mục hệ thống</b> — {system} Đổi tên, biểu tượng, thứ tự, ẩn được nhưng không xóa được.</div>}
            <div className="ad-frow app-pair">
              <div className="ad-f">
                <label htmlFor="cf-name">Tên danh mục <i>*</i></label>
                <input id="cf-name" className="vx-input" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); dirty(); }} placeholder="Ví dụ: Cây ăn trái" />
              </div>
              <div className="ad-f">
                <label htmlFor="cf-slug">Đường dẫn</label>
                {creating ? (
                  <input id="cf-slug" className="vx-input" value={shownSlug} maxLength={60} placeholder="tu-sinh-theo-ten"
                    onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); setSlugTouched(true); dirty(); }} />
                ) : (
                  <span className="app-catslug"><Link href={`/danh-muc/${initial.slug}`} target="_blank">/danh-muc/{initial.slug}</Link></span>
                )}
                <span className="hint">{creating ? 'Tự sinh theo tên, sửa được. Sau khi tạo không đổi được (link cũ không bị hỏng).' : 'Không đổi được sau khi tạo.'}</span>
              </div>
            </div>
            <div className="ad-f">
              <label>Biểu tượng (menu trái, trang chủ)</label>
              <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
                {CATEGORY_ICONS.map((i) => (
                  <button key={i} type="button" className="vx-chip" aria-pressed={icon === i} aria-label={ICON_LABELS[i]} title={ICON_LABELS[i]} onClick={() => { setIcon(i); dirty(); }}
                    style={{ padding: 4, width: 36, height: 36, display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                    <Art name={i} />
                  </button>
                ))}
              </span>
            </div>
            <div className="vx-label-row">
              <span>Hiện trên menu, trang chủ, chân trang</span>
              <button type="button" className="vx-switch" role="switch" aria-checked={active} aria-label="Hiện trên menu" onClick={() => { setActive(!active); dirty(); }} />
            </div>
            {!active && <span className="hint">Đang ẩn: khách không thấy danh mục trên menu; sản phẩm trong danh mục vẫn bán (muốn ngừng bán thì ẩn từng sản phẩm).</span>}
          </div>
        </div>

        <div className="ad-card">
          <div className="ad-card__h">Bộ thông số chung</div>
          <div className="ad-card__b">
            <span className="hint">
              Khi thêm hoặc sửa sản phẩm thuộc danh mục này, các thông số dưới đây được điền sẵn trong khung “Thông số” (nhóm con có thể thêm thông số riêng).
              Đánh dấu <b>Bắt buộc</b> thì sản phẩm phải nhập giá trị mới lưu được. Thông số để trống không hiện trên web.
            </span>
            <SpecFieldsEditor rows={rows} onChange={(r) => { setRows(r); dirty(); }} disabled={!canEdit} />
          </div>
        </div>
      </fieldset>

      {canEdit && (
        <div className="app-catbar">
          {msg && <span role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'ok' : 'vx-err'}>{msg.text}</span>}
          {!creating && !system && (
            <button type="button" className="vx-btn vx-btn--ghost" style={{ color: 'var(--danger)' }} disabled={pending} onClick={remove}
              title={productCount ? `Còn ${productCount} sản phẩm — chuyển sản phẩm sang danh mục khác trước` : undefined}>
              Xóa danh mục
            </button>
          )}
          <button type="button" className="vx-btn vx-btn--primary" disabled={pending} onClick={save}>
            {pending ? 'Đang lưu…' : creating ? 'Tạo danh mục' : 'Lưu danh mục'}
          </button>
        </div>
      )}
    </>
  );
}

// ---- Nhóm con -------------------------------------------------------------------------------

export type AdminSub = { slug: string; name: string; active: boolean; specs: SpecField[]; products: number };

/** Thêm / sửa nhóm con ngay trong danh sách. */
function SubForm({ category, sub, onDone }: { category: string; sub: AdminSub | null; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(sub?.name ?? '');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [active, setActive] = useState(sub?.active ?? true);
  const [rows, setRows] = useState<Row[]>(toRows(sub?.specs ?? []));
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const save = () => start(async () => {
    setError('');
    const r = await saveSubcategoryAction({
      mode: sub ? 'update' : 'create', category, slug: sub ? sub.slug : slugTouched ? slug.trim() : '',
      name, active, specs: cleanRows(rows),
    }).catch(() => FAIL);
    if (!r.ok) { setError(r.error); return; }
    router.refresh();
    onDone();
  });

  return (
    <div className="app-subform">
      <div className="ad-frow app-pair">
        <div className="ad-f">
          <label>Tên nhóm con <i>*</i></label>
          <input className="vx-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Cây thủy sinh" autoFocus />
        </div>
        <div className="ad-f">
          <label>Đường dẫn</label>
          {sub ? (
            <span className="app-catslug">/danh-muc/{category}/{sub.slug}</span>
          ) : (
            <input className="vx-input" value={slugTouched ? slug : toSlug(name)} maxLength={60} placeholder="tu-sinh-theo-ten"
              onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); setSlugTouched(true); }} />
          )}
        </div>
      </div>
      <label className="vx-check" style={{ flexDirection: 'row', fontWeight: 400, alignItems: 'center' }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Hiện trên menu
      </label>
      <div className="ad-f">
        <label>Thông số riêng của nhóm con (thêm sau bộ chung)</label>
        <SpecFieldsEditor rows={rows} onChange={setRows} />
      </div>
      {error && <span className="vx-err" role="alert">{error}</span>}
      <div className="row">
        <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending} onClick={save}>{pending ? 'Đang lưu…' : sub ? 'Lưu nhóm con' : 'Thêm nhóm con'}</button>
        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={onDone}>Hủy</button>
      </div>
    </div>
  );
}

/** Xóa nhóm con; còn sản phẩm thì chọn nhóm con nhận sản phẩm (gộp). */
function SubDelete({ category, sub, others, onDone }: { category: string; sub: AdminSub; others: AdminSub[]; onDone: () => void }) {
  const router = useRouter();
  const [moveTo, setMoveTo] = useState(others[0]?.slug ?? '');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    setError('');
    const r = await deleteSubcategoryAction(category, sub.slug, sub.products ? moveTo : undefined).catch(() => FAIL);
    if (!r.ok) { setError(r.error); return; }
    router.refresh();
    onDone();
  });
  return (
    <div className="app-subform">
      {sub.products > 0 ? (
        others.length ? (
          <div className="ad-f">
            <label>Nhóm con “{sub.name}” còn {sub.products} sản phẩm. Chuyển các sản phẩm này sang:</label>
            <Select className="vx-input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              {others.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
            </Select>
          </div>
        ) : <span>Nhóm con “{sub.name}” còn {sub.products} sản phẩm và là nhóm con duy nhất — thêm nhóm con khác để chuyển sản phẩm sang trước.</span>
      ) : <span>Xóa nhóm con “{sub.name}”? Không thể hoàn tác.</span>}
      {error && <span className="vx-err" role="alert">{error}</span>}
      <div className="row">
        {(sub.products === 0 || others.length > 0) && (
          <button type="button" className="vx-btn vx-btn--sm" style={{ background: 'var(--danger)', color: '#fff' }} disabled={pending} onClick={run}>
            {pending ? 'Đang xóa…' : sub.products ? 'Chuyển sản phẩm & xóa' : 'Xóa nhóm con'}
          </button>
        )}
        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={onDone}>Hủy</button>
      </div>
    </div>
  );
}

/** Danh sách nhóm con của một danh mục: hiện/ẩn, thứ tự, sửa (kèm thông số riêng), xóa / gộp, thêm mới. */
export function SubcategoryManager({ category, subs, baseSpecs, canEdit }: {
  category: string;
  subs: AdminSub[];
  /** Bộ thông số chung của danh mục (hiện để nhắc). */
  baseSpecs: SpecField[];
  canEdit: boolean;
}) {
  // đang mở: '+' = thêm mới, 'edit:<slug>', 'del:<slug>'
  const [open, setOpen] = useState<string | null>(null);
  const close = () => setOpen(null);

  return (
    <div className="ad-card">
      <div className="ad-card__h">
        Nhóm con ({subs.length})
        {canEdit && open !== '+' && <a style={{ cursor: 'pointer' }} onClick={() => setOpen('+')}>+ Thêm nhóm con</a>}
      </div>
      <div className="ad-card__b">
        {!subs.length && <div className="app-catnote">Danh mục chưa có nhóm con — cần ít nhất 1 nhóm con mới gắn được sản phẩm vào danh mục.</div>}
        {open === '+' && <SubForm category={category} sub={null} onDone={close} />}
        <div className="app-sublist">
          {subs.map((s, i) => (
            <div key={s.slug} className="app-subrow" data-open={open?.endsWith(`:${s.slug}`) || undefined}>
              <div className="app-subrow__main">
                <span className="app-subrow__name">
                  <b>{s.name}</b>
                  <small>
                    /{s.slug} · {s.products} sản phẩm
                    {s.specs.length > 0 && ` · +${s.specs.length} thông số riêng`}
                  </small>
                </span>
                {canEdit ? <MenuToggle category={category} sub={s.slug} active={s.active} /> : <span className={`ad-pill ${s.active ? 'done' : 'wait'}`}>{s.active ? 'Đang hiện' : 'Ẩn'}</span>}
                {canEdit && (
                  <span className="app-subrow__acts">
                    <MoveButtons category={category} sub={s.slug} first={i === 0} last={i === subs.length - 1} />
                    <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => setOpen(`edit:${s.slug}`)}>Sửa</button>
                    <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)' }} onClick={() => setOpen(`del:${s.slug}`)}>Xóa</button>
                  </span>
                )}
              </div>
              {open === `edit:${s.slug}` && <SubForm category={category} sub={s} onDone={close} />}
              {open === `del:${s.slug}` && <SubDelete category={category} sub={s} others={subs.filter((o) => o.slug !== s.slug)} onDone={close} />}
            </div>
          ))}
        </div>
        {baseSpecs.length > 0 && (
          <span className="hint">Mọi nhóm con đều dùng bộ thông số chung: {baseSpecs.map((f) => f.name + (f.required ? ' *' : '')).join(', ')}.</span>
        )}
      </div>
    </div>
  );
}
