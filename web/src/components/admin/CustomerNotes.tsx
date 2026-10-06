'use client';

import { useState, useTransition } from 'react';
import { updateCustomerNotesAction } from '@/app/actions/customers';

/** Ghi chú nội bộ về khách trong trang chi tiết admin — lưu ngay, không cần trang riêng. */
export function CustomerNotes({ id, initial }: { id: number; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(true);
  const [pending, start] = useTransition();

  const save = () => {
    start(async () => {
      const r = await updateCustomerNotesAction({ id, notes }).catch(() => ({ ok: false as const }));
      setSaved(r.ok);
    });
  };

  return (
    <div className="ad-card">
      <div className="ad-card__h">Ghi chú nội bộ</div>
      <div className="ad-card__b">
        <textarea
          className="vx-input"
          style={{ minHeight: 72, width: '100%' }}
          value={notes}
          maxLength={2000}
          placeholder="Ví dụ: nhà hướng tây, hay hỏi về cháy lá…"
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          onBlur={() => !saved && save()}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{pending ? 'Đang lưu…' : saved ? 'Đã lưu' : 'Chưa lưu — bấm ra ngoài ô để lưu'}</span>
      </div>
    </div>
  );
}
