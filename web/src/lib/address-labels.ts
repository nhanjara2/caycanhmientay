// Nhãn sổ địa chỉ — dùng chung trang khách, thanh toán và admin.

export const KIND_LABEL = { home: 'Nhà riêng', office: 'Văn phòng', site: 'Công trình' } as const;
export type AddressKind = keyof typeof KIND_LABEL;

/** Điều kiện giao cây lớn: giúp shop chọn xe và số người khiêng. */
export const CONDITION_LABEL = {
  truck: 'Xe tải vào được',
  alley: 'Hẻm nhỏ – chỉ xe máy',
  elevator: 'Có thang máy',
  stairs: 'Phải lên cầu thang bộ',
} as const;
export type DeliveryCondition = keyof typeof CONDITION_LABEL;

export type AddressDTO = {
  id: number;
  name: string;
  phone: string;
  street: string;
  area: string;
  kind: AddressKind;
  conditions: DeliveryCondition[];
  isDefault: boolean;
  lat: number | null;
  lng: number | null;
};

export const fullAddress = (a: Pick<AddressDTO, 'street' | 'area'>) => `${a.street}, ${a.area}`;
