/** Hai biểu tượng nhấn mạnh giảm giá (kiểu Shopee): đồng hồ báo thức có dấu % (cạnh nhãn -%) và vé voucher có dấu tích (cạnh giá). Hình vẽ riêng, màu cố định. */
const RED = '#ee4d2d';

export function ClockPercentIcon() {
  const body = RED;
  const mark = '#fff';
  return (
    <svg className="app-fico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="5.2" cy="5.4" r="3.2" fill={body} />
      <circle cx="18.8" cy="5.4" r="3.2" fill={body} />
      <path d="M6.2 21.2 4 23.2M17.8 21.2l2.2 2" stroke={body} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="13.4" r="9" fill={body} />
      <circle cx="9.1" cy="10.9" r="1.6" fill="none" stroke={mark} strokeWidth="1.5" />
      <circle cx="14.9" cy="15.9" r="1.6" fill="none" stroke={mark} strokeWidth="1.5" />
      <path d="M15.2 9.9 8.8 16.9" stroke={mark} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Vé voucher viền đỏ, vạch đứt giữa vé, dấu tích tròn ở góc dưới phải. `title` = chú thích khi rê chuột. */
export function VoucherCheckIcon({ title }: { title: string }) {
  return (
    <svg className="app-fico app-fico--voucher" viewBox="0 0 24 24" role="img" aria-label={title}>
      <title>{title}</title>
      <path d="M2.6 7.6a2 2 0 0 1 2-2h14.8a2 2 0 0 1 2 2v2.1a2.2 2.2 0 0 0 0 4.4v2.1a2 2 0 0 1-2 2H4.6a2 2 0 0 1-2-2v-2.1a2.2 2.2 0 0 0 0-4.4z" fill="none" stroke={RED} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.6 7.6v8.8" stroke={RED} strokeWidth="1.5" strokeDasharray="1.4 2" strokeLinecap="round" />
      <circle cx="18.6" cy="17.4" r="4.6" fill={RED} stroke="#fff" strokeWidth="1" />
      <path d="m16.4 17.5 1.6 1.6 2.9-3.3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
