'use client';

import Link from '@/components/LocaleLink';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useTranslations } from 'next-intl';

type Consent = { personal: boolean; analytics: boolean; ads: boolean; at: string };
const KEY = 'ccmt-consent';
/** Phát trên window mỗi lần khách lưu lựa chọn — mã phân tích (Analytics.tsx) nghe để tải ngay. */
export const CONSENT_EVENT = 'ccmt:consent';

/** Khách đã cho phép nhóm này chưa (chưa chọn gì = chưa). */
export function hasConsent(kind: 'personal' | 'analytics' | 'ads') {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? 'null') as Consent | null)?.[kind] === true; } catch { return false; }
}

/** Xin đồng ý cookie lần đầu vào web. Chưa đồng ý thì không tải mã phân tích/quảng cáo. */
export function CookieConsent() {
  const t = useTranslations('cookie');
  const [show, setShow] = useState(false);
  const [custom, setCustom] = useState(false);
  const [pref, setPref] = useState({ personal: true, analytics: true, ads: false });

  useEffect(() => {
    try { setShow(!localStorage.getItem(KEY)); } catch {}
  }, []);

  const save = (c: Omit<Consent, 'at'>) => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...c, at: new Date().toISOString() })); } catch {}
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setShow(false);
  };

  if (!show) return null;

  if (custom) {
    const row = (k: keyof typeof pref, title: string, sub: string) => (
      <div className="ck-row">
        <div><b>{title}</b><small>{sub}</small></div>
        <button type="button" className="vx-switch" role="switch" aria-checked={pref[k]} aria-label={title} onClick={() => setPref((p) => ({ ...p, [k]: !p[k] }))} />
      </div>
    );
    return (
      <div className="ck-pref app-ck-pref" role="dialog" aria-label={t('prefTitle')}>
        <div className="h">{t('prefTitle')}</div>
        <div className="ck-row"><div><b>{t('need')}</b><small>{t('needSub')}</small></div><span className="lock">{t('always')}</span></div>
        {row('personal', t('personal'), t('personalSub'))}
        {row('analytics', t('analytics'), t('analyticsSub'))}
        {row('ads', t('ads'), t('adsSub'))}
        <div className="f">
          <button type="button" className="vx-btn vx-btn--outline" onClick={() => setCustom(false)}>{t('cancel')}</button>
          <button type="button" className="vx-btn vx-btn--primary" onClick={() => save(pref)}>{t('save')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ck app-ck" role="dialog" aria-label="Cookie">
      <b><Icon name="shield" />{t('title')}</b>
      <p>
        {t('text')}{' '}
        <Link href="/chinh-sach/bao-mat">{t('privacy')}</Link>
      </p>
      <div className="acts">
        <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setCustom(true)}>{t('custom')}</button>
        <button type="button" className="vx-btn vx-btn--outline" onClick={() => save({ personal: false, analytics: false, ads: false })}>{t('necessary')}</button>
        <button type="button" className="vx-btn vx-btn--primary" onClick={() => save({ personal: true, analytics: true, ads: true })}>{t('all')}</button>
      </div>
    </div>
  );
}
