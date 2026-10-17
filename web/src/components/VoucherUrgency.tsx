import { voucherUrgency } from '@/lib/voucher-labels';

/** "Đã dùng 85%" (thanh đỏ khi sắp hết lượt) + "Còn 2 ngày" — chỉ hiện khi mã có giới hạn lượt / sắp hết hạn thật. */
export function VoucherUrgency({ v, expiry = true }: { v: { usedPct?: number | null; endsAt?: string | Date | null }; expiry?: boolean }) {
  const u = voucherUrgency(v);
  const end = expiry ? u.expiry : null;
  if (u.used == null && !end) return null;
  return (
    <span className="app-vurg" data-hot={u.hot || undefined}>
      {u.used != null && (
        <span className="app-vurg__used">
          <span className="bar" aria-hidden="true"><i style={{ width: `${u.used}%` }} /></span>Đã dùng {u.used}%
        </span>
      )}
      {end && <span className="app-vurg__end">{end}</span>}
    </span>
  );
}
