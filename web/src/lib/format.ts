const vnd = new Intl.NumberFormat('vi-VN');

/** 289000 -> "289.000đ" */
export const money = (n: number) => `${vnd.format(n)}đ`;

export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}k` : String(n));
