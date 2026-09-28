import type { Metadata } from 'next';
import Link from 'next/link';
import { QuestionRow, ReviewRow } from '@/components/admin/ReviewModeration';
import { Icon } from '@/components/Icon';
import { REVIEW_HOLD_STARS } from '@/lib/reviews';
import { requireStaff } from '@/server/auth';
import { countQuestions, listQuestionsAdmin, QUESTION_FILTERS, type QuestionFilter } from '@/server/questions';
import { countReviewsByStatus, listReviewsAdmin, REVIEW_TABS, reviewKpis, type ReviewTab } from '@/server/reviews';

export const metadata: Metadata = { title: 'Hỏi đáp & đánh giá' };

type Props = { searchParams: Promise<{ tab?: string; loc?: string; sao?: string; anh?: string; q?: string }> };

type Tab = ReviewTab | 'cau-hoi';
const TABS: { key: Tab; label: string }[] = [
  { key: 'cho-duyet', label: 'Chờ duyệt' },
  { key: 'cau-hoi', label: 'Câu hỏi' },
  { key: 'dang-hien', label: 'Đang hiện' },
  { key: 'da-an', label: 'Đã ẩn' },
];

/** AdminReviews: duyệt đánh giá 1–2★, trả lời câu hỏi, ẩn nội dung vi phạm, trả lời công khai (dữ liệu thật). */
export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const [counts, qc, k] = await Promise.all([countReviewsByStatus(), countQuestions(), reviewKpis()]);
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab)
    : counts.pending ? 'cho-duyet' : qc.unanswered ? 'cau-hoi' : 'dang-hien';
  const loc: QuestionFilter = sp.loc && sp.loc in QUESTION_FILTERS ? (sp.loc as QuestionFilter) : 'chua-tra-loi';
  const stars = Number(sp.sao) >= 1 && Number(sp.sao) <= 5 ? Number(sp.sao) : undefined;
  const photo = sp.anh === '1';
  const q = sp.q?.slice(0, 60);
  const isQ = tab === 'cau-hoi';
  const filtered = Boolean(q || (!isQ && (stars || photo)));
  const base = `/admin/danh-gia?tab=${tab}${isQ ? `&loc=${loc}` : ''}`;

  const reviews = isQ ? [] : await listReviewsAdmin({ tab: tab as ReviewTab, stars, photo, q });
  const questions = isQ ? await listQuestionsAdmin({ filter: loc, q }) : [];
  const badge: Record<Tab, number> = { 'cho-duyet': counts.pending, 'cau-hoi': qc.unanswered, 'dang-hien': counts.published, 'da-an': counts.hidden };
  const qCount: Record<QuestionFilter, number> = { 'chua-tra-loi': qc.unanswered, 'da-tra-loi': qc.answered, 'da-an': qc.hidden };

  return (
    <div className="ad-body">
      <div className="ad-title"><h1>Hỏi đáp &amp; đánh giá</h1></div>
      <div className="ad-kpis">
        <div className="ad-kpi">
          <span><Icon name="star" />Điểm trung bình</span>
          <b>{k.published ? k.avg.toFixed(1).replace('.', ',') : '—'}</b>
          <small>{k.published} đánh giá đang hiện</small>
        </div>
        <div className={`ad-kpi${qc.unanswered ? ' warn' : ''}`}>
          <span><Icon name="chat" />Câu hỏi chưa trả lời</span>
          <b>{qc.unanswered}</b>
          <small>Cam kết trả lời trong 2 giờ</small>
        </div>
        <div className={`ad-kpi${counts.pending ? ' warn' : ''}`}>
          <span><Icon name="alert" />Đánh giá chờ duyệt</span>
          <b>{counts.pending}</b>
          <small>Đánh giá 1–{REVIEW_HOLD_STARS} sao</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="check" />Tỉ lệ đã phản hồi</span>
          <b>{k.replyRate === null ? '—' : `${k.replyRate}%`}</b>
          <small>Đánh giá 30 ngày qua · {k.week} mới trong 7 ngày</small>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-stabs">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/danh-gia?tab=${t.key}`} aria-current={tab === t.key ? 'true' : undefined}>
              {t.label}{badge[t.key] ? <em>{badge[t.key]}</em> : null}
            </Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/danh-gia">
          <input type="hidden" name="tab" value={tab} />
          {isQ && <input type="hidden" name="loc" value={loc} />}
          {isQ && (
            <span className="vx-seg">
              {(Object.keys(QUESTION_FILTERS) as QuestionFilter[]).map((f) => (
                <Link key={f} href={`/admin/danh-gia?tab=cau-hoi&loc=${f}`} className="vx-chip" aria-pressed={loc === f}>
                  {QUESTION_FILTERS[f]}{qCount[f] ? ` (${qCount[f]})` : ''}
                </Link>
              ))}
            </span>
          )}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder={isQ ? 'Câu hỏi, tên khách, sản phẩm' : 'Nội dung, tên khách, sản phẩm'} aria-label="Tìm" />
          </label>
          {!isQ && (
            <>
              <select name="sao" defaultValue={stars ?? ''} className="vx-input" style={{ width: 'auto' }} aria-label="Số sao">
                <option value="">Mọi số sao</option>
                {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
              </select>
              <label className="vx-check" style={{ fontSize: 13 }}>
                <input type="checkbox" name="anh" value="1" defaultChecked={photo} /> Có ảnh
              </label>
            </>
          )}
          <button className="vx-btn vx-btn--outline vx-btn--sm">{isQ ? 'Tìm' : 'Lọc'}</button>
          {filtered && <Link href={base} className="vx-btn vx-btn--ghost vx-btn--sm">Bỏ lọc</Link>}
        </form>
        {tab === 'cho-duyet' && (
          <div className="vx-note" style={{ margin: 12 }}>
            <Icon name="alert" />
            <div>
              Đánh giá 1–{REVIEW_HOLD_STARS} sao chờ duyệt: người viết vẫn thấy đánh giá của mình như đã đăng, khách khác chưa thấy.
              Nên liên hệ / trả lời khách rồi <b>Duyệt</b>; chỉ <b>Ẩn</b> khi vi phạm (quảng cáo, lộ thông tin cá nhân, xúc phạm).
            </div>
          </div>
        )}
        {isQ && loc === 'chua-tra-loi' && (
          <div className="vx-note" style={{ margin: 12 }}>
            <Icon name="chat" />
            <div>
              Câu hỏi chỉ hiện công khai sau khi được trả lời (người hỏi thấy câu hỏi của mình ngay). Trả lời xong khách nhận thông báo trên web
              {' '}(và Zalo/email khi đã cấu hình). Câu hỏi lặp lại nhiều nên đưa lên mục Câu hỏi thường gặp.
            </div>
          </div>
        )}
        {reviews.map((r) => (
          <ReviewRow
            key={r.id}
            r={{
              id: r.id, status: r.status, stars: r.stars, content: r.content, verified: r.verified,
              customer: r.customer, userId: r.userId, productSlug: r.productSlug, productName: r.productName,
              image: r.image, icon: r.icon, photos: r.photos, flags: r.flags, reply: r.reply ?? '',
              createdAt: r.createdAt.getTime(), edited: r.updatedAt.getTime() - r.createdAt.getTime() > 60_000,
              moderatedBy: r.moderatedBy, helpful: r.helpful,
            }}
          />
        ))}
        {questions.map((x) => (
          <QuestionRow
            key={x.id}
            q={{
              id: x.id, status: x.status, content: x.content, customer: x.customer, userId: x.userId,
              productSlug: x.productSlug, productName: x.productName, image: x.image, icon: x.icon,
              flags: x.flags, answer: x.answer ?? '', answerBy: x.answerBy, createdAt: x.createdAt.getTime(),
              moderatedBy: x.moderatedBy, helpful: x.helpful,
            }}
          />
        ))}
        {!reviews.length && !questions.length && (
          <p style={{ textAlign: 'center', padding: 32, margin: 0, color: 'var(--ink-muted)' }}>
            {filtered ? 'Không có mục nào khớp tìm kiếm.'
              : tab === 'cho-duyet' ? 'Không có đánh giá nào chờ duyệt.'
              : isQ ? (loc === 'chua-tra-loi' ? 'Đã trả lời hết câu hỏi.' : 'Chưa có câu hỏi.')
              : 'Chưa có đánh giá.'}
          </p>
        )}
      </div>
    </div>
  );
}
