'use client';

import { Breadcrumb } from './Blocks';
import Link from '@/components/LocaleLink';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createServiceRequestAction } from '@/app/actions/service-requests';
import { isPhone } from '@/lib/auth';
import { compressImage } from '@/lib/compress-image';
import { errId, focusFirstError, invalidProps } from '@/lib/form-a11y';
import { money } from '@/lib/format';
import { PARTNER_INFO, PARTNER_TYPES, WHOLESALE_URL, type PartnerType } from '@/lib/partners';
import { ADVISOR_URL, KINDS, PLAN_STORE_KEY, type SavedPlan } from '@/lib/plant-advisor';
import { Icon } from './Icon';

export type WholesaleDefaults = { type?: PartnerType; company: string; name: string; phone: string; address: string; items?: string };

export const WHOLESALE_DRAFT_KEY = 'ccmt-wholesale-quote-draft';
const DRAFT_KEY = WHOLESALE_DRAFT_KEY;
const MAX_PHOTOS = 3;

type Draft = { type: PartnerType | null; items: string; needBy: string; company: string; name: string; phone: string; address: string };

/**
 * Form Yêu cầu báo giá sỉ (/bao-gia-si): loại đối tác → danh sách hàng (+ ảnh bảng khối lượng, phương án từ Tư vấn chọn cây) → liên hệ.
 * `embedded`: đặt trong trang /doi-tac (#bao-gia) — không breadcrumb, tiêu đề h2.
 */
