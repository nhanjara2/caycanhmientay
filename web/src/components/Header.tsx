'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useCart } from '@/lib/cart';
import { AccountMenu } from './AccountMenu';
import { NotificationBell } from './NotificationBell';
import { Icon } from './Icon';

const KEYWORDS = ['Monstera', 'Kích rễ', 'Trị nấm', 'Đất kiểng lá', 'Chậu tự tưới', 'Lan hồ điệp', 'Phân tan chậm'];

export function SearchBox({ placeholder = 'Tìm cây, thuốc, phân bón, chậu…' }: { placeholder?: string }) {
  return (
    <Suspense fallback={<SearchForm initial="" placeholder={placeholder} />}>
      <SearchWithParams placeholder={placeholder} />
    </Suspense>
  );
}

function SearchWithParams({ placeholder }: { placeholder: string }) {
  const q = useSearchParams().get('q') ?? '';
  return <SearchForm key={q} initial={q} placeholder={placeholder} />;
}

function SearchForm({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form className="vx-search" role="search" onSubmit={submit}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Tìm kiếm" />
      <button className="vx-btn vx-btn--primary" aria-label="Tìm">
        <Icon name="search" />
      </button>
    </form>
  );
}

export function Header() {
  const { totals, ready } = useCart();
  const count = ready ? totals.count : 0;

  return (
    <header className="vx-header app-header">
      <div className="vx-header__main">
        <button
          type="button"
          className="app-menubtn"
          aria-label="Mở danh mục"
          onClick={() => document.body.toggleAttribute('data-sidebar-open')}
        >
          <Icon name="menu" />
        </button>
        <Link href="/" className="vx-logo">
          <Icon name="leaf" size={28} />
          <span className="app-logo-text">Cây Cảnh Miền Tây</span>
        </Link>
        <SearchBox />
        <div className="vx-loc">
          <Icon name="pin" size={18} />
          <span>
            <small>Giao đến</small>Q.1, TP.HCM
          </span>
        </div>
        <div className="vx-hactions">
          <NotificationBell />
          <AccountMenu />
          <Link href="/gio-hang" className="vx-cartbtn" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
            <Icon name="cart" />
            {count > 0 && <em>{count}</em>}
            <span className="app-hide-sm">Giỏ hàng</span>
          </Link>
        </div>
      </div>
      <nav className="vx-keywords" aria-label="Từ khóa gợi ý">
        {KEYWORDS.map((k) => (
          <Link key={k} href={`/tim-kiem?q=${encodeURIComponent(k)}`}>
            {k}
          </Link>
        ))}
      </nav>
    </header>
  );
}
