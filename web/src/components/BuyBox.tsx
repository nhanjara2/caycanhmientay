'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { brandOf, cheapestOption, discountPct, isQuote, optionOrder, QUOTE_TEXT, SOLD_OUT_TEXT, type Product } from '@/lib/catalog';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { SALES_PHONE, ZALO_URL } from '@/lib/contact';
import { compact, money } from '@/lib/format';
import { starsText } from '@/lib/reviews';
import { WHOLESALE_QUOTE_URL } from '@/lib/partners';
import { computeTotals } from '@/lib/pricing';
import { seoNameOf } from '@/lib/seo-name';
import { useShipping } from '@/lib/shipping-client';
import type { PublicVoucher } from '@/lib/voucher-labels';
import { inScope, productScopeItem } from '@/lib/voucher-scope';
import { usePublicVouchers } from '@/lib/vouchers-client';
import { DeliverToNote } from './DeliverTo';
import { FlashPriceBar } from './FlashSale';
import { ClockPercentIcon, VoucherCheckIcon } from './FlashIcons';
import { Icon, Thumb } from './Icon';
import { WishlistHeart } from './WishlistHeart';
import { Select } from './Select';

/** Khối mua bên phải trang chi tiết (bố cục kiểu Shopee): tên → meta → khung giá → các hàng có nhãn
 *  (giá theo số lượng, mã giảm giá, vận chuyển, quy cách, số lượng) → Thêm vào giỏ / Mua ngay → khuyến mãi → mô tả ngắn → SpecTable. */
