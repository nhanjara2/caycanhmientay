import Link from '@/components/LocaleLink';
import { CARE_PHONE, FACEBOOK_URL, formatPhone, LINKEDIN_URL, GOOGLE_REVIEW_URL, SALES_PHONE, SHOP_ADDRESS, SUPPORT_PHONE, TIKTOK_URL, YOUTUBE_URL, ZALO_QR, ZALO_URL } from '@/lib/contact';
import { ASK_AI } from '@/lib/ask-ai';
import { FooterGroup } from './FooterGroup';
import { Icon } from './Icon';
import { getTranslations } from 'next-intl/server';
import { LangSwitch } from './LangSwitch';

// Tên link: messages/<lang>.json → footer.links.<đường dẫn>
const ABOUT = ['/chinh-sach/gioi-thieu', '/he-thong-cua-hang', '/chinh-sach/giay-phep-kinh-doanh', '/chinh-sach/quy-che-hoat-dong',
  '/chinh-sach/giao-hang', '/chinh-sach/bao-hanh-cay', '/chinh-sach/doi-tra', '/chinh-sach/thanh-toan', '/chinh-sach/dat-coc',
  '/chinh-sach/bao-mat', '/chinh-sach/dieu-khoan'];
const LEARN = ['/goc-cham-cay', '/video', '/benh-cay', '/chinh-sach/thuoc-bvtv-an-toan', '/doi-tac', '/bao-gia-si', '/tu-van-chon-cay',
  '/khuyen-mai', '/tin-tuc'];
// [khóa chữ, số điện thoại, người phụ trách]
const HOTLINES: [string, string, string?][] = [
  ['hot1', SALES_PHONE, 'Nhân'],
  ['hot2', CARE_PHONE, 'Thịnh'],
  ['hot3', SUPPORT_PHONE, 'Trâm'],
];
// Logo trong public/images/pay/
const PAY: [string, string, string][] = [
  ['Visa', 'visa.svg', 'https://www.visa.com.vn'], ['Mastercard', 'mastercard.svg', 'https://www.mastercard.com.vn'],
  ['JCB', 'jcb.svg', 'https://www.global.jcb'], ['Napas', 'napas.png', 'https://napas.com.vn'],
  ['VietQR', 'vietqr.svg', 'https://vietqr.net'], ['MoMo', 'momo.svg', 'https://www.momo.vn'],
  ['ZaloPay', 'zalopay.svg', 'https://zalopay.vn'], ['VNPay', 'vnpay.svg', 'https://vnpay.vn'],
  ['Apple Pay', 'applepay.svg', 'https://www.apple.com/vn/apple-pay/'],
];

export async function Footer() {
  const t = await getTranslations('footer');
  return (
    <footer className="vx-footer">
      <div className="vx-fband">
        <span className="vx-fband__t">
          <Icon name="pin" size={24} />
          <span>
            {t('visit')}
            <small>{t('visitSub')}</small>
          </span>
        </span>
        <Link className="vx-btn" href="/he-thong-cua-hang">{t('stores')}</Link>
      </div>
      <div className="vx-fnews">
        <Icon name="mail" style={{ color: 'var(--primary)' }} />
        <span>
          <b>{t('news')}</b>
          <br />
          <span>{t('newsSub')}</span>
        </span>
        <form className="f">
          <input className="vx-input" type="email" placeholder={t('email')} aria-label="Email" />
          <button className="vx-btn vx-btn--primary" type="button">{t('subscribe')}</button>
        </form>
      </div>
      <div className="vx-fcols">
        <FooterGroup title={t('about')}>
          {ABOUT.map((h) => <Link key={h} href={h}>{t(`links.${h}`)}</Link>)}
        </FooterGroup>
        <FooterGroup title={t('learn')}>
          {LEARN.map((h) => <Link key={h} href={h}>{t(`links.${h}`)}</Link>)}
        </FooterGroup>
        <div className="vx-fcol">
          <h4>{t('hotline')}</h4>
          {HOTLINES.map(([label, phone, name]) => (
            <div key={label} className="vx-hot">
              <span>{t(label)}</span>
              <b><a href={`tel:${phone}`}>{formatPhone(phone)}</a>{name && <small> ({name})</small>}</b>
            </div>
          ))}
          <h4 style={{ marginTop: 8 }}>{t('certs')}</h4>
          <div className="vx-certs">
            <span className="vx-cert"><Icon name="shield" />{t('cert1')}</span>
            <span className="vx-cert"><Icon name="shield" />{t('cert2')}</span>
          </div>
        </div>
        <div className="vx-fcol">
          <h4>{t('connect')}</h4>
          <div className="vx-social">
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" title="Facebook"><img src="/images/social/facebook.svg" alt="Facebook" width={36} height={36} loading="lazy" /></a>
            <a href={ZALO_URL} target="_blank" rel="noreferrer" title="Zalo"><img src="/images/social/zalo.svg" alt="Zalo" width={36} height={36} loading="lazy" /></a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" title="YouTube"><img src="/images/social/youtube.svg" alt="YouTube" width={36} height={36} loading="lazy" /></a>
            <a href={TIKTOK_URL} target="_blank" rel="noreferrer" title="TikTok"><img src="/images/social/tiktok.svg" alt="TikTok" width={36} height={36} loading="lazy" /></a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" title="LinkedIn"><img src="/images/social/linkedin.svg" alt="LinkedIn" width={36} height={36} loading="lazy" /></a>
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" title={t('googleReview')}><img src="/images/social/google.svg" alt={t('googleReview')} width={36} height={36} loading="lazy" /></a>
          </div>
          <h4 style={{ marginTop: 8 }}>{t('askAi')}</h4>
          <div className="app-askai">
            {ASK_AI.map((a) => (
              <a key={a.name} href={a.href} target="_blank" rel="noopener noreferrer nofollow" title={a.name} aria-label={t('askAiOne', { name: a.name })}><img src={`/images/ai/${a.name.toLowerCase()}.svg`} alt="" width={36} height={36} loading="lazy" /></a>
            ))}
          </div>
          {/* Mã QR chỉ có ích khi xem trên máy tính; điện thoại đã có nút "Chat Zalo" ở thanh dưới. */}
          <div className="vx-fcol app-qrbox">
            <h4 style={{ marginTop: 8 }}>{t('qr')}</h4>
            <a className="vx-qr app-qr" href={ZALO_URL} target="_blank" rel="noreferrer">
              <img src={ZALO_QR} alt={t('qrAlt')} loading="lazy" />
            </a>
          </div>
          <h4 style={{ marginTop: 8 }}>{t('pay')}</h4>
          <div className="vx-paylogos">
            {PAY.map(([name, file, url]) => (
              <a key={name} className="vx-payl" href={url} target="_blank" rel="noopener noreferrer" title={t('payAbout', { name })} aria-label={t('payAria', { name })}><img src={`/images/pay/${file}`} alt="" loading="lazy" /></a>
            ))}
          </div>
        </div>
      </div>
      <div className="vx-flegal">
        <span>{t('legal')}</span>
        <span><LangSwitch /></span>
        <span>{t('contact', { address: SHOP_ADDRESS, phone: SALES_PHONE })}</span>
      </div>
    </footer>
  );
}
