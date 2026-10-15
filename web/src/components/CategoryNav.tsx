'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { discountPct, QUOTE_TEXT, type Category } from '@/lib/catalog';
import { ZALO_URL } from '@/lib/contact';
import { money } from '@/lib/format';
import { shortCategoryName, type MegaMenuData, type MegaProduct } from '@/lib/mega-menu';
import { Art, Icon, type IconName } from './Icon';
import { thumbUrl } from '@/lib/images';

/** Lối tắt riêng của vài danh mục hệ thống (theo slug trong SYSTEM_CATEGORIES). */
const SHORTCUTS: Record<string, { href: string; label: string; icon: IconName }[]> = {
  'cay-canh': [{ href: '/tu-van-chon-cay', label: 'Tư vấn chọn cây theo không gian', icon: 'spark' }],
  'thuoc-bvtv': [
    { href: '/benh-cay', label: 'Tra cứu theo bệnh cây', icon: 'bug' },
    { href: '/chinh-sach/thuoc-bvtv-an-toan', label: 'Hướng dẫn dùng thuốc an toàn', icon: 'shield' },
  ],
};

const OPEN_DELAY = 140; // rê chuột lướt qua thanh thì chưa mở
const CLOSE_DELAY = 220; // chuột trượt ra mép một chút thì chưa đóng
const TTL = 5 * 60_000;

// Tải một lần cho cả trang (chuyển trang trong web vẫn giữ), làm mới sau 5 phút; lỗi mạng thì lần rê sau tải lại.
let cached: { at: number; p: Promise<MegaMenuData | null> } | undefined;
function loadMega() {
  if (!cached || Date.now() - cached.at > TTL) {
    const p = fetch('/api/mega-menu')
      .then((r) => (r.ok ? (r.json() as Promise<MegaMenuData>) : null))
      .catch(() => null)
      .then((d) => {
        if (!d) cached = undefined;
        return d;
      });
    cached = { at: Date.now(), p };
  }
  return cached.p;
}

/**
 * Thanh danh mục ngang dưới đầu trang (máy tính ≥ 1024px, trang không có menu trái): rê chuột / bấm ▾ mở bảng xổ —
 * cột trái là nhóm con, bên phải là sản phẩm bán chạy của nhóm đang trỏ. Tablet / điện thoại đã có nút "Danh mục" ở Header.
 */