export function BuyBox({ product: p, category, wishlisted = false }: {
  product: Product;
  /** Tên danh mục / nhóm con (đọc từ database ở trang). */
  /** `extra` = nhóm con phụ (sản phẩm hiện ở nhiều nhóm). */
  category: { cat: string; sub?: string; extra?: { slug: string; name: string }[] };
  wishlisted?: boolean;
}) {
  const { add } = useCart();
  const { rules } = useShipping();
  // Sản phẩm không áp mã (admin đánh dấu) thì không hiện vé voucher
  const allVouchers = usePublicVouchers();
  const vouchers = p.noVoucher ? [] : allVouchers.filter((v) => inScope(v.scope, productScopeItem(p)));
  const partner = useAuth().user?.partner;
  const partnerPct = partner?.discount ?? 0;
  const partnerType = partner?.type;
  const router = useRouter();
  // Quy cách hiện theo giá thấp → cao; chọn sẵn quy cách rẻ nhất (khớp giá "Từ …" ở thẻ sản phẩm)
  const order = optionOrder(p.options);
  const [opt, setOpt] = useState(() => cheapestOption(p.options));
  const [qty, setQty] = useState(1);
  const u = p.options[opt];
  const quote = isQuote(u);
  // Quy cách đang chọn hết hàng: trang vẫn hiện giá, nhưng không cho vào giỏ — gọi / Zalo hỏi ngày có hàng (schema ghi OutOfStock)
  const out = !quote && Boolean(u.soldOut);
  const buyable = !quote && !out;
  const brand = brandOf(p);
  const pct = discountPct(u);
  // Giá theo số lượng: 1 cây = giá lẻ, mỗi 2 cây cùng quy cách = giá combo; giá sỉ công trình liên hệ báo giá
  const unit = p.unit.toLowerCase();
  const combo = u.combo2 && u.combo2 < 2 * u.price ? u.combo2 : 0;
  // % bớt thêm khi mua 2 (so với 2 lần giá lẻ) — sticker đỏ trên ô "Mua 2"
  const comboPct = combo ? Math.round((1 - combo / (2 * u.price)) * 100) : 0;
  const flash = !!p.flash && !quote;
  const payNow = quote ? 0 : computeTotals([{ ...u, qty, ship: p.ship }], 'pickup', 0, rules).goods;
  const quoteHref = partnerType ? `${WHOLESALE_QUOTE_URL}?loai=${partnerType}` : WHOLESALE_QUOTE_URL;

  // Khi nút "Mua ngay" đã cuộn khỏi màn hình (kể cả khuất sau đầu trang dính) thì hiện thanh mua dính ở đáy — mọi cỡ màn (trang sản phẩm dài ~6 màn hình).
  const ctaRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const head = document.querySelector<HTMLElement>('.app-header');
    const top = head && getComputedStyle(head).position !== 'static' ? head.offsetHeight : 0;
    const io = new IntersectionObserver(([e]) => setBar(!e.isIntersecting && e.boundingClientRect.top < top), { rootMargin: `-${top}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.body.toggleAttribute('data-buybar', bar);
    return () => document.body.removeAttribute('data-buybar');
  }, [bar]);
  const buyNow = () => {
    add(p, u.idx, qty);
    router.push('/gio-hang');
  };
  const stepper = (cls: string) => (
    <span className={cls}>
      <button type="button" aria-label="Giảm" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
      <span aria-live="polite">{qty}</span>
      <button type="button" aria-label="Tăng" disabled={qty >= 99} onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
    </span>
  );
  // Chưa có giá → hỏi giá; hết hàng → hỏi ngày có hàng
  const ask = out ? 'hàng' : 'giá';
  const contactLinks = (callCls: string, zaloCls: string, short = false) => (
    <>
      <a href={`tel:${SALES_PHONE}`} className={callCls}><Icon name="phone" />{short ? 'Gọi' : `Gọi hỏi ${ask}`}</a>
      <a href={ZALO_URL} target="_blank" rel="noreferrer" className={zaloCls}>{!short && <Icon name="chat" />}Hỏi {ask} qua Zalo</a>
    </>
  );

  return (
    <div className="vx-buy">
      <div className="vx-buy__brand">
        <span className="vx-badge vx-badge--origin">{p.origin}</span>
        <span>Thương hiệu: {brand ?? <Link href="/chinh-sach/gioi-thieu">Cây Cảnh Miền Tây</Link>}</span>
      </div>
      <h1 className="vx-buy__title">{seoNameOf(p)}</h1>
      <div className="vx-buy__meta">
        <span>{p.sku}</span>·
        {p.reviews > 0 ? (
          <>
            <span>{p.rating.toFixed(1)}</span>
            <span className="vx-stars">{starsText(p.rating)}</span>·
            <a href="#danh-gia">{p.reviews} đánh giá</a>
          </>
        ) : <a href="#danh-gia">Chưa có đánh giá</a>}
        ·<span>Đã bán {compact(p.sold)}</span>
      </div>
      {/* Sản phẩm Flash sale: dải đỏ đếm ngược liền trên khung giá (kiểu Shopee) */}
      <div className={flash ? 'app-ppwrap app-ppwrap--flash' : 'app-ppwrap'}>
      {flash && <FlashPriceBar />}
      <div className="app-pp">
        <div className="vx-buy__price">
          {quote ? <b className="app-quote">{QUOTE_TEXT}</b> : <><b>{money(u.price)}</b><span>/ {p.unit}</span></>}
          {/* Flash sale: vé voucher có dấu tích cuối dòng giá khi shop đang có mã giảm giá */}
          {flash && vouchers.length > 0 && <VoucherCheckIcon title={`Đơn này dùng được mã giảm giá: ${(vouchers.find((v) => v.kind === 'discount') ?? vouchers[0]).code}`} />}
        </div>
        {u.oldPrice && !quote && (
          <div className="vx-buy__old">
            <s>{money(u.oldPrice)}</s>
            {flash && <ClockPercentIcon />}
            <span className="vx-badge vx-badge--sale">-{pct}%</span>
          </div>
        )}
        {out && <span className="app-soldout" data-stock="out">{SOLD_OUT_TEXT}</span>}
        {p.options.length > 1 && <small className="app-pp__opt">Giá cho quy cách <b>{u.label}</b></small>}
      </div>
      </div>
      <div className="app-prows">
        {buyable && (
          <div className="app-prow app-prow--stack-md">
            <span className="app-prow__k">Giá theo số lượng</span>
            <div className="app-prow__v">
              {/* Ô bấm được, mỗi ô chỉ 2 dòng (nhãn + giá): Mua 1 → số lượng 1, Mua 2 (giá combo) → số lượng 2 (đang ≥ 2 thì giữ); Giá sỉ → form báo giá */}
              <div className="app-tiers app-tiers--tiles" role="group" aria-label="Giá theo số lượng">
                <button type="button" className="app-tiers__row" aria-pressed={!(combo && qty >= 2)} data-on={!(combo && qty >= 2) || undefined} onClick={() => setQty(1)}>
                  <span>Mua 1 {unit}</span><b>{money(u.price)}</b>
                </button>
                {combo > 0 && (
                  <button type="button" className="app-tiers__row" aria-pressed={qty >= 2} data-on={qty >= 2 || undefined} onClick={() => setQty((q) => Math.max(2, q))}>
                    <span>Mua 2 {unit}</span><b>{money(combo)}</b>
                    {comboPct > 0 && <em className="app-tiers__off">-{comboPct}%</em>}
                  </button>
                )}
                <Link href={quoteHref} className="app-tiers__row app-tiers__row--link app-plain">
                  <span>Giá sỉ</span><b>Liên hệ</b>
                </Link>
              </div>
            </div>
          </div>
        )}
        {!quote && (vouchers.length > 0 || partnerPct > 0) && (
          <div className="app-prow">
            <span className="app-prow__k">Mã giảm giá</span>
            <div className="app-prow__v">
              {vouchers.length > 0 && <VoucherStrip vouchers={vouchers} />}
              {partnerPct > 0 && <small className="app-prow__note">Bạn được chiết khấu đối tác thêm <b>{partnerPct}%</b>.</small>}
            </div>
          </div>
        )}
        <div className="app-prow">
          <span className="app-prow__k">Vận chuyển</span>
          <div className="app-prow__v"><DeliverToNote ship={p.ship} bulky={Boolean(u.bulky)} /></div>
        </div>
        <div className="app-prow">
          <span className="app-prow__k" id="buy-opt">{p.options.length > 1 ? `Chọn quy cách (${p.options.length})` : 'Quy cách'}</span>
          <div className="app-prow__v">
            {/* Chỉ có 1 quy cách vẫn hiện thành ô đã chọn sẵn (có dấu ✓), không ghi chữ trơn */}
            <div className="app-vopts" role="group" aria-labelledby="buy-opt">
              {order.map((i) => {
                const o = p.options[i];
                return (
                  <button key={o.label} type="button" className="app-vopt" aria-pressed={i === opt} onClick={() => setOpt(i)} data-stock={!isQuote(o) && o.soldOut ? 'out' : undefined}>
                    <span className="app-vopt__l">{o.label}</span>
                    <small>{isQuote(o) ? 'Liên hệ báo giá' : money(o.price)}</small>
                    {!isQuote(o) && o.soldOut && <small className="app-vopt__out">{SOLD_OUT_TEXT}</small>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {buyable && (
          <div className="app-prow">
            <span className="app-prow__k">Số lượng</span>
            <div className="app-prow__v app-qtyrow">{stepper('vx-stepper')}</div>
          </div>
        )}
      </div>
      {!buyable ? (
        <div className="vx-buy__cta" ref={ctaRef}>
          {contactLinks('vx-btn vx-btn--primary vx-btn--lg', 'vx-btn vx-btn--soft vx-btn--lg')}
        </div>
      ) : (
        <div className="vx-buy__cta app-buycta" ref={ctaRef}>
          <button type="button" className="vx-btn vx-btn--outline vx-btn--lg app-buycta__add" onClick={() => add(p, u.idx, qty)}>
            <Icon name="cart" />
            Thêm vào giỏ hàng
          </button>
          <button type="button" className="vx-btn vx-btn--primary vx-btn--lg app-buycta__buy" onClick={buyNow}>
            <span>Mua ngay</span><small>{money(payNow)}</small>
          </button>
        </div>
      )}
      {/* Thanh mua dính đáy: điện thoại = ảnh + tên + giá trên, Gọi / Thêm vào giỏ / Mua ngay dưới; máy tính = một hàng nổi giữa màn hình có chọn quy cách + số lượng */}
      <div className="app-buybar" data-show={bar || undefined} inert={!bar}>
        <div className="app-buybar__prod">
          <span className="app-buybar__img"><Thumb src={p.images?.[0]} icon={p.icon} /></span>
          <span className="app-buybar__info">
            <b className="app-buybar__name" title={seoNameOf(p)}>{p.name}</b>
            <small className="app-buybar__meta">{p.options.length > 1 ? u.label : p.unit}{buyable && qty > 1 && ` · SL ${qty}`}{out && ` · ${SOLD_OUT_TEXT}`}</small>
          </span>
          <span className="app-buybar__price">
            {quote ? <b className="app-quote">{QUOTE_TEXT}</b> : <b>{money(u.price)}</b>}
            {u.oldPrice && !quote && <span><s>{money(u.oldPrice)}</s>{pct > 0 && <em className="vx-badge vx-badge--sale">-{pct}%</em>}</span>}
          </span>
        </div>
        {p.options.length > 1 && (
          <label className="app-buybar__opt">
            <span className="app-sr">Chọn quy cách</span>
            <Select value={opt} onChange={(e) => setOpt(Number(e.target.value))}>
              {order.map((i) => <option key={p.options[i].label} value={i}>{p.options[i].label}{p.options[i].soldOut && !isQuote(p.options[i]) ? ` (${SOLD_OUT_TEXT})` : ''}</option>)}
            </Select>
          </label>
        )}
        {buyable && stepper('vx-stepper app-buybar__qty')}
        {!buyable ? (
          <div className="app-buybar__acts">
            {contactLinks('vx-btn vx-btn--outline vx-btn--lg app-buybar__call', 'vx-btn vx-btn--primary vx-btn--lg app-buybar__buy', true)}
          </div>
        ) : (
          <div className="app-buybar__acts">
            <a href={`tel:${SALES_PHONE}`} className="vx-btn vx-btn--outline vx-btn--lg app-buybar__call"><Icon name="phone" />Gọi</a>
            <button type="button" className="vx-btn vx-btn--outline vx-btn--lg app-buybar__add" onClick={() => add(p, u.idx, qty)}>
              <Icon name="cart" />Thêm vào giỏ
            </button>
            <button type="button" className="vx-btn vx-btn--primary vx-btn--lg app-buybar__buy" onClick={buyNow}>
              <span>Mua ngay</span><small>{money(payNow)}</small>
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <WishlistHeart slug={p.slug} active={wishlisted} className="vx-btn vx-btn--ghost vx-btn--sm" labels={{ on: 'Đã lưu vào yêu thích', off: 'Lưu vào yêu thích' }} />
      </div>
      <div className="vx-promo">
        <div className="vx-promo__head"><Icon name="gift" />Tặng 1 gói phân tan chậm 100g khi mua kèm đất trộn</div>
        <div className="vx-promo__row"><Icon name="chat" />Cần tư vấn? <a href={ZALO_URL} target="_blank" rel="noreferrer" className="vx-link">Chat Zalo với kỹ sư</a></div>
      </div>
      <MoreInfo>
      <p className="vx-lead">{p.lead}</p>
      <dl className="vx-spec-t">
        {p.specs.map(([k, v]) => (
          <SpecRow key={k} k={k} v={v} />
        ))}
        <dt>Danh mục</dt>
        <dd>
          <Link href={`/danh-muc/${p.category}/${p.sub}`} style={{ display: 'inline' }}>{category.sub ?? category.cat}</Link>
          {category.extra?.map((s) => (
            <span key={s.slug}>, <Link href={`/danh-muc/${p.category}/${s.slug}`} style={{ display: 'inline' }}>{s.name}</Link></span>
          ))}
        </dd>
      </dl>
      </MoreInfo>
    </div>
  );
}

/** "1 triệu", "1,5 triệu" cho số tròn trăm nghìn từ 1 triệu; còn lại ghi đủ. */
const moneyShort = (n: number) => (n >= 1e6 && n % 1e5 === 0 ? `${String(n / 1e6).replace('.', ',')} triệu` : money(n));

/** "10%" / "50.000đ" — mức giảm ngắn của mã ở hàng Mã giảm giá. */
const voucherShort = (v: PublicVoucher) => (v.discountType === 'percent' ? `${v.discountValue}%` : money(v.discountValue));

/** Thứ tự vé: mã miễn phí giao + mã giảm giá dễ đạt nhất (đơn tối thiểu thấp nhất) đứng đầu, còn lại theo đơn tối thiểu tăng dần. */
function orderVouchers(list: PublicVoucher[]) {
  const easy = [...list].sort((a, b) => a.minOrder - b.minOrder);
  const first = (['ship', 'discount'] as const).flatMap((k) => easy.find((v) => v.kind === k) ?? []);
  return [...first, ...easy.filter((v) => !first.includes(v))];
}

const STRIP_PAD = 44; // chỗ nút ‹ › che ở hai mép (px)

/** Hàng vé mã giảm giá: một hàng cuộn ngang (vuốt được) + nút ‹ › hiện khi còn vé khuất — không xuống dòng. */
function VoucherStrip({ vouchers }: { vouchers: PublicVoucher[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ prev: false, next: false });
  const list = orderVouchers(vouchers);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const prev = el.scrollLeft > 4;
      const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setEdge((e) => (e.prev === prev && e.next === next ? e : { prev, next }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [vouchers.length]);

  // Cuộn tới đúng mép một vé: › đưa vé đang bị khuất bên phải về đầu hàng, ‹ lùi lại gần một màn
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const view = el.clientWidth - STRIP_PAD * 2;
    const target = dir > 0
      ? items.find((it) => it.offsetLeft + it.offsetWidth > el.scrollLeft + el.clientWidth - STRIP_PAD)
      : items.find((it) => it.offsetLeft - STRIP_PAD >= el.scrollLeft - view);
    let left = target ? target.offsetLeft - STRIP_PAD : el.scrollLeft + dir * view;
    if (Math.abs(left - el.scrollLeft) < 8) left = el.scrollLeft + dir * view;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: Math.max(0, left), behavior: calm ? 'auto' : 'smooth' });
  };

  return (
    <div className="app-vstrip" data-prev={edge.prev || undefined} data-next={edge.next || undefined}>
      <ul className="app-vtags" ref={ref}>
        {list.map((v) => (
          <li key={v.code} className="app-vtag" data-kind={v.kind}>
            <span className="app-vtag__stub" aria-hidden="true"><Icon name={v.kind === 'ship' ? 'truck' : 'tag'} /></span>
            <span className="app-vtag__body">
              <b>{v.kind === 'ship' ? `Freeship ${money(v.discountValue)}` : `Giảm ${voucherShort(v)}`}</b>
              {v.minOrder > 0 && <small>Đơn từ {moneyShort(v.minOrder)}</small>}
            </span>
          </li>
        ))}
      </ul>
      {edge.prev && <button type="button" className="app-vstrip__nav app-vstrip__nav--prev" aria-label="Xem mã trước" onClick={() => go(-1)}><Icon name="chevron" /></button>}
      {edge.next && <button type="button" className="app-vstrip__nav app-vstrip__nav--next" aria-label="Xem mã tiếp theo" onClick={() => go(1)}><Icon name="chevron" /></button>}
    </div>
  );
}

/** Mô tả + bảng thông số dài (cây có 15–17 thông số) thì thu gọn, nút "Xem tất cả thông tin" mở ra. */
function MoreInfo({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    // Thu gọn còn 18rem (điện thoại 24rem); chỉ thu khi dài hơn hẳn (> 30rem) để không giấu đi vài dòng lẻ
    const check = () => setLong(el.offsetHeight > 30 * parseFloat(getComputedStyle(document.documentElement).fontSize));
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const toggle = () => {
    setOpen((o) => !o);
    // Thu gọn khi đã cuộn xuống dưới: đưa đầu khối về lại màn hình, khỏi bị hụt mất chỗ đang đọc
    const el = box.current;
    if (open && el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  };
  return (
    <div className="app-more" ref={box} data-long={long || undefined} data-open={open || undefined}>
      <div className="app-more__body" id="thong-tin-sp" onFocusCapture={(e) => {
        if (!long || open) return;
        // Tab vào link nằm trong phần đang thu gọn: mở ra rồi cuộn lại tới đúng chỗ đang focus (khối giãn ra làm nó trôi khỏi màn hình)
        setOpen(true);
        const t = e.target as HTMLElement;
        requestAnimationFrame(() => t.scrollIntoView({ block: 'nearest' }));
      }}>
        <div ref={inner}>{children}</div>
      </div>
      {long && (
        <button type="button" className="app-more__btn" aria-expanded={open} aria-controls="thong-tin-sp" onClick={toggle}>
          <Icon name="chevron" />{open ? 'Thu gọn' : 'Xem tất cả thông tin'}
        </button>
      )}
    </div>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  const warn = k === 'An toàn thú cưng' && v.startsWith('Không');
  return (
    <>
      <dt>{k}</dt>
      <dd className={warn ? 'warn' : undefined}>{v}</dd>
    </>
  );
}
