'use client';

/**
 * Ô chọn tự vẽ thay cho <select> (bảng xổ mặc định của trình duyệt xấu và không chỉnh được kiểu).
 * Dùng y như <select>: con là <option> / <optgroup>, nhận value / defaultValue / name / id / disabled / required,
 * onChange nhận `e.target.value` — đổi `<select` thành `<Select` là chạy.
 * - Máy tính / tablet: bảng xổ dưới ô (sát đáy màn hình thì tự lật lên trên), cuộn trang thì bám theo ô.
 * - Điện thoại < 768px: bảng trượt từ dưới lên, dòng cao 52px, chữ 17px, có tiêu đề + nút Đóng.
 * - Bàn phím: ↑ ↓ Home End PageUp PageDown, Enter / Space chọn, Esc đóng, gõ chữ để nhảy (không phân biệt dấu).
 * - Có `name` thì kèm ô ẩn để form gửi đi được (cả form của server component); `required` vẫn được trình duyệt kiểm tra.
 * Bảng xổ gắn vào <body> (portal) nên không bị cắt bởi khung cuộn / hộp thoại.
 */

import {
  Children, Fragment, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type KeyboardEvent, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type Opt = { value: string; label: string; disabled: boolean; group?: string };

export type SelectChange = { target: { value: string; name: string } };

type Props = {
  children: ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: SelectChange) => void;
  id?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
};

const SHEET_MQ = '(max-width: 47.9375em)';

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

function collect(children: ReactNode, out: Opt[], group?: string) {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const p = c.props as { value?: string | number; label?: string; disabled?: boolean; children?: ReactNode };
    if (c.type === 'option') {
      const label = (p.label ?? textOf(p.children)).replace(/\s+/g, ' ').trim();
      out.push({ value: p.value !== undefined ? String(p.value) : label, label, disabled: !!p.disabled, group });
    } else if (c.type === 'optgroup') {
      collect(p.children, out, p.label);
    } else if (c.type === Fragment) {
      collect(p.children, out, group);
    }
  });
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