export function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [sub, setSub] = useState('');
  const [data, setData] = useState<MegaMenuData | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const warm = useCallback(() => {
    if (!data) loadMega().then((d) => d && setData(d));
  }, [data]);

  const show = useCallback((slug: string | null) => {
    clearTimeout(timer.current);
    setOpen(slug);
    setSub('');
  }, []);

  // đổi trang (bấm link trong bảng) → đóng
  useEffect(() => show(null), [pathname, show]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      navRef.current?.querySelector<HTMLElement>(`[data-cat="${open}"] .app-catnav__tog`)?.focus();
      show(null);
    };
    const onDown = (e: globalThis.PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) show(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, show]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // chỉ chuột mới mở / đóng theo rê; cảm ứng dùng nút ▾
  const enterItem = (slug: string) => (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    if (open) {
      if (open !== slug) show(slug);
    } else timer.current = setTimeout(() => show(slug), OPEN_DELAY);
  };
  // rê sang mục không có bảng xổ (Khuyến mãi…) → đóng bảng đang mở
  const enterLink = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    if (open) timer.current = setTimeout(() => show(null), CLOSE_DELAY);
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    if (open) timer.current = setTimeout(() => show(null), CLOSE_DELAY);
  };
  const enterPanel = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') clearTimeout(timer.current);
  };

  const cat = categories.find((c) => c.slug === open);
  const key = cat ? (sub ? `${cat.slug}/${sub}` : cat.slug) : '';
  const subName = cat && sub ? cat.subs.find((s) => s.slug === sub)?.name : undefined;
  const href = cat ? `/danh-muc/${cat.slug}${sub ? `/${sub}` : ''}` : '/';
  const items = data && key ? (data.top[key] ?? []).map((s) => data.products[s]).filter(Boolean) : [];

  // bảng xổ nằm ngay sau nút ▾ của mục đang mở → bấm Tab từ nút đi thẳng vào bảng
  const panel = cat && (
    <div className="app-mm" id="app-mm" onPointerEnter={enterPanel} data-subs={cat.subs.length > 0 || undefined}>
      {cat.subs.length > 0 && (
        <ul className="app-mm__side">
          <li>
            <Link href={`/danh-muc/${cat.slug}`} data-active={!sub || undefined} onPointerEnter={() => setSub('')} onFocus={() => setSub('')}>
              <span>Tất cả {cat.name}</span>
              {data && <small>{data.counts[cat.slug] ?? 0}</small>}
              <Icon name="chevron" className="chev" />
            </Link>
          </li>
          {cat.subs.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/danh-muc/${cat.slug}/${s.slug}`}
                data-active={sub === s.slug || undefined}
                onPointerEnter={() => setSub(s.slug)}
                onFocus={() => setSub(s.slug)}
              >
                <span>{s.name}</span>
                {data && <small>{data.counts[`${cat.slug}/${s.slug}`] ?? 0}</small>}
                <Icon name="chevron" className="chev" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="app-mm__body">
        <div className="app-mm__head">
          <span className="app-mm__title">
            Bán chạy <span>· {subName ?? cat.name}</span>
          </span>
          <Link href={href} className="vx-link app-mm__all" aria-label={`Xem tất cả ${subName ?? cat.name}`}>
            Xem tất cả <Icon name="chevron" />
          </Link>
        </div>
        {!data ? (
          <div className="app-mm__grid" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="app-mm__card app-mm__card--skel">
                <span className="app-mm__img" />
                <span className="app-mm__skline" />
                <span className="app-mm__skline app-mm__skline--short" />
              </span>
            ))}
          </div>
        ) : items.length ? (
          <div className="app-mm__grid">
            {items.map((p) => <MiniCard key={p.slug} p={p} />)}
          </div>
        ) : (
          <p className="app-mm__empty">
            {sub ? (
              <>Nhóm này chưa có sản phẩm đang bán. <Link href={`/danh-muc/${cat.slug}`} className="vx-link">Xem cả danh mục {cat.name}</Link></>
            ) : (
              <>Danh mục này đang cập nhật sản phẩm. <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="vx-link">Hỏi hàng qua Zalo</a></>
            )}
          </p>
        )}
        {SHORTCUTS[cat.slug] && (
          <div className="app-mm__tips">
            {SHORTCUTS[cat.slug].map((s) => (
              <Link key={s.href} href={s.href}>
                <Icon name={s.icon} />{s.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <nav className="app-catnav" aria-label="Danh mục sản phẩm" ref={navRef} onPointerEnter={warm} onFocus={warm} onPointerLeave={leave}>
      <ul className="app-catnav__bar">
        {categories.map((c) => (
          <li key={c.slug} data-cat={c.slug} data-open={open === c.slug || undefined} onPointerEnter={enterItem(c.slug)}>
            <Link href={`/danh-muc/${c.slug}`} className="app-catnav__link" title={c.name}>
              {shortCategoryName(c.name)}
            </Link>
            <button
              type="button"
              className="app-catnav__tog"
              aria-expanded={open === c.slug}
              aria-controls="app-mm"
              aria-label={`Xem nhóm hàng và sản phẩm bán chạy: ${c.name}`}
              onClick={() => {
                warm();
                show(open === c.slug ? null : c.slug);
              }}
            >
              <Icon name="chevron" />
            </button>
            {open === c.slug && panel}
          </li>
        ))}
        <li className="app-catnav__extra app-catnav__extra--sale" onPointerEnter={enterLink}>
          <Link href="/khuyen-mai" className="app-catnav__link">
            <Icon name="tag" />Khuyến mãi
          </Link>
        </li>
        <li className="app-catnav__extra app-catnav__extra--wide" onPointerEnter={enterLink}>
          <Link href="/doi-tac" className="app-catnav__link">
            <Icon name="box" />Đối tác sỉ
          </Link>
        </li>
      </ul>

    </nav>
  );
}

function MiniCard({ p }: { p: MegaProduct }) {
  const pct = discountPct({ price: p.price, oldPrice: p.oldPrice ?? undefined });
  return (
    <Link href={`/san-pham/${p.slug}`} className="app-mm__card" title={p.name}>
      <span className="app-mm__img">
        {p.image ? <img src={thumbUrl(p.image, 320)} alt="" width={320} height={320} loading="lazy" /> : <Art name={p.icon} />}
        {pct > 0 && <span className="vx-badge vx-badge--sale">-{pct}%</span>}
      </span>
      <span className="app-mm__name">{p.name}</span>
      <span className="app-mm__price">
        {p.price > 0 ? (
          <>
            {p.from && <small>Từ </small>}
            <b>{money(p.price)}</b> <small>/ {p.unit}</small>
          </>
        ) : (
          <span className="app-quote">{QUOTE_TEXT}</span>
        )}
      </span>
      {p.oldPrice && p.price > 0 ? <s className="app-mm__old">{money(p.oldPrice)}</s> : null}
    </Link>
  );
}
