'use client';

import { useState } from 'react';
import { createForeignInquiryAction } from '@/app/actions/service-requests';
import { Select } from '@/components/Select';

const TYPES: [string, string][] = [
  ['trade', 'Plant reseller / garden centre / importer'],
  ['landscape', 'Landscaping company'],
  ['project', 'Construction / hospitality project'],
];

/** Form báo giá của bản tiếng Anh: lưu vào bảng yêu cầu báo giá sỉ (/admin/dich-vu) + báo cho shop. */
export function EnInquiryForm() {
  const [state, setState] = useState<{ busy?: boolean; error?: string; code?: string }>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ busy: true });
    try {
      const r = await createForeignInquiryAction(new FormData(e.currentTarget));
      setState(r.ok ? { code: r.code || 'sent' } : { error: r.error });
    } catch {
      setState({ error: 'Something went wrong. Please email us instead.' });
    }
  }

  if (state.code) {
    return (
      <div className="en-card en-done" role="status">
        <h2>Thank you — we have received your request</h2>
        <p>{state.code !== 'sent' && <>Reference: <b>{state.code}</b>. </>}We will reply by email within 1–2 business days (Vietnam time, GMT+7).</p>
      </div>
    );
  }

  return (
    <form className="en-card en-form" onSubmit={submit} noValidate={false}>
      <h2>Send an inquiry</h2>
      <label className="en-field">
        <span>Your business *</span>
        <Select name="service" required defaultValue="" aria-label="Your business">
          <option value="" disabled>Choose one</option>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </label>
      <div className="en-row">
        <label className="en-field"><span>Full name *</span><input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label>
        <label className="en-field"><span>Company</span><input name="company" maxLength={120} autoComplete="organization" /></label>
      </div>
      <div className="en-row">
        <label className="en-field"><span>Email *</span><input name="email" type="email" required maxLength={120} autoComplete="email" /></label>
        <label className="en-field"><span>Phone / WhatsApp</span><input name="phone" type="tel" maxLength={24} autoComplete="tel" placeholder="+1 555 123 4567" /></label>
      </div>
      <label className="en-field"><span>Country / city of delivery *</span><input name="country" required minLength={2} maxLength={80} autoComplete="country-name" /></label>
      <label className="en-field">
        <span>Plants and quantities you need *</span>
        <textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder="e.g. Aglaonema 'Red Valentine', 30–40 cm, 200 pots; Sansevieria 60 cm, 100 pots…" />
      </label>
      {/* Ô bẫy bot: người thật không thấy */}
      <input className="en-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state.error && <p className="en-err" role="alert">{state.error}</p>}
      <button className="en-btn" type="submit" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send inquiry'}</button>
      <p className="en-note">We use your details only to reply to this inquiry.</p>
    </form>
  );
}
