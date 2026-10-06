// Nhãn + quy tắc xếp chuyến giao hàng — dùng chung admin Giao hàng và app tài xế.

export const VEHICLE_LABEL = { truck: 'Xe tải', bike: 'Xe máy' } as const;
export type VehicleKey = keyof typeof VEHICLE_LABEL;

/** Tải tối đa mặc định của một chuyến, tính bằng "điểm tải". */
export const DEFAULT_CAPACITY: Record<VehicleKey, number> = { truck: 30, bike: 8 };

/** Điểm tải: mỗi cây sống 1 điểm, mỗi món vật tư 0,25 điểm (chưa có cân nặng / kích cỡ nên chỉ là ước lượng). */
export const PLANT_LOAD = 1;
export const SUPPLY_LOAD = 0.25;
export const orderLoad = (plantQty: number, supplyQty: number) => plantQty * PLANT_LOAD + supplyQty * SUPPLY_LOAD;

/** Xe máy chở từ bấy nhiêu cây sống trở lên thì cảnh báo nên đổi xe tải. */
export const BIKE_PLANT_WARN = 4;

/** Mở chỉ đường Google Maps theo địa chỉ chữ (chưa lưu tọa độ trong đơn). */
export const directionsUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export const loadLabel = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '').replace('.', ','));