const Chevron = () => (
  <svg className="app-select__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const Check = () => (
  <svg className="app-select__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

export function Select({
  children, value, defaultValue, onChange, id, name, className, style, disabled, required, 'aria-label': ariaLabel,
}: Props) {
  const opts: Opt[] = [];
  collect(children, opts);

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => (defaultValue !== undefined ? String(defaultValue) : opts.find((o) => !o.disabled)?.value ?? ''));
  const current = controlled ? String(value) : inner;
  const found = opts.findIndex((o) => o.value === current);
  const selIdx = found >= 0 ? found : opts.length ? 0 : -1;   // như <select>: giá trị lạ thì hiện mục đầu
  const shown = selIdx >= 0 ? opts[selIdx].label : '';

  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [active, setActive] = useState(-1);
  const [title, setTitle] = useState('');
  const uid = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ s: '', t: 0 });
  const optId = (i: number) => `${uid}-o${i}`;
  const listId = `${uid}-list`;

  const labelText = () => {
    if (ariaLabel) return ariaLabel;
    const b = btnRef.current;
    const l = b?.labels?.[0];
    if (!b || !l) return '';
    let t = '';
    l.childNodes.forEach((n) => { if (!n.contains(b)) t += n.textContent ?? ''; });
    return t.replace(/\s+/g, ' ').replace(/\s*\*$/, '').trim();
  };

  const enabledFrom = (start: number, step: 1 | -1) => {
    for (let i = start; i >= 0 && i < opts.length; i += step) if (!opts[i].disabled) return i;
    return -1;
  };

  const show = (at?: number) => {
    if (disabled || !opts.length) return;
    setSheet(window.matchMedia(SHEET_MQ).matches);
    setTitle(labelText());
    setActive(at ?? (selIdx >= 0 && !opts[selIdx].disabled ? selIdx : enabledFrom(0, 1)));
    setOpen(true);
    btnRef.current?.focus({ preventScroll: true });   // Safari không tự đặt con trỏ vào nút khi bấm chuột
  };
  const close = useCallback(() => setOpen(false), []);

  const pick = (i: number) => {
    const o = opts[i];
    if (!o || o.disabled) return;
    setOpen(false);
    btnRef.current?.focus({ preventScroll: true });
    if (o.value === current) return;
    if (!controlled) setInner(o.value);
    onChange?.({ target: { value: o.value, name: name ?? '' } });
  };

  // Đặt bảng xổ cạnh ô (chế độ bảng trượt dưới đáy do CSS lo)
  const place = useCallback(() => {
    const b = btnRef.current, pop = popRef.current, list = listRef.current;
    if (!b || !pop || !list || pop.dataset.sheet !== undefined) return;
    const r = b.getBoundingClientRect();
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) { setOpen(false); return; }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const margin = 8, gap = 4;
    const below = vh - r.bottom - gap - margin, above = r.top - gap - margin;
    const fs = parseFloat(getComputedStyle(b).fontSize);
    pop.style.fontSize = fs > 15 ? `${fs}px` : '';   // ô chữ to (form địa chỉ) thì bảng xổ cũng chữ to
    const want = list.scrollHeight + 2;
    const up = below < Math.min(want, 13 * rem) && above > below;
    pop.style.maxHeight = `${Math.max(7 * rem, Math.min(22 * rem, up ? above : below))}px`;
    pop.style.minWidth = `${Math.min(r.width, vw - margin * 2)}px`;
    pop.style.top = up ? '' : `${r.bottom + gap}px`;
    pop.style.bottom = up ? `${vh - r.top + gap}px` : '';
    pop.style.left = '0px';
    pop.style.left = `${Math.max(margin, Math.min(r.left, vw - pop.offsetWidth - margin))}px`;
    pop.dataset.side = up ? 'top' : 'bottom';
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const list = listRef.current;
    const sel = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.offsetHeight / 2;
  }, [open, sheet, place]);

  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => t instanceof Node && (!!btnRef.current?.contains(t) || !!popRef.current?.contains(t));
    const onDown = (e: PointerEvent) => {
      if (inside(e.target) || (e.target as Element | null)?.classList?.contains('app-select__backdrop')) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => { if (!popRef.current?.contains(e.target as Node)) place(); };
    const onResize = () => { if (window.matchMedia(SHEET_MQ).matches !== sheet) setOpen(false); else place(); };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    let restore: (() => void) | undefined;
    if (sheet) {
      const html = document.documentElement, prev = html.style.overflow;
      html.style.overflow = 'hidden';
      restore = () => { html.style.overflow = prev; };
    }
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      restore?.();
    };
  }, [open, sheet, place]);

  // Giữ mục đang trỏ trong tầm nhìn — chỉ cuộn danh sách (scrollIntoView sẽ cuộn cả trang khi bảng đang trượt lên)
  useEffect(() => {
    const list = listRef.current, el = open && active >= 0 ? document.getElementById(`${uid}-o${active}`) : null;
    if (!list || !el) return;
    const top = el.offsetTop, bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 4;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 4;
  }, [open, active, uid]);

  const typeahead = (ch: string, from: number) => {
    const now = Date.now(), st = typed.current;
    st.s = now - st.t > 700 ? ch : st.s + ch;
    st.t = now;
    const q = fold(st.s);
    const repeat = [...q].every((c) => c === q[0]);
    const needle = repeat ? q[0] : q;
    const start = st.s.length === 1 || repeat ? from + 1 : Math.max(from, 0);
    for (let k = 0; k < opts.length; k++) {
      const i = (start + k) % opts.length;
      const l = fold(opts[i].label);   // khớp đầu nhãn hoặc đầu một từ: "can" → "TP. Cần Thơ"
      if (!opts[i].disabled && (l.startsWith(needle) || l.includes(` ${needle}`))) return i;
    }
    return -1;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    const printable = k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (!open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); show(); }
      else if (printable) { const i = typeahead(k, selIdx); if (i >= 0) { e.preventDefault(); show(i); } }
      return;
    }
    const step = (from: number, by: number) => {
      const dir = by > 0 ? 1 : -1;
      const target = Math.max(0, Math.min(opts.length - 1, from + by));
      const i = enabledFrom(target, dir);
      return i >= 0 ? i : enabledFrom(target, dir === 1 ? -1 : 1);
    };
    const typing = Date.now() - typed.current.t < 700 && typed.current.s !== '';
    switch (k) {
      case 'ArrowDown': e.preventDefault(); setActive((a) => step(a, 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive((a) => step(a < 0 ? opts.length : a, -1)); break;
      case 'PageDown': e.preventDefault(); setActive((a) => step(a, 10)); break;
      case 'PageUp': e.preventDefault(); setActive((a) => step(a, -10)); break;
      case 'Home': e.preventDefault(); setActive(enabledFrom(0, 1)); break;
      case 'End': e.preventDefault(); setActive(enabledFrom(opts.length - 1, -1)); break;
      case 'Enter': e.preventDefault(); pick(active); break;
      case ' ':
        e.preventDefault();
        if (typing) { const i = typeahead(k, active); if (i >= 0) setActive(i); } else pick(active);
        break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); setOpen(false); break;   // không để hộp thoại phía ngoài đóng theo
      case 'Tab': setOpen(false); break;
      default:
        if (printable) { e.preventDefault(); const i = typeahead(k, active); if (i >= 0) setActive(i); }
    }
  };

  let lastGroup: string | undefined;
  const pop = open && createPortal(
    <>
      {sheet && <div className="app-select__backdrop" onClick={close} aria-hidden="true" />}
      <div
        ref={popRef}
        className="app-select__pop"
        data-sheet={sheet ? '' : undefined}
        onMouseDown={(e) => e.preventDefault()}   // giữ con trỏ ở nút, không bôi đen chữ
        onClick={(e) => e.stopPropagation()}       // không để cú bấm lọt lên thẻ / hộp thoại chứa ô chọn
        onPointerDown={(e) => e.stopPropagation()}
      >
        {sheet && (
          <div className="app-select__head">
            <span>{title || 'Chọn'}</span>
            <button type="button" className="app-select__close" onClick={close}>Đóng</button>
          </div>
        )}
        <div ref={listRef} id={listId} className="app-select__list" role="listbox" aria-label={title || undefined}>
          {opts.map((o, i) => {
            const head = o.group !== lastGroup && o.group ? <div className="app-select__group" role="presentation">{o.group}</div> : null;
            lastGroup = o.group;
            return (
              <Fragment key={`${i}-${o.value}`}>
                {head}
                <div
                  id={optId(i)}
                  role="option"
                  aria-selected={i === selIdx}
                  aria-disabled={o.disabled || undefined}
                  data-active={i === active ? '' : undefined}
                  className="app-select__opt"
                  onMouseMove={() => { if (!o.disabled && active !== i) setActive(i); }}
                  onClick={() => pick(i)}
                >
                  <span>{o.label}</span>
                  {i === selIdx && <Check />}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id={id}
        className={`app-select${className ? ` ${className}` : ''}`}
        style={style}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span className="app-select__val">
          <span className="app-select__cur">{shown}</span>
          {opts.map((o, i) => <span key={i} className="app-select__size" aria-hidden="true">{o.label}</span>)}
        </span>
        <Chevron />
      </button>
      {(name || required) && (
        <input
          className="app-select__native"
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={selIdx >= 0 ? opts[selIdx].value : ''}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          onFocus={() => btnRef.current?.focus()}
        />
      )}
      {pop}
    </>
  );
}
