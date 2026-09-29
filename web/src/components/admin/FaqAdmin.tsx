'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteFaqAction, moveFaqAction, saveFaqAction, setFaqActiveAction } from '@/app/actions/faqs';
import { Thumb } from '@/components/Icon';
import { FAQ_ANSWER_MAX_CHARS, FAQ_QUESTION_MAX_CHARS, FAQ_SCOPES, type FaqScope } from '@/lib/reviews';

export type FaqValues = { question: string; answer: string; scope: FaqScope; active: boolean };

/**
 * Form câu hỏi thường gặp (dùng khi đưa câu hỏi của khách lên FAQ, sửa câu có sẵn, thêm câu chung).
 * `productName` = có sản phẩm để chọn phạm vi "Chỉ sản phẩm này".
 */
export function FaqForm({ initial, productName, submitLabel, onSubmit, onCancel }: {
  initial: FaqValues;
  productName: string | null;
  submitLabel: string;
  onSubmit: (v: FaqValues) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const scopes = (Object.keys(FAQ_SCOPES) as FaqScope[]).filter((s) => s !== 'product' || productName);

  const submit = () => {
    setError('');
    start(async () => {
      const err = await onSubmit(v).catch(() => 'Không lưu được, vui lòng thử lại');
      if (err) setError(err);
    });
  };

  return (
    <div className="rv-faq">
      <label>
        Câu hỏi (viết gọn, rõ như khách hay hỏi)
        <input className="vx-input" value={v.question} maxLength={FAQ_QUESTION_MAX_CHARS} onChange={(e) => setV({ ...v, question: e.target.value })} />
      </label>
      <label>
        Câu trả lời (không ghi tên khách)
        <textarea className="vx-input" value={v.answer} maxLength={FAQ_ANSWER_MAX_CHARS} onChange={(e) => setV({ ...v, answer: e.target.value })} />
      </label>
      <div className="row">
        <select className="vx-input" style={{ width: 'auto' }} value={v.scope} onChange={(e) => setV({ ...v, scope: e.target.value as FaqScope })} aria-label="Hiện ở">
          {scopes.map((s) => <option key={s} value={s}>{s === 'product' ? `Chỉ ${productName}` : FAQ_SCOPES[s]}</option>)}
        </select>
        <label className="vx-check" style={{ flexDirection: 'row', fontWeight: 400 }}>
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Hiện trên web
        </label>
      </div>
      {error && <small role="alert" style={{ color: 'var(--danger)' }}>{error}</small>}
      <div className="row">
        <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending} onClick={submit}>{pending ? 'Đang lưu…' : submitLabel}</button>
        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={onCancel}>Hủy</button>
      </div>
    </div>
  );
}

export type AdminFaqRow = {
  id: number;
  scope: FaqScope;
  question: string;
  answer: string;
  active: boolean;
  productSlug: string | null;
  productName: string | null;
  image: string | null;
  icon: string;
  fromCustomer: string | null;
  questionId: number | null;
  first: boolean;
  last: boolean;
};

const scopeLabel = (f: AdminFaqRow) => (f.scope === 'product' ? f.productName ?? 'Sản phẩm' : `Câu chung · ${FAQ_SCOPES[f.scope]}`);

/** Một câu FAQ trong tab "Câu hỏi thường gặp": sửa, bật/tắt, đổi thứ tự trong nhóm, xóa. */
export function FaqRow({ f }: { f: AdminFaqRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError('');
    start(async () => {
      const r = await fn().catch(() => ({ ok: false as const, error: 'Không lưu được, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.refresh();
    });
  };

  return (
    <div className={`faq-item${f.active ? '' : ' off'}`}>
      {f.productSlug ? (
        <Link href={`/san-pham/${f.productSlug}#hoi-dap`} className="ad-thumb" target="_blank" title="Mở trang sản phẩm"><Thumb src={f.image} icon={f.icon} /></Link>
      ) : <span className="ad-thumb"><Thumb src={null} icon="chat" /></span>}
      <span>
        <span className="meta">
          <b style={{ color: 'var(--ink)' }}>{scopeLabel(f)}</b>
          {f.fromCustomer && <>{' · '}Từ câu hỏi của {f.fromCustomer}</>}
          {!f.active && <span className="vx-badge">Đang ẩn</span>}
        </span>
        {editing ? (
          <FaqForm
            initial={{ question: f.question, answer: f.answer, scope: f.scope, active: f.active }}
            productName={f.productName}
            submitLabel="Lưu"
            onCancel={() => setEditing(false)}
            onSubmit={async (v) => {
              const r = await saveFaqAction({ id: f.id, ...v });
              if (!r.ok) return r.error;
              setEditing(false);
              router.refresh();
              return null;
            }}
          />
        ) : (
          <>
            <p className="q">{f.question}</p>
            <p className="a">{f.answer}</p>
          </>
        )}
        {error && <small role="alert" style={{ color: 'var(--danger)' }}>{error}</small>}
      </span>
      {!editing && (
        <span className="acts">
          <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => setEditing(true)}>Sửa</button>
          <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => run(() => setFaqActiveAction(f.id, !f.active))}>
            {f.active ? 'Ẩn' : 'Hiện'}
          </button>
          <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending || f.first} onClick={() => run(() => moveFaqAction(f.id, -1))} aria-label="Lên trên">↑</button>
          <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending || f.last} onClick={() => run(() => moveFaqAction(f.id, 1))} aria-label="Xuống dưới">↓</button>
          <button
            type="button"
            className="vx-btn vx-btn--ghost vx-btn--sm"
            disabled={pending}
            onClick={() => confirm('Xóa câu hỏi thường gặp này?') && run(() => deleteFaqAction(f.id))}
          >
            Xóa
          </button>
        </span>
      )}
    </div>
  );
}

/** Nút + form thêm câu hỏi chung (không gắn sản phẩm). */
export function FaqNew() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={() => setOpen(true)}>+ Thêm câu hỏi chung</button>;
  }
  return (
    <div style={{ padding: 12 }}>
      <FaqForm
        initial={{ question: '', answer: '', scope: 'plant', active: true }}
        productName={null}
        submitLabel="Thêm"
        onCancel={() => setOpen(false)}
        onSubmit={async (v) => {
          const r = await saveFaqAction(v);
          if (!r.ok) return r.error;
          setOpen(false);
          router.refresh();
          return null;
        }}
      />
    </div>
  );
}
