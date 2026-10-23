import { parseYoutubeId } from '@/lib/catalog';
import { isExternalImage, plainText, safeHref, type PostBlock } from '@/lib/posts';

// ---- Dán nội dung chép từ web khác / Word / Google Docs → khối bài viết ----------------------
// Giữ cấu trúc (tiêu đề, đoạn, danh sách, bảng, ảnh link https, video YouTube) và chữ đậm + link;
// màu, phông, cỡ chữ của nơi chép bỏ đi để bài theo đúng giao diện web.

type Seg = { v: string; b: boolean; href: string | null };

const BLOCK_TAGS = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER', 'ASIDE', 'BLOCKQUOTE', 'FIGURE',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'PRE', 'HR', 'IMG', 'IFRAME', 'LI', 'DL', 'DT', 'DD', 'CENTER']);
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SVG', 'NAV', 'FORM', 'META', 'LINK', 'TITLE']);

const isBold = (el: HTMLElement, parent: boolean) => {
  const w = el.style.fontWeight;
  if (w) return w === 'bold' || w === 'bolder' || +w >= 600;
  // Google Docs bọc cả đoạn trong <b style="font-weight:normal">, nên chỉ tin thẻ khi không ghi kiểu chữ.
  return el.tagName === 'B' || el.tagName === 'STRONG' || parent;
};

function segments(node: Node, bold: boolean, href: string | null, out: Seg[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const v = (node.nodeValue ?? '').replace(/[\s ]+/g, ' ');
    if (v) out.push({ v, b: bold, href });
    return;
  }
  if (!(node instanceof HTMLElement) || SKIP_TAGS.has(node.tagName)) return;
  if (node.tagName === 'BR') { out.push({ v: '\n', b: false, href: null }); return; }
  const b = isBold(node, bold);
  const h = node.tagName === 'A' ? safeHref(node.getAttribute('href') ?? '') ?? href : href;
  node.childNodes.forEach((c) => segments(c, b, h, out));
}

/** Đoạn chữ → "**đậm**" và "[chữ](link)" như ô soạn. */
function inlineText(nodes: Node[]): string {
  const segs: Seg[] = [];
  nodes.forEach((n) => segments(n, false, null, segs));
  const merged: Seg[] = [];
  for (const s of segs) {
    const last = merged[merged.length - 1];
    if (last && last.b === s.b && last.href === s.href) last.v += s.v;
    else merged.push({ ...s, v: s.v.replace(/[*[\]]/g, (c) => (c === '*' ? '∗' : c)) });
  }
  const out = merged.map(({ v, b, href }) => {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(v)!;
    let core = m[2];
    if (!core) return v;
    if (b) core = `**${core}**`;
    if (href) core = `[${core.replace(/\n/g, ' ')}](${href})`;
    return m[1] + core + m[3];
  }).join('');
  return out.replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const flat = (s: string) => plainText(s).replace(/\s+/g, ' ').trim();

export function htmlToBlocks(html: string): PostBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: PostBlock[] = [];
  const push = (b: PostBlock) => out.length < 300 && out.push(b);
  const para = (nodes: Node[]) => {
    const text = inlineText(nodes);
    if (!text) return;
    // Thiếu thẻ <p> (Word, vài web): xuống 2 dòng là sang đoạn mới.
    for (const t of text.split(/\n\n+/)) if (t.trim()) push({ type: 'p', text: t.trim().slice(0, 5000) });
  };
  const image = (img: HTMLImageElement, caption = '') => {
    const src = img.getAttribute('src') ?? '';
    if (isExternalImage(src)) push({ type: 'image', file: src, caption: (caption || img.alt || '').trim().slice(0, 200) });
  };
  const list = (el: HTMLElement) => {
    const items: string[] = [];
    el.querySelectorAll('li').forEach((li) => {
      const own = [...li.childNodes].filter((c) => !(c instanceof HTMLElement && (c.tagName === 'UL' || c.tagName === 'OL')));
      const t = inlineText(own).replace(/\n+/g, ' ');
      if (t) items.push(t.slice(0, 500));
    });
    for (let i = 0; i < items.length; i += 30) push({ type: 'list', items: items.slice(i, i + 30), ordered: el.tagName === 'OL' });
  };
  const table = (el: HTMLTableElement) => {
    const rows = [...el.rows].map((r) => [...r.cells].slice(0, 8).map((c) => flat(inlineText([c])).slice(0, 300)))
      .filter((r) => r.some(Boolean)).slice(0, 30);
    if (rows.length) push({ type: 'table', rows });
  };

  const walk = (parent: Node) => {
    let run: Node[] = [];
    const flush = () => { if (run.length) para(run); run = []; };
    parent.childNodes.forEach((n) => {
      if (!(n instanceof HTMLElement)) { run.push(n); return; }
      const tag = n.tagName;
      if (SKIP_TAGS.has(tag)) return;
      if (!BLOCK_TAGS.has(tag)) {
        // Thẻ chữ (span, b, a…) có thể chứa ảnh hoặc khối bên trong.
        if (n.querySelector('img, p, div, ul, ol, table, h1, h2, h3, h4, h5, h6')) { flush(); walk(n); } else run.push(n);
        return;
      }
      flush();
      if (/^H[1-6]$/.test(tag)) {
        const text = flat(inlineText([n])).slice(0, 150);
        if (text) push({ type: tag <= 'H2' ? 'h2' : 'h3', text });
        n.querySelectorAll('img').forEach((img) => image(img));
      } else if (tag === 'UL' || tag === 'OL') list(n);
      else if (tag === 'TABLE') table(n as HTMLTableElement);
      else if (tag === 'IMG') image(n as HTMLImageElement);
      else if (tag === 'IFRAME') {
        const id = parseYoutubeId(n.getAttribute('src') ?? '');
        if (id) push({ type: 'video', youtubeId: id, caption: '' });
      } else if (tag === 'FIGURE') {
        const cap = flat(inlineText([...n.querySelectorAll('figcaption')]));
        const imgs = n.querySelectorAll('img');
        if (imgs.length) imgs.forEach((img) => image(img, cap));
        else walk(n);
      } else if (tag === 'HR') { /* bỏ */ }
      else walk(n);
    });
    flush();
  };
  walk(doc.body);
  return out;
}
