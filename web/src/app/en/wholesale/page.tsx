import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { EnChrome, EnCrumbs, intlPhone, intlTel, WHATSAPP_URL } from '@/components/en/EnChrome';
import { EnInquiryForm } from '@/components/en/EnInquiryForm';
import { enPageLd } from '@/components/en/enLd';
import { SALES_PHONE, SHOP_EMAIL, ZALO_URL } from '@/lib/contact';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

const TITLE = 'Wholesale Plant Inquiry – Get a Quote';
const DESC = 'Send your list of plants, sizes and quantities and get a wholesale quote from Cây Cảnh Miền Tây, a plant nursery in Sa Dec, Vietnam. Reply by email within 1–2 business days.';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: TITLE, description: DESC, alternates: { canonical: '/en/wholesale' },
}));

export default function EnWholesale() {
  return (
    <EnChrome path="/en/wholesale">
      <JsonLd data={enPageLd({ path: '/en/wholesale', name: TITLE, description: DESC, type: 'ContactPage', crumbs: [['Home', '/en'], ['Wholesale inquiry', '/en/wholesale']] })} />
      <div className="en-wrap en-page">
        <EnCrumbs items={[['Home', '/en'], ['Wholesale inquiry']]} />
        <h1>Wholesale plant inquiry</h1>
        <p className="en-lead">Tell us what you need. We check stock with our nurseries and reply with prices, photos and lead time.</p>
        <div className="en-split">
          <EnInquiryForm />
          <aside className="en-card en-aside">
            <h2>Other ways to reach us</h2>
            <p>Email: <a href={`mailto:${SHOP_EMAIL}?subject=Wholesale%20inquiry`}>{SHOP_EMAIL}</a><br />(attach your BOQ or spreadsheet)</p>
            <p>WhatsApp: <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{intlPhone(SALES_PHONE)}</a></p>
            <p>Phone: <a href={intlTel(SALES_PHONE)}>{intlPhone(SALES_PHONE)}</a></p>
            <p>Zalo: <a href={ZALO_URL} target="_blank" rel="noopener noreferrer">{intlPhone(SALES_PHONE)}</a></p>
            <p>Hours: 8:00 – 21:00 Vietnam time (GMT+7)</p>
            <h2>Helpful to include</h2>
            <ul>
              <li>Plant names (common or botanical)</li>
              <li>Size: height and / or pot size</li>
              <li>Quantity of each item</li>
              <li>Delivery location and date needed</li>
            </ul>
          </aside>
        </div>
      </div>
    </EnChrome>
  );
}
