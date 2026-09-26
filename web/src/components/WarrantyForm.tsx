'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { createWarrantyAction } from '@/app/actions/warranty';
import { compressImage as compress } from '@/lib/compress-image';
import { Art, Icon, type IconName } from './Icon';

export type WarrantyItem = { itemId: number; name: string; label: string; icon: string; code: string; daysLeft: number };

const SYMPTOMS = ['Lá vàng', 'Lá mềm, rũ', 'Đốm nâu', 'Rụng lá', 'Thối gốc', 'Có sâu, rệp', 'Dập, gãy khi nhận'];
const SHOTS = [
  { title: 'Toàn cây', hint: 'Chụp cả chậu, đủ sáng' },
  { title: 'Cận lá bệnh', hint: 'Mặt trên và mặt dưới lá' },
  { title: 'Gốc và mặt đất', hint: 'Nhấc nhẹ cây nếu được' },
];

/** WarrantyRequest: 1 Chọn cây → 2 Chụp ảnh & mô tả → 3 Gửi yêu cầu. */
export function WarrantyForm({ items }: { items: WarrantyItem[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [item, setItem] = useState<WarrantyItem | null>(items.length === 1 ? items[0] : null);
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [previews, setPreviews] = useState<string[]>(['', '', '']);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [placement, setPlacement] = useState('');
  const [watering, setWatering] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [pending, start] = useTransition();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const pick = async (i: number, f?: File) => {
    if (!f) return;
    setError('');
    try {
      const c = await compress(f);
      setPhotos((p) => p.map((x, j) => (j === i ? c : x)));
      setPreviews((p) => p.map((x, j) => (j === i ? URL.createObjectURL(c) : x)));
    } catch {
      setError('Không đọc được ảnh này, vui lòng chọn ảnh khác');
    }
  };

  const next = () => {
    setError('');
    if (step === 1 && !item) return setError('Chọn cây cần bảo hành');
    if (step === 2) {
      if (!photos.some(Boolean)) return setError('Cần ít nhất 1 ảnh cây');
      if (!symptoms.length) return setError('Chọn ít nhất một triệu chứng');
    }
    setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s));
  };

  const submit = () => {
    if (!item) return;
    const fd = new FormData();
    fd.set('orderItemId', String(item.itemId));
    symptoms.forEach((s) => fd.append('symptoms', s));
    fd.set('description', description);
    fd.set('placement', placement);
    fd.set('watering', watering);
    photos.forEach((p) => p && fd.append('photos', p));
    start(async () => {
      const r = await createWarrantyAction(fd).catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
      if (!r.ok) { setError(r.error); return; }
      setDone(r.code);
      router.refresh();
    });
  };

  if (done) {
    return (
      <section className="vx-profile" style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <span className="os-check"><Icon name="check" /></span>
        <h3 style={{ margin: 0 }}>Đã gửi yêu cầu {done}</h3>
        <p style={{ margin: 0, color: 'var(--ink-muted)' }}>Kỹ sư sẽ xem ảnh và phản hồi trong 24 giờ. Giữ nguyên cây, chưa cắt lá bệnh nhé.</p>
      </section>
    );
  }

  const steps = ['Chọn cây', 'Chụp ảnh & mô tả', 'Gửi yêu cầu'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="wr-steps">
        {steps.map((s, i) => (
          <span key={s} style={{ display: 'contents' }}>
            {i > 0 && <i />}
            <span className={i + 1 < step ? 'done' : i + 1 === step ? 'on' : undefined}><b>{i + 1}</b>{s}</span>
          </span>
        ))}
      </div>
      <div className="app-cols" style={{ display: 'grid', '--cols': 'minmax(0,1fr) 300px', gap: 12, alignItems: 'start' }}>
        <section className="vx-profile" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 1 && (
            <>
              <b style={{ fontSize: 14 }}>Cây nào cần bảo hành?</b>
              <div className="vx-pay" role="radiogroup">
                {items.map((it) => (
                  <button key={it.itemId} type="button" role="radio" className="vx-pay__opt" aria-checked={item?.itemId === it.itemId} onClick={() => setItem(it)}>
                    <span className="vx-radio" />
                    <span className="vx-pay__mark"><Art name={it.icon as IconName} /></span>
                    <span>{it.name}<small>{it.label} · Đơn {it.code} · còn {it.daysLeft} ngày bảo hành</small></span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step >= 2 && item && (
            <div className="au-who">
              <span className="vx-item__img" style={{ width: 48, height: 48 }}><Art name={item.icon as IconName} /></span>
              <span><b>{item.name}</b><small>{item.label} · Đơn {item.code}</small></span>
              <span className="vx-badge vx-badge--success" style={{ marginLeft: 'auto' }}>Còn {item.daysLeft} ngày</span>
            </div>
          )}

          {step === 2 && (
            <>
              <b style={{ fontSize: 14 }}>Chụp 3 ảnh theo gợi ý</b>
              <div className="wr-shots">
                {SHOTS.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    className={`wr-shot${photos[i] ? ' done' : ''}`}
                    style={{ position: 'relative', cursor: 'pointer', font: 'inherit', background: previews[i] ? `center/cover no-repeat url(${previews[i]})` : undefined }}
                    onClick={() => inputs.current[i]?.click()}
                  >
                    {photos[i] ? <em>{s.title} ✓</em> : <><Icon name="plus" /><b style={{ color: 'var(--ink)' }}>{s.title}</b>{s.hint}</>}
                    <input
                      ref={(el) => { inputs.current[i] = el; }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={(e) => pick(i, e.target.files?.[0])}
                    />
                  </button>
                ))}
              </div>
              <b style={{ fontSize: 14 }}>Cây bị gì?</b>
              <div className="vx-row">
                {SYMPTOMS.map((s) => (
                  <button key={s} type="button" className="vx-chip" aria-pressed={symptoms.includes(s)}
                    onClick={() => setSymptoms((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}>{s}</button>
                ))}
              </div>
              <div className="ad-f">
                <label htmlFor="wr-desc">Mô tả thêm</label>
                <textarea id="wr-desc" className="vx-input" style={{ minHeight: 60, fontSize: 13 }} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000}
                  placeholder="Ví dụ: Lá dưới vàng và mềm từ hôm qua, đất vẫn ẩm dù tưới 2 lần/tuần." />
              </div>
              <div className="ad-frow two">
                <div className="ad-f">
                  <label htmlFor="wr-place">Cây đặt ở đâu?</label>
                  <input id="wr-place" className="vx-input" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Trong nhà, cách cửa sổ 2m" maxLength={120} />
                </div>
                <div className="ad-f">
                  <label htmlFor="wr-water">Tưới bao lâu một lần?</label>
                  <input id="wr-water" className="vx-input" value={watering} onChange={(e) => setWatering(e.target.value)} placeholder="2 lần/tuần" maxLength={120} />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="ad-kv">
              <span>Ảnh</span><span>{photos.filter(Boolean).length} ảnh</span>
              <span>Triệu chứng</span><span>{symptoms.join(', ')}</span>
              {description && <><span>Mô tả</span><span>{description}</span></>}
              {placement && <><span>Vị trí đặt</span><span>{placement}</span></>}
              {watering && <><span>Tưới</span><span>{watering}</span></>}
            </div>
          )}

          {error && <span className="vx-err" role="alert">{error}</span>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {step > 1 && <button type="button" className="vx-btn vx-btn--outline" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>Quay lại</button>}
            {step < 3
              ? <button type="button" className="vx-btn vx-btn--primary" onClick={next}>Tiếp tục</button>
              : <button type="button" className="vx-btn vx-btn--primary" onClick={submit} disabled={pending}>{pending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>}
          </div>
        </section>
        <aside className="ad-card" style={{ borderRadius: 16 }}>
          <div className="ad-card__h">Sau khi gửi</div>
          <div className="ad-card__b">
            <div className="wr-track">
              <div className={step === 3 ? 'now' : undefined}><i /><span><b>Gửi yêu cầu</b><small>Kèm ảnh và mô tả</small></span></div>
              <div><i /><span><b>Kỹ sư xem xét</b><small>Phản hồi trong 24 giờ</small></span></div>
              <div><i /><span><b>Kết quả</b><small>Đổi cây · Hướng dẫn cứu cây + tặng vật tư · Hoàn tiền</small></span></div>
              <div><i /><span><b>Hoàn tất</b><small>Giao cây mới hoặc hoàn tiền</small></span></div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Mẹo: giữ nguyên cây, không cắt lá bệnh trước khi kỹ sư xem.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