export function WholesaleQuoteForm({ defaults, fromAdvisor = false, embedded = false }: { defaults: WholesaleDefaults; fromAdvisor?: boolean; embedded?: boolean }) {
  const [v, setV] = useState<Draft>({
    type: defaults.type ?? null, items: defaults.items ?? '', needBy: '', company: defaults.company, name: defaults.name, phone: defaults.phone, address: defaults.address,
  });
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  // Trong trang /doi-tac tiêu đề trang là h1 riêng → form dùng h2 / h3.
  const Title = embedded ? 'h2' : 'h1';
  const Sub = embedded ? 'h3' : 'h2';
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (done !== null && embedded) doneRef.current?.focus(); }, [done, embedded]);

  const set = <K extends keyof Draft>(k: K, val: Draft[K]) => setV((x) => ({ ...x, [k]: val }));

  // Nháp lưu trên máy này (không gồm ảnh). Loại đối tác trên link (?loai=) ưu tiên hơn nháp.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Draft>;
      setV((x) => ({
        ...x, ...d,
        items: defaults.items && !d.items?.includes(defaults.items) ? [defaults.items, d.items].filter(Boolean).join('\n') : d.items ?? x.items,
        type: defaults.type ?? (d.type && PARTNER_TYPES.includes(d.type) ? d.type : x.type),
        company: d.company || x.company, name: d.name || x.name, phone: d.phone || x.phone, address: d.address || x.address,
      }));
    } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
  }, [defaults.type, defaults.items]);

  // Phương án từ trang Tư vấn chọn cây: đính kèm danh sách cây + số lượng
  useEffect(() => {
    if (!fromAdvisor) return;
    try {
      const d = JSON.parse(sessionStorage.getItem(PLAN_STORE_KEY) ?? 'null') as { plan?: SavedPlan } | null;
      if (d?.plan?.lines?.length && KINDS[d.plan.kind]) setPlan(d.plan);
    } catch { /* bỏ qua */ }
  }, [fromAdvisor]);
  const dropPlan = () => {
    setPlan(null);
    try { sessionStorage.removeItem(PLAN_STORE_KEY); } catch { /* bỏ qua */ }
  };

  // Tự lưu nháp trên máy này (không gồm ảnh) — khách khỏi bấm Lưu nháp
  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) { loaded.current = true; return; }
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* bỏ qua */ } }, 500);
    return () => clearTimeout(t);
  }, [v]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const picked: { file: File; url: string }[] = [];
    for (const f of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      try {
        const c = await compressImage(f);
        picked.push({ file: c, url: URL.createObjectURL(c) });
      } catch {
        setError('Không đọc được một ảnh, vui lòng chọn ảnh khác');
      }
    }
    setPhotos((p) => [...p, ...picked].slice(0, MAX_PHOTOS));
    if (fileInput.current) fileInput.current.value = '';
  };
  const removePhoto = (i: number) => setPhotos((p) => {
    URL.revokeObjectURL(p[i].url);
    return p.filter((_, j) => j !== i);
  });

  const errors = {
    type: !v.type && 'Chọn bạn là đối tác nào',
    items: v.items.trim().length < 5 && !plan && !photos.length && 'Nhập ghi chú hoặc gửi kèm ảnh',
    name: v.name.trim().length < 2 && 'Nhập tên người liên hệ',
    phone: !isPhone(v.phone) && 'Số điện thoại chưa đúng',
    address: v.address.trim().length < 3 && 'Nhập nơi giao hàng (tỉnh / thành hoặc địa chỉ công trình)',
  };
  // Câu báo lỗi mang id <ô>-err để ô nhập trỏ tới (aria-describedby) — trình đọc màn hình đọc lỗi khi vào ô
  const FIELD: Record<keyof typeof errors, string> = { type: 'qf-type', items: 'qf-items', name: 'qf-name', phone: 'qf-phone', address: 'qf-addr' };
  const err = (k: keyof typeof errors) => (touched && errors[k] ? <span className="vx-err" id={errId(FIELD[k])}>{errors[k]}</span> : null);
  const bad = (k: keyof typeof errors) => invalidProps(FIELD[k], touched && errors[k]);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => {
    setTouched(true);
    setError('');
    if (Object.values(errors).some(Boolean)) {
      setError('Vui lòng kiểm tra lại các ô được đánh dấu');
      focusFirstError(formRef.current);
      return;
    }
    const fd = new FormData();
    fd.set('service', v.type!);
    if (v.company.trim()) fd.set('company', v.company);
    if (v.needBy) fd.set('needBy', v.needBy);
    fd.set('name', v.name);
    fd.set('phone', v.phone);
    fd.set('address', v.address);
    if (v.items.trim()) fd.set('note', v.items.trim().slice(0, 4000));
    fd.set('website', honeypot.current?.value ?? '');
    if (plan) fd.set('plan', JSON.stringify(plan));
    photos.forEach((p) => fd.append('photos', p.file));
    start(async () => {
      const r = await createServiceRequestAction(fd).catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
      if (!r.ok) { setError(r.error); return; }
      try { localStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(PLAN_STORE_KEY); } catch { /* bỏ qua */ }
      setDone(r.code);
      if (embedded) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  if (done !== null) {
    return (
      <div className="qf-card app-qf-done" ref={doneRef} tabIndex={-1}>
        <span className="os-check"><Icon name="check" /></span>
        <Title>Đã nhận yêu cầu báo giá{done ? ` ${done}` : ''}</Title>
        <p>
          Nhân viên kinh doanh sẽ gọi số <b>{v.phone}</b> để xác nhận danh sách hàng, quy cách và nơi giao, rồi gửi báo giá sỉ qua Zalo.
        </p>
        <div className="vx-row" style={{ justifyContent: 'center' }}>
          {!embedded && <Link href={WHOLESALE_URL} className="vx-btn vx-btn--outline">Về trang Đối tác</Link>}
          <Link href="/danh-muc" className="vx-btn vx-btn--primary">Xem sản phẩm</Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="qf-card" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      {!embedded && <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Đối tác sỉ', href: WHOLESALE_URL }, { label: 'Yêu cầu báo giá sỉ' }]} />}
      {!embedded && <h1>Yêu cầu báo giá sỉ</h1>}

      <div className="qf-sec">
        <Sub>Bạn là</Sub>
        <div className="app-qf-chips" role="radiogroup" aria-label="Loại đối tác" {...bad('type')} tabIndex={touched && errors.type ? -1 : undefined}>
          {PARTNER_TYPES.map((t) => (
            <button key={t} type="button" role="radio" className="app-qf-chip" aria-checked={v.type === t} onClick={() => set('type', t)} title={PARTNER_INFO[t].hint}>
              <Icon name={PARTNER_INFO[t].icon} size={18} />{PARTNER_INFO[t].short}
            </button>
          ))}
        </div>
        {err('type')}
      </div>

      <div className="qf-sec">
        <Sub>Cần mua gì?</Sub>
        {plan && (
          <div className="qf-plan">
            <div className="qf-plan__h">
              <b><Icon name="receipt" size={18} />Phương án chọn cây đính kèm · {KINDS[plan.kind].name}</b>
              <span className="qf-plan__acts">
                <Link href={`${ADVISOR_URL}?loai=${plan.kind}`}>Sửa phương án</Link>
                <button type="button" onClick={dropPlan}>Bỏ đính kèm</button>
              </span>
            </div>
            <ul>
              {plan.lines.slice(0, 8).map((l, i) => (
                <li key={i}>{l.title}: <b>{l.qty.toLocaleString('vi-VN')} {l.unit}</b>{l.height ? `, cao ${l.height}` : ''}{l.product ? ` — ${l.product}` : ''}</li>
              ))}
              {plan.lines.length > 8 && <li>… và {plan.lines.length - 8} mục khác</li>}
            </ul>
            {plan.total > 0 && <span className="qf-plan__total">Tạm tính theo giá trên web: <b>{money(plan.total)}</b> — báo giá sỉ chính thức gửi qua Zalo</span>}
          </div>
        )}
        <div className="ad-f">
          <textarea id="qf-items" aria-label="Ghi chú" {...bad('items')} className={`vx-input app-qf-items${touched && errors.items ? ' vx-input--error' : ''}`} maxLength={4000} value={v.items}
            onChange={(e) => set('items', e.target.value)}
            placeholder={'VD: Kim tiền cao 60cm × 20 cây\nLưỡi hổ chậu C9 × 50'} />
          {err('items')}
        </div>
        <div className="ad-f">
          <div className="qf-up">
            {photos.map((p, i) => (
              <span key={p.url} className="app-qf-photo" style={{ backgroundImage: `url(${p.url})` }}>
                <button type="button" aria-label={`Xóa ảnh ${i + 1}`} onClick={() => removePhoto(i)}><Icon name="close" /></button>
              </span>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" className="add app-qf-add" onClick={() => fileInput.current?.click()}>
                <Icon name="camera" size={18} />
                {photos.length ? 'Thêm ảnh' : 'Gửi ảnh danh sách / BOQ'}
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
          </div>
        </div>
      </div>

      <div className="qf-sec">
        <Sub>Liên hệ</Sub>
        <div className="ad-frow app-qf-grid">
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-company">Đơn vị / cửa hàng</label><input id="qf-company" value={v.company} onChange={(e) => set('company', e.target.value)} autoComplete="organization" maxLength={120} /></div>
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-name">Người liên hệ</label><input id="qf-name" {...bad('name')} value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" maxLength={80} /></div>
            {err('name')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-phone">SĐT / Zalo</label><input id="qf-phone" {...bad('phone')} value={v.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" maxLength={15} /></div>
            {err('phone')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-addr">Nơi giao hàng</label><input id="qf-addr" {...bad('address')} value={v.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" maxLength={200} placeholder="Tỉnh / thành, hoặc địa chỉ công trình" /></div>
            {err('address')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-needby">Thời gian cần hàng</label><input id="qf-needby" value={v.needBy} onChange={(e) => set('needBy', e.target.value)} maxLength={80} placeholder="VD: đầu tháng 12" /></div>
          </div>
        </div>
        {/* Ô bẫy bot — người dùng không thấy */}
        <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="app-hp" />
      </div>

      {error && <span className="vx-err" role="alert">{error}</span>}
      <div className="app-qf-actions">
        <button type="submit" className="vx-btn vx-btn--primary vx-btn--lg" disabled={pending}>{pending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
      </div>
    </form>
  );
}
