import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqNew, FaqRow } from '@/components/admin/FaqAdmin';
import { QuestionRow, ReviewRow } from '@/components/admin/ReviewModeration';
import { Icon } from '@/components/Icon';
import { FAQ_LIMIT, REVIEW_HOLD_STARS } from '@/lib/reviews';
import { requireStaff } from '@/server/auth';
import { countFaqs, FAQ_FILTERS, listFaqsAdmin, type FaqFilter } from '@/server/faqs';
import { countQuestions, listQuestionsAdmin, QUESTION_FILTERS, type QuestionFilter } from '@/server/questions';
import { countReviewsByStatus, listReviewsAdmin, REVIEW_TABS, reviewKpis, type ReviewTab } from '@/server/reviews';

export const metadata: Metadata = { title: 'Hỏi đáp & đánh giá' };

type Props = { searchParams: Promise<{ tab?: string; loc?: string; sao?: string; anh?: string; q?: string }> };

type Tab = ReviewTab | 'cau-hoi' | 'faq';
const TABS: { key: Tab; label: string }[] = [
  { key: 'cho-duyet', label: 'Chờ duyệt' },
  { key: 'cau-hoi', label: 'Câu hỏi' },
  { key: 'dang-hien', label: 'Đang hiện' },
  { key: 'da-an', label: 'Đã ẩn' },
  { key: 'faq', label: 'Câu hỏi thường gặp' },
];

/**
 * AdminReviews: duyệt đánh giá 1–2★, trả lời câu hỏi (có gợi ý trả lời), duyệt câu trả lời của khách,
 * ẩn nội dung vi phạm, quản lý Câu hỏi thường gặp ở trang sản phẩm (dữ liệu thật).
 */
