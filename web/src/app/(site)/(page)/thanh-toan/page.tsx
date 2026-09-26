'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { deliveryStoresAction, listAddressesAction } from '@/app/actions/addresses';
import { EmptyState } from '@/components/Blocks';
import { CartList, OrderSummary, Steps } from '@/components/CartParts';
import { Icon, type IconName } from '@/components/Icon';
import { placeOrderAction } from '@/app/actions/orders';
import { fullAddress, type AddressDTO } from '@/lib/address-labels';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { computeTotals } from '@/lib/pricing';
import { plantZone, PLANT_ZONE_KM, type StorePoint } from '@/lib/stock';

const SLOTS = [
  { day: 'Hôm nay', time: '8:00 – 12:00' },
  { day: 'Hôm nay', time: '14:00 – 18:00' },
  { day: 'Ngày mai', time: '8:00 – 12:00' },
  { day: 'Ngày mai', time: '14:00 – 18:00' },
];

const PAYMENTS: { key: string; label: string; note?: string; icon: IconName }[] = [
  { key: 'cod', label: 'Thanh toán tiền mặt khi nhận hàng', note: 'Không áp dụng cho đơn có sản phẩm Flash sale', icon: 'cash' },
  { key: 'qr', label: 'Chuyển khoản ngân hàng (QR Code)', note: 'Quét mã, xác nhận tự động', icon: 'qr' },
  { key: 'momo', label: 'Ví điện tử MoMo', icon: 'wallet' },
  { key: 'zalopay', label: 'Ví điện tử ZaloPay', icon: 'wallet' },
  { key: 'card', label: 'Thẻ quốc tế (Visa, Mastercard), Apple Pay', icon: 'card' },
];

const PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export default function CheckoutPage() {
  const { lines, ready, clear } = useCart();
  const router = useRouter();
  const hasFlash = lines.some((l) => l.snap.flash);
  const hour = new Date().getHours();

  const [delivery, setDelivery] = useState<'ship' | 'pickup'>('ship');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [slot, setSlot] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [picked, setPay] = useState('qr');
  const [safety, setSafety] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const [saved, setSaved] = useState<AddressDTO[]>([]);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [stores, setStores] = useState<StorePoint[]>([]);

  useEffect(() => { deliveryStoresAction().then(setStores).catch(() => {}); }, []);

  const pickSaved = (a: AddressDTO) => {
    setSavedId(a.id); setName(a.name); setPhone(a.phone); setAddress(fullAddress(a));
  };

  // Đã đăng nhập: lấy sổ địa chỉ, điền sẵn địa chỉ mặc định.
  useEffect(() => {
    if (!user) { setSaved([]); return; }
    listAddressesAction().then((list) => {
      setSaved(list);
      const def = list.find((a) => a.isDefault) ?? list[0];
      if (def) pickSaved(def);
    }).catch(() => {});
  }, [user]);

  if (!ready) return <div className="vx-checkout app-page" style={{ minHeight: 400 }} />;
  if (!lines.length) {
    return (
      <div className="vx-checkout app-page" style={{ gridTemplateColumns: '1fr' }}>
        <EmptyState icon="cart" title="Chưa có sản phẩm để thanh toán" text="Giỏ hàng đang trống." action={<Link className="vx-btn vx-btn--primary" href="/">Mua sắm ngay</Link>} />
      </div>
    );
  }

  // Nhận tại vườn thì không tính phí giao. Server tính lại đúng công thức này khi tạo đơn.
  const totals = computeTotals(lines.map((l) => ({ ...l.snap, qty: l.qty })), delivery);

  // Đơn có Flash sale không được trả tiền mặt.
  const pay = picked === 'cod' && hasFlash ? 'qr' : picked;

  const errors = {
    name: !name.trim() && 'Vui lòng nhập họ tên',
    phone: !PHONE.test(phone.replace(/\s/g, '')) && 'Số điện thoại chưa đúng',
    address: delivery === 'ship' && !address.trim() && 'Vui lòng nhập địa chỉ nhận hàng',
    slot: delivery === 'ship' && slot === null && 'Chọn khung giờ giao',
    safety: totals.hasPesticide && !safety && 'Vui lòng xác nhận đã đọc hướng dẫn an toàn',
  };
  // Địa chỉ đã lưu có ghim bản đồ nằm ngoài vùng giao cây sống (server cũng kiểm tra lại).
  const savedAddr = saved.find((a) => a.id === savedId);
  const zone = savedAddr?.lat != null && savedAddr.lng != null ? plantZone({ lat: savedAddr.lat, lng: savedAddr.lng }, stores) : null;
  const outOfZone = delivery === 'ship' && lines.some((l) => l.snap.ship === 'plant') && zone !== null && !zone.inZone;
  const valid = !Object.values(errors).some(Boolean) && !outOfZone;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError('');
    if (!valid || busy) return;
    setBusy(true);
    const r = await placeOrderAction({
      items: lines.map((l) => ({ slug: l.slug, option: l.option, qty: l.qty })),
      name, phone, delivery, note,
      address: delivery === 'ship' ? address : undefined,
      slot: delivery === 'ship' && slot !== null ? `${SLOTS[slot].day}, ${SLOTS[slot].time}` : undefined,
      payment: pay,
      safetyAck: safety,
      addressId: delivery === 'ship' && savedId !== null ? savedId : undefined,
    }).catch(() => ({ ok: false as const, error: 'Không gửi được đơn. Vui lòng kiểm tra mạng và thử lại.' }));
    setBusy(false);
    if (!r.ok) { setServerError(r.error); return; }
    clear();
    router.push(`/dat-hang-thanh-cong?ma=${r.code}`);
  };

  const err = (k: keyof typeof errors) => touched && errors[k] ? <span className="vx-err">{errors[k]}</span> : null;

  return (
    <form className="vx-checkout app-page" onSubmit={submit} noValidate>
      <div className="vx-checkout__main">
        <Steps step={2} />
        <div className="vx-card">
          <div className="vx-label-row">
            <b>Chọn hình thức nhận hàng</b>
            <div className="vx-toggle">
              <button type="button" aria-pressed={delivery === 'ship'} onClick={() => setDelivery('ship')}><Icon name="truck" />Giao tận nơi</button>
              <button type="button" aria-pressed={delivery === 'pickup'} onClick={() => setDelivery('pickup')}><Icon name="home" />Nhận tại vườn</button>
            </div>
          </div>

          <h3 className="vx-card__title"><Icon name="user" />Thông tin người đặt</h3>
          <div className="vx-fields">
            <div className="vx-field">
              <input className={`vx-input${touched && errors.name ? ' vx-input--error' : ''}`} placeholder="Họ và tên người đặt" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              {err('name')}
            </div>
            <div className="vx-field">
              <input className={`vx-input${touched && errors.phone ? ' vx-input--error' : ''}`} placeholder="Số điện thoại" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              {err('phone')}
            </div>
          </div>

          {delivery === 'ship' ? (
            <>
              <h3 className="vx-card__title"><Icon name="pin" />Thông tin nhận hàng</h3>
              {saved.length > 0 && (
                <div className="vx-pay" role="radiogroup" aria-label="Địa chỉ đã lưu">
                  {saved.map((a) => (
                    <button key={a.id} type="button" role="radio" className="vx-pay__opt" aria-checked={savedId === a.id} onClick={() => pickSaved(a)}>
                      <span className="vx-radio" />
                      <span><b>{a.name}</b> · {a.phone}<small>{fullAddress(a)}</small></span>
                    </button>
                  ))}
                  <button type="button" role="radio" className="vx-pay__opt" aria-checked={savedId === null} onClick={() => { setSavedId(null); setAddress(''); }}>
                    <span className="vx-radio" /><span>Giao đến địa chỉ khác</span>
                  </button>
                </div>
              )}
              <div className="vx-fields">
                <div className="vx-field vx-field--full">
                  <input className={`vx-input${touched && errors.address ? ' vx-input--error' : ''}`} placeholder="Số nhà, đường, Phường, Tỉnh/Thành" value={address} onChange={(e) => { setAddress(e.target.value); if (savedId !== null) setSavedId(null); }} autoComplete="street-address" />
                  {err('address')}
                  {outOfZone && (
                    <span className="vx-err" role="alert">
                      Địa chỉ này cách cửa hàng gần nhất {zone!.km.toFixed(0)} km — ngoài vùng giao cây sống ({PLANT_ZONE_KM} km). Chọn Nhận tại vườn hoặc bỏ cây sống khỏi giỏ.
                    </span>
                  )}
                </div>
              </div>
              <b style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="clock" />Chọn khung giờ giao</b>
              <div className="vx-slots2">
                {SLOTS.map((s, i) => {
                  const past = s.day === 'Hôm nay' && hour >= parseInt(s.time) + 2;
                  return (
                    <button key={i} type="button" className="vx-tslot" aria-pressed={slot === i} aria-disabled={past || undefined} onClick={() => !past && setSlot(i)}>
                      {s.day}<small>{s.time}</small>
                    </button>
                  );
                })}
              </div>
              {err('slot')}
            </>
          ) : (
            <div className="vx-note"><Icon name="pin" /><div><b>Nhận tại vườn Cái Mơn – Chợ Lách.</b> Shop giữ hàng 3 ngày và nhắn Zalo khi cây sẵn sàng.</div></div>
          )}
          <textarea className="vx-input" placeholder="Ghi chú cho shop (không bắt buộc). Ví dụ: Gọi trước 15 phút, cây để ở sảnh." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <CartList editable={false} />

        <div className="vx-card">
          <h3 className="vx-card__title">Chọn phương thức thanh toán</h3>
          <div className="vx-pay" role="radiogroup">
            {PAYMENTS.map((m) => {
              const disabled = m.key === 'cod' && hasFlash;
              return (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  className="vx-pay__opt"
                  aria-checked={pay === m.key}
                  aria-disabled={disabled || undefined}
                  onClick={() => !disabled && setPay(m.key)}
                >
                  <span className="vx-radio" />
                  <span className="vx-pay__mark"><Icon name={m.icon} /></span>
                  <span>{m.label}{m.note && <small>{m.note}</small>}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <OrderSummary totals={totals}>
        {totals.hasPesticide && (
          <label className="vx-check">
            <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
            Tôi đã đọc hướng dẫn an toàn khi sử dụng thuốc bảo vệ thực vật
          </label>
        )}
        {err('safety')}
        {serverError && <div className="vx-note" role="alert"><Icon name="alert" /><div>{serverError}</div></div>}
        <button type="submit" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={busy}>{busy ? 'Đang đặt hàng…' : 'Đặt hàng'}</button>
        <p className="vx-terms">
          Bằng việc đặt hàng, bạn đồng ý với <a>Điều khoản dịch vụ</a> và <a>Chính sách đổi trả cây</a> của Cây Cảnh Miền Tây
        </p>
      </OrderSummary>
    </form>
  );
}
