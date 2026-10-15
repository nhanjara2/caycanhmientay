'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { deliveryStoresAction, listAddressesAction } from '@/app/actions/addresses';
import { AddressFields, EMPTY_ADDR, type AddrValue } from '@/components/AddressFields';
import { AddressModal, useNewAddress } from '@/components/AddressBook';
import { EmptyState } from '@/components/Blocks';
import { PhoneModal } from '@/components/PhoneModal';
import { CartList, OrderSummary, Steps } from '@/components/CartParts';
import { Icon, type IconName } from '@/components/Icon';
import { placeOrderAction } from '@/app/actions/orders';
import { slotOptionsAction } from '@/app/actions/shipping';
import { fullAddress, type AddressDTO } from '@/lib/address-labels';
import { PICKUP_PLACE } from '@/lib/contact';
import { ONLINE_PAYMENT_METHODS, ONLINE_PAYMENTS_READY, PAY_LABEL, PAY_LOGO } from '@/lib/order-labels';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { useDeliverTo } from '@/lib/deliver-to';
import { computeTotals, minOrderShort, withVouchers } from '@/lib/pricing';
import { clearVoucherPick, useAppliedVouchers } from '@/lib/voucher-pick';
import { useShipping } from '@/lib/shipping-client';
import { regionOfAddress, type DayOption } from '@/lib/shipping';
import { plantZone, type StorePoint } from '@/lib/stock';
import { addrComplete, composeFull } from '@/lib/vn-provinces';
import { VoucherBox } from '@/components/VoucherBox';

// Logo lấy theo PAY_LOGO (public/images/pay/); cards: dải logo nhỏ dưới tên
const ALL_PAYMENTS: { key: keyof typeof PAY_LABEL; label: string; note?: string; icon: IconName; cards?: [string, string][] }[] = [
  { key: 'deposit', label: 'Đặt cọc — shop liên hệ hướng dẫn', note: 'Chưa cần trả tiền ngay. Sau khi đặt, shop gọi hoặc nhắn Zalo trong 30 phút (8:00 – 21:00) để xác nhận đơn và hướng dẫn chuyển khoản đặt cọc.', icon: 'phone' },
  { key: 'qr', label: 'Chuyển khoản ngân hàng (QR Code)', note: 'Quét mã, xác nhận tự động', icon: 'qr' },
  { key: 'momo', label: 'Ví điện tử MoMo', icon: 'wallet' },
  { key: 'zalopay', label: 'Ví điện tử ZaloPay', icon: 'wallet' },
  {
    key: 'card', label: 'Thẻ quốc tế (Visa, Mastercard, JCB), Apple Pay', icon: 'card',
    cards: [['Visa', 'visa.svg'], ['Mastercard', 'mastercard.svg'], ['JCB', 'jcb.svg'], ['Apple Pay', 'applepay.svg']],
  },
];
// Shop không nhận tiền mặt khi nhận hàng (COD). Chưa nối cổng thanh toán trực tuyến thì không có bước chọn phương thức: đơn luôn là Đặt cọc
// (shop gọi / nhắn Zalo sau khi đặt) — xem ONLINE_PAYMENTS_READY trong lib/order-labels.ts.
const PAYMENTS = ALL_PAYMENTS.filter((m) => ONLINE_PAYMENTS_READY || !ONLINE_PAYMENT_METHODS.includes(m.key));
const DEFAULT_PAY = PAYMENTS[0].key;
const SHOW_PAY_PICKER = PAYMENTS.length > 1;

const PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export default function CheckoutPage() {
  const { lines, ready, clear } = useCart();
  const router = useRouter();

  const [delivery, setDelivery] = useState<'ship' | 'pickup'>('ship');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // Địa chỉ gõ / chọn tại chỗ (khi không dùng địa chỉ trong sổ): `address` là chuỗi ghép từ các ô này
  const [addr, setAddr] = useState<AddrValue>(EMPTY_ADDR);
  const typeAddr = (v: AddrValue) => { setAddr(v); setAddress(composeFull(v)); };
  const { rules, regionProvinces, plantZoneKm, plantZoneEnabled, slotsEnabled, minOrder } = useShipping();
  // Khung giờ lấy từ Cài đặt giao hàng (còn chỗ / đã kín / đã qua giờ); chọn = "ngày|mã khung"
  const [days, setDays] = useState<DayOption[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [picked, setPay] = useState<string>(DEFAULT_PAY);
  const [safety, setSafety] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { getPlace } = useDeliverTo();
  const [saved, setSaved] = useState<AddressDTO[]>([]);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [stores, setStores] = useState<StorePoint[]>([]);
  const [editing, setEditing] = useState<AddressDTO | Omit<AddressDTO, 'id'> | null>(null);
  const [askPhone, setAskPhone] = useState(false);
  const blankAddress = useNewAddress();
  // Mã khách chọn trong hộp "Ưu đãi dành cho bạn" (mang từ giỏ hàng sang); đổi cách nhận hàng thì server tính lại
  // Phí giao cây sống theo tỉnh / thành của địa chỉ nhận (server tính lại bằng đúng hàm này)
  const region = delivery === 'ship' ? regionOfAddress(address, regionProvinces) : null;
  const vouchers = useAppliedVouchers({ items: lines.map((l) => ({ slug: l.slug, option: l.option, qty: l.qty })), phone, delivery, region, enabled: ready });

  useEffect(() => { deliveryStoresAction().then(setStores).catch(() => {}); }, []);
  const loadSlots = () => slotOptionsAction().then(setDays).catch(() => setDays([]));
  useEffect(() => { if (slotsEnabled) void loadSlots(); }, [slotsEnabled]);

  const pickSaved = (a: AddressDTO) => {
    setSavedId(a.id); setName(a.name); setPhone(a.phone); setAddress(fullAddress(a));
  };
  const pickOther = () => { setSavedId(null); setAddress(composeFull(addr)); };

  /** Đọc lại sổ địa chỉ rồi chọn `select` (vừa thêm/sửa), không có thì địa chỉ mặc định. */
  const loadAddresses = async (select?: number) => {
    const list = await listAddressesAction();
    setSaved(list);
    // mặc định: địa chỉ đang chọn ở "Giao đến" trên đầu trang (nếu lấy từ sổ), không có thì địa chỉ mặc định
    const a = list.find((x) => x.id === select) ?? list.find((x) => x.id === getPlace()?.addressId) ?? list.find((x) => x.isDefault) ?? list[0];
    if (a) pickSaved(a); else setSavedId(null);
  };
  /** Xóa địa chỉ trong hộp Sửa: đang chọn đúng địa chỉ đó thì chọn lại địa chỉ mặc định. */
  const afterDelete = async (id: number) => {
    if (savedId === id) return loadAddresses();
    setSaved(await listAddressesAction());
  };

  // Đã đăng nhập: điền sẵn tên + SĐT tài khoản, rồi địa chỉ mặc định trong sổ (nếu có).
  // Chạy lúc đăng nhập/đăng xuất (không theo cả object user) để lúc khai SĐT xong không chọn lại địa chỉ.
  const loggedIn = Boolean(user);
  useEffect(() => {
    if (!user) { setSaved([]); return; }
    if (user.name !== 'Khách hàng') setName((n) => n || user.name);
    setPhone((p) => p || user.phone);
    loadAddresses().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  if (!ready) return <div className="vx-checkout app-page" style={{ minHeight: 400 }} />;
  if (!lines.length) {
    return (
      <div className="vx-checkout app-page" style={{ gridTemplateColumns: '1fr' }}>
        <EmptyState icon="cart" title="Chưa có sản phẩm để thanh toán" action={<Link className="vx-btn vx-btn--primary" href="/">Mua sắm ngay</Link>} />
      </div>
    );
  }

  // Nhận tại vườn thì không tính phí giao. Server tính lại đúng công thức này (kể cả mã giảm giá) khi tạo đơn.
  // Combo 2 cây tính ngay ở đây; server tính lại khi tạo đơn.
  const totals = withVouchers(
    computeTotals(lines.map((l) => ({ ...l.snap, qty: l.qty })), delivery, 0, rules, user?.partner?.discount ?? 0, region),
    vouchers.applied.discount?.discount ?? 0, vouchers.applied.ship?.discount ?? 0,
  );

  // Khung đã chọn còn dùng được (chưa kín / chưa qua giờ) → gửi lên server
  const chosen = (() => {
    if (!slotsEnabled || !slot || !days) return null;
    const [date, key] = slot.split('|');
    const s = days.find((d) => d.date === date)?.slots.find((x) => x.key === key);
    return s && !s.full && !s.past ? { date, key } : null;
  })();

  const pay = picked;

  const errors = {
    name: !name.trim() && 'Vui lòng nhập họ tên',
    phone: !PHONE.test(phone.replace(/\s/g, '')) && 'Số điện thoại chưa đúng',
    address: delivery === 'ship' && (savedId === null ? !addrComplete(addr) : !address.trim()) && 'Bạn nhập giúp số nhà, tên đường và chọn Tỉnh / Thành phố nhé',
    slot: delivery === 'ship' && slotsEnabled && (slot === null || !chosen) && 'Chọn khung giờ giao',
    safety: totals.hasPesticide && !safety && 'Vui lòng xác nhận đã đọc hướng dẫn an toàn',
  };
  // Địa chỉ đã lưu có ghim bản đồ nằm ngoài vùng giao cây sống (server cũng kiểm tra lại).
  const savedAddr = saved.find((a) => a.id === savedId);
  const zone = savedAddr?.lat != null && savedAddr.lng != null ? plantZone({ lat: savedAddr.lat, lng: savedAddr.lng }, stores, plantZoneKm) : null;
  const outOfZone = plantZoneEnabled && delivery === 'ship' && lines.some((l) => l.snap.ship === 'plant') && zone !== null && !zone.inZone;
  // Đơn giao hàng chưa đủ tiền hàng tối thiểu thì không đặt được (máy chủ cũng chặn); nhận tại vườn không giới hạn.
  const short = minOrderShort(totals.goods, minOrder, delivery);
  const valid = !Object.values(errors).some(Boolean) && !outOfZone && !short;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError('');
    if (!valid || busy) return;
    // Tài khoản Google chưa có SĐT: bắt buộc khai (không cần mã xác thực) rồi mới đặt.
    if (user && !user.phone) { setAskPhone(true); return; }
    void placeOrder();
  };

  const placeOrder = async () => {
    setBusy(true);
    const r = await placeOrderAction({
      items: lines.map((l) => ({ slug: l.slug, option: l.option, qty: l.qty })),
      name, phone, delivery, note,
      address: delivery === 'ship' ? address : undefined,
      slotDate: delivery === 'ship' && chosen ? chosen.date : undefined,
      slotKey: delivery === 'ship' && chosen ? chosen.key : undefined,
      payment: pay,
      safetyAck: safety,
      addressId: delivery === 'ship' && savedId !== null ? savedId : undefined,
      voucherCode: vouchers.applied.discount?.code,
      shipVoucherCode: vouchers.applied.ship?.code,
    }).catch(() => ({ ok: false as const, error: 'Không gửi được đơn. Vui lòng kiểm tra mạng và thử lại.' }));
    setBusy(false);
    if (!r.ok) {
      setServerError(r.error);
      if (/khung giờ/i.test(r.error)) { setSlot(null); void loadSlots(); }
      if ('needsPhone' in r && r.needsPhone) setAskPhone(true);
      return;
    }
    clearVoucherPick();
    clear();
    router.push(`/dat-hang-thanh-cong?ma=${r.code}`);
  };

  const err = (k: keyof typeof errors) => touched && errors[k] ? <span className="vx-err">{errors[k]}</span> : null;

  return (
    <>
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
            <div className="vx-fields app-buyer">
              <div className="vx-field">
                <label htmlFor="co-name" className="app-lbl">Họ và tên</label>
                <input id="co-name" className={`vx-input${touched && errors.name ? ' vx-input--error' : ''}`} placeholder="Ví dụ: Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                {err('name')}
              </div>
              <div className="vx-field">
                <label htmlFor="co-phone" className="app-lbl">Số điện thoại</label>
                <input id="co-phone" className={`vx-input${touched && errors.phone ? ' vx-input--error' : ''}`} placeholder="Ví dụ: 0912 345 678" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                {err('phone')}
              </div>
            </div>

            {delivery === 'ship' ? (
              <>
                <div className="vx-label-row">
                  <h3 className="vx-card__title"><Icon name="pin" />Thông tin nhận hàng</h3>
                  {user && <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => setEditing(blankAddress)}>+ Thêm địa chỉ mới</button>}
                </div>
                {saved.length > 0 && (
                  <div className="vx-pay" role="radiogroup" aria-label="Địa chỉ đã lưu">
                    {saved.map((a) => (
                      <div key={a.id} className="app-addr-opt">
                        <button type="button" role="radio" className="vx-pay__opt" aria-checked={savedId === a.id} onClick={() => pickSaved(a)}>
                          <span className="vx-radio" />
                          <span>
                            <b>{a.name}</b> · {a.phone}
                            {a.isDefault && <> <span className="vx-badge vx-badge--outline">Mặc định</span></>}
                            <small>{fullAddress(a)}</small>
                          </span>
                        </button>
                        <button type="button" className="app-addr-opt__edit" onClick={() => setEditing(a)} aria-label={`Sửa địa chỉ ${fullAddress(a)}`}>Sửa</button>
                      </div>
                    ))}
                    <button type="button" role="radio" className="vx-pay__opt" aria-checked={savedId === null} onClick={pickOther}>
                      <span className="vx-radio" /><span>Giao đến địa chỉ khác (không lưu vào sổ)</span>
                    </button>
                  </div>
                )}
                <div className="vx-fields">
                  <div className="vx-field vx-field--full">
                    {savedId === null && <AddressFields value={addr} onChange={typeAddr} stores={stores} idPrefix="co" />}
                    {err('address')}
                    {outOfZone && (
                      <span className="vx-err" role="alert">
                        Địa chỉ này cách cửa hàng gần nhất {zone!.km.toFixed(0)} km — ngoài vùng giao cây sống ({plantZoneKm} km). Chọn Nhận tại vườn hoặc bỏ cây sống khỏi giỏ.
                      </span>
                    )}
                  </div>
                </div>
                {slotsEnabled && <>
                <b style={{ fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="clock" />Chọn khung giờ giao</b>
                <div className="vx-slots2">
                  {days === null && <span className="vx-help">Đang tải khung giờ…</span>}
                  {days?.length === 0 && <span className="vx-err" role="alert">Hiện shop chưa nhận khung giờ giao nào. Vui lòng chọn Nhận tại vườn hoặc liên hệ shop.</span>}
                  {days?.map((d) => d.closed ? (
                    <button key={d.date} type="button" className="vx-tslot" aria-disabled="true" disabled>{d.label}<small>Nghỉ · {d.closed}</small></button>
                  ) : d.slots.map((s) => {
                    const id = `${d.date}|${s.key}`;
                    const off = s.past || s.full;
                    return (
                      <button key={id} type="button" className="vx-tslot" aria-pressed={slot === id} aria-disabled={off || undefined} onClick={() => !off && setSlot(id)}>
                        {d.label}<small>{s.full ? `${s.time} · Đã kín` : s.time}</small>
                      </button>
                    );
                  }))}
                </div>
                {err('slot')}
                </>}
              </>
            ) : (
              <div className="vx-note"><Icon name="pin" /><div><b>Nhận tại {PICKUP_PLACE}</b></div></div>
            )}
            <textarea className="vx-input" placeholder="Ghi chú cho shop (không bắt buộc). Ví dụ: Gọi trước 15 phút, cây để ở sảnh." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <CartList editable={false} />

          {SHOW_PAY_PICKER && (
            <div className="vx-card">
              <h3 className="vx-card__title">Chọn phương thức thanh toán</h3>
              <div className="vx-pay" role="radiogroup">
                {PAYMENTS.map((m) => {
                  return (
                    <button
                      key={m.key}
                      type="button"
                      role="radio"
                      className="vx-pay__opt"
                      aria-checked={pay === m.key}
                      onClick={() => setPay(m.key)}
                    >
                      <span className="vx-radio" />
                      <span className="vx-pay__mark app-pay-logo">
                        {PAY_LOGO[m.key] ? <img src={`/images/pay/${PAY_LOGO[m.key]}`} alt="" /> : <Icon name={m.icon} />}
                      </span>
                      <span>
                        {m.label}
                        {m.note && <small>{m.note}</small>}
                        {m.cards && (
                          <span className="app-pay-cards">
                            {m.cards.map(([name, file]) => <img key={name} src={`/images/pay/${file}`} alt={name} title={name} />)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <OrderSummary totals={totals} delivery={delivery} voucher={<VoucherBox state={vouchers} goods={totals.goods} shipFee={totals.plantShip + totals.supplyShip} />}>
          {totals.hasPesticide && (
            <label className="vx-check">
              <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
              Tôi đã đọc hướng dẫn an toàn khi sử dụng thuốc bảo vệ thực vật
            </label>
          )}
          {err('safety')}
          {serverError && <div className="vx-note" role="alert"><Icon name="alert" /><div>{serverError}</div></div>}
          <button type="submit" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={busy || short > 0}>{busy ? 'Đang đặt hàng…' : short > 0 ? 'Chưa đủ đơn tối thiểu để giao' : 'Đặt hàng'}</button>
          {short > 0 && <Link href="/gio-hang" className="vx-btn vx-btn--outline vx-btn--block">Quay lại giỏ hàng để mua thêm</Link>}
          <p className="vx-terms">
            Bằng việc đặt hàng, bạn đồng ý với <a>Điều khoản dịch vụ</a> và <a>Chính sách đổi trả cây</a> của Cây Cảnh Miền Tây
          </p>
        </OrderSummary>
      </form>

      {/* Ngoài <form> đặt hàng: hộp thoại có form riêng (không lồng form). */}
      {editing && (
        <AddressModal
          value={editing}
          stores={stores}
          onClose={() => setEditing(null)}
          onSaved={(id) => { loadAddresses(id).catch(() => {}); }}
          onDeleted={(id) => { afterDelete(id).catch(() => {}); }}
        />
      )}
      {askPhone && (
        <PhoneModal
          initial={phone}
          note="Tài khoản của bạn chưa có số điện thoại. Nhập số để hoàn tất đặt hàng — không cần mã xác thực."
          onClose={() => setAskPhone(false)}
          onSaved={() => { setServerError(''); void placeOrder(); }}
        />
      )}
    </>
  );
}
