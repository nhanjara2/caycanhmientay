'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ZALO_URL } from '@/lib/contact';
import { money } from '@/lib/format';
import {
  careLabel, estimateRental, MAX_QTY, packagePrice, plantCount, qtySummary, RENTAL_STORE_KEY, RENTAL_TIERS, suggestQty, termLabel,
  type RentalConfig, type RentalPackage, type RentalQty, type RentalTierKey,
} from '@/lib/office-rental';
import { ADVISOR_URL } from '@/lib/plant-advisor';
import { Icon } from './Icon';
import { QUOTE_URL } from './ServiceParts';

const QUOTE_OFFICE = `${QUOTE_URL}?loai=van-phong`;
const SHOP_OFFICE = '/danh-muc/cay-canh/cay-van-phong';

const STATE_KEY = 'ccmt-rental-state-v1';
const sameQty = (a: RentalQty, b: RentalQty) => RENTAL_TIERS.every((k) => a[k] === b[k]);
const clampQty = (n: number) => Math.max(0, Math.min(MAX_QTY, Math.floor(Number.isFinite(n) ? n : 0)));

/**
 * Gói thuê cây + "Tự chọn số cây" (ServiceDetailLayout: bảng gói + máy tính ước tính).
 * Bấm "Chọn gói này" → điền số cây của gói vào máy tính bên dưới để khách chỉnh tiếp; giá gói và máy tính cùng một công thức (lib/office-rental).
 */
