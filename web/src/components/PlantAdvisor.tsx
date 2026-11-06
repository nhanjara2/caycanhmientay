'use client';

import { Breadcrumb } from './Blocks';
import Link from '@/components/LocaleLink';
import { useRouter } from '@/components/LocaleLink';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart, type CartLine } from '@/lib/cart';
import { ZALO_URL } from '@/lib/contact';
import { money } from '@/lib/format';
import {
  COMMON, KINDS, PLAN_STORE_KEY, SPACE_KINDS, TIERS, buildPlan, cleanAnswers, defaults, fmtHeight, lightName, quotePrefill, summarize, toSavedPlan,
  visibleQuestions, type AdvisorPlant, type Answers, type Question, type SpaceKind, type ZoneResult,
} from '@/lib/plant-advisor';
import { WHOLESALE_QUOTE_URL } from '@/lib/partners';
import { Icon, Thumb } from './Icon';

const STATE_KEY = 'ccmt-advisor-v1';
const STEPS = ['Không gian', 'Kích thước, vị trí', 'Thói quen, ngân sách', 'Phương án'];
/** Giỏ hàng nhận tối đa 99 mỗi dòng; nhiều hơn thì nên để kỹ sư báo giá sỉ. */
const CART_MAX = 99;

type State = { kind: SpaceKind | null; step: number; answers: Answers; choice: Record<string, number> };

const allQuestions = (kind: SpaceKind) => [...KINDS[kind].questions, ...COMMON];
const fresh = (kind: SpaceKind | null): State => ({ kind, step: kind ? 1 : 0, answers: kind ? defaults(allQuestions(kind)) : {}, choice: {} });

