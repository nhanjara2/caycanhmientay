'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveRentalAction } from '@/app/actions/office-rental';
import { money } from '@/lib/format';
import {
  DEFAULT_RENTAL, MAX_PACKAGES, MAX_TERMS, packagePrice, RENTAL_TIERS, RENTAL_URL, tryParseRental,
  type RentalConfig, type RentalTierKey,
} from '@/lib/office-rental';

type PkgForm = { key: string; name: string; fit: string; qty: Record<RentalTierKey, string>; weekly: boolean; perks: string; hot: boolean; custom: boolean };
type Form = {
  showPrices: boolean;
  tiers: { key: RentalTierKey; name: string; size: string; examples: string; price: string }[];
  weeklyExtra: string; minPlants: string; vatRate: string;
  terms: { months: string; discount: string }[];
  includes: string;
  packages: PkgForm[];
};

const digits = (s: string, max = 9) => s.replace(/\D/g, '').slice(0, max);
const n = (s: string) => Number(s || 0);
const toForm = (c: RentalConfig): Form => ({
  showPrices: c.showPrices,
  tiers: c.tiers.map((t) => ({ ...t, price: String(t.price) })),
  weeklyExtra: String(c.weeklyExtra), minPlants: String(c.minPlants), vatRate: String(c.vatRate),
  terms: c.terms.map((t) => ({ months: String(t.months), discount: String(t.discount) })),
  includes: c.includes.join('\n'),
  packages: c.packages.map((p) => ({
    ...p, perks: p.perks.join('\n'),
    qty: Object.fromEntries(RENTAL_TIERS.map((k) => [k, String(p.qty[k])])) as Record<RentalTierKey, string>,
  })),
});
const toPayload = (f: Form) => ({
  showPrices: f.showPrices,
  tiers: f.tiers.map((t) => ({ ...t, price: n(t.price) })),
  weeklyExtra: n(f.weeklyExtra), minPlants: n(f.minPlants), vatRate: n(f.vatRate),
  terms: f.terms.map((t) => ({ months: n(t.months), discount: n(t.discount) })),
  includes: f.includes.split('\n'),
  packages: f.packages.map((p) => ({
    ...p, perks: p.perks.split('\n'),
    qty: Object.fromEntries(RENTAL_TIERS.map((k) => [k, n(p.qty[k])])),
  })),
});

