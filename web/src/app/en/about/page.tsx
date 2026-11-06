import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { EnChrome, EnCrumbs } from '@/components/en/EnChrome';
import { enPageLd } from '@/components/en/enLd';
import { LEGAL } from '@/lib/contact';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

const TITLE = 'About Us – A Family Plant Nursery in Sa Dec';
const DESC = 'Cây Cảnh Miền Tây is a plant nursery in Sa Dec Flower Village, Dong Thap, Vietnam. Founded in 2007, supplying landscape projects since 2019 with a network of about 200 nurseries.';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: TITLE, description: DESC, alternates: { canonical: '/en/about' },
}));

const MILESTONES: [string, string][] = [
  ['2007', 'The nursery is founded in Sa Dec Flower Village, Dong Thap province.'],
  ['2019', 'We start supplying trees and plants for landscape and construction projects.'],
  ['2024', 'Our sourcing network grows to about 200 partner nurseries across southern Vietnam.'],
  ['2026', 'We focus on wholesale supply for landscapers, projects and resellers.'],
];

export default function EnAbout() {
  return (
    <EnChrome path="/en/about">
      <JsonLd data={enPageLd({ path: '/en/about', name: TITLE, description: DESC, type: 'AboutPage', crumbs: [['Home', '/en'], ['About us', '/en/about']] })} />
      <div className="en-wrap en-page">
        <EnCrumbs items={[['Home', '/en'], ['About us']]} />
        <h1>About Cây Cảnh Miền Tây</h1>
        <p className="en-lead">
          <i>Cây Cảnh Miền Tây</i> means &ldquo;ornamental plants of the Mekong Delta&rdquo;. We are a plant nursery and wholesale supplier based in
          Sa Dec Flower Village (Làng Hoa Sa Đéc), Dong Thap — a century-old growing area that supplies flowers and plants to the whole of Vietnam.
        </p>

        <h2>What we do</h2>
        <ul>
          <li>Grow and source ornamental, indoor, office and landscape plants.</li>
          <li>Supply plants, pots, fertiliser and growing media to landscapers, projects and resellers.</li>
          <li>Publish free plant-care guides and a plant disease library (in Vietnamese) reviewed by our team.</li>
        </ul>

        <h2>Our history</h2>
        <ol className="en-timeline">
          {MILESTONES.map(([y, t]) => <li key={y}><b>{y}</b><span>{t}</span></li>)}
        </ol>

        <h2>Why buy from us</h2>
        <ul>
          <li><b>Nursery prices</b> — we work directly with growers, without layers of middlemen.</li>
          <li><b>Wide choice</b> — about 200 partner nurseries let us fill mixed and large orders.</li>
          <li><b>Real photos</b> — we send photos of the actual plants before you confirm.</li>
          <li><b>Plant warranty</b> — live plants delivered within Vietnam are covered for 7 days after delivery.</li>
        </ul>

        <h2>Business information</h2>
        <table className="en-table">
          <tbody>
            <tr><th scope="row">Trading name</th><td>{LEGAL.name}</td></tr>
            <tr><th scope="row">Owner</th><td>{LEGAL.owner}</td></tr>
            <tr><th scope="row">Business registration no.</th><td>{LEGAL.regNo} (issued {LEGAL.regIssued})</td></tr>
            <tr><th scope="row">Location</th><td>Sa Dec Flower Village, Dong Thap, Vietnam</td></tr>
          </tbody>
        </table>

        <div className="en-cta">
          <Link className="en-btn" href="/en/wholesale">Request a wholesale quote</Link>
        </div>
      </div>
    </EnChrome>
  );
}
