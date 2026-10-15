'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createServiceRequestAction } from '@/app/actions/service-requests';
import { isPhone } from '@/lib/auth';
import { compressImage } from '@/lib/compress-image';
import { money } from '@/lib/format';
import { PARTNER_INFO, PARTNER_TYPES, WHOLESALE_URL, type PartnerType } from '@/lib/partners';
import { ADVISOR_URL, KINDS, PLAN_STORE_KEY, type SavedPlan } from '@/lib/plant-advisor';
import { NEED_BY } from '@/lib/service-labels';
import { Icon } from './Icon';

export type WholesaleDefaults = { type?: PartnerType; company: string; name: string; phone: string; address: string };

const DRAFT_KEY = 'ccmt-wholesale-quote-draft';
const MAX_PHOTOS = 3;

type Draft = { type: PartnerType | null; items: string; needBy: string; company: string; name: string; phone: string; address: string };

/** Form Yêu cầu báo giá sỉ (/bao-gia-si): loại đối tác → danh sách hàng (+ ảnh bảng khối lượng, phương án từ Tư vấn chọn cây) → liên hệ. */
export function WholesaleQuoteForm({ defaults, fromAdvisor = false }: { defaults: WholesaleDefaults; fromAdvisor?: boolean }) {
  const [v, setV] = useState<Draft>({
    type: defaults.type ?? null, items: '', needBy: '', company: defaults.company, name: defaults.name, phone: defaults.phone, address: defaults.address,
  });
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(k: K, val: Draft[K]) => setV((x) => ({ ...x, [k]: val }));

  // Nháp lưu trên máy này (không gồm ảnh). Loại đối tác trên link (?loai=) ưu tiên hơn nháp.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Draft>;
      setV((x) => ({
        ...x, ...d,
        type: defaults.type ?? (d.type && PARTNER_TYPES.includes(d.type) ? d.type : x.type),
        company: d.company || x.company, name: d.name || x.name, phone: d.phone || x.phone, address: d.address || x.address,
      }));
      setInfo('Đã mở lại bản nháp bạn lưu trước đó.');
    } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
  }, [defaults.type]);

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

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
      setInfo('Đã lưu nháp trên máy này (ảnh cần chọn lại khi gửi).');
    } catch {
      setInfo('Trình duyệt không cho lưu nháp.');
    }
  };

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
    items: v.items.trim().length < 5 && !plan && !photos.length && 'Ghi danh sách hàng cần báo giá, hoặc gửi kèm ảnh',
    name: v.name.trim().length < 2 && 'Nhập tên người liên hệ',
    phone: !isPhone(v.phone) && 'Số điện thoại chưa đúng',
    address: v.address.trim().length < 3 && 'Nhập nơi giao hàng (tỉnh / thành hoặc địa chỉ công trình)',
  };
  const err = (k: keyof typeof errors) => (touched && errors[k] ? <span className="vx-err">{errors[k]}</span> : null);

  const submit = () => {
    setTouched(true);
    setError('');
    if (Object.values(errors).some(Boolean)) {
      setError('Vui lòng kiểm tra lại các ô được đánh dấu');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  if (done !== null) {
    return (
      <div className="qf-card app-qf-done">
        <span className="os-check"><Icon name="check" /></span>
        <h1>Đã nhận yêu cầu báo giá{done ? ` ${done}` : ''}</h1>
        <p>
          Nhân viên kinh doanh sẽ gọi số <b>{v.phone}</b> để xác nhận danh sách hàng, quy cách và nơi giao, rồi gửi báo giá sỉ qua Zalo.
        </p>
        <div className="vx-row" style={{ justifyContent: 'center' }}>
          <Link href={WHOLESALE_URL} className="vx-btn vx-btn--outline">Về trang Đối tác</Link>
          <Link href="/danh-muc" className="vx-btn vx-btn--primary">Xem sản phẩm</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="qf-card" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div className="vx-crumb"><Link href={WHOLESALE_URL}>Đối tác sỉ</Link>/<span>Yêu cầu báo giá sỉ</span></div>
      <h1>Yêu cầu báo giá sỉ</h1>

      <div className="qf-sec">
        <h2><b>1</b>Bạn là đối tác nào?</h2>
        <div className="qf-opts app-qf-opts3" role="radiogroup" aria-label="Loại đối tác">
          {PARTNER_TYPES.map((t) => (
            <button key={t} type="button" role="radio" className="qf-opt" aria-checked={v.type === t} onClick={() => set('type', t)}>
              <Icon name={PARTNER_INFO[t].icon} />
              {PARTNER_INFO[t].label}<small>{PARTNER_INFO[t].hint}</small>
            </button>
          ))}
        </div>
        {err('type')}
      </div>

      <div className="qf-sec">
        <h2><b>2</b>Hàng cần báo giá</h2>
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
          <label htmlFor="qf-items">Danh sách cây / vật tư{plan || photos.length ? ' (thêm nếu cần)' : ''}</label>
          <textarea id="qf-items" className={`vx-input app-qf-items${touched && errors.items ? ' vx-input--error' : ''}`} maxLength={4000} value={v.items}
            onChange={(e) => set('items', e.target.value)}
            placeholder={'Mỗi dòng một loại: tên cây, quy cách (chiều cao, đường kính gốc, cỡ bầu), số lượng\nVí dụ:\nCau vua, cao 3–3,5m, bầu 60cm — 40 cây\nLá màu, bầu 15cm — 2.000 bầu'} />
          {err('items')}
        </div>
        <div className="ad-f">
          <label>Ảnh bảng khối lượng, bản vẽ hoặc danh sách viết tay (không bắt buộc, tối đa {MAX_PHOTOS} ảnh)</label>
          <div className="qf-up">
            {photos.map((p, i) => (
              <span key={p.url} className="app-qf-photo" style={{ backgroundImage: `url(${p.url})` }}>
                <button type="button" aria-label={`Xóa ảnh ${i + 1}`} onClick={() => removePhoto(i)}><Icon name="close" /></button>
              </span>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" className="add app-qf-add" onClick={() => fileInput.current?.click()}>
                <Icon name="camera" />
                Thêm ảnh
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
          </div>
        </div>
        <div className="ad-f">
          <label>Khi nào cần hàng?</label>
          <div className="vx-row">
            {NEED_BY.map((b) => (
              <button key={b} type="button" className="vx-chip" aria-pressed={v.needBy === b} onClick={() => set('needBy', v.needBy === b ? '' : b)}>{b}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="qf-sec">
        <h2><b>3</b>Thông tin liên hệ</h2>
        <div className="ad-frow">
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-company">Tên đơn vị / cửa hàng (không bắt buộc)</label><input id="qf-company" value={v.company} onChange={(e) => set('company', e.target.value)} autoComplete="organization" maxLength={120} /></div>
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-name">Người liên hệ</label><input id="qf-name" value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" maxLength={80} /></div>
            {err('name')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-phone">Số điện thoại / Zalo</label><input id="qf-phone" value={v.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" maxLength={15} /></div>
            {err('phone')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-addr">Nơi giao hàng</label><input id="qf-addr" value={v.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" maxLength={200} placeholder="Tỉnh / thành, hoặc địa chỉ công trình" /></div>
            {err('address')}
          </div>
        </div>
        {/* Ô bẫy bot — người dùng không thấy */}
        <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="app-hp" />
      </div>

      {error && <span className="vx-err" role="alert">{error}</span>}
      {info && !error && <span className="vx-help" role="status">{info}</span>}
      <div className="app-qf-actions">
        <button type="button" className="vx-btn vx-btn--outline" onClick={saveDraft}>Lưu nháp</button>
        <button type="submit" className="vx-btn vx-btn--primary vx-btn--lg" disabled={pending}>{pending ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'}</button>
      </div>
    </form>
  );
}
