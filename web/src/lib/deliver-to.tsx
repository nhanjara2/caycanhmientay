'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { deliveryStoresAction, listAddressesAction } from '@/app/actions/addresses';
import { fullAddress, type AddressDTO } from '@/lib/address-labels';
import { useAuth } from '@/lib/auth';
import type { StorePoint } from '@/lib/stock';

/**
 * "Giao đến" ở đầu trang: nơi khách muốn nhận hàng. Chọn từ sổ địa chỉ (đã đăng nhập) hoặc ghim trên bản đồ (ai cũng được).
 * Nhớ trong trình duyệt (localStorage); dùng để báo trước vùng giao cây sống ở trang sản phẩm. Đơn hàng vẫn dùng địa chỉ chọn ở bước thanh toán.
 */
export type DeliverPlace = {
  /** Dòng ngắn hiện ở đầu trang (Phường, Tỉnh/Thành). */
  label: string;
  /** Địa chỉ đầy đủ. */
  detail: string;
  /** Chưa ghim bản đồ thì null (chưa kiểm tra được vùng giao cây sống). */
  lat: number | null;
  lng: number | null;
  /** Chọn từ sổ địa chỉ của tài khoản thì có id. */
  addressId: number | null;
};

const KEY = 'ccmt-deliver-to-v1';

export const placeFromAddress = (a: AddressDTO): DeliverPlace => ({ label: a.area, detail: fullAddress(a), lat: a.lat, lng: a.lng, addressId: a.id });

const num = (v: unknown, min: number, max: number) => (typeof v === 'number' && v >= min && v <= max ? v : null);

function read(): DeliverPlace | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<DeliverPlace> | null;
    if (!v || typeof v.label !== 'string' || !v.label || typeof v.detail !== 'string') return null;
    const lat = num(v.lat, 8, 24), lng = num(v.lng, 102, 110);
    return {
      label: v.label.slice(0, 120), detail: v.detail.slice(0, 300),
      lat: lat !== null && lng !== null ? lat : null, lng: lat !== null && lng !== null ? lng : null,
      addressId: typeof v.addressId === 'number' ? v.addressId : null,
    };
  } catch {
    return null;
  }
}

type Ctx = {
  place: DeliverPlace | null;
  /** Đã đọc xong lựa chọn đã nhớ (trước đó hiện "Chọn địa chỉ" cho khớp bản server). */
  loaded: boolean;
  /** Cửa hàng (công khai) để tính vùng giao cây sống; rỗng cho tới khi tải xong. */
  stores: StorePoint[];
  open: boolean;
  openPicker: () => void;
  closePicker: () => void;
  setPlace: (p: DeliverPlace | null) => void;
  /** Lựa chọn mới nhất (đọc trong hàm async, tránh giá trị cũ của lần render). */
  getPlace: () => DeliverPlace | null;
};

const DeliverCtx = createContext<Ctx | null>(null);

export function DeliverToProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loggedIn = Boolean(user);
  const [place, setPlaceState] = useState<DeliverPlace | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<StorePoint[]>([]);
  const placeRef = useRef<DeliverPlace | null>(null);
  const askedStores = useRef(false);

  const setPlace = useCallback((p: DeliverPlace | null) => {
    placeRef.current = p;
    setPlaceState(p);
    try {
      if (p) localStorage.setItem(KEY, JSON.stringify(p));
      else localStorage.removeItem(KEY);
    } catch {}
  }, []);

  useEffect(() => {
    const p = read();
    placeRef.current = p;
    setPlaceState(p);
    setLoaded(true);
  }, []);

  // Cửa hàng chỉ tải khi cần (đã có điểm giao có tọa độ, hoặc đang mở hộp chọn)
  useEffect(() => {
    if (askedStores.current || !(open || place?.lat != null)) return;
    askedStores.current = true;
    deliveryStoresAction().then(setStores).catch(() => { askedStores.current = false; });
  }, [open, place?.lat]);

  // Đồng bộ với tài khoản: đăng xuất thì bỏ địa chỉ lấy từ sổ (máy dùng chung); đăng nhập thì cập nhật / bỏ địa chỉ đã sửa, đã xóa,
  // chưa chọn gì thì lấy địa chỉ mặc định.
  useEffect(() => {
    if (!loaded || !ready) return;
    if (!loggedIn) {
      if (placeRef.current?.addressId != null) setPlace(null);
      return;
    }
    let live = true;
    listAddressesAction().then((list) => {
      if (!live) return;
      const cur = placeRef.current;
      const fallback = list.find((a) => a.isDefault) ?? list[0];
      if (cur?.addressId != null) {
        const a = list.find((x) => x.id === cur.addressId) ?? fallback;
        setPlace(a ? placeFromAddress(a) : null);
      } else if (!cur && fallback) {
        setPlace(placeFromAddress(fallback));
      }
    }).catch(() => {});
    return () => { live = false; };
  }, [loaded, ready, loggedIn, setPlace]);

  const getPlace = useCallback(() => placeRef.current, []);
  const openPicker = useCallback(() => setOpen(true), []);
  const closePicker = useCallback(() => setOpen(false), []);

  return <DeliverCtx.Provider value={{ place, loaded, stores, open, openPicker, closePicker, setPlace, getPlace }}>{children}</DeliverCtx.Provider>;
}

export function useDeliverTo() {
  const ctx = useContext(DeliverCtx);
  if (!ctx) throw new Error('useDeliverTo phải nằm trong <DeliverToProvider>');
  return ctx;
}
