'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addServiceNoteAction, updateServiceRequestAction } from '@/app/actions/service-requests';
import { money } from '@/lib/format';
import { SERVICE_STAGES, STAGE_LABEL, type ServiceStage } from '@/lib/service-labels';
import { Select } from '@/components/Select';

export type PanelValue = {
  id: number;
  stage: ServiceStage;
  assigneeId: number | null;
  /** "YYYY-MM-DDTHH:mm" giờ Việt Nam, '' = chưa hẹn. */
  surveyAt: string;
  value: number | null;
  lostReason: string;
};

/** Khung "Xử lý": giai đoạn, người phụ trách, lịch hẹn, giá trị báo giá. Mọi thay đổi ghi vào lịch sử. */
export function ServiceRequestPanel({ init, staff }: { init: PanelValue; staff: { id: number; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(init);
  const [valueText, setValueText] = useState(init.value != null ? String(init.value) : '');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof PanelValue>(k: K, val: PanelValue[K]) => { setV((x) => ({ ...x, [k]: val })); setMsg(null); };

  const value = valueText === '' ? null : Number(valueText);
  const dirty = v.stage !== init.stage || v.assigneeId !== init.assigneeId || v.surveyAt !== init.surveyAt || value !== init.value
    || (v.stage === 'lost' && v.lostReason !== init.lostReason);

  const save = () => {
    start(async () => {
      const r = await updateServiceRequestAction({
        id: v.id,
        stage: v.stage,
        assigneeId: v.assigneeId,
        surveyAt: v.surveyAt || null,
        value,
        lostReason: v.stage === 'lost' ? v.lostReason : undefined,
      }).catch(() => ({ ok: false as const, error: 'Không lưu được, kiểm tra mạng rồi thử lại' }));
      setMsg(r.ok ? { ok: true, text: 'Đã lưu' } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });
  };

  return (
    <div className="ad-card">
      <div className="ad-card__h">Xử lý</div>
      <div className="ad-card__b app-sr-form">
        <div className="ad-f">
          <label htmlFor="sr-stage">Giai đoạn</label>
          <Select id="sr-stage" className="vx-input" value={v.stage} onChange={(e) => set('stage', e.target.value as ServiceStage)}>
            {SERVICE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </Select>
        </div>
        {v.stage === 'lost' && (
          <div className="ad-f">
            <label htmlFor="sr-lost">Lý do thua</label>
            <input id="sr-lost" className="vx-input" value={v.lostReason} maxLength={300} onChange={(e) => set('lostReason', e.target.value)}
              placeholder="Ví dụ: khách chọn nơi khác, giá chưa phù hợp" />
          </div>
        )}
        <div className="ad-f">
          <label htmlFor="sr-who">Nhân viên phụ trách</label>
          <Select id="sr-who" className="vx-input" value={v.assigneeId ?? ''} onChange={(e) => set('assigneeId', e.target.value ? Number(e.target.value) : null)}>
            <option value="">Chưa giao</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="ad-f">
          <label htmlFor="sr-survey">Hẹn gặp / xem cây (nếu có)</label>
          <input id="sr-survey" type="datetime-local" className="vx-input" value={v.surveyAt} onChange={(e) => set('surveyAt', e.target.value)} />
        </div>
        <div className="ad-f">
          <label htmlFor="sr-value">Giá trị báo giá / đơn đã chốt (đồng)</label>
          <input id="sr-value" className="vx-input" inputMode="numeric" value={valueText} placeholder="Chưa báo giá"
            onChange={(e) => { setValueText(e.target.value.replace(/\D/g, '').slice(0, 11)); setMsg(null); }} />
          {value != null && <span className="vx-help">{money(value)}</span>}
        </div>
        {msg && <span className={msg.ok ? 'vx-help' : 'vx-err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</span>}
        <button type="button" className="vx-btn vx-btn--primary" disabled={!dirty || pending} onClick={save}>{pending ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </div>
  );
}

/** Ghi nhận cuộc gọi / ghi chú nội bộ vào "Lịch sử liên hệ". */
export function ServiceNoteBox({ id, contacted }: { id: number; contacted: boolean }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const send = (kind: 'call' | 'note') => {
    setError('');
    start(async () => {
      const r = await addServiceNoteAction({ id, kind, text }).catch(() => ({ ok: false as const, error: 'Không lưu được, kiểm tra mạng rồi thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setText('');
      router.refresh();
    });
  };

  return (
    <div className="app-sr-note">
      <textarea className="vx-input" style={{ minHeight: 60, fontSize: '0.8125rem' }} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Nội dung trao đổi với khách, hẹn gọi lại…" aria-label="Ghi chú" />
      {error && <span className="vx-err" role="alert">{error}</span>}
      <div className="vx-row">
        <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending} onClick={() => send('call')}>
          {contacted ? 'Ghi nhận cuộc gọi' : 'Đã gọi cho khách'}
        </button>
        <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending || text.trim().length < 2} onClick={() => send('note')}>Thêm ghi chú</button>
      </div>
    </div>
  );
}