/** Trang Tư vấn chọn cây: 4 bước chọn không gian → câu hỏi → thói quen → phương án (cây, số lượng, chiều cao từng vị trí). */
export function PlantAdvisor({ plants, initialKind }: { plants: AdvisorPlant[]; initialKind: SpaceKind | null }) {
  const [s, setS] = useState<State>(() => fresh(initialKind));
  const [loaded, setLoaded] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const router = useRouter();

  // Giữ câu trả lời khi tải lại trang / bấm xem sản phẩm rồi quay lại (chỉ trong tab này)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as State;
        if (saved.kind && SPACE_KINDS.includes(saved.kind) && (!initialKind || initialKind === saved.kind)) {
          setS({
            kind: saved.kind, step: Math.min(3, Math.max(1, Number(saved.step) || 1)),
            answers: cleanAnswers(allQuestions(saved.kind), saved.answers ?? {}), choice: saved.choice ?? {},
          });
        }
      }
    } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
    setLoaded(true);
  }, [initialKind]);
  useEffect(() => {
    if (!loaded) return;
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch { /* bỏ qua */ }
  }, [s, loaded]);

  const go = (step: number) => {
    setS((x) => ({ ...x, step }));
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const setAnswer = (id: string, v: Answers[string]) => setS((x) => ({ ...x, answers: { ...x.answers, [id]: v }, choice: {} }));
  const pickKind = (kind: SpaceKind) => {
    setS(s.kind === kind ? { ...s, step: 1 } : fresh(kind));
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const zones = useMemo(() => (s.kind && s.step === 3 ? buildPlan(s.kind, s.answers, plants) : []), [s.kind, s.step, s.answers, plants]);

  const kindQs = s.kind ? visibleQuestions(KINDS[s.kind].questions, s.answers) : [];
  const commonQs = visibleQuestions(COMMON, s.answers);
  const missing = (qs: Question[]) => qs.find((q) => q.type === 'multi' && !(s.answers[q.id] as string[] | undefined)?.length);

  return (
    <div className="pa" ref={top}>
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tư vấn chọn cây' }]} />
      <header className="pa-head">
        <h1>Tư vấn chọn cây</h1>
        <p>Trả lời vài câu hỏi về chỗ đặt cây, web gợi ý <b>loại cây, số lượng và chiều cao</b> cho từng vị trí. Miễn phí, không cần đăng nhập.</p>
      </header>

      <ol className="pa-steps" aria-label="Các bước">
        {STEPS.map((t, i) => (
          <li key={t} aria-current={s.step === i ? 'step' : undefined} data-done={s.step > i || undefined}>
            <b>{i + 1}</b><span>{t}</span>
          </li>
        ))}
      </ol>

      {s.step === 0 || !s.kind ? (
        <section className="pa-card">
          <h2>Bạn cần cây cho không gian nào?</h2>
          <div className="pa-kinds">
            {SPACE_KINDS.map((k) => (
              <button key={k} type="button" className="pa-kind" aria-pressed={s.kind === k} onClick={() => pickKind(k)}>
                <span className="pa-kind__ic"><Icon name={KINDS[k].icon} /></span>
                <b>{KINDS[k].name}</b>
                <small>{KINDS[k].hint}</small>
              </button>
            ))}
          </div>
        </section>
      ) : s.step === 1 || s.step === 2 ? (
        <section className="pa-card">
          <h2>{s.step === 1 ? KINDS[s.kind].name : 'Thói quen và ngân sách'}</h2>
          <div className="pa-qs">
            {(s.step === 1 ? kindQs : commonQs).map((q) => <QuestionField key={q.id} q={q} value={s.answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />)}
          </div>
          <StepNav
            back={() => go(s.step - 1)}
            next={() => go(s.step + 1)}
            nextLabel={s.step === 2 ? 'Xem phương án' : 'Tiếp tục'}
            blocked={missing(s.step === 1 ? kindQs : commonQs)?.label}
          />
        </section>
      ) : (
        <Result
          kind={s.kind} answers={s.answers} zones={zones} choice={s.choice}
          setChoice={(id, i) => setS((x) => ({ ...x, choice: { ...x.choice, [id]: i } }))}
          setTier={(t) => setAnswer('tier', t)}
          edit={() => go(1)}
          restart={() => { setS(fresh(null)); go(0); }}
          addToCart={(lines) => { cart.merge(lines); cart.notify(`Đã thêm ${lines.length} loại cây vào giỏ hàng`); }}
          sendPlan={() => {
            const kind = s.kind!;
            try {
              sessionStorage.setItem(PLAN_STORE_KEY, JSON.stringify({ plan: toSavedPlan(kind, s.answers, zones, s.choice), prefill: quotePrefill(kind, s.answers) }));
            } catch { /* không lưu được thì vẫn sang form, khách tự điền */ }
            router.push(`${WHOLESALE_QUOTE_URL}?phuong-an=1`);
          }}
        />
      )}
    </div>
  );
}

function StepNav({ back, next, nextLabel, blocked }: { back: () => void; next: () => void; nextLabel: string; blocked?: string }) {
  const [tried, setTried] = useState(false);
  return (
    <div className="pa-nav">
      {tried && blocked && <span className="vx-err" role="alert">Chọn ít nhất một mục ở “{blocked}”</span>}
      <button type="button" className="vx-btn vx-btn--outline vx-btn--lg" onClick={back}>Quay lại</button>
      <button type="button" className="vx-btn vx-btn--primary vx-btn--lg" onClick={() => { setTried(true); if (!blocked) next(); }}>
        {nextLabel}
        <Icon name="chevron" size={16} />
      </button>
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: Answers[string]) => void }) {
  if (q.type === 'number') return <NumberField q={q} value={Number(value)} onChange={onChange} />;
  const multi = q.type === 'multi';
  const list = multi ? ((value as string[]) ?? []) : [];
  return (
    <fieldset className="pa-q">
      <legend>{q.label}{q.hint && <small> ({q.hint})</small>}</legend>
      <div className="pa-opts" role={multi ? 'group' : 'radiogroup'} aria-label={q.label}>
        {q.options.map((o) => {
          const on = multi ? list.includes(o.key) : value === o.key;
          return (
            <button
              key={o.key} type="button" className="pa-opt"
              role={multi ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(multi ? (on ? list.filter((x) => x !== o.key) : [...list, o.key]) : o.key)}
            >
              <span className="pa-opt__mark" aria-hidden="true">{on && <Icon name="check" size={14} />}</span>
              <span>{o.name}{o.hint && <small>{o.hint}</small>}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function NumberField({ q, value, onChange }: { q: Extract<Question, { type: 'number' }>; value: number; onChange: (v: number) => void }) {
  const step = q.step ?? 1;
  const [text, setText] = useState(String(value).replace('.', ','));
  const clamp = (n: number) => Math.min(q.max, Math.max(q.min, Math.round(n / step) * step));
  const commit = (n: number) => { const v = Number(clamp(n).toFixed(2)); onChange(v); setText(String(v).replace('.', ',')); };
  useEffect(() => { setText(String(value).replace('.', ',')); }, [value]);
  const id = `pa-${q.id}`;
  return (
    <div className="pa-q">
      <label htmlFor={id}>{q.label}{q.hint && <small> ({q.hint})</small>}</label>
      <div className="pa-num">
        <button type="button" aria-label={`Bớt ${step} ${q.unit}`} onClick={() => commit(value - step)} disabled={value <= q.min}>−</button>
        <input
          id={id} className="vx-input" inputMode={step < 1 ? 'decimal' : 'numeric'} value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d.,]/g, '').slice(0, 8);
            setText(t);
            const n = Number(t.replace(',', '.'));
            if (t && Number.isFinite(n) && n >= q.min && n <= q.max) onChange(n);
          }}
          onBlur={() => { const n = Number(text.replace(',', '.')); commit(Number.isFinite(n) && text ? n : q.def); }}
        />
        <span className="pa-num__u">{q.unit}</span>
        <button type="button" aria-label={`Thêm ${step} ${q.unit}`} onClick={() => commit(value + step)} disabled={value >= q.max}>+</button>
      </div>
    </div>
  );
}

function Result({ kind, answers, zones, choice, setChoice, setTier, edit, restart, addToCart, sendPlan }: {
  kind: SpaceKind; answers: Answers; zones: ZoneResult[]; choice: Record<string, number>;
  setChoice: (slot: string, i: number) => void; setTier: (t: string) => void; edit: () => void; restart: () => void;
  addToCart: (lines: CartLine[]) => void; sendPlan: () => void;
}) {
  const k = KINDS[kind];
  const [added, setAdded] = useState(false);
  const slots = zones.flatMap((z) => z.slots);
  const chosen = slots.map((sl) => ({ sl, pk: sl.picks[choice[sl.id] ?? 0] }));
  const total = chosen.reduce((t, { sl, pk }) => t + (pk ? pk.price * sl.qty : 0), 0);
  const missing = chosen.filter(({ pk }) => !pk).length;
  const capped = chosen.some(({ sl, pk }) => pk && sl.qty > CART_MAX);

  const cartLines = (): CartLine[] => {
    const map = new Map<string, CartLine>();
    for (const { sl, pk } of chosen) {
      if (!pk) continue;
      const o = pk.plant.options[pk.option];
      const key = `${pk.plant.slug}|${o.idx}`;
      const cur = map.get(key);
      const qty = Math.min(CART_MAX, (cur?.qty ?? 0) + sl.qty);
      map.set(key, { slug: pk.plant.slug, option: o.idx, qty, snap: o.snap });
    }
    return [...map.values()];
  };

  const summary = summarize(kind, answers).slice(1);
  const cartBtn = (primary: boolean) => (
    <button
      type="button" className={`vx-btn vx-btn--lg ${primary ? 'vx-btn--primary' : 'vx-btn--outline'}`} disabled={!total}
      onClick={() => { addToCart(cartLines()); setAdded(true); }}
    >
      <Icon name="cart" size={18} />
      {primary ? 'Thêm cả bộ vào giỏ' : 'Thêm cây có sẵn vào giỏ'}
    </button>
  );
  const planBtn = (primary: boolean) => (
    <button type="button" className={`vx-btn vx-btn--lg ${primary ? 'vx-btn--primary' : 'vx-btn--outline'}`} onClick={sendPlan}>
      <Icon name="receipt" size={18} />
      {primary ? 'Gửi phương án, nhận báo giá sỉ' : 'Gửi phương án xin báo giá sỉ'}
    </button>
  );

  return (
    <>
      <section className="pa-card pa-sum">
        <div className="pa-sum__h">
          <h2>Phương án cho {k.name.toLowerCase()}</h2>
          <button type="button" className="vx-btn vx-btn--outline" onClick={edit}>Sửa câu trả lời</button>
        </div>
        <ul className="pa-sum__list">{summary.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="pa-q">
          <span className="pa-lbl">Ngân sách</span>
          <div className="pa-opts pa-opts--row" role="radiogroup" aria-label="Ngân sách">
            {TIERS.map((t) => (
              <button key={t.key} type="button" className="pa-opt" role="radio" aria-checked={answers.tier === t.key} onClick={() => setTier(t.key)}>
                <span className="pa-opt__mark" aria-hidden="true">{answers.tier === t.key && <Icon name="check" size={14} />}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {!zones.length && (
        <section className="pa-card">
          <p className="pa-empty">Chưa có hạng mục nào cần cây. Bấm <b>Sửa câu trả lời</b> và nhập ít nhất một khu vực / chiều dài / diện tích.</p>
        </section>
      )}

      {zones.map((z) => (
        <section key={z.key} className="pa-card pa-zone">
          <h2>{z.title}</h2>
          {z.note && <p className="pa-note"><Icon name="alert" size={18} />{z.note}</p>}
          {z.slots.map((sl) => {
            const idx = Math.min(choice[sl.id] ?? 0, Math.max(0, sl.picks.length - 1));
            const pk = sl.picks[idx];
            return (
              <article key={sl.id} className="pa-slot">
                <div className="pa-slot__h">
                  <h3>{sl.title}</h3>
                  <span className="pa-tags">
                    <span className="pa-tag pa-tag--qty">{sl.qty.toLocaleString('vi-VN')} {sl.unit}</span>
                    {sl.h && <span className="pa-tag">Cao {fmtHeight(sl.h)}</span>}
                    {sl.light && <span className="pa-tag">{lightName(sl.light)}</span>}
                  </span>
                </div>
                <p className="pa-why">{sl.why}</p>
                {pk ? (
                  <div className="pa-pick">
                    <Link href={`/san-pham/${pk.plant.slug}`} className="pa-pick__img"><Thumb src={pk.plant.image} icon={pk.plant.icon} alt={pk.plant.name} /></Link>
                    <div className="pa-pick__b">
                      <Link href={`/san-pham/${pk.plant.slug}`} className="pa-pick__name">{pk.plant.name}</Link>
                      <span className="pa-pick__opt">
                        {pk.plant.options[pk.option].label}{pk.h ? ` · cao ${fmtHeight(pk.h)}` : ''}
                      </span>
                      <span className="pa-pick__price">
                        {money(pk.price)} × {sl.qty.toLocaleString('vi-VN')} = <b>{money(pk.price * sl.qty)}</b>
                      </span>
                      {pk.notes.length > 0 && <ul className="pa-pick__notes">{pk.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
                    </div>
                  </div>
                ) : (
                  <p className="pa-none">
                    Chưa có cây phù hợp đang bán trên web. Kỹ sư sẽ chọn cây và báo giá cho vị trí này khi bạn gửi phương án,
                    hoặc <a href={ZALO_URL} target="_blank" rel="noreferrer">nhắn Zalo</a> để hỏi ngay.
                  </p>
                )}
                {sl.picks.length > 1 && (
                  <div className="pa-alts">
                    <span className="pa-lbl">Cây khác hợp chỗ này:</span>
                    {sl.picks.map((p, i) => (
                      <button key={p.plant.slug} type="button" className="vx-chip" aria-pressed={i === idx} onClick={() => setChoice(sl.id, i)}>
                        {p.plant.name} · {money(p.price)}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}

      {zones.length > 0 && (
        <section className="pa-card pa-total">
          <div className="pa-total__row">
            <span>Tạm tính các cây có sẵn</span>
            <b>{money(total)}</b>
          </div>
          <ul className="pa-total__notes">
            {missing > 0 && <li>{missing} vị trí chưa có cây trên web — kỹ sư báo giá riêng.</li>}
            <li>Giá lẻ, chưa gồm phí giao{k.retail ? '' : ', đất, chậu, vật tư'}; mua 2 cây cùng loại có giá combo, số lượng lớn gửi phương án để nhận giá sỉ. Giá có thể đổi theo mùa và cỡ cây thực tế.</li>
            {capped && <li>Giỏ hàng nhận tối đa {CART_MAX} cây mỗi loại; số lượng lớn hơn nên gửi phương án để kỹ sư báo giá sỉ.</li>}
          </ul>
          <div className="pa-acts">
            {k.retail ? <>{cartBtn(true)}{planBtn(false)}</> : <>{planBtn(true)}{cartBtn(false)}</>}
          </div>
          {added && <p className="pa-added" role="status">Đã thêm vào giỏ. <Link href="/gio-hang">Xem giỏ hàng →</Link></p>}
          <div className="pa-more">
            <a href={ZALO_URL} target="_blank" rel="noreferrer"><Icon name="chat" size={16} />Chat Zalo với kỹ sư</a>
            <button type="button" onClick={restart}>Làm lại từ đầu</button>
          </div>
        </section>
      )}
    </>
  );
}
