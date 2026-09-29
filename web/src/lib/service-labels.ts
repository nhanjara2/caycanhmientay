// Yêu cầu dịch vụ (QuoteRequestForm ↔ AdminServiceRequests): nhãn và lựa chọn dùng chung client/server.

export const SERVICE_TYPES = ['garden', 'office', 'care', 'clinic'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** 4 thẻ dịch vụ ở phần 1 của form. `param` = giá trị ?loai= trên link từ trang dịch vụ. */
export const SERVICE_INFO: Record<ServiceType, { label: string; hint: string; param: string }> = {
  garden: { label: 'Sân vườn, ban công', hint: 'Thiết kế & thi công', param: 'san-vuon' },
  office: { label: 'Cây văn phòng', hint: 'Cho thuê, bán', param: 'van-phong' },
  care: { label: 'Chăm sóc định kỳ', hint: 'Tại nhà, văn phòng', param: 'cham-soc' },
  clinic: { label: 'Chữa cây tại nhà', hint: 'Kỹ sư đến tận nơi', param: 'chua-cay' },
};
export const serviceFromParam = (p?: string | null) => SERVICE_TYPES.find((s) => SERVICE_INFO[s].param === p);

/** Giai đoạn trên bảng Kanban admin. `lost` = cột Thua (ẩn mặc định). */
export const SERVICE_STAGES = ['new', 'scheduled', 'quoted', 'in_progress', 'done', 'lost'] as const;
export type ServiceStage = (typeof SERVICE_STAGES)[number];
export const BOARD_STAGES = ['new', 'scheduled', 'quoted', 'in_progress', 'done'] as const satisfies readonly ServiceStage[];

export const STAGE_LABEL: Record<ServiceStage, string> = {
  new: 'Mới',
  scheduled: 'Đã hẹn khảo sát',
  quoted: 'Đã báo giá',
  in_progress: 'Đang thi công',
  done: 'Hoàn thành',
  lost: 'Thua',
};
/** Màu nhãn `ad-pill` theo giai đoạn. */
export const STAGE_PILL: Record<ServiceStage, string> = {
  new: 'new', scheduled: 'wait', quoted: 'prep', in_progress: 'ship', done: 'done', lost: 'cancel',
};

export const SPACES = ['Ban công chung cư', 'Sân thượng', 'Sân vườn nhà phố', 'Biệt thự', 'Văn phòng', 'Nhà hàng, quán cà phê', 'Sảnh, khu chung', 'Khác'] as const;
export const SUNS = ['Đông · nắng sáng', 'Tây · nắng chiều', 'Nam · nắng cả ngày', 'Bắc · ít nắng', 'Trong nhà, ít nắng', 'Chưa rõ'] as const;
export const STYLES = ['Nhiệt đới', 'Tối giản', 'Kiểu Nhật', 'Có góc trồng rau', 'Dễ chăm, ít tưới'] as const;
export const BUDGETS = ['Dưới 10 triệu', '10 – 30 triệu', '30 – 100 triệu', 'Trên 100 triệu', 'Chưa rõ, cần tư vấn'] as const;
/** Ngân sách viết gọn trên thẻ Kanban. */
export const BUDGET_SHORT: Record<(typeof BUDGETS)[number], string> = {
  'Dưới 10 triệu': '< 10 tr', '10 – 30 triệu': '10–30 tr', '30 – 100 triệu': '30–100 tr', 'Trên 100 triệu': '> 100 tr', 'Chưa rõ, cần tư vấn': 'Chưa rõ NS',
};
/** Nguồn yêu cầu: web = khách tự gửi form; còn lại do nhân viên nhập. */
export const SOURCES = ['web', 'hotline', 'zalo', 'facebook', 'store'] as const;
export type ServiceSource = (typeof SOURCES)[number];
export const SOURCE_LABEL: Record<ServiceSource, string> = {
  web: 'Form trên web', hotline: 'Gọi hotline', zalo: 'Zalo', facebook: 'Facebook', store: 'Tại cửa hàng',
};

// ---- Lịch khảo sát ---------------------------------------------------------------------------

export const SLOT_TIMES = { am: '9:00 – 11:00', pm: '14:00 – 16:00' } as const;
export type SlotTime = keyof typeof SLOT_TIMES;
/** Số lịch khảo sát tối đa mỗi khung giờ (số kỹ sư đi được cùng lúc). */
export const SLOT_CAPACITY = 2;
/** Số ngày hiện cho khách chọn, bắt đầu từ ngày mai. */
export const SLOT_DAYS = 4;
/** Chưa gọi lại quá 2 giờ, báo giá quá 3 ngày chưa chốt → chữ đỏ trên thẻ. */
export const CALLBACK_HOURS = 2;
export const QUOTE_STALE_DAYS = 3;

const TZ = 'Asia/Ho_Chi_Minh';
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export const todayVN = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: TZ });

const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Các ngày khách được chọn: từ ngày mai, SLOT_DAYS ngày. */
export const slotDates = (now = new Date()) => Array.from({ length: SLOT_DAYS }, (_, i) => addDays(todayVN(now), i + 1));

/** "T7 28/09" */
export const fmtSlotDay = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  return `${WEEKDAY[d.getUTCDay()]} ${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
};
export const fmtSlot = (ymd: string, t: SlotTime) => `${fmtSlotDay(ymd)} · ${SLOT_TIMES[t]}`;

export const serviceCode = (id: number) => `DV-${String(id).padStart(4, '0')}`;

/** Tiền gọn cho thẻ Kanban: 2.400.000 → "2,4 tr", 350.000 → "350k". */
export const shortMoney = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} tr` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}đ`;
