'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { votePostAction } from '@/app/actions/posts';
import { isQuote, QUOTE_TEXT, type Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { Thumb } from './Icon';

/** Khối "Dùng trong bài này": sản phẩm thật, thêm vào giỏ ngay (quy cách đầu tiên). */
export function ArticleProducts({ title, products }: { title: string; products: Product[] }) {
  const { add } = useCart();
  return (
    <div className="ar-prod">
      <b>{title}</b>
      {products.map((p) => {
        const o = p.options[0];
        return (
          <div key={p.slug} className="ar-mini">
            <Link href={`/san-pham/${p.slug}`} className="ad-thumb" aria-label={p.name}><Thumb src={p.images?.[0]} icon={p.icon} alt={p.name} /></Link>
            <Link href={`/san-pham/${p.slug}`} className="app-plain">{p.name}</Link>
            {o && <b className="pr">{isQuote(o) ? QUOTE_TEXT : money(o.price)}{p.options.length > 1 && <small> · {o.label}</small>}</b>}
            {o && (isQuote(o)
              ? <Link href={`/san-pham/${p.slug}`} className="vx-btn vx-btn--outline">Xem & hỏi giá</Link>
              : <button type="button" className="vx-btn vx-btn--primary" onClick={() => add(p, o.idx)}>Thêm vào giỏ</button>)}
          </div>
        );
      })}
    </div>
  );
}

const KEY = 'ccmt-post-votes';

/** "Bài viết có hữu ích?" — trình duyệt nhớ đã bấm để không đếm trùng. */
export function PostHelpful({ id }: { id: number }) {
  const [voted, setVoted] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const v = (JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>)[id];
      if (typeof v === 'boolean') setVoted(v);
    } catch {}
  }, [id]);
  const vote = (helpful: boolean) => {
    setVoted(helpful);
    try {
      const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>;
      localStorage.setItem(KEY, JSON.stringify({ ...all, [id]: helpful }));
    } catch {}
    votePostAction(id, helpful).catch(() => {});
  };
  return (
    <div className="ar-help">
      {voted === null ? (
        <>
          <span>Bài viết có hữu ích?</span>
          <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => vote(true)}>Có</button>
          <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => vote(false)}>Không</button>
        </>
      ) : (
        <span>{voted ? 'Cảm ơn bạn! Rất vui vì bài viết có ích.' : 'Cảm ơn bạn đã góp ý — chúng tôi sẽ viết rõ hơn.'}</span>
      )}
    </div>
  );
}

/** Chia sẻ: điện thoại mở bảng chia sẻ (Zalo, Messenger…), máy tính chép link. */
export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  };
  return (
    <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={share}>
      <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 14, height: 14 }} aria-hidden="true">
        <circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 11 7.6-4M8.2 13l7.6 4" />
      </svg>
      {done ? 'Đã chép link' : 'Chia sẻ'}
    </button>
  );
}

/** Mục lục bên trái: tô đậm mục đang đọc (tiêu đề cuối cùng đã lên tới 1/3 trên màn hình). */
export function TocLinks({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const heads = items.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    if (!heads.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Vạch đọc ở 1/3 trên màn hình (--header-h ghi bằng rem nên không parseFloat ra px được).
      const line = window.innerHeight / 3;
      // Cuộn tới đáy trang thì mục cuối luôn sáng (mục ngắn không bao giờ chạm mép trên).
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let cur = heads[0].id;
      for (const h of heads) if (h.getBoundingClientRect().top <= line) cur = h.id;
      setActive(atEnd ? heads[heads.length - 1].id : cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [items]);
  return <>{items.map((t) => <a key={t.id} href={`#${t.id}`} aria-current={t.id === active ? 'true' : undefined}>{t.text}</a>)}</>;
}
