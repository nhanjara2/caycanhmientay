import Link from 'next/link';
import type { ReactNode } from 'react';
import { SALES_PHONE } from '@/lib/contact';
import type { ServiceType } from '@/lib/service-labels';
import { SERVICE_ORDER, SERVICE_PAGES, SERVICES_URL } from '@/lib/services';
import { Icon, type IconName } from './Icon';

export { QUOTE_URL } from '@/lib/services';
/** Hotline tư vấn chăm cây, bắt bệnh, dịch vụ sân vườn (Thịnh) — cùng số với chân trang. */
export const SERVICE_PHONE = '0927291989';
/** 0703005001 → 0703 005 001 */
export const phoneText = (p: string) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

/** Khung đầu trang tối màu của nhóm trang Dịch vụ / Doanh nghiệp (ServicesHubLayout, BusinessLayout). */
export function ServiceHero({ badge, title, text, primary, call, proof, art, image, tag }: {
  badge: string; title: string; text: string;
  primary: { label: string; href: string };
  call: { phone: string; label: string };
  proof?: { b: string; text: string }[];
  art: IconName;
  /** Ảnh thay cho biểu tượng ở khung bên phải. */
  image?: { src: string; alt: string };
  tag: { b: string; text: string };
}) {
  return (
    <section className="sv-hero">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="vx-badge vx-badge--sun" style={{ alignSelf: 'flex-start' }}>{badge}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="acts">
          <Link href={primary.href} className="vx-btn vx-btn--lg vx-btn--light">{primary.label}</Link>
          <a href={`tel:${call.phone}`} className="vx-btn vx-btn--lg vx-btn--line">
            <Icon name="phone" size={16} />
            {call.label}
          </a>
        </div>
        {proof && proof.length > 0 && (
          <div className="sv-proof">
            {proof.map((x) => <span key={x.text}><b>{x.b}</b>{x.text}</span>)}
          </div>
        )}
      </div>
      <div className={image ? 'sv-art sv-art--img' : 'sv-art'}>
        {image ? <img src={image.src} alt={image.alt} width={960} height={720} fetchPriority="high" /> : <Icon name={art} />}
        <span className="tag"><b>{tag.b}</b>{tag.text}</span>
      </div>
    </section>
  );
}

/** Dãy bước có số thứ tự, nối nhau bằng đường kẻ (sv-steps). */
export function ServiceSteps({ title, steps }: { title: string; steps: { icon: IconName; b: string; text: ReactNode }[] }) {
  return (
    <section className="sv-sec" style={{ background: 'var(--surface)' }}>
      <h2>{title}</h2>
      <div className="sv-steps">
        {steps.map((s) => (
          <div key={s.b} className="sv-step">
            <span><Icon name={s.icon} /></span>
            <div className="t">
              <b>{s.b}</b>
              {s.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Câu hỏi thường gặp: <details> thuần HTML, không cần JavaScript. */
export function ServiceFaq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <section className="sv-sec">
      <h2>Câu hỏi thường gặp</h2>
      <div className="sv-faq">
        {items.map((x) => (
          <details key={x.q}>
            <summary>{x.q}</summary>
            <div>{x.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Dải kêu gọi cuối trang: nút chính + số điện thoại. */
export function ServiceCta({ title, text, label, href }: { title: string; text: string; label: string; href: string }) {
  return (
    <div className="sv-cta">
      <Icon name="chat" size={40} />
      <span>
        <b>{title}</b>
        <span>{text}. Hoặc gọi <a href={`tel:${SALES_PHONE}`}>{phoneText(SALES_PHONE)}</a>.</span>
      </span>
      <Link href={href} className="vx-btn vx-btn--lg">{label}</Link>
    </div>
  );
}

/** Thanh chuyển giữa các trang dịch vụ (dưới breadcrumb trang Dịch vụ và từng dịch vụ); điện thoại cuộn ngang. */
export function ServiceTabs({ current }: { current?: ServiceType }) {
  return (
    <nav className="sd-tabs" aria-label="Các dịch vụ">
      <Link href={SERVICES_URL} aria-current={current ? undefined : 'page'}>Tất cả dịch vụ</Link>
      {SERVICE_ORDER.map((t) => (
        <Link key={t} href={SERVICE_PAGES[t].href} aria-current={current === t ? 'page' : undefined}>
          <Icon name={SERVICE_PAGES[t].icon} size={18} />
          {SERVICE_PAGES[t].tab}
        </Link>
      ))}
    </nav>
  );
}

/** Thẻ các dịch vụ (trang Dịch vụ: tất cả; trang một dịch vụ: "Dịch vụ khác" — bỏ dịch vụ đang xem). */
export function ServiceCards({ except }: { except?: ServiceType }) {
  return (
    <div className="sv-cards" data-n={SERVICE_ORDER.length - (except ? 1 : 0)}>
      {SERVICE_ORDER.filter((t) => t !== except).map((t) => (
        <div key={t} className="sv-card">
          <span className="img"><img src={SERVICE_PAGES[t].image} alt={SERVICE_PAGES[t].alt} width={960} height={720} loading="lazy" /></span>
          <span className="b">
            <b>{SERVICE_PAGES[t].name}</b>
            {SERVICE_PAGES[t].text}
            <span className="from">{t === 'office' ? 'Có bảng giá thuê tham khảo' : 'Báo giá sau khi trao đổi, khảo sát'}</span>
            <Link href={SERVICE_PAGES[t].href}>
              Xem chi tiết dịch vụ
              <Icon name="chevron" size={14} />
            </Link>
          </span>
        </div>
      ))}
    </div>
  );
}
