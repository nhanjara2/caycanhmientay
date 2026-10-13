'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveStickerDaysAction } from '@/app/actions/stickers';
import { dayLabelOf, MAX_STICKER_DAYS, MAX_STICKER_TEXT, STICKER_DAY_TEXT, type ActiveStickerDay, type StickerDay, type StickerDayConfig } from '@/lib/sticker-days';

const blank = (): StickerDay => ({ date: '', endDate: '', text: '', on: true });

/** Ô sticker ngày mẫu (cùng kiểu ô trên ảnh sản phẩm, dùng class .app-stk của web khách). */
function Tile({ label, text }: { label: string; text: string }) {
  return (
    <span className="app-stk" data-size="lg" style={{ position: 'static', display: 'inline-flex', width: 'auto', verticalAlign: 'middle', borderRadius: 6 }} aria-hidden="true">
      <span className="app-stk__t" data-k="day"><i>{text}</i><b>{label}</b></span>
    </span>
  );
}

/** AdminStickerDays: ngày đặc biệt hiện thành ô sticker kiểu "15.10" ở góc ảnh sản phẩm — ngày đôi mỗi tháng (tự động) + ngày shop thêm. */
export function StickerDays({ initial, today }: { initial: StickerDayConfig; today: ActiveStickerDay | null }) {
  const router = useRouter();
  const [monthly, setMonthly] = useState(initial.monthly);
  const [days, setDays] = useState<StickerDay[]>(initial.days);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const edit = (fn: () => void) => { fn(); setSaved(false); };
  const setDay = (i: number, patch: Partial<StickerDay>) => edit(() => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x))));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const rows = days.filter((d) => d.date);
    start(async () => {
      const r = await saveStickerDaysAction({ monthly, days: rows }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setMonthly(r.config.monthly);
      setDays(r.config.days);
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title"><h1>Ngày sự kiện</h1></div>

      <div className="ad-card">
        <div className="ad-card__h">Ô ngày trên ảnh sản phẩm</div>
        <div className="ad-card__b" style={{ gap: 14 }}>
          <span className="vx-help" style={{ margin: 0 }}>
            Vào ngày đặc biệt, mọi sản phẩm hiện thêm một ô ghi ngày (kiểu 15.10, 11.11) ở góc dưới trái ảnh — trên thẻ sản phẩm và ở ảnh lớn trang chi tiết. Ngày bạn tự thêm được ưu tiên hơn ngày đôi.
          </span>
          <div>
            Hôm nay:{' '}
            {today ? <><Tile label={today.label} text={today.text} /> <span className="vx-help">đang hiện trên web</span></> : <span className="vx-help">không phải ngày đặc biệt, web không hiện ô ngày.</span>}
          </div>
          <div className="ad-f">
            <label className="vx-check"><input type="checkbox" checked={monthly} onChange={(e) => edit(() => setMonthly(e.target.checked))} /> Tự hiện vào các ngày đôi mỗi tháng (1.1, 2.2, 3.3 … 12.12)</label>
            <span className="hint">Mỗi tháng có một ngày đẹp để săn sale: ngày 1 tháng 1, ngày 2 tháng 2… ngày 12 tháng 12.</span>
          </div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Ngày shop tự thêm</div>
        <div className="ad-card__b" style={{ gap: 10 }}>
          {days.map((d, i) => (
            <div key={i} className="app-sday-row">
              <div className="ad-f">
                <label htmlFor={`sd-d-${i}`}>Từ ngày</label>
                <input id={`sd-d-${i}`} className="vx-input" type="date" value={d.date} onChange={(e) => setDay(i, { date: e.target.value })} />
              </div>
              <div className="ad-f">
                <label htmlFor={`sd-e-${i}`}>Đến ngày (bỏ trống = 1 ngày)</label>
                <input id={`sd-e-${i}`} className="vx-input" type="date" value={d.endDate} min={d.date || undefined} onChange={(e) => setDay(i, { endDate: e.target.value })} />
              </div>
              <div className="ad-f">
                <label htmlFor={`sd-t-${i}`}>Chữ nhỏ trên ô</label>
                <input id={`sd-t-${i}`} className="vx-input" value={d.text} maxLength={MAX_STICKER_TEXT} placeholder={STICKER_DAY_TEXT} onChange={(e) => setDay(i, { text: e.target.value })} />
              </div>
              <div className="app-sday-row__acts">
                {d.date && <Tile label={dayLabelOf(d.date)} text={(d.text || STICKER_DAY_TEXT).toUpperCase()} />}
                <label className="vx-check"><input type="checkbox" checked={d.on} onChange={(e) => setDay(i, { on: e.target.checked })} /> Bật</label>
                <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => edit(() => setDays((x) => x.filter((_, j) => j !== i)))}>Xóa</button>
              </div>
            </div>
          ))}
          {!days.length && <span className="vx-help" style={{ margin: 0 }}>Chưa có ngày nào — web chỉ hiện ô ngày vào các ngày đôi{monthly ? '' : ' (đang tắt)'}. Thêm ngày khi shop có chương trình riêng (vd. 15.10 giảm sâu cây để bàn).</span>}
          <span><button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={days.length >= MAX_STICKER_DAYS} onClick={() => edit(() => setDays((x) => [...x, blank()]))}>+ Thêm ngày</button></span>
        </div>
      </div>

      <div className="ad-sticky">
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span> : saved ? 'Đã lưu — áp dụng ngay trên website' : 'Thay đổi có hiệu lực ngay sau khi lưu'}
        </span>
        <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  );
}