/** Bảng giá + gói thuê cây văn phòng hiện trên /dich-vu/cho-thue-cay-van-phong (Quản lý). */
export function RentalSettings({ initial }: { initial: RentalConfig }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(() => toForm(initial));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const edit = (fn: (x: Form) => Form) => { setF(fn); setSaved(false); };
  const setTier = (i: number, k: 'name' | 'size' | 'examples' | 'price', v: string) => edit((x) => ({ ...x, tiers: x.tiers.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));
  const setTerm = (i: number, k: 'months' | 'discount', v: string) => edit((x) => ({ ...x, terms: x.terms.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));
  const setPkg = (i: number, patch: Partial<PkgForm>) => edit((x) => ({ ...x, packages: x.packages.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const movePkg = (i: number, d: -1 | 1) => edit((x) => {
    const a = [...x.packages];
    [a[i], a[i + d]] = [a[i + d], a[i]];
    return { ...x, packages: a };
  });

  // Xem trước giá gói bằng đúng công thức trang khách (dữ liệu đang sửa, chưa kiểm tra đủ → bỏ qua)
  const preview = tryParseRental(toPayload(f));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    start(async () => {
      const r = await saveRentalAction(toPayload(f)).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setF(toForm(r.config));
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title">
        <h1>Gói thuê cây văn phòng</h1>
        <a className="vx-btn vx-btn--outline vx-btn--sm" href={RENTAL_URL} target="_blank" rel="noopener noreferrer">Xem trang khách ↗</a>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Hiển thị giá</div>
        <div className="ad-card__b">
          <label className="vx-check"><input type="checkbox" checked={f.showPrices} onChange={(e) => edit((x) => ({ ...x, showPrices: e.target.checked }))} /> Hiện giá thuê trên website</label>
          <span className="vx-help" style={{ margin: 0 }}>
            {f.showPrices
              ? 'Đang BẬT: khách thấy giá gói và tính được chi phí theo số cây (ghi rõ là giá tham khảo, giá chính thức sau khảo sát).'
              : 'Đang TẮT: trang chỉ hiện số cây của từng gói, ghi "Báo giá sau khảo sát" — khách vẫn chọn gói / số cây và gửi yêu cầu được.'}
          </span>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Giá thuê theo cỡ cây (đ / cây / tháng)</div>
        <div className="ad-card__b" style={{ gap: 14 }}>
          {f.tiers.map((t, i) => (
            <div key={t.key} className="ort-adm-tier">
              <div className="ad-frow">
                <div className="ad-f">
                  <label htmlFor={`rt-n-${t.key}`}>Tên cỡ cây</label>
                  <input id={`rt-n-${t.key}`} className="vx-input" maxLength={40} value={t.name} onChange={(e) => setTier(i, 'name', e.target.value)} />
                </div>
                <div className="ad-f">
                  <label htmlFor={`rt-s-${t.key}`}>Chiều cao</label>
                  <input id={`rt-s-${t.key}`} className="vx-input" maxLength={40} value={t.size} placeholder="Cao 60cm–1,2m" onChange={(e) => setTier(i, 'size', e.target.value)} />
                </div>
                <div className="ad-f">
                  <label htmlFor={`rt-p-${t.key}`}>Giá thuê / cây / tháng</label>
                  <input id={`rt-p-${t.key}`} className="vx-input" inputMode="numeric" value={t.price} onChange={(e) => setTier(i, 'price', digits(e.target.value, 7))} />
                  <span className="hint">{n(t.price) === 0 ? '0 = liên hệ báo giá' : money(n(t.price))} · đã gồm chậu + chăm 2 tuần / lần</span>
                </div>
              </div>
              <div className="ad-f">
                <label htmlFor={`rt-e-${t.key}`}>Ví dụ cây (khách thấy dưới tên cỡ cây)</label>
                <input id={`rt-e-${t.key}`} className="vx-input" maxLength={120} value={t.examples} onChange={(e) => setTier(i, 'examples', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Chăm sóc, thời hạn, VAT</div>
        <div className="ad-card__b" style={{ gap: 14 }}>
          <div className="ad-frow">
            <div className="ad-f">
              <label htmlFor="rt-weekly">Chăm hằng tuần cộng thêm (%)</label>
              <input id="rt-weekly" className="vx-input" inputMode="numeric" value={f.weeklyExtra} onChange={(e) => edit((x) => ({ ...x, weeklyExtra: digits(e.target.value, 3) }))} />
              <span className="hint">So với chăm 2 tuần / lần</span>
            </div>
            <div className="ad-f">
              <label htmlFor="rt-min">Thuê tối thiểu (cây)</label>
              <input id="rt-min" className="vx-input" inputMode="numeric" value={f.minPlants} onChange={(e) => edit((x) => ({ ...x, minPlants: digits(e.target.value, 3) }))} />
              <span className="hint">Ít hơn thì trang gợi ý mua cây về tự chăm</span>
            </div>
            <div className="ad-f">
              <label htmlFor="rt-vat">VAT khi xuất hóa đơn (%)</label>
              <input id="rt-vat" className="vx-input" inputMode="numeric" value={f.vatRate} onChange={(e) => edit((x) => ({ ...x, vatRate: digits(e.target.value, 2) }))} />
              <span className="hint">0 = không hiện ô &quot;Xuất hóa đơn VAT&quot;</span>
            </div>
          </div>
          <div>
            <b style={{ fontSize: '0.8125rem' }}>Thời hạn thuê và mức giảm</b>
            <div className="ort-adm-terms">
              {f.terms.map((t, i) => (
                <div key={i} className="ort-adm-term">
                  <input className="vx-input" inputMode="numeric" aria-label="Số tháng" value={t.months} onChange={(e) => setTerm(i, 'months', digits(e.target.value, 2))} />
                  <span>tháng, giảm</span>
                  <input className="vx-input" inputMode="numeric" aria-label="Mức giảm (%)" value={t.discount} onChange={(e) => setTerm(i, 'discount', digits(e.target.value, 2))} />
                  <span>%</span>
                  <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={f.terms.length <= 1} onClick={() => edit((x) => ({ ...x, terms: x.terms.filter((_, j) => j !== i) }))}>Xóa</button>
                </div>
              ))}
            </div>
            <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" style={{ marginTop: 8 }} disabled={f.terms.length >= MAX_TERMS} onClick={() => edit((x) => ({ ...x, terms: [...x.terms, { months: '24', discount: '15' }] }))}>+ Thêm thời hạn</button>
            <span className="vx-help" style={{ display: 'block', margin: '6px 0 0' }}>Thời hạn ngắn nhất là thời hạn tối thiểu; giá gói trên web tính theo thời hạn này.</span>
          </div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Gói nào cũng gồm</div>
        <div className="ad-card__b">
          <textarea className="vx-input" rows={5} value={f.includes} aria-label="Gói nào cũng gồm" onChange={(e) => edit((x) => ({ ...x, includes: e.target.value }))} />
          <span className="vx-help" style={{ margin: 0 }}>Mỗi dòng một ý, tối đa 8 dòng. Chỉ ghi điều shop thật sự làm — khách đọc như cam kết.</span>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Các gói (tối đa {MAX_PACKAGES})</div>
        <div className="ad-card__b" style={{ gap: 16 }}>
          {f.packages.map((p, i) => {
            const pc = preview?.packages[i];
            const pr = preview && pc ? packagePrice(preview, pc) : null;
            return (
              <fieldset key={p.key || i} className="ort-adm-pkg">
                <legend>Gói {i + 1}{p.hot && ' · nổi bật'}</legend>
                <div className="ad-frow app-pair">
                  <div className="ad-f">
                    <label htmlFor={`pk-n-${i}`}>Tên gói</label>
                    <input id={`pk-n-${i}`} className="vx-input" maxLength={40} value={p.name} onChange={(e) => setPkg(i, { name: e.target.value })} />
                  </div>
                  <div className="ad-f">
                    <label htmlFor={`pk-f-${i}`}>Phù hợp với</label>
                    <input id={`pk-f-${i}`} className="vx-input" maxLength={80} value={p.fit} placeholder="Văn phòng 10–25 người" onChange={(e) => setPkg(i, { fit: e.target.value })} />
                  </div>
                </div>
                <label className="vx-check"><input type="checkbox" checked={p.custom} onChange={(e) => setPkg(i, { custom: e.target.checked })} /> Gói theo yêu cầu (không tính giá, nút &quot;Nhận báo giá&quot;)</label>
                {!p.custom && (
                  <>
                    <div className="ad-frow">
                      {f.tiers.map((t) => (
                        <div key={t.key} className="ad-f">
                          <label htmlFor={`pk-${i}-${t.key}`}>Số {t.name.toLowerCase()}</label>
                          <input id={`pk-${i}-${t.key}`} className="vx-input" inputMode="numeric" value={p.qty[t.key]} onChange={(e) => setPkg(i, { qty: { ...p.qty, [t.key]: digits(e.target.value, 3) } })} />
                        </div>
                      ))}
                    </div>
                    <label className="vx-check"><input type="checkbox" checked={p.weekly} onChange={(e) => setPkg(i, { weekly: e.target.checked })} /> Chăm hằng tuần (bỏ chọn = 2 tuần / lần)</label>
                  </>
                )}
                <div className="ad-f">
                  <label htmlFor={`pk-p-${i}`}>Điểm nổi bật (mỗi dòng một ý, tối đa 5)</label>
                  <textarea id={`pk-p-${i}`} className="vx-input" rows={3} value={p.perks} onChange={(e) => setPkg(i, { perks: e.target.value })} />
                </div>
                <div className="ort-adm-pkg__foot">
                  <label className="vx-check"><input type="radio" name="pk-hot" checked={p.hot} onChange={() => edit((x) => ({ ...x, packages: x.packages.map((q, j) => ({ ...q, hot: j === i })) }))} /> Gắn nhãn &quot;Được chọn nhiều nhất&quot;</label>
                  {p.hot && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => setPkg(i, { hot: false })}>Bỏ nhãn</button>}
                  <span className="ort-adm-pkg__price">
                    {p.custom ? 'Giá: Liên hệ' : pr ? (pr.needsQuote ? 'Giá: liên hệ (có cỡ cây giá 0)' : <>Giá trên web: <b>{money(pr.monthly)}</b> / tháng · ≈ {money(pr.perPlant)} / cây</>) : 'Kiểm tra lại các ô để xem giá'}
                  </span>
                  <span className="ort-adm-pkg__acts">
                    <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label="Đưa gói lên" disabled={i === 0} onClick={() => movePkg(i, -1)}>↑</button>
                    <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label="Đưa gói xuống" disabled={i === f.packages.length - 1} onClick={() => movePkg(i, 1)}>↓</button>
                    <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={f.packages.length <= 1} onClick={() => edit((x) => ({ ...x, packages: x.packages.filter((_, j) => j !== i) }))}>Xóa gói</button>
                  </span>
                </div>
              </fieldset>
            );
          })}
          <span>
            <button
              type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={f.packages.length >= MAX_PACKAGES}
              onClick={() => edit((x) => ({ ...x, packages: [...x.packages, { key: '', name: 'Gói mới', fit: '', qty: { 'de-ban': '5', vua: '0', lon: '0' }, weekly: false, perks: '', hot: false, custom: false }] }))}
            >+ Thêm gói</button>
          </span>
          <span className="vx-help" style={{ margin: 0 }}>Giá gói = Σ số cây × giá cỡ cây (+ phụ phí chăm hằng tuần), theo thời hạn ngắn nhất — không nhập riêng, nên gói và phần &quot;Tự chọn số cây&quot; luôn khớp. Muốn gói rẻ hơn thì giảm giá cỡ cây hoặc thêm mức giảm theo thời hạn.</span>
        </div>
      </div>

      <div className="ad-sticky">
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span> : saved ? 'Đã lưu — trang khách cập nhật ngay' : 'Yêu cầu đã gửi giữ nguyên ước tính lúc khách gửi'}
        </span>
        <button type="button" className="vx-btn vx-btn--ghost" onClick={() => { if (confirm('Đưa toàn bộ về giá và gói mặc định? (chưa lưu cho tới khi bấm Lưu)')) edit(() => toForm(DEFAULT_RENTAL)); }}>Về mặc định</button>
        <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  );
}
