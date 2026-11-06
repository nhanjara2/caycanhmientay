'use client';

import Image from 'next/image';
import Link from '@/components/LocaleLink';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/components/LocaleLink';
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/lib/cart';
import { toggleSidebar, useSidebarOpen } from '@/lib/sidebar';
import { AccountMenu } from './AccountMenu';
import { DeliverToButton } from './DeliverTo';
import { NotificationBell } from './NotificationBell';
import { Icon } from './Icon';
import { LangSwitch } from './LangSwitch';

/**
 * Từ khóa chạy ngang dưới ô tìm kiếm (máy tính): từ khóa khách tìm thật (`trending`, server/monitor.ts trendingSearches)
 * đứng trước, còn chỗ thì lấy danh sách chọn tay này (cây đang bán) cho đủ TRENDING_COUNT.
 */
const TRENDING_COUNT = 16;
const TRENDING = [
  'Vạn lộc', 'Lưỡi hổ', 'Phú quý', 'Ngân hậu', 'Môn quan âm', 'Môn melo', 'Dạ lan thanh', 'Đuôi công', 'Đế vương',
  'Bạch mã hoàng tử', 'Vạn niên thanh', 'Ngọc ngân', 'Dương xỉ', 'Tùng thơm', 'Giữ tiền', 'Tắc cẩm thạch',
];

/** Chữ gợi ý trong ô tìm kiếm: gõ dần từng chữ, dừng một lúc, xóa rồi sang câu kế. Câu đầu = chữ máy chủ in sẵn. */
// Câu gợi ý: messages/<lang>.json → header.hints.
const HINT_TYPE_MS = 70;
const HINT_ERASE_MS = 28;
const HINT_HOLD_MS = 2200;

/** Chỉ xóa tới phần đầu giống câu kế ("Tìm cây" giữ lại), không xóa trắng cả ô. */
function sharedStart(a: string[], b: string[]) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

function useTypedHint(hints: string[], paused: boolean) {
  const [text, setText] = useState(hints[0]);
  const pos = useRef({ i: 0, n: Array.from(hints[0]).length, erasing: true });
  useEffect(() => {
    if (paused || hints.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const p = pos.current;
      const cur = Array.from(hints[p.i]);
      let wait = HINT_TYPE_MS;
      if (p.erasing) {
        const next = (p.i + 1) % hints.length;
        if (p.n > sharedStart(cur, Array.from(hints[next]))) {
          p.n--;
          wait = HINT_ERASE_MS;
        } else {
          p.i = next;
          p.erasing = false;
        }
      } else if (p.n < cur.length) {
        p.n++;
      } else {
        p.erasing = true;
        wait = HINT_HOLD_MS;
      }
      setText(Array.from(hints[p.i]).slice(0, p.n).join(''));
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, HINT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [hints, paused]);
  return text;
}

type SearchBoxProps = { placeholder?: string; below?: ReactNode };

/** Không truyền `placeholder` thì chữ gợi ý tự đổi câu (`HINTS`); truyền thì đứng yên. `below`: dải nằm ngay dưới ô, rộng bằng ô. */
export function SearchBox(props: SearchBoxProps) {
  return (
    <Suspense fallback={<SearchForm initial="" {...props} />}>
      <SearchWithParams {...props} />
    </Suspense>
  );
}

function SearchWithParams(props: SearchBoxProps) {
  const q = useSearchParams().get('q') ?? '';
  return <SearchForm key={q} initial={q} {...props} />;
}

/** Hai bản danh sách nối nhau, CSS kéo đúng một nửa rồi lặp nên chạy liền mạch; rê chuột / Tab vào thì dừng.
 *  HTML máy chủ chỉ có MỘT bản (máy tìm kiếm khỏi thấy từ khóa lặp — Google AI từng chê "nhồi từ khóa");
 *  bản thứ hai trình duyệt tự thêm sau khi chạy, có đủ hai bản mới bắt đầu chạy (`data-loop`). */
function trendingList(real: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of [...real.map((q) => q.charAt(0).toLocaleUpperCase('vi') + q.slice(1)), ...TRENDING]) {
    const key = k.toLocaleLowerCase('vi');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= TRENDING_COUNT) break;
  }
  return out;
}

