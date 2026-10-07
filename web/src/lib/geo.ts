// Tìm địa chỉ / vị trí hiện tại (dùng chung MapPicker, form địa chỉ, "Giao đến").
// Photon (komoot) — miễn phí, lượng truy cập vừa phải. Chạy thật với lượng khách lớn: đổi sang Goong / Vietmap (xem MapPicker).
const PHOTON = 'https://photon.komoot.io';

// Nền bản đồ: máy chủ OpenStreetMap Đức (miễn phí, lượng truy cập vừa phải). Không dùng thẳng openstreetmap.org vì một số nhà mạng Việt Nam chặn tên miền này.
// Chạy thật với lượng khách lớn: đổi sang Goong / Vietmap (có hợp đồng, bản đồ đúng chủ quyền Hoàng Sa – Trường Sa)
// bằng biến NEXT_PUBLIC_MAP_TILES / NEXT_PUBLIC_MAP_ATTRIBUTION, và thay 2 hàm geocode bên dưới. Dùng chung MapPicker + bản đồ cửa hàng.
export const MAP_TILES = process.env.NEXT_PUBLIC_MAP_TILES ?? 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? '© OpenStreetMap';

type PhotonProps = Partial<Record<'name' | 'housenumber' | 'street' | 'locality' | 'district' | 'city' | 'state' | 'countrycode', string>>;
type PhotonResult = { features: { properties: PhotonProps; geometry: { coordinates: [number, number] } }[] };

/** Tách kết quả Photon thành "số nhà, đường" + "Phường, Tỉnh/Thành" (khách sửa lại được). */
function split(a: PhotonProps): { street: string; area: string } {
  const road = [a.housenumber, a.street].filter(Boolean).join(' ');
  const street = a.name && a.name !== a.street ? [a.name, road].filter(Boolean).join(', ') : road || a.name || '';
  const city = a.city || a.state || '';
  return { street, area: [a.district, city].filter(Boolean).join(', ') };
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal) {
  const r = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&limit=1`, { signal });
  const j = (await r.json()) as PhotonResult;
  const f = j.features?.[0];
  return f && f.properties.countrycode === 'VN' ? split(f.properties) : null;
}

export async function searchPlace(q: string, near: { lat: number; lng: number }) {
  const r = await fetch(`${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=1&lat=${near.lat}&lon=${near.lng}&bbox=102,8,110,24`);
  const j = (await r.json()) as PhotonResult;
  const c = j.features?.[0]?.geometry.coordinates;
  return c ? { lat: c[1], lng: c[0] } : null;
}

/** Vị trí hiện tại của thiết bị (hỏi quyền). Lỗi trả về câu tiếng Việt dễ hiểu. */
export function locateMe(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Thiết bị này không hỗ trợ định vị. Bạn hãy chọn trên bản đồ hoặc tự nhập địa chỉ.')); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Chưa lấy được vị trí. Bạn hãy cho phép trình duyệt dùng vị trí, hoặc chọn trên bản đồ / tự nhập địa chỉ.')),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}