export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const [counts, qc, k, faqTotal] = await Promise.all([countReviewsByStatus(), countQuestions(), reviewKpis(), countFaqs()]);
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab)
    : counts.pending ? 'cho-duyet' : qc.unanswered || qc.pendingAnswers ? 'cau-hoi' : 'dang-hien';
  const isQ = tab === 'cau-hoi';
  const isFaq = tab === 'faq';
  const loc: QuestionFilter = sp.loc && sp.loc in QUESTION_FILTERS ? (sp.loc as QuestionFilter)
    : !qc.unanswered && qc.pendingAnswers ? 'khach-tra-loi' : 'chua-tra-loi';
  const faqLoc: FaqFilter = sp.loc && sp.loc in FAQ_FILTERS ? (sp.loc as FaqFilter) : 'tat-ca';
  const stars = Number(sp.sao) >= 1 && Number(sp.sao) <= 5 ? Number(sp.sao) : undefined;
  const photo = sp.anh === '1';
  const q = sp.q?.slice(0, 60);
  const filtered = Boolean(q || (!isQ && !isFaq && (stars || photo)));
  const base = `/admin/danh-gia?tab=${tab}${isQ ? `&loc=${loc}` : isFaq ? `&loc=${faqLoc}` : ''}`;

  const reviews = isQ || isFaq ? [] : await listReviewsAdmin({ tab: tab as ReviewTab, stars, photo, q });
  const questions = isQ ? await listQuestionsAdmin({ filter: loc, q }) : [];
  const faqs = isFaq ? await listFaqsAdmin({ filter: faqLoc, q }) : [];
  const badge: Record<Tab, number> = {
    'cho-duyet': counts.pending, 'cau-hoi': qc.unanswered + qc.pendingAnswers, 'dang-hien': counts.published, 'da-an': counts.hidden, faq: 0,
  };
  const qCount: Record<QuestionFilter, number> = {
    'chua-tra-loi': qc.unanswered, 'da-tra-loi': qc.answered, 'khach-tra-loi': qc.pendingAnswers, 'da-an': qc.hidden,
  };

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
          {(isQ || isFaq) && <input type="hidden" name="loc" value={isQ ? loc : faqLoc} />}
          {isQ && (
            <span className="vx-seg">
              {(Object.keys(QUESTION_FILTERS) as QuestionFilter[]).map((f) => (
                <Link key={f} href={`/admin/danh-gia?tab=cau-hoi&loc=${f}`} className="vx-chip" aria-pressed={loc === f}>
                  {QUESTION_FILTERS[f]}{qCount[f] ? ` (${f === 'khach-tra-loi' ? `${qCount[f]} chờ duyệt` : qCount[f]})` : ''}
                </Link>
              ))}
            </span>
          )}
          {isFaq && (
            <span className="vx-seg">
              {(Object.keys(FAQ_FILTERS) as FaqFilter[]).map((f) => (
                <Link key={f} href={`/admin/danh-gia?tab=faq&loc=${f}`} className="vx-chip" aria-pressed={faqLoc === f}>{FAQ_FILTERS[f]}</Link>
              ))}
            </span>
          )}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input
              className="app-bare"
              name="q"
              defaultValue={q}
              placeholder={isQ ? 'Câu hỏi, tên khách, sản phẩm' : isFaq ? 'Câu hỏi, câu trả lời, sản phẩm' : 'Nội dung, tên khách, sản phẩm'}
              aria-label="Tìm"
            />
          </label>
          {!isQ && !isFaq && (
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
          <button className="vx-btn vx-btn--outline vx-btn--sm">{isQ || isFaq ? 'Tìm' : 'Lọc'}</button>
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
              Câu hỏi chỉ hiện công khai sau khi có người trả lời (người hỏi thấy câu hỏi của mình ngay; khách đã mua sản phẩm cũng thấy
              {' '}để trả lời giúp). Trả lời xong khách nhận thông báo trên web (và Zalo/email khi đã cấu hình).
              {' '}<b>Gợi ý trả lời</b> là bản nháp — kiểm tra, sửa rồi mới bấm Trả lời. Câu hỏi lặp lại nhiều nên bấm <b>Đưa lên FAQ</b> sau khi trả lời.
            </div>
          </div>
        )}
        {isQ && loc === 'khach-tra-loi' && (
          <div className="vx-note" style={{ margin: 12 }}>
            <Icon name="chat" />
            <div>
              Khách trả lời nhau hiện ngay; câu có số điện thoại / đường link <b>chờ duyệt</b> (người viết vẫn thấy như đã đăng).
              {' '}Chỉ <b>Ẩn</b> câu quảng cáo, sai thông tin (nhất là liều thuốc) hoặc xúc phạm.
            </div>
          </div>
        )}
        {isFaq && (
          <div className="vx-note" style={{ margin: 12, alignItems: 'center' }}>
            <Icon name="chat" />
            <div style={{ flex: 1 }}>
              Mỗi trang sản phẩm hiện tối đa {FAQ_LIMIT} câu: câu riêng của sản phẩm trước, rồi câu chung theo nhóm (thứ tự theo nút ↑ ↓).
              {' '}Thêm câu riêng bằng nút <b>Đưa lên FAQ</b> ở câu hỏi đã trả lời trong tab Câu hỏi.
            </div>
          </div>
        )}
        {isFaq && <div style={{ padding: '0 12px 12px' }}><FaqNew /></div>}
        {reviews.map((r) => (
          <ReviewRow
            key={r.id}
            r={{
              id: r.id, status: r.status, stars: r.stars, content: r.content, verified: r.verified,
              customer: r.customer, userId: r.userId, productSlug: r.productSlug, productName: r.productName,
              image: r.image, icon: r.icon, photos: r.photos, flags: r.flags, reply: r.reply ?? '',
              createdAt: r.createdAt.getTime(), edited: r.updatedAt.getTime() - r.createdAt.getTime() > 60_000,
              moderatedBy: r.moderatedBy, helpful: r.helpful, suggestion: r.suggestion,
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
              moderatedBy: x.moderatedBy, helpful: x.helpful, answers: x.answers, faqId: x.faqId, repeats: x.repeats,
              suggestion: x.suggestion,
            }}
          />
        ))}
        {faqs.map((f, i) => {
          // Đầu / cuối nhóm (cùng sản phẩm hoặc cùng loại câu chung) → khóa nút ↑ / ↓
          const group = (x: typeof f) => `${x.productSlug ?? ''}|${x.ship ?? ''}`;
          return (
            <FaqRow
              key={f.id}
              f={{
                id: f.id, scope: f.scope, question: f.question, answer: f.answer, active: f.active, productSlug: f.productSlug,
                productName: f.productName, image: f.image, icon: f.icon, fromCustomer: f.fromCustomer, questionId: f.questionId,
                first: !faqs[i - 1] || group(faqs[i - 1]) !== group(f), last: !faqs[i + 1] || group(faqs[i + 1]) !== group(f),
              }}
            />
          );
        })}
        {!reviews.length && !questions.length && !faqs.length && (
          <p style={{ textAlign: 'center', padding: 32, margin: 0, color: 'var(--ink-muted)' }}>
            {filtered ? 'Không có mục nào khớp tìm kiếm.'
              : tab === 'cho-duyet' ? 'Không có đánh giá nào chờ duyệt.'
              : isFaq ? (faqTotal ? 'Không có câu nào trong mục này.' : 'Chưa có câu hỏi thường gặp.')
              : isQ ? (loc === 'chua-tra-loi' ? 'Đã trả lời hết câu hỏi.' : loc === 'khach-tra-loi' ? 'Chưa có khách nào trả lời câu hỏi.' : 'Chưa có câu hỏi.')
              : 'Chưa có đánh giá.'}
          </p>
        )}
      </div>
    </div>
  );
}