function TrendingSearches({ real }: { real: string[] }) {
  const t = useTranslations('header');
  const list = trendingList(real);
  const [loop, setLoop] = useState(false);
  useEffect(() => setLoop(true), []);
  return (
    <nav className="app-trend" aria-label={t('trending')}>
      <span className="app-trend__label">
        <span>{t('trending')}</span>
      </span>
      {/* Tab tới link đang khuất làm khung tự cuộn — rời đi thì trả về đầu để vòng lặp không hở */}
      <div className="app-trend__view" onBlur={(e) => { e.currentTarget.scrollLeft = 0; }}>
        <ul className="app-trend__track" data-loop={loop || undefined}>
          {(loop ? [0, 1] : [0]).map((copy) =>
            list.map((k) => (
              <li key={`${copy}-${k}`} aria-hidden={copy === 1 || undefined}>
                <Link href={`/tim-kiem?q=${encodeURIComponent(k)}`} tabIndex={copy === 1 ? -1 : undefined}>
                  <Icon name="trend" />
                  {k}
                </Link>
              </li>
            )),
          )}
        </ul>
      </div>
    </nav>
  );
}

function SearchForm({ initial, placeholder, below }: SearchBoxProps & { initial: string }) {
  const router = useRouter();
  const t = useTranslations('header');
  const lang = useLocale();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hints = useMemo(() => t.raw('hints') as string[], [lang]);
  const [q, setQ] = useState(initial);
  // Ô đang có chữ thì chữ gợi ý không hiện — dừng đồng hồ.
  const hint = useTypedHint(hints, placeholder !== undefined || q !== '');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    // action + name="q": chưa chạy JavaScript (hoặc script lỗi) vẫn gửi đúng tới /tim-kiem?q=…, không sinh URL lạ trên trang đang xem (SEO mục 18)
    <form className="vx-search" role="search" action={lang === 'en' ? '/en/tim-kiem' : '/tim-kiem'} method="get" onSubmit={submit}>
      <input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder ?? hint} aria-label={t('search')} />
      <button className="vx-btn vx-btn--primary" aria-label={t('searchBtn')}>
        <Icon name="search" />
      </button>
      {below}
    </form>
  );
}

/** `nav`: thanh danh mục ngang (CategoryNav) — SiteChrome đọc danh mục trên server rồi truyền vào. */
export function Header({ nav, trending = [] }: { nav?: ReactNode; trending?: string[] }) {
  const { totals, ready } = useCart();
  const count = ready ? totals.count : 0;
  const menuOpen = useSidebarOpen();
  const t = useTranslations('header');

  return (
    <header className="vx-header app-header">
      <div className="vx-header__main">
        <button
          type="button"
          className="app-menubtn"
          aria-label={t('menu')}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? 'app-side' : undefined}
          onClick={toggleSidebar}
        >
          <Icon name="menu" />
          <span className="app-menubtn__t">{t('menuShort')}</span>
        </button>
        <Link href="/" className="vx-logo" aria-label={t('home')}>
          <Image src="/images/brand/logo-mark.png" alt="" width={362} height={239} className="app-logo-mark" priority />
          {/* Hai nửa tên: máy tính / tablet nằm một dòng, điện thoại xếp 2 dòng cạnh logo (kiểu Long Châu) */}
          <span className="app-logo-text"><span>Cây Cảnh</span> <span>Miền Tây</span></span>
        </Link>
        <SearchBox below={<TrendingSearches real={trending} />} />
        <DeliverToButton />
        <div className="vx-hactions">
          <LangSwitch />
          <NotificationBell />
          <AccountMenu />
          <Link href="/gio-hang" className="vx-cartbtn" aria-label={t('cartAria', { count })}>
            <Icon name="cart" />
            {count > 0 && <em key={count}>{count}</em>}
            <span className="app-hide-sm">{t('cart')}</span>
          </Link>
        </div>
      </div>
      {nav}
    </header>
  );
}
