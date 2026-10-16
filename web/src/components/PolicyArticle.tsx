import Link from 'next/link';
import { Breadcrumb } from './Blocks';
import type { ReactNode } from 'react';
import type { Block, Section } from '@/lib/policy-content';
import { PolicyNav } from './PolicyNav';
import { ShareButton } from './PostClient';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
/** Từ 6 mục trở lên thì có khung "Trong trang này" để nhảy nhanh. */
const TOC_MIN = 6;
const WORDS_PER_MIN = 200;

// `**đậm**`, `[chữ](đường-dẫn)`, địa chỉ https:// trần.
const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s]+)/g;

function anchor(href: string, label: ReactNode, key: number) {
  if (href.startsWith('/')) return <Link key={key} href={href}>{label}</Link>;
  if (href.startsWith('tel:') || href.startsWith('mailto:')) return <a key={key} href={href}>{label}</a>;
  return <a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
}

/** Chữ trong đoạn → phần tử React (không dùng dangerouslySetInnerHTML). */
function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1] !== undefined) out.push(<b key={key++}>{m[1]}</b>);
    else if (m[2] !== undefined) out.push(anchor(m[3], m[2], key++));
    else out.push(anchor(m[4], m[4], key++));
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

const plain = (t: string) => t.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

function blockText(b: Block): string {
  if (typeof b === 'string') return plain(b);
  if ('ul' in b) return b.ul.map(plain).join(' ');
  if ('ol' in b) return b.ol.map(plain).join(' ');
  if ('table' in b) return [...b.table.head, ...b.table.rows.flat()].map(plain).join(' ');
  return plain(b.note);
}

export const readMinutes = (sections: Section[]) => {
  const words = sections.flatMap((s) => [s.h, ...s.blocks.map(blockText)]).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MIN));
};

function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string') return <p><Inline text={b} /></p>;
  if ('ul' in b) return <ul>{b.ul.map((t) => <li key={t}><Inline text={t} /></li>)}</ul>;
  if ('ol' in b) return <ol>{b.ol.map((t) => <li key={t}><Inline text={t} /></li>)}</ol>;
  if ('table' in b) {
    return (
      <div className="vx-table-wrap">
        <table className="vx-table">
          <thead><tr>{b.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {b.table.rows.map((r) => (
              <tr key={r[0]}>{r.map((c, i) => <td key={i}><Inline text={c} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="vx-callout">
      <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8v.5" />
      </svg>
      <div><Inline text={b.note} /></div>
    </div>
  );
}

/** Khung chung các trang chính sách / hướng dẫn: breadcrumb, menu bài trong danh mục, tiêu đề, nội dung theo mục. */
export function PolicyArticle({ title, updated, sections }: { title: string; updated: string; sections: Section[] }) {
  return (
    <>
      <div style={{ padding: '12px 24px 0', background: 'var(--surface)' }}>
        <Breadcrumb items={[{ label: title }]} />
      </div>
      <div className="vx-policypage">
        <PolicyNav />
        <article className="vx-policy">
          <h1>{title}</h1>
          <div className="vx-policy__meta">
            <span>Cập nhật lần cuối: {updated}</span>
            <span>·</span>
            <span>{readMinutes(sections)} phút đọc</span>
            <span className="acts"><ShareButton title={title} /></span>
          </div>
          {sections.length >= TOC_MIN && (
            <nav className="pol-toc" aria-label="Trong trang này">
              <b>Trong trang này</b>
              <ol>
                {sections.map((s, i) => (
                  <li key={s.h}><a href={`#${s.id ?? `muc-${i + 1}`}`}>{ROMAN[i]}. {s.h}</a></li>
                ))}
              </ol>
            </nav>
          )}
          {sections.map((s, i) => (
            <section key={s.h} style={{ display: 'contents' }}>
              <h2 id={s.id ?? `muc-${i + 1}`}>{ROMAN[i]}. {s.h}</h2>
              {s.blocks.map((b, j) => <BlockView key={j} b={b} />)}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