export function OfficeRentalPlanner({ cfg }: { cfg: RentalConfig }) {
  const router = useRouter();
  const start = cfg.packages.find((p) => p.hot && !p.custom) ?? cfg.packages.find((p) => !p.custom);
  const [qty, setQty] = useState<RentalQty>(() => ({ ...(start?.qty ?? { 'de-ban': cfg.minPlants, vua: 0, lon: 0 }) }));
  const [weekly, setWeekly] = useState(start?.weekly ?? false);
  const [months, setMonths] = useState(cfg.terms[0].months);
  const [vat, setVat] = useState(false);
  const [people, setPeople] = useState('');
  const [area, setArea] = useState('');
  const [flash, setFlash] = useState(false);
  const restored = useRef(false);
  const skipSave = useRef(false);

  // Giữ lựa chọn trong tab (bấm "Chọn lại" ở form khảo sát, hoặc xem sản phẩm rồi quay lại)
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(STATE_KEY) ?? 'null') as { qty?: RentalQty; weekly?: boolean; months?: number; vat?: boolean; people?: string; area?: string } | null;
      if (d?.qty) {
        setQty(Object.fromEntries(RENTAL_TIERS.map((k) => [k, clampQty(Number(d.qty?.[k]))])) as RentalQty);
        setWeekly(!!d.weekly);
        if (cfg.terms.some((t) => t.months === d.months)) setMonths(d.months!);
        setVat(!!d.vat && cfg.vatRate > 0);
        setPeople(String(d.people ?? '').slice(0, 4));
        setArea(String(d.area ?? '').slice(0, 5));
      }
    } catch { /* bỏ qua */ }
    restored.current = true;
    // Lần lưu ngay sau đây còn mang giá trị mặc định — bỏ qua, không ghi đè lựa chọn vừa đọc (React chạy effect 2 lần khi dev)
    skipSave.current = true;
  }, [cfg]);
  useEffect(() => {
    if (!restored.current) return;
    if (skipSave.current) { skipSave.current = false; return; }
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ qty, weekly, months, vat, people, area })); } catch { /* bỏ qua */ }
  }, [qty, weekly, months, vat, people, area]);

  const est = estimateRental(cfg, { qty, weekly, months, vat });
  const matched = cfg.packages.find((p) => !p.custom && sameQty(p.qty, qty) && p.weekly === weekly);
  const priced = cfg.showPrices && !est.needsQuote && est.plants > 0;
  const maxDiscount = cfg.terms.reduce((m, t) => (t.discount > m.discount ? t : m), cfg.terms[0]);

  const setTier = (k: RentalTierKey, n: number) => setQty((x) => ({ ...x, [k]: clampQty(n) }));

  const pick = (p: RentalPackage) => {
    setQty({ ...p.qty });
    setWeekly(p.weekly);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
    document.getElementById('tinh-chi-phi')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const suggest = () => {
    const s = suggestQty(Number(people), Number(area));
    if (plantCount(s) > 0) setQty(s);
  };

  const send = () => {
    const parts = [
      matched ? `Gói ${matched.name}` : 'Tự chọn số cây',
      qtySummary(cfg, qty),
      careLabel(weekly).toLowerCase(),
      `thuê ${termLabel(est.term)}`,
      vat && cfg.vatRate > 0 ? `có xuất hóa đơn VAT ${cfg.vatRate}%` : '',
      priced ? `ước tính ${money(est.monthly)} / tháng` : '',
    ].filter(Boolean);
    try {
      sessionStorage.setItem(RENTAL_STORE_KEY, JSON.stringify({ note: `Thuê cây văn phòng (tính trên web): ${parts.join('; ')}.`, area: Number(area) || undefined }));
    } catch { /* trình duyệt chặn lưu trữ: vẫn mở form */ }
    router.push(`${QUOTE_OFFICE}&uoc-tinh=1`);
  };

  return (
    <>
      <section className="sv-sec" id="goi-thue">
        <h2>Chọn gói thuê cây</h2>
        <p className="sub">Gói là số cây gợi ý theo cỡ văn phòng. Chọn gói rồi tăng, giảm từng loại cây ở phần bên dưới cho vừa không gian của bạn.</p>
        <div className="ort-pk-grid">
          {cfg.packages.map((p) => {
            const pr = packagePrice(cfg, p);
            const active = matched?.key === p.key;
            return (
              <div key={p.key} className={`pk ort-pk${p.hot ? ' hot' : ''}`} data-active={active || undefined}>
                {p.hot && <span className="badge">Được chọn nhiều nhất</span>}
                <b className="n">{p.name}</b>
                {p.fit && <span className="ort-pk__fit">{p.fit}</span>}
                {cfg.showPrices && !pr.needsQuote ? (
                  <>
                    <span className="p">{money(pr.monthly)}<small> / tháng</small></span>
                    <span className="ort-pk__sub">
                      ≈ {money(pr.perPlant)} / cây · thuê {termLabel(cfg.terms[0])}
                      {pr.longest.discount > 0 && pr.longest.months !== cfg.terms[0].months && <><br />Thuê {termLabel(pr.longest)}: <b>{money(pr.longestMonthly)}</b> / tháng</>}
                    </span>
                  </>
                ) : (
                  <span className="p ort-pk__quote">{p.custom ? 'Liên hệ' : 'Báo giá sau khảo sát'}</span>
                )}
                <ul>
                  {!p.custom && cfg.tiers.filter((t) => p.qty[t.key] > 0).map((t) => (
                    <li key={t.key}><Icon name="plant" /><span><b>{p.qty[t.key]}</b> {t.name.toLowerCase()} <span className="ort-muted">({t.size.toLowerCase()})</span></span></li>
                  ))}
                  <li><Icon name="clock" /><span>{p.custom ? 'Lịch chăm theo thỏa thuận' : careLabel(p.weekly)}</span></li>
                  {p.perks.map((x) => <li key={x}><Icon name="check" /><span>{x}</span></li>)}
                </ul>
                {p.custom ? (
                  <Link href={QUOTE_OFFICE} className="vx-btn vx-btn--outline vx-btn--block">Nhận báo giá</Link>
                ) : (
                  <button type="button" className={`vx-btn vx-btn--block ${p.hot ? 'vx-btn--primary' : 'vx-btn--outline'}`} onClick={() => pick(p)} aria-pressed={active}>
                    {active ? <><Icon name="check" size={16} />Đang chọn gói này</> : 'Chọn gói này'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {cfg.includes.length > 0 && (
          <div className="ort-incl">
            <b>Gói nào cũng gồm</b>
            <ul className="sv-check">
              {cfg.includes.map((t) => <li key={t}><Icon name="check" />{t}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section className="sv-sec ort-calc-sec" id="tinh-chi-phi">
        <h2>Hoặc tự chọn số lượng cây</h2>
        <p className="sub">
          {cfg.showPrices
            ? <>Tính theo từng cỡ cây{maxDiscount.discount > 0 && <>, thuê {termLabel(maxDiscount)} giảm {maxDiscount.discount}%</>}. Thuê từ {cfg.minPlants} cây.</>
            : <>Chọn số cây từng cỡ, kỹ sư báo giá sau khảo sát. Thuê từ {cfg.minPlants} cây.</>}
        </p>
        <div className="ort-calc" data-flash={flash || undefined}>
          <div className="ort-calc__in">
            <div className="ort-tiers">
              {cfg.tiers.map((t) => (
                <div key={t.key} className="ort-tier">
                  <span className="ort-tier__ic"><Icon name={t.key === 'de-ban' ? 'sprout' : t.key === 'vua' ? 'plant' : 'tree'} /></span>
                  <span className="ort-tier__t">
                    <b>{t.name}</b>
                    <span>{t.size}{cfg.showPrices && <> · {t.price > 0 ? <>{money(t.price)} / cây / tháng</> : 'liên hệ'}</>}</span>
                    {t.examples && <small>Ví dụ: {t.examples}</small>}
                  </span>
                  <span className="ort-step" role="group" aria-label={`Số ${t.name.toLowerCase()}`}>
                    <button type="button" aria-label={`Bớt 1 ${t.name.toLowerCase()}`} disabled={qty[t.key] <= 0} onClick={() => setTier(t.key, qty[t.key] - 1)}>−</button>
                    <input
                      inputMode="numeric" aria-label={`Số ${t.name.toLowerCase()}`} value={qty[t.key]}
                      onChange={(e) => setTier(t.key, Number(e.target.value.replace(/\D/g, '').slice(0, 3)))}
                      onFocus={(e) => e.target.select()}
                    />
                    <button type="button" aria-label={`Thêm 1 ${t.name.toLowerCase()}`} disabled={qty[t.key] >= MAX_QTY} onClick={() => setTier(t.key, qty[t.key] + 1)}>+</button>
                  </span>
                </div>
              ))}
            </div>

            <details className="ort-help">
              <summary>Chưa biết cần bao nhiêu cây? Nhập số người và diện tích</summary>
              <div className="ort-help__b">
                <label>
                  <span>Số người làm việc</span>
                  <input className="vx-input" inputMode="numeric" value={people} placeholder="VD: 15" onChange={(e) => setPeople(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                </label>
                <label>
                  <span>Diện tích (m²)</span>
                  <input className="vx-input" inputMode="numeric" value={area} placeholder="VD: 120" onChange={(e) => setArea(e.target.value.replace(/\D/g, '').slice(0, 5))} />
                </label>
                <button type="button" className="vx-btn vx-btn--outline" disabled={!people && !area} onClick={suggest}>Gợi ý số cây</button>
                <small>Cách gợi ý: 1 cây để bàn cho 2 người, 1 cây đặt sàn cho mỗi 12m², thêm 1 cây lớn cho mỗi 100m² (từ 60m²). Muốn có phương án từng vị trí, dùng <Link href={`${ADVISOR_URL}?loai=van-phong`}>Tư vấn chọn cây</Link>.</small>
              </div>
            </details>

            <div className="ort-opt">
              <span className="ort-opt__l">Tần suất chăm sóc</span>
              <span className="ort-chips" role="radiogroup" aria-label="Tần suất chăm sóc">
                <button type="button" role="radio" className="vx-chip" aria-checked={!weekly} onClick={() => setWeekly(false)}>2 tuần / lần</button>
                <button type="button" role="radio" className="vx-chip" aria-checked={weekly} onClick={() => setWeekly(true)}>
                  Hằng tuần{cfg.showPrices && cfg.weeklyExtra > 0 && <> (+{cfg.weeklyExtra}%)</>}
                </button>
              </span>
            </div>
            <div className="ort-opt">
              <span className="ort-opt__l">Thời hạn thuê</span>
              <span className="ort-chips" role="radiogroup" aria-label="Thời hạn thuê">
                {cfg.terms.map((t) => (
                  <button key={t.months} type="button" role="radio" className="vx-chip" aria-checked={months === t.months} onClick={() => setMonths(t.months)}>
                    {termLabel(t)}{cfg.showPrices && t.discount > 0 && <> · giảm {t.discount}%</>}
                  </button>
                ))}
              </span>
            </div>
            {cfg.vatRate > 0 && (
              <div className="ort-opt">
                <label className="vx-check ort-vat"><input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} /> Xuất hóa đơn VAT{cfg.showPrices && <> (+{cfg.vatRate}%)</>}</label>
              </div>
            )}
            <div className="ort-mini">
              <span>
                {est.plants} cây · {priced ? <><b>{money(est.monthly)}</b> / tháng</> : est.plants ? 'báo giá sau khảo sát' : 'chưa chọn'}
              </span>
              <a href="#ort-out">Xem chi tiết</a>
            </div>
          </div>

          <div className="ort-out" id="ort-out" aria-live="polite">
            <span className="ort-out__k">{matched ? `Gói ${matched.name}` : 'Tự chọn số cây'} · {est.plants} cây</span>
            {priced ? (
              <>
                <span className="ort-out__big">{money(est.monthly)}<small> / tháng</small></span>
                <ul className="ort-out__lines">
                  {est.lines.filter((l) => l.qty > 0).map((l) => (
                    <li key={l.tier.key}><span>{l.qty} {l.tier.name.toLowerCase()} × {money(l.tier.price)}</span><b>{money(l.amount)}</b></li>
                  ))}
                  {est.care > 0 && <li><span>Chăm hằng tuần +{cfg.weeklyExtra}%</span><b>+{money(est.care)}</b></li>}
                  {est.discount > 0 && <li><span>Thuê {termLabel(est.term)} giảm {est.term.discount}%</span><b>−{money(est.discount)}</b></li>}
                  {est.vat > 0 && <li><span>VAT {cfg.vatRate}%</span><b>+{money(est.vat)}</b></li>}
                </ul>
                <span className="ort-out__sum">Cả {termLabel(est.term)}: <b>{money(est.total)}</b> · ≈ {money(Math.round(est.monthly / est.plants / 1000) * 1000)} / cây / tháng</span>
              </>
            ) : est.plants === 0 ? (
              <span className="ort-out__big ort-out__big--muted">Chọn số cây</span>
            ) : (
              <>
                <span className="ort-out__big ort-out__big--muted">Báo giá sau khảo sát</span>
                <span>{qtySummary(cfg, qty)} · {careLabel(weekly).toLowerCase()} · thuê {termLabel(est.term)}</span>
              </>
            )}
            {est.belowMin && (
              <span className="ort-out__warn" role="status">
                <Icon name="alert" size={16} />
                <span>Thuê tối thiểu {cfg.minPlants} cây. Chỉ cần vài chậu? <Link href={SHOP_OFFICE}>Mua cây về tự chăm</Link>.</span>
              </span>
            )}
            <button type="button" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={est.plants === 0} onClick={send}>{cfg.showPrices ? 'Gửi yêu cầu kèm ước tính này' : 'Gửi yêu cầu với số cây này'}</button>
            <a className="vx-btn vx-btn--outline vx-btn--block" href={ZALO_URL} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={16} />Hỏi nhanh qua Zalo</a>
            <span className="ort-out__note">
              {cfg.showPrices ? 'Giá tham khảo. ' : ''}Kỹ sư khảo sát miễn phí, chọn loại cây hợp ánh sáng từng vị trí rồi gửi báo giá chính thức qua Zalo.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
