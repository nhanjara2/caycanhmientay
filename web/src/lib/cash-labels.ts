// Sổ Thu chi (/admin/thu-chi) — hằng số dùng chung trình duyệt + server (không import gì của server).

/** Khoản tiền ghi tay ngoài bán hàng và chi phí. */
export const CASH_KINDS = ['income', 'capital_in', 'capital_out'] as const;
export type CashKind = (typeof CASH_KINDS)[number];

export const CASH_KIND_LABEL: Record<CashKind, string> = {
  income: 'Thu khác',
  capital_in: 'Vốn bỏ vào',
  capital_out: 'Rút vốn',
};
/** Tiền vô (true) hay tiền ra (false). */
export const CASH_KIND_IN: Record<CashKind, boolean> = { income: true, capital_in: true, capital_out: false };
export const CASH_KIND_HINT: Record<CashKind, string> = {
  income: 'Ví dụ: bán chậu cũ, khách trả nợ cũ, tiền thưởng nhà cung cấp',
  capital_in: 'Ví dụ: tiền túi bỏ vào làm vốn, tiền vay',
  capital_out: 'Ví dụ: rút tiền về tiêu riêng, trả nợ vay',
};
export const MAX_CASH_NOTE = 200;
