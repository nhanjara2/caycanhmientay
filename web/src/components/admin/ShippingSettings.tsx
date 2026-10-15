'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveShippingAction } from '@/app/actions/shipping';
import { MAX_SLOTS, REGION_LABEL, WEEKDAYS, type ShipRegion, type ShippingConfig } from '@/lib/shipping';
import { PROVINCES } from '@/lib/vn-provinces';
import { Select } from '@/components/Select';

type Form = {
  feeHcm: string; feeWest: string; feeFar: string; bulky: string; hcm: string[]; west: string[];
  plantFree: string; supplyFee: string; supplyFree: string; minOrder: string; zoneKm: string; zoneOn: boolean; slotsOn: boolean; daysAhead: string;
  slots: { key: string; from: string; to: string }[];
  cap: Record<string, string[]>;
  closed: { date: string; note: string }[];
};

const digits = (s: string) => s.replace(/\D/g, '');
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const toForm = (c: ShippingConfig): Form => ({
  feeHcm: String(c.plant.regionFee.hcm), feeWest: String(c.plant.regionFee.west), feeFar: String(c.plant.regionFee.far), bulky: String(c.plant.bulky),
  hcm: [...c.regionProvinces.hcm], west: [...c.regionProvinces.west], plantFree: String(c.plant.freeFrom), supplyFee: String(c.supply.fee), supplyFree: String(c.supply.freeFrom), minOrder: String(c.minOrder),
  zoneKm: String(c.plantZoneKm), zoneOn: c.plantZoneEnabled, slotsOn: c.slotsEnabled, daysAhead: String(c.daysAhead), slots: c.slots.map((s) => ({ ...s })),
  cap: Object.fromEntries(c.slots.map((s) => [s.key, (c.cap[s.key] ?? Array(7).fill(0)).map(String)])),
  closed: c.closed.map((x) => ({ ...x })),
});

