'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createServiceRequestAction } from '@/app/actions/service-requests';
import { isPhone } from '@/lib/auth';
import { compressImage } from '@/lib/compress-image';
import { money } from '@/lib/format';
import { ADVISOR_URL, KINDS, PLAN_STORE_KEY, type SavedPlan } from '@/lib/plant-advisor';
import { RENTAL_STORE_KEY, RENTAL_URL } from '@/lib/office-rental';
import {
  BUDGETS, SERVICE_INFO, SERVICE_TYPES, SLOT_TIMES, SPACES, STYLES, SUNS, fmtSlot, fmtSlotDay, type ServiceType, type SlotTime,
} from '@/lib/service-labels';
import { Icon } from './Icon';
import { Select } from './Select';

export type QuoteSlot = { key: string; date: string; time: SlotTime; full: boolean };
export type QuoteDefaults = { service?: ServiceType; name: string; phone: string; address: string };

// Icon 4 thẻ dịch vụ, lấy từ design-system/components/QuoteRequestForm/preview.html
const SERVICE_ICON: Record<ServiceType, React.ReactNode> = {
  garden: <><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-5h4v5" /></>,
  office: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></>,
  care: <><path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" /><path d="M20 3v5h-5" /></>,
  clinic: <><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" /></>,
};

const DRAFT_KEY = 'ccmt-quote-draft';
const MAX_PHOTOS = 3;

type Draft = {
  service: ServiceType | null; space: string; area: string; sun: string; styles: string[]; budget: string;
  slot: string; name: string; phone: string; address: string; note: string;
};

