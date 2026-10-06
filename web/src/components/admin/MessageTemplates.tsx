'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { resetTemplateAction, saveTemplateAction, sendTestTemplateAction } from '@/app/actions/messages';
import { GLOBAL_VARS, GROUPS, renderText, sampleVars, TEXT_MAX, VARIABLES, type EventDef } from '@/lib/message-templates';

export type TemplateView = { def: EventDef; text: string; inApp: boolean; external: boolean; custom: boolean };

/** **đậm** → <b> cho phần xem trước. */
const bold = (t: string) => t.split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x));

/** AdminMessageTemplates: danh sách mẫu theo nhóm | sửa nội dung + biến + kênh | xem trước chuông thông báo và Zalo. */
export function MessageTemplates({ templates, zaloReady, emailReady }: { templates: TemplateView[]; zaloReady: boolean; emailReady: boolean }) {
  const router = useRouter();
  const [key, setKey] = useState(templates[0].def.key);
  const cur = templates.find((t) => t.def.key === key) ?? templates[0];
  const [edits, setEdits] = useState<Record<string, { text: string; inApp: boolean; external: boolean }>>({});
  const v = edits[cur.def.key] ?? { text: cur.text, inApp: cur.inApp, external: cur.external };
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const set = (p: Partial<typeof v>) => { setEdits((e) => ({ ...e, [cur.def.key]: { ...v, ...p } })); setMsg(null); };
  const dirty = v.text !== cur.text || v.inApp !== cur.inApp || v.external !== cur.external;

  const insert = (name: string) => {
    const el = area.current;
    const tok = `{${name}}`;
    if (!el) { set({ text: v.text + tok }); return; }
    const a = el.selectionStart ?? v.text.length, b = el.selectionEnd ?? a;
    set({ text: v.text.slice(0, a) + tok + v.text.slice(b) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + tok.length, a + tok.length); });
  };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string, after?: () => void) => {
    setMsg(null);
    start(async () => {
      const r = await fn().catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      setMsg({ ok: r.ok, text: r.ok ? okText : r.error ?? 'Có lỗi' });
      if (r.ok) after?.();
      router.refresh();
    });
  };

  const rendered = renderText(v.text, sampleVars());
  const channelNote = v.external ? [zaloReady ? 'Zalo ZNS' : null, emailReady ? 'email' : null].filter(Boolean).join(' + ') : '';

  return (
    <div className="mt">
      <div className="mt-list">
        {GROUPS.map((g) => (
          <div key={g}>
            <h4>{g.toUpperCase()}</h4>
            {templates.filter((t) => t.def.group === g).map((t) => (
              <a key={t.def.key} role="button" tabIndex={0} aria-current={t.def.key === cur.def.key ? 'true' : undefined} style={{ cursor: 'pointer' }}
                onClick={() => { setKey(t.def.key); setMsg(null); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setKey(t.def.key); setMsg(null); } }}>
                {t.def.title}
                <small className={(edits[t.def.key]?.external ?? t.external) ? 'z' : 'e'}>{(edits[t.def.key]?.external ?? t.external) ? 'ZALO' : 'CHUÔNG'}</small>
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-edit">
        <div className="vx-label-row">
          <b style={{ fontSize: '0.9375rem' }}>{cur.def.title}</b>
          <span className={`vx-badge ${cur.custom ? 'vx-badge--success' : 'vx-badge--outline'}`}>{cur.custom ? 'Đã chỉnh sửa' : 'Mặc định'}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Gửi tự động khi: {cur.def.trigger}.</span>
        <div className="ad-f">
          <label>Biến có thể chèn (bấm để chèn vào chỗ con trỏ)</label>
          <div className="mt-vars">
            {[...cur.def.vars, ...GLOBAL_VARS].map((n) => (
              <span key={n} role="button" tabIndex={0} title={`${VARIABLES[n]?.label} · ví dụ: ${VARIABLES[n]?.sample}`} style={{ cursor: 'pointer' }}
                onClick={() => insert(n)} onKeyDown={(e) => { if (e.key === 'Enter') insert(n); }}>{`{${n}}`}</span>
            ))}
          </div>
        </div>
        <div className="ad-f">
          <label htmlFor="mt-text">Nội dung (dùng **chữ** để in đậm)</label>
          <textarea id="mt-text" ref={area} className="vx-input mt-body" style={{ minHeight: 120, resize: 'vertical' }} value={v.text} maxLength={TEXT_MAX + 50} onChange={(e) => set({ text: e.target.value })} />
          <span className="hint">{v.text.length}/{TEXT_MAX} ký tự</span>
        </div>
        <label className="vx-check"><input type="checkbox" checked={v.inApp} onChange={(e) => set({ inApp: e.target.checked })} /> Hiện trong chuông thông báo của khách</label>
        <label className="vx-check"><input type="checkbox" checked={v.external} onChange={(e) => set({ external: e.target.checked })} /> Gửi thêm qua Zalo ZNS / email {v.external && !zaloReady && !emailReady && <span style={{ color: 'var(--danger)' }}>(chưa cấu hình kênh nào — xem hướng dẫn phía trên)</span>}</label>
        {msg && <span className={msg.ok ? 'vx-help' : 'vx-err'} role={msg.ok ? 'status' : 'alert'} style={{ margin: 0 }}>{msg.text}</span>}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {cur.custom && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => { if (confirm('Khôi phục nội dung mặc định?')) run(() => resetTemplateAction(cur.def.key), 'Đã khôi phục mặc định', () => setEdits((e) => { const { [cur.def.key]: _x, ...rest } = e; return rest; })); }}>Khôi phục mặc định</button>}
          <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => run(() => sendTestTemplateAction(cur.def.key), 'Đã gửi thử: xem chuông thông báo của bạn trên website và tab Nhật ký gửi')}>Gửi thử cho tôi</button>
          <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending || !dirty} onClick={() => run(() => saveTemplateAction(cur.def.key, v), 'Đã lưu mẫu', () => setEdits((e) => { const { [cur.def.key]: _x, ...rest } = e; return rest; }))}>Lưu mẫu</button>
        </div>
      </div>

      <div className="mt-phone">
        <span className="oa">Xem trước · dữ liệu mẫu</span>
        <div className="mt-bubble">
          <div className="tx"><b>Chuông thông báo trên website</b>{v.inApp ? bold(rendered) : <i style={{ color: 'var(--ink-muted)' }}>Không hiện trong chuông (đang tắt)</i>}</div>
        </div>
        <div className="mt-bubble">
          <div className="tx">
            <b>Zalo / email{channelNote ? ` (${channelNote})` : ''}</b>
            {v.external ? <>Chào Chị Ngọc,<br />{rendered.replace(/\*\*/g, '')}</> : <i style={{ color: 'var(--ink-muted)' }}>Không gửi ra ngoài (đang tắt)</i>}
          </div>
        </div>
        <span style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', textAlign: 'center' }}>Mẫu Zalo ZNS phải được Zalo duyệt; shop dùng một mẫu ZNS chung nhận {'{tên khách}'}, {'{nội dung}'}, {'{link}'}.</span>
      </div>
    </div>
  );
}