/** AdminShippingSettings: phí giao theo nhóm, giới hạn vùng giao cây sống (tùy chọn), khung giờ × thứ với số đơn tối đa và ngày nghỉ lễ (khi shop có xe giao riêng). */
export function ShippingSettings({ initial }: { initial: ShippingConfig }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(() => toForm(initial));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const edit = (fn: (x: Form) => Form) => { setF(fn); setSaved(false); };

  const setSlot = (i: number, k: 'from' | 'to', v: string) => edit((x) => ({ ...x, slots: x.slots.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
  const setCap = (key: string, d: number, v: string) => edit((x) => ({ ...x, cap: { ...x.cap, [key]: x.cap[key].map((c, j) => (j === d ? digits(v).slice(0, 3) : c)) } }));
  const addSlot = () => edit((x) => {
    let n = x.slots.length + 1;
    while (x.slots.some((s) => s.key === `khung-${n}`)) n++;
    const key = `khung-${n}`;
    return { ...x, slots: [...x.slots, { key, from: '18:00', to: '20:00' }], cap: { ...x.cap, [key]: Array(7).fill('4') } };
  });
  const removeSlot = (i: number) => edit((x) => {
    const key = x.slots[i].key;
    const { [key]: _drop, ...cap } = x.cap;
    return { ...x, slots: x.slots.filter((_, j) => j !== i), cap };
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      plant: { freeFrom: Number(f.plantFree || 0), regionFee: { hcm: Number(f.feeHcm || 0), west: Number(f.feeWest || 0), far: Number(f.feeFar || 0) }, bulky: Number(f.bulky || 0) },
      regionProvinces: { hcm: f.hcm, west: f.west },
      supply: { fee: Number(f.supplyFee || 0), freeFrom: Number(f.supplyFree || 0) },
      minOrder: Number(f.minOrder || 0),
      plantZoneEnabled: f.zoneOn,
      plantZoneKm: Number(f.zoneKm || 0),
      slotsEnabled: f.slotsOn,
      daysAhead: Number(f.daysAhead || 0),
      slots: f.slots,
      cap: Object.fromEntries(f.slots.map((s) => [s.key, f.cap[s.key].map((c) => Number(c || 0))])),
      closed: f.closed.filter((c) => c.date),
    };
    start(async () => {
      const r = await saveShippingAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setF(toForm(r.config));
      setSaved(true);
      router.refresh();
    });
  };

  /** Vùng của một tỉnh / thành trong form; đổi vùng thì giữ nguyên thứ tự danh sách. */
  const regionOf = (name: string): ShipRegion => (f.hcm.includes(name) ? 'hcm' : f.west.includes(name) ? 'west' : 'far');
  const setRegion = (name: string, r: ShipRegion) => edit((x) => {
    const hcm = x.hcm.filter((n) => n !== name), west = x.west.filter((n) => n !== name);
    (r === 'hcm' ? hcm : r === 'west' ? west : []).push(name);
    const order = (list: string[]) => PROVINCES.map((p) => p.name).filter((n) => list.includes(n));
    return { ...x, hcm: order(hcm), west: order(west) };
  });
  const count = (r: ShipRegion) => PROVINCES.filter((p) => regionOf(p.name) === r).length;

  const money = (k: 'feeHcm' | 'feeWest' | 'feeFar' | 'bulky' | 'plantFree' | 'supplyFee' | 'supplyFree' | 'minOrder', label: string, id: string) => (
    <div className="ad-f">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="vx-input" inputMode="numeric" value={f[k]} onChange={(e) => edit((x) => ({ ...x, [k]: digits(e.target.value) }))} />
      <span className="hint">{f[k] === '' || Number(f[k]) === 0 ? '0đ' : `${fmt(Number(f[k]))}đ`}</span>
    </div>
  );

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title"><h1>Cài đặt giao hàng</h1></div>

      <div className="ad-card">
        <div className="ad-card__h">Phí giao và ngưỡng miễn phí</div>
        <div className="ad-card__b" style={{ gap: 16 }}>
          <div>
            <b style={{ fontSize: '0.8125rem' }}>Cây sống</b> <span className="vx-help">đóng khung chống dập, giao qua đơn vị vận chuyển (hoặc xe shop nếu bật bên dưới) — phí tính theo tỉnh / thành nhận hàng</span>
            <div className="ad-frow" style={{ marginTop: 8 }}>
              {money('feeHcm', `Phí giao — ${REGION_LABEL.hcm} (đ)`, 'sh-fee-hcm')}
              {money('feeWest', `Phí giao — ${REGION_LABEL.west} (đ)`, 'sh-fee-west')}
              {money('feeFar', `Phí giao — ${REGION_LABEL.far} (đ)`, 'sh-fee-far')}
            </div>
            <div className="ad-frow two" style={{ marginTop: 8 }}>
              {money('plantFree', 'Miễn phí giao từ đơn cây (đ)', 'sh-pfree')}
              {money('bulky', 'Phụ phí mỗi cây lớn (đ)', 'sh-bulky')}
            </div>
            <span className="vx-help" style={{ display: 'block', marginTop: 6 }}>
              Phụ phí cây lớn cộng thêm cho từng cây đã tích “Lớn” ở quy cách trong trang sửa sản phẩm, <b>kể cả khi đơn đã đủ mức miễn phí giao</b>; 0 = không thu. Khách chưa chọn nơi nhận chỉ thấy số tạm tính theo vùng rẻ nhất.
            </span>
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                Tỉnh / thành thuộc vùng nào ({REGION_LABEL.hcm}: {count('hcm')} · {REGION_LABEL.west}: {count('west')} · {REGION_LABEL.far}: {count('far')})
              </summary>
              <div className="app-region-grid">
                {PROVINCES.map((p) => (
                  <div key={p.name} className="app-region-row">
                    <span>{p.name}</span>
                    <Select className="vx-input" aria-label={`Vùng của ${p.name}`} value={regionOf(p.name)} onChange={(e) => setRegion(p.name, e.target.value as ShipRegion)}>
                      <option value="hcm">{REGION_LABEL.hcm}</option>
                      <option value="west">{REGION_LABEL.west}</option>
                      <option value="far">{REGION_LABEL.far}</option>
                    </Select>
                  </div>
                ))}
              </div>
              <span className="vx-help" style={{ display: 'block', marginTop: 6 }}>34 tỉnh / thành theo địa giới mới (tên tỉnh cũ như Bình Dương, Long An… tự đổi về tỉnh mới). Địa chỉ khách không nhận ra tỉnh thì tính như tỉnh xa.</span>
            </details>
          </div>
          <div>
            <b style={{ fontSize: '0.8125rem' }}>Vật tư</b> <span className="vx-help">thuốc, phân, chậu, dụng cụ…</span>
            <div className="ad-frow two" style={{ marginTop: 8 }}>
              {money('supplyFee', 'Phí giao (đ)', 'sh-sfee')}
              {money('supplyFree', 'Miễn phí giao từ đơn vật tư (đ)', 'sh-sfree')}
            </div>
          </div>
          <div>
            <b style={{ fontSize: '0.8125rem' }}>Đơn tối thiểu để giao hàng</b> <span className="vx-help">tiền hàng sau combo, chưa trừ mã giảm giá; nhận tại vườn và bán tại quầy không giới hạn; 0 = không giới hạn</span>
            <div className="ad-frow two" style={{ marginTop: 8 }}>
              {money('minOrder', 'Tiền hàng tối thiểu mỗi đơn giao (đ)', 'sh-min')}
            </div>
          </div>
          <div className="ad-f">
            <label className="vx-check"><input type="checkbox" checked={f.zoneOn} onChange={(e) => edit((x) => ({ ...x, zoneOn: e.target.checked }))} /> Chỉ giao cây sống trong một vùng quanh cửa hàng</label>
            <span className="hint">
              {f.zoneOn
                ? 'Đang giới hạn: địa chỉ ngoài vùng không đặt được cây sống (chỉ nhận tại vườn hoặc mua vật tư). Chỉ kiểm tra được khi địa chỉ khách đã ghim bản đồ.'
                : 'Đang TẮT: giao cây sống toàn quốc, không giới hạn khoảng cách (phù hợp khi giao qua đơn vị vận chuyển / sàn khác).'}
            </span>
          </div>
          {f.zoneOn && (
            <div className="ad-frow two">
              <div className="ad-f">
                <label htmlFor="sh-km">Bán kính vùng giao cây sống (km)</label>
                <input id="sh-km" className="vx-input" inputMode="decimal" value={f.zoneKm} onChange={(e) => edit((x) => ({ ...x, zoneKm: e.target.value.replace(/[^\d.]/g, '').slice(0, 5) }))} />
                <span className="hint">Tính từ cửa hàng gần nhất tới địa chỉ khách (đã ghim bản đồ). Xa hơn chỉ giao vật tư, thuốc, phân bón.</span>
              </div>
            </div>
          )}
          <span className="vx-help" style={{ margin: 0 }}>Nhận tại vườn luôn miễn phí giao. Giỏ hàng, trang thanh toán và đơn mới dùng số này ngay sau khi lưu; đơn đã đặt giữ nguyên phí cũ.</span>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Khung giờ giao và số đơn tối đa</div>
        <div className="ad-card__b" style={{ gap: 14 }}>
          <div className="ad-f">
            <label className="vx-check"><input type="checkbox" checked={f.slotsOn} onChange={(e) => edit((x) => ({ ...x, slotsOn: e.target.checked }))} /> Cho khách chọn khung giờ giao (shop có xe / tài xế riêng)</label>
            <span className="hint">
              {f.slotsOn
                ? 'Đang BẬT: khách phải chọn khung giờ ở trang thanh toán, đơn vào bảng xếp chuyến ở mục Giao hàng.'
                : 'Đang TẮT: khách không chọn giờ; shop liên hệ xác nhận và gửi qua đơn vị vận chuyển. Bật lên khi shop tự giao bằng xe / tài xế.'}
            </span>
          </div>
          {f.slotsOn && <>
          <div className="ad-frow two">
            <div className="ad-f">
              <label htmlFor="sh-days">Khách được chọn giao trong</label>
              <Select id="sh-days" className="vx-input" value={f.daysAhead} onChange={(e) => edit((x) => ({ ...x, daysAhead: e.target.value }))}>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? 'Chỉ hôm nay' : `${n} ngày (hôm nay + ${n - 1} ngày tới)`}</option>)}
              </Select>
            </div>
          </div>
          <div className="app-slot-table">
            <div className="app-slot-row app-slot-row--head">
              <span>Khung giờ</span>{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}<span />
            </div>
            {f.slots.map((s, i) => (
              <div className="app-slot-row" key={s.key}>
                <span className="app-slot-time">
                  <input className="vx-input" inputMode="numeric" maxLength={5} placeholder="08:00" value={s.from} aria-label="Từ giờ" onChange={(e) => setSlot(i, 'from', e.target.value.replace(/[^\d:]/g, ''))} />
                  –
                  <input className="vx-input" inputMode="numeric" maxLength={5} placeholder="12:00" value={s.to} aria-label="Đến giờ" onChange={(e) => setSlot(i, 'to', e.target.value.replace(/[^\d:]/g, ''))} />
                </span>
                {WEEKDAYS.map((d, j) => (
                  <label key={d} className="app-slot-cap" data-day={d}>
                    <input className="vx-input" inputMode="numeric" value={f.cap[s.key]?.[j] ?? ''} aria-label={`${s.from}–${s.to} ${d}: số đơn tối đa`} onChange={(e) => setCap(s.key, j, e.target.value)} data-off={Number(f.cap[s.key]?.[j] || 0) === 0 || undefined} />
                  </label>
                ))}
                <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={f.slots.length <= 1} onClick={() => removeSlot(i)} aria-label={`Xóa khung ${s.from}–${s.to}`}>Xóa</button>
              </div>
            ))}
          </div>
          <span className="acts" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={f.slots.length >= MAX_SLOTS} onClick={addSlot}>+ Thêm khung giờ</button>
            <span className="vx-help" style={{ margin: 0 }}>Số đơn tối đa mỗi khung theo từng thứ; nhập 0 = không giao khung đó. Đủ số đơn thì khung tự hiện “Đã kín” ở trang thanh toán; khung đóng nhận đơn trước giờ kết thúc 2 giờ.</span>
          </span>
          </>}
        </div>
      </div>

      {f.slotsOn && <div className="ad-card">
        <div className="ad-card__h">Ngày nghỉ lễ, Tết</div>
        <div className="ad-card__b" style={{ gap: 10 }}>
          {f.closed.map((c, i) => (
            <div key={i} className="app-closed-row">
              <input className="vx-input" type="date" value={c.date} aria-label="Ngày nghỉ" onChange={(e) => edit((x) => ({ ...x, closed: x.closed.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)) }))} />
              <input className="vx-input" value={c.note} maxLength={60} placeholder="Ghi chú (VD: Mùng 1 Tết)" aria-label="Ghi chú" onChange={(e) => edit((x) => ({ ...x, closed: x.closed.map((y, j) => (j === i ? { ...y, note: e.target.value } : y)) }))} />
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => edit((x) => ({ ...x, closed: x.closed.filter((_, j) => j !== i) }))}>Xóa</button>
            </div>
          ))}
          {!f.closed.length && <span className="vx-help" style={{ margin: 0 }}>Chưa có ngày nghỉ nào — shop giao mọi ngày theo bảng trên.</span>}
          <span><button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => edit((x) => ({ ...x, closed: [...x.closed, { date: '', note: '' }] }))}>+ Thêm ngày nghỉ</button></span>
          <span className="vx-help" style={{ margin: 0 }}>Ngày nghỉ không có khung giờ giao; khách thấy “Nghỉ” kèm ghi chú.</span>
        </div>
      </div>}

      <div className="ad-sticky">
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span> : saved ? 'Đã lưu — áp dụng ngay trên website' : 'Thay đổi có hiệu lực ngay sau khi lưu'}
        </span>
        <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  );
}
