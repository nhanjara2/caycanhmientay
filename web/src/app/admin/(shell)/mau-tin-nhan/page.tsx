import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageTemplates, type TemplateView } from '@/components/admin/MessageTemplates';
import { Icon } from '@/components/Icon';
import { EVENTS } from '@/lib/message-templates';
import { fmtDateTime } from '@/lib/order-labels';
import { maskPhone, requireAccess } from '@/server/auth';
import { channelStatus, customTemplates, recentOutboundLog } from '@/server/messages';

export const metadata: Metadata = { title: 'Mẫu tin nhắn' };

type Props = { searchParams: Promise<{ tab?: string }> };

const STATUS = { sent: { label: 'Đã gửi', pill: 'done' }, failed: { label: 'Lỗi', pill: 'cancel' }, skipped: { label: 'Bỏ qua', pill: 'wait' } } as const;

/** MessageTemplates: nội dung thông báo tự động gửi khách (chuông trên website, Zalo ZNS, email) + nhật ký gửi. Chỉ Quản lý. */
export default async function AdminMessageTemplatesPage({ searchParams }: Props) {
  await requireAccess('settings');
  const sp = await searchParams;
  const log = sp.tab === 'nhat-ky';
  const ch = channelStatus();

  const custom = await customTemplates();
  const templates: TemplateView[] = EVENTS.map((def) => {
    const c = custom.get(def.key);
    return { def, text: c?.text ?? def.text, inApp: c?.inApp ?? true, external: c?.external ?? def.external, custom: !!c };
  });
  const rows = log ? await recentOutboundLog() : [];

  return (
    <div className="ad-body">
      <div className="ad-title"><h1>Mẫu tin nhắn</h1></div>
      <div className="ad-card">
        <div className="ad-stabs">
          <Link href="/admin/mau-tin-nhan" aria-current={!log ? 'true' : undefined}>Mẫu tin</Link>
          <Link href="/admin/mau-tin-nhan?tab=nhat-ky" aria-current={log ? 'true' : undefined}>Nhật ký gửi</Link>
        </div>
      </div>
      {!ch.zalo && !ch.email && (
        <div className="vx-note">
          <Icon name="alert" />
          <div>
            Chưa cấu hình kênh gửi ra ngoài nên tin chỉ hiện trong <b>chuông thông báo</b> trên website; các tin “Gửi thêm qua Zalo / email” được ghi vào Nhật ký với trạng thái “Bỏ qua”.
            Để gửi Zalo: điền <code>ZALO_ZNS_ACCESS_TOKEN</code> và <code>ZALO_ZNS_TEMPLATE_ID</code>; để gửi email: <code>RESEND_API_KEY</code> và <code>EMAIL_FROM</code> (Vercel → Environment Variables).
          </div>
        </div>
      )}
      {ch.zalo !== ch.email && (
        <div className="vx-note"><Icon name="check" /><div>Đã cấu hình: {ch.zalo ? 'Zalo ZNS' : 'email'}. {ch.zalo ? 'Email chưa cấu hình.' : 'Zalo ZNS chưa cấu hình.'}</div></div>
      )}
      {log ? (
        <div className="ad-card">
          <div className="ad-tablewrap">
            <table className="ad-table app-mtable">
              <thead><tr><th>Lúc</th><th>Kênh</th><th>Gửi tới</th><th>Nội dung</th><th>Kết quả</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDateTime(r.createdAt)}</td>
                    <td data-label="Kênh">{r.channel === 'zalo' ? 'Zalo' : 'Email'}</td>
                    <td data-label="Gửi tới">{r.channel === 'zalo' ? maskPhone(r.to) : r.to}</td>
                    <td data-label="Nội dung" data-wide>{r.body.length > 90 ? `${r.body.slice(0, 90)}…` : r.body}</td>
                    <td data-label="Kết quả" data-m="aside"><span className={`ad-pill ${STATUS[r.status].pill}`}>{STATUS[r.status].label}</span>{r.error && <small>{r.error}</small>}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={5} style={{ color: 'var(--ink-muted)' }}>Chưa có tin nào gửi ra ngoài (Zalo / email).</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <MessageTemplates templates={templates} zaloReady={ch.zalo} emailReady={ch.email} />
      )}
    </div>
  );
}
