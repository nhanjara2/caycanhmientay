import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { EnChrome, intlPhone, intlTel, WHATSAPP_URL } from '@/components/en/EnChrome';
import { enPageLd } from '@/components/en/enLd';
import { SALES_PHONE } from '@/lib/contact';
import { PARTNER_IMAGE, PARTNER_IMAGE_POS } from '@/lib/partners';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

const TITLE = 'Cây Cảnh Miền Tây – Wholesale Plant Nursery in Sa Dec, Vietnam';
const DESC = 'Ornamental, indoor, office and landscape plants from Sa Dec Flower Village, Vietnam. Nursery prices and wholesale supply for landscapers, projects and resellers since 2007.';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: { absolute: TITLE }, description: DESC, alternates: { canonical: '/en' },
}));

const RANGE: [string, string, string][] = [
  ['Desk & tabletop plants', '/images/danh-muc/cay-de-ban.webp', 'Small potted foliage plants and succulents for desks, shelves and gift sets.'],
  ['Office plants', '/images/danh-muc/cay-van-phong.webp', 'Shade-tolerant plants that stay healthy under air-conditioning and office lighting.'],
  ['Indoor plants', '/images/danh-muc/cay-trong-nha.webp', 'Aglaonema, Philodendron, Dieffenbachia, Sansevieria and other popular houseplants.'],
  ['Balcony plants', '/images/danh-muc/cay-ban-cong.webp', 'Sun- and wind-tolerant flowering and foliage plants for balconies and terraces.'],
  ['Garden plants', '/images/danh-muc/cay-san-vuon.webp', 'Shrubs, flowering plants and hedging for home gardens and courtyards.'],
  ['Landscape & project trees', '/images/danh-muc/cay-cong-trinh.webp', 'Shade and street trees for parks, resorts, residential and public projects.'],
];

const WHO: ['trade' | 'landscape' | 'project', string, string][] = [
  ['trade', 'Resellers & garden centres', 'Mixed loads of popular varieties at nursery prices, re-ordered on a regular schedule.'],
  ['landscape', 'Landscaping companies', 'Plants matched to your planting plan: size, pot, quantity — sourced from our partner nurseries.'],
  ['project', 'Construction & hospitality projects', 'Quotes from your bill of quantities, deliveries split to follow the project schedule.'],
];

const FACTS: [string, string][] = [
  ['2007', 'Founded in Sa Dec'], ['2019', 'Supplying landscape projects'], ['~200', 'Partner nurseries'], ['50+', 'Plant varieties'],
];

export default function EnHome() {
  return (
    <EnChrome path="/en">
      <JsonLd data={enPageLd({ path: '/en', name: TITLE, description: DESC })} />
      <section className="en-hero">
        <div className="en-wrap en-hero__in">
          <div>
            <p className="en-eyebrow">Sa Dec Flower Village · Mekong Delta, Vietnam</p>
            <h1>Wholesale plants straight from the nursery</h1>
            <p className="en-lead">
              Cây Cảnh Miền Tây has grown and traded ornamental plants in Sa Dec — Vietnam&apos;s best-known flower village — since 2007.
              We supply indoor, office and landscape plants to landscapers, projects and resellers at nursery prices.
            </p>
            <div className="en-cta">
              <Link className="en-btn" href="/en/wholesale">Request a wholesale quote</Link>
              <a className="en-btn en-btn--ghost" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </div>
          </div>
          <img className="en-hero__img" src={PARTNER_IMAGE.trade} alt="Our grower in the cactus nursery in Sa Dec" width={800} height={1067} style={{ objectPosition: PARTNER_IMAGE_POS.trade }} fetchPriority="high" />
        </div>
      </section>

      <section className="en-wrap en-facts" aria-label="Key facts">
        {FACTS.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
      </section>

      <section className="en-wrap en-sec">
        <h2>What we grow and supply</h2>
        <div className="en-grid3">
          {RANGE.map(([t, img, d]) => (
            <article key={t} className="en-card en-tile">
              <img src={img} alt={t} width={640} height={640} loading="lazy" />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="en-wrap en-sec">
        <h2>Who we work with</h2>
        <div className="en-grid3">
          {WHO.map(([k, t, d]) => (
            <article key={k} className="en-card en-tile">
              <img src={PARTNER_IMAGE[k]} alt={t} width={640} height={480} loading="lazy" style={{ objectPosition: PARTNER_IMAGE_POS[k], aspectRatio: '4 / 3' }} />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="en-wrap en-sec">
        <h2>How ordering works</h2>
        <ol className="en-steps">
          <li><b>Send your list</b><span>Plant names, sizes (height or pot) and quantities — a spreadsheet or BOQ is fine.</span></li>
          <li><b>Get a quote</b><span>We confirm availability with our nurseries and reply with prices, photos and lead time.</span></li>
          <li><b>Confirm &amp; deposit</b><span>Once you confirm, we reserve the plants and agree on payment and delivery.</span></li>
          <li><b>Delivery</b><span>Nationwide delivery within Vietnam. For overseas orders, see the note below.</span></li>
        </ol>
        <div className="en-callout">
          <b>Buying from outside Vietnam?</b>
          <p>
            Live plants need a phytosanitary certificate and must meet the import rules of your country (many countries do not accept plants in soil).
            Tell us your country and the plants you need, and we will tell you honestly what is possible.
          </p>
        </div>
      </section>

      <section className="en-band">
        <div className="en-wrap en-band__in">
          <h2>Ready to source plants from Sa Dec?</h2>
          <div className="en-cta">
            <Link className="en-btn en-btn--light" href="/en/wholesale">Request a quote</Link>
            <a className="en-btn en-btn--ghost-light" href={intlTel(SALES_PHONE)}>Call {intlPhone(SALES_PHONE)}</a>
          </div>
        </div>
      </section>
    </EnChrome>
  );
}
