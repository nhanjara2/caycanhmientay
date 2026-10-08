import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Product } from '@/lib/catalog';
import type { Project } from '@/lib/projects';
import type { ServiceType } from '@/lib/service-labels';
import { quoteHref, SERVICE_PAGES, SERVICES_URL } from '@/lib/services';
import { Breadcrumb } from './Blocks';
import { Icon, type IconName } from './Icon';
import { ProductGrid } from './ProductCard';
import { ProjectCard } from './ProjectParts';
import { phoneText, SERVICE_PHONE, ServiceCards, ServiceCta, ServiceFaq, ServiceHero, ServiceSteps, ServiceTabs } from './ServiceParts';

type Item = { icon: IconName; b: string; text: ReactNode };

/** Nội dung một trang dịch vụ (components/service-content.tsx). Chỉ ghi điều shop làm thật — không số liệu, giá, đánh giá mẫu. */
export type ServiceContent = {
  type: ServiceType;
  badge: string;
  intro: string;
  proof?: { b: string; text: string }[];
  tag: { b: string; text: string };
  fit: { title: string; items: Item[] };
  scope: { title: string; sub?: string; items: Item[] };
  price: { title: string; items: string[]; note: ReactNode };
  prepare: string[];
  steps: { icon: IconName; b: string; text: ReactNode }[];
  faq: { q: string; a: ReactNode }[];
  cta: { title: string; text: string };
};

/**
 * Trang một dịch vụ (/dich-vu/<dịch vụ>) theo ServiceDetailLayout: thanh chuyển dịch vụ → khung đầu trang có ảnh → phù hợp với →
 * dịch vụ gồm → phần riêng (children) → các bước → báo giá tính theo / cần chuẩn bị → công trình đã làm → sản phẩm → hỏi đáp → dịch vụ khác.
 */
export function ServiceDetail({ c, children, projects = [], products }: {
  c: ServiceContent;
  children?: ReactNode;
  /** Dự án đã đăng ở /admin/du-an có liên quan (đã lọc). */
  projects?: Project[];
  products?: { title: string; href: string; more: string; list: Product[] };
}) {
  const page = SERVICE_PAGES[c.type];
  const quote = quoteHref(c.type);
  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <div className="sv-crumb">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dịch vụ', href: SERVICES_URL }, { label: page.name }]} />
      </div>
      <ServiceTabs current={c.type} />

      <ServiceHero
        badge={c.badge}
        title={page.name}
        text={c.intro}
        primary={{ label: 'Đặt lịch khảo sát miễn phí', href: quote }}
        call={{ phone: SERVICE_PHONE, label: phoneText(SERVICE_PHONE) }}
        proof={c.proof}
        art={page.icon}
        image={{ src: page.image, alt: page.alt }}
        tag={c.tag}
      />

      <section className="sv-sec">
        <h2>{c.fit.title}</h2>
        <div className="sd-fit">
          {c.fit.items.map((x) => (
            <div key={x.b} className="sd-fit__i">
              <span className="sd-ic"><Icon name={x.icon} /></span>
              <span><b>{x.b}</b>{x.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sv-sec sd-white">
        <h2>{c.scope.title}</h2>
        {c.scope.sub && <p className="sub">{c.scope.sub}</p>}
        <div className="sd-scope" data-n={c.scope.items.length}>
          {c.scope.items.map((x, i) => (
            <div key={x.b} className="sd-scope__i">
              <span className="sd-scope__n">{i + 1}</span>
              <span className="sd-ic"><Icon name={x.icon} /></span>
              <b>{x.b}</b>
              <p>{x.text}</p>
            </div>
          ))}
        </div>
      </section>

      {children}

      <ServiceSteps title="Các bước làm việc" steps={c.steps} />

      <section className="sv-sec">
        <div className="sv-split">
          <div className="sv-panel">
            <h2>{c.price.title}</h2>
            <ul className="sv-check">
              {c.price.items.map((t) => <li key={t}><Icon name="check" />{t}</li>)}
            </ul>
            <p className="sv-note">{c.price.note}</p>
          </div>
          <div className="sv-panel">
            <h2>Chuẩn bị để được tư vấn nhanh</h2>
            <ul className="sv-check">
              {c.prepare.map((t) => <li key={t}><Icon name="check" />{t}</li>)}
            </ul>
            <div className="acts">
              <Link href={quote} className="vx-btn vx-btn--primary">Gửi yêu cầu</Link>
              <a href={`tel:${SERVICE_PHONE}`} className="vx-btn vx-btn--outline"><Icon name="phone" size={16} />Gọi {phoneText(SERVICE_PHONE)}</a>
            </div>
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="sv-sec">
          <div className="vx-sect">
            <h2 style={{ fontSize: '1.125rem' }}>Công trình đã làm</h2>
            <Link className="vx-link" href="/doanh-nghiep#du-an">Xem tất cả dự án <Icon name="chevron" size={16} /></Link>
          </div>
          <div className="dn-grid">
            {projects.slice(0, 3).map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {products && products.list.length > 0 && (
        <section className="sv-sec">
          <div className="vx-sect">
            <h2 style={{ fontSize: '1.125rem' }}>{products.title}</h2>
            <Link className="vx-link" href={products.href}>{products.more} <Icon name="chevron" size={16} /></Link>
          </div>
          <ProductGrid products={products.list} />
        </section>
      )}

      <ServiceFaq items={c.faq} />

      <section className="sv-sec">
        <h2>Dịch vụ khác</h2>
        <ServiceCards except={c.type} />
      </section>

      <ServiceCta title={c.cta.title} text={c.cta.text} label="Đặt lịch khảo sát" href={quote} />
    </div>
  );
}