/** QuoteRequestForm: 5 phần trên một trang — dịch vụ → không gian → ngân sách → lịch khảo sát → liên hệ. */
export function QuoteForm({ defaults, slots, fromAdvisor = false, fromRental = false }: {
  defaults: QuoteDefaults; slots: QuoteSlot[];
  /** Mở từ nút "Gửi phương án" của trang Tư vấn chọn cây. */ fromAdvisor?: boolean;
  /** Mở từ nút "Gửi yêu cầu kèm ước tính" của trang Cho thuê cây văn phòng. */ fromRental?: boolean;
}) {
  const [v, setV] = useState<Draft>({
    service: defaults.service ?? null, space: '', area: '', sun: '', styles: [], budget: '',
    slot: '', name: defaults.name, phone: defaults.phone, address: defaults.address, note: '',
  });
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [done, setDone] = useState<{ code: string; slot: string } | null>(null);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [rental, setRental] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(k: K, val: Draft[K]) => setV((x) => ({ ...x, [k]: val }));

  // Nháp lưu trên máy này (không gồm ảnh). Link từ trang dịch vụ (?loai=) ưu tiên hơn dịch vụ trong nháp.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Draft>;
      setV((x) => ({
        ...x, ...d,
        service: defaults.service ?? d.service ?? x.service,
        // Lịch đã qua hoặc đã kín thì bỏ
        slot: slots.some((s) => s.key === d.slot && !s.full) ? d.slot! : '',
        name: d.name || x.name, phone: d.phone || x.phone, address: d.address || x.address,
      }));
      setInfo('Đã mở lại bản nháp bạn lưu trước đó.');
    } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
  }, [defaults.service, slots]);

  // Phương án từ trang Tư vấn chọn cây: đính kèm + ghi sẵn loại không gian, diện tích, hướng nắng
  useEffect(() => {
    if (!fromAdvisor) return;
    try {
      const raw = sessionStorage.getItem(PLAN_STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { plan: SavedPlan; prefill: { service?: ServiceType; space?: string; area?: number; sun?: string } };
      if (!d.plan?.lines?.length || !KINDS[d.plan.kind]) return;
      setPlan(d.plan);
      const f = d.prefill ?? {};
      setV((x) => ({
        ...x,
        service: f.service && SERVICE_TYPES.includes(f.service) ? f.service : x.service,
        space: f.space && (SPACES as readonly string[]).includes(f.space) ? f.space : x.space,
        area: f.area && f.area >= 1 ? String(Math.min(100_000, Math.round(f.area))) : x.area,
        sun: f.sun && (SUNS as readonly string[]).includes(f.sun) ? f.sun : x.sun,
      }));
    } catch { /* bỏ qua */ }
  }, [fromAdvisor]);
  // Ước tính từ trang Cho thuê cây văn phòng: đính kèm vào ghi chú khi gửi + ghi sẵn loại không gian, diện tích
  useEffect(() => {
    if (!fromRental) return;
    try {
      const raw = sessionStorage.getItem(RENTAL_STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { note?: string; area?: number };
      if (typeof d.note !== 'string' || !d.note) return;
      setRental(d.note.slice(0, 600));
      setV((x) => ({
        ...x,
        service: 'office',
        space: 'Văn phòng',
        area: d.area && d.area >= 1 ? String(Math.min(100_000, Math.round(d.area))) : x.area,
      }));
    } catch { /* bỏ qua */ }
  }, [fromRental]);
  const dropRental = () => {
    setRental(null);
    try { sessionStorage.removeItem(RENTAL_STORE_KEY); } catch { /* bỏ qua */ }
  };

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
    const room = MAX_PHOTOS - photos.length;
    const picked: { file: File; url: string }[] = [];
    for (const f of Array.from(files).slice(0, room)) {
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
    service: !v.service && 'Chọn dịch vụ bạn cần',
    area: v.area !== '' && !(Number(v.area) >= 1) && 'Diện tích chưa đúng',
    name: v.name.trim().length < 2 && 'Nhập họ tên',
    phone: !isPhone(v.phone) && 'Số điện thoại chưa đúng',
    address: v.address.trim().length < 5 && 'Nhập địa chỉ khảo sát',
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
    fd.set('service', v.service!);
    if (v.space) fd.set('space', v.space);
    if (v.area) fd.set('area', v.area);
    if (v.sun) fd.set('sun', v.sun);
    v.styles.forEach((s) => fd.append('styles', s));
    if (v.budget) fd.set('budget', v.budget);
    if (v.slot) fd.set('slot', v.slot);
    fd.set('name', v.name);
    fd.set('phone', v.phone);
    fd.set('address', v.address);
    const note = [rental, v.note.trim()].filter(Boolean).join('\n').slice(0, 1000);
    if (note) fd.set('note', note);
    fd.set('website', honeypot.current?.value ?? '');
    if (plan) fd.set('plan', JSON.stringify(plan));
    photos.forEach((p) => fd.append('photos', p.file));
    start(async () => {
      const r = await createServiceRequestAction(fd).catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
      if (!r.ok) { setError(r.error); return; }
      try { localStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(PLAN_STORE_KEY); sessionStorage.removeItem(RENTAL_STORE_KEY); } catch { /* bỏ qua */ }
      const s = slots.find((x) => x.key === v.slot);
      setDone({ code: r.code, slot: s ? fmtSlot(s.date, s.time) : '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  if (done) {
    return (
      <div className="qf-card app-qf-done">
        <span className="os-check"><Icon name="check" /></span>
        <h1>Đã nhận yêu cầu{done.code ? ` ${done.code}` : ''}</h1>
        <p>
          Kỹ sư sẽ gọi số <b>{v.phone}</b> trong 2 giờ làm việc để xác nhận
          {done.slot ? <> lịch khảo sát <b>{done.slot}</b></> : ' và hẹn lịch khảo sát'}.
          Báo giá gửi qua Zalo trong 48 giờ sau khi khảo sát.
        </p>
        <div className="vx-row" style={{ justifyContent: 'center' }}>
          <Link href="/dich-vu" className="vx-btn vx-btn--outline">Về trang Dịch vụ</Link>
          <Link href="/" className="vx-btn vx-btn--primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  const showStyles = v.service !== 'care' && v.service !== 'clinic';
  const days = [...new Set(slots.map((s) => s.date))];

  return (
    <form className="qf-card" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div className="vx-crumb"><Link href="/dich-vu">Dịch vụ</Link>/<span>Đặt lịch khảo sát</span></div>
      <h1>Đặt lịch khảo sát &amp; báo giá</h1>

      <div className="qf-sec">
        <h3><b>1</b>Bạn cần dịch vụ gì?</h3>
        <div className="qf-opts" role="radiogroup" aria-label="Dịch vụ">
          {SERVICE_TYPES.map((s) => (
            <button key={s} type="button" role="radio" className="qf-opt" aria-checked={v.service === s} onClick={() => set('service', s)}>
              <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">{SERVICE_ICON[s]}</svg>
              {SERVICE_INFO[s].label}<small>{SERVICE_INFO[s].hint}</small>
            </button>
          ))}
        </div>
        {err('service')}
      </div>

      {rental && (
        <div className="qf-plan">
          <div className="qf-plan__h">
            <b><Icon name="receipt" size={18} />Gói / số cây thuê bạn đã chọn</b>
            <span className="qf-plan__acts">
              <Link href={`${RENTAL_URL}#tinh-chi-phi`}>Chọn lại</Link>
              <button type="button" onClick={dropRental}>Bỏ đính kèm</button>
            </span>
          </div>
          <span>{rental.replace(/^Thuê cây văn phòng \(tính trên web\): /, '')}</span>
          <span className="qf-plan__total">Gửi kèm yêu cầu này; kỹ sư báo giá chính thức sau khảo sát.</span>
        </div>
      )}

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
              <li key={i}>{l.title}: <b>{l.qty.toLocaleString('vi-VN')} {l.unit}</b>{l.height ? `, cao ${l.height}` : ''}{l.product ? ` — ${l.product}` : ' — nhờ kỹ sư chọn'}</li>
            ))}
            {plan.lines.length > 8 && <li>… và {plan.lines.length - 8} mục khác</li>}
          </ul>
          {plan.total > 0 && <span className="qf-plan__total">Tạm tính cây có sẵn: <b>{money(plan.total)}</b> (kỹ sư báo giá chính thức sau khảo sát)</span>}
        </div>
      )}

      <div className="qf-sec">
        <h3><b>2</b>Không gian của bạn</h3>
        <div className="ad-frow">
          <div className="ad-f">
            <label htmlFor="qf-space">Loại không gian</label>
            <Select id="qf-space" className="vx-input" value={v.space} onChange={(e) => set('space', e.target.value)}>
              <option value="">Chọn…</option>
              {SPACES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div className="ad-f">
            <label htmlFor="qf-area">Diện tích (m²)</label>
            <input id="qf-area" className={`vx-input${touched && errors.area ? ' vx-input--error' : ''}`} inputMode="numeric" placeholder="Ví dụ: 8"
              value={v.area} onChange={(e) => set('area', e.target.value.replace(/\D/g, '').slice(0, 6))} />
            {err('area')}
          </div>
          <div className="ad-f">
            <label htmlFor="qf-sun">Hướng / nắng</label>
            <Select id="qf-sun" className="vx-input" value={v.sun} onChange={(e) => set('sun', e.target.value)}>
              <option value="">Chọn…</option>
              {SUNS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <div className="ad-f">
          <label>Ảnh hiện trạng (giúp báo giá sát hơn, tối đa {MAX_PHOTOS} ảnh)</label>
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
        {showStyles && (
          <div className="ad-f">
            <label>Phong cách mong muốn</label>
            <div className="vx-row">
              {STYLES.map((s) => (
                <button key={s} type="button" className="vx-chip" aria-pressed={v.styles.includes(s)}
                  onClick={() => set('styles', v.styles.includes(s) ? v.styles.filter((x) => x !== s) : [...v.styles, s])}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="qf-sec">
        <h3><b>3</b>Ngân sách dự kiến</h3>
        <div className="vx-row">
          {BUDGETS.map((b) => (
            <button key={b} type="button" className="vx-chip" aria-pressed={v.budget === b} onClick={() => set('budget', v.budget === b ? '' : b)}>{b}</button>
          ))}
        </div>
      </div>

      <div className="qf-sec">
        <h3><b>4</b>Chọn lịch khảo sát</h3>
        {/* Máy tính: mỗi cột một ngày (sáng trên, chiều dưới). Điện thoại: mỗi hàng một ngày. */}
        <div className="vx-slots2 app-qf-slots" style={{ '--days': days.length } as React.CSSProperties}>
          {slots.map((s) => (
            <button key={s.key} type="button" className="vx-tslot" aria-pressed={v.slot === s.key} aria-disabled={s.full || undefined}
              onClick={() => !s.full && set('slot', v.slot === s.key ? '' : s.key)}>
              {fmtSlotDay(s.date)}<small>{s.full ? 'Đã kín' : SLOT_TIMES[s.time]}</small>
            </button>
          ))}
        </div>
        <span className="vx-help">{v.slot ? 'Bấm lại ô đã chọn để bỏ chọn.' : 'Chưa tiện ngày nào? Bỏ trống, kỹ sư sẽ gọi để hẹn giờ phù hợp.'}</span>
      </div>

      <div className="qf-sec">
        <h3><b>5</b>Thông tin liên hệ</h3>
        <div className="ad-frow">
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-name">Họ và tên</label><input id="qf-name" value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" maxLength={80} /></div>
            {err('name')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-phone">Số điện thoại</label><input id="qf-phone" value={v.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" maxLength={15} /></div>
            {err('phone')}
          </div>
          <div className="vx-field">
            <div className="vx-fl"><label htmlFor="qf-addr">Địa chỉ khảo sát</label><input id="qf-addr" value={v.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" maxLength={200} /></div>
            {err('address')}
          </div>
        </div>
        <div className="ad-f">
          <label htmlFor="qf-note">Ghi chú cho kỹ sư (không bắt buộc)</label>
          <textarea id="qf-note" className="vx-input" style={{ minHeight: 64, fontSize: '0.8125rem' }} maxLength={1000} value={v.note} onChange={(e) => set('note', e.target.value)}
            placeholder="Ví dụ: muốn thuê 30 cây cho văn phòng 2 tầng, cần báo giá theo tháng" />
        </div>
        {/* Ô bẫy bot — người dùng không thấy */}
        <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="app-hp" />
      </div>

      {error && <span className="vx-err" role="alert">{error}</span>}
      {info && !error && <span className="vx-help" role="status">{info}</span>}
      <div className="app-qf-actions">
        <button type="button" className="vx-btn vx-btn--outline" onClick={saveDraft}>Lưu nháp</button>
        <button type="submit" className="vx-btn vx-btn--primary vx-btn--lg" disabled={pending}>{pending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
      </div>
    </form>
  );
}
