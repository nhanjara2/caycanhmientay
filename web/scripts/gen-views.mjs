// Sinh view React (src/views/*.tsx) từ design-system/components/<Tên>/preview.html.
//
//   npm run gen-views            # sinh lại toàn bộ theo scripts/views.config.mjs
//
// Mỗi view là markup tĩnh đúng như preview; phần chung (Header, AccountSidebar, khung admin…)
// được thay bằng component React qua `replace`, link được nối qua `links` / `linkByClass`.
// Không sửa tay file trong src/views — sửa preview.html hoặc views.config.mjs rồi chạy lại.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import prettier from 'prettier';
import { GLOBAL_BUTTON_LINKS, GLOBAL_LINKS, views } from './views.config.mjs';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const comps = join(web, '..', 'design-system/components');
const out = join(web, 'src/views');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const BOOL = new Set(['disabled', 'checked', 'open', 'hidden', 'required', 'multiple', 'readonly', 'selected', 'autofocus']);
const RENAME = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete', inputmode: 'inputMode',
  datetime: 'dateTime', contenteditable: 'contentEditable', spellcheck: 'spellCheck', enterkeyhint: 'enterKeyHint',
  'xlink:href': 'xlinkHref', srcset: 'srcSet', crossorigin: 'crossOrigin', frameborder: 'frameBorder',
};
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// ---- chọn phần tử: ".a", "tag", "tag.a.b" -------------------------------------------------
const classes = (n) => (n.attrs?.find((a) => a.name === 'class')?.value ?? '').split(/\s+/).filter(Boolean);
function matches(n, sel) {
  if (!n.tagName) return false;
  const [tag, ...cls] = sel.split('.');
  if (tag && n.tagName !== tag) return false;
  const have = classes(n);
  return cls.every((c) => have.includes(c));
}
function find(n, sel) {
  if (matches(n, sel)) return n;
  for (const c of n.childNodes ?? []) {
    const r = find(c, sel);
    if (r) return r;
  }
  return null;
}
const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(text).join('')).replace(/\s+/g, ' ').trim();

// ---- style="a:b;c:d" -> {{ a: 'b', c: 'd' }} -----------------------------------------------
function styleObj(css) {
  const parts = [];
  let depth = 0, cur = '';
  for (const ch of css) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  const entries = parts.map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(':');
    const k = p.slice(0, i).trim();
    let v = p.slice(i + 1).trim();
    // Cỡ chữ / dòng cao ghi px trong preview → rem (co giãn theo cỡ chữ trình duyệt; 16px = 1rem nên không đổi khi khách để mặc định)
    if (/^(font-size|line-height)$/.test(k) && /^\d*\.?\d+px$/.test(v)) v = `${+(parseFloat(v) / 16).toFixed(4)}rem`;
    const key = k.startsWith('--') ? JSON.stringify(k) : camel(k.replace(/^-(webkit|moz|ms)-/, (_, v) => `${v[0].toUpperCase()}${v.slice(1)}-`));
    return `${key}: ${JSON.stringify(v)}`;
  });
  return `{{ ${entries.join(', ')} }}`;
}

function attrsOf(n, spreads) {
  const out = [];
  const extraClass = [];
  for (const { name, value } of n.attrs ?? []) {
    if (name === 'style') {
      // grid-template-columns inline -> biến --cols + class app-cols để responsive.css ghi đè được trên mobile
      const cols = value.match(/grid-template-columns\s*:\s*([^;]+)/);
      const rest = cols ? value.replace(cols[0], `--cols:${cols[1].trim()}`) : value;
      if (cols) extraClass.push('app-cols');
      if (rest.trim()) out.push(`style=${styleObj(rest)}`);
      continue;
    }
    if (name === 'open' && n.tagName !== 'details' && n.tagName !== 'dialog') { spreads.push('open: true'); continue; }
    if (name === 'selected') continue;
    let key = RENAME[name] ?? (name.startsWith('aria-') || name.startsWith('data-') ? name : name.includes('-') ? camel(name) : name);
    if (name === 'value' && ['input', 'textarea', 'select'].includes(n.tagName)) key = 'defaultValue';
    if (name === 'checked') key = 'defaultChecked';
    if (BOOL.has(name) && value === '') out.push(`${key}`);
    else out.push(`${key}=${JSON.stringify(value)}`);
  }
  if (extraClass.length) {
    const i = out.findIndex((a) => a.startsWith('className='));
    if (i >= 0) out[i] = `className=${JSON.stringify(`${JSON.parse(out[i].slice(10))} ${extraClass.join(' ')}`)}`;
    else out.push(`className=${JSON.stringify(extraClass.join(' '))}`);
  }
  return out;
}

function emitText(v) {
  const t = v.replace(/\s+/g, ' ');
  if (!t.trim()) return t.length ? "{' '}" : '';
  return /[{}<>&"'`]|^ | $/.test(t) ? `{${JSON.stringify(t)}}` : t;
}

function makeEmitter(cfg, used) {
  const links = { ...GLOBAL_LINKS, ...(cfg.links ?? {}) };
  const byClass = cfg.linkByClass ?? {};
  const inside = Object.entries(cfg.linkInside ?? {});
  const buttons = { ...GLOBAL_BUTTON_LINKS, ...(cfg.buttonLinks ?? {}) };
  const stack = [];
  const replaceEntries = Object.entries(cfg.replace ?? {});
  const removes = cfg.remove ?? [];

  const emit = (n) => {
    stack.push(n);
    try { return emitNode(n); } finally { stack.pop(); }
  };
  const emitNode = (n) => {
    if (n.nodeName === '#text') return emitText(n.value);
    if (n.nodeName === '#comment' || !n.tagName) return '';
    if (['script', 'style'].includes(n.tagName)) return '';
    if (removes.some((s) => matches(n, s))) return '';
    for (const [sel, rep] of replaceEntries) {
      if (matches(n, sel)) {
        const jsx = typeof rep === 'function' ? rep(n, { text, classes }) : rep;
        for (const m of jsx.matchAll(/<([A-Z]\w*)/g)) used.add(m[1]);
        return jsx;
      }
    }

    let tag = n.tagName;
    const spreads = [];
    const attrs = attrsOf(n, spreads);
    const kids = n.tagName === 'template' ? n.content.childNodes : n.childNodes ?? [];

    if (tag === 'a' && !n.attrs.some((a) => a.name === 'href')) {
      const cls = classes(n);
      const href =
        links[text(n)] ??
        cls.map((c) => byClass[c]).find(Boolean) ??
        inside.find(([sel]) => stack.slice(0, -1).some((a) => matches(a, sel)))?.[1];
      if (href) { tag = 'Link'; attrs.unshift(`href=${JSON.stringify(href)}`); used.add('Link'); }
    }
    const inLink = stack.slice(0, -1).some((a) => a.tagName === 'a');
    if (tag === 'button' && buttons[text(n)] && !inLink) {
      tag = 'Link';
      attrs.unshift(`href=${JSON.stringify(buttons[text(n)])}`);
      used.add('Link');
    }
    if (tag === 'textarea' && kids.length) {
      attrs.push(`defaultValue=${JSON.stringify(text(n))}`);
      return `<textarea ${attrs.join(' ')} />`;
    }
    if (spreads.length) attrs.push(`{...{ ${spreads.join(', ')} }}`);
    const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    if (VOID.has(tag)) return `${open} />`;
    const inner = kids.map(emit).join('');
    return inner ? `${open}>${inner}</${tag}>` : `${open} />`;
  };
  return emit;
}

async function build(cfg) {
  const html = readFileSync(join(comps, cfg.from, 'preview.html'), 'utf8');
  const doc = parse(html);
  const htmlEl = doc.childNodes.find((c) => c.tagName === 'html');
  const body = htmlEl.childNodes.find((c) => c.tagName === 'body');
  let roots = body.childNodes;
  if (cfg.root) {
    const r = find(body, cfg.root);
    if (!r) throw new Error(`${cfg.name}: không thấy root ${cfg.root}`);
    roots = cfg.rootInner ? r.childNodes : [r];
  }
  const used = new Set();
  const emit = makeEmitter({ ...cfg, remove: ['.vx-header', 'footer.vx-footer', ...(cfg.remove ?? [])] }, used);
  const jsx = roots.map(emit).join('').trim();

  const imports = [];
  if (used.has('Link')) imports.push(`import Link from 'next/link';`);
  for (const [mod, names] of Object.entries(cfg.imports ?? {})) {
    const need = names.filter((x) => used.has(x));
    if (need.length) imports.push(`import { ${need.join(', ')} } from '${mod}';`);
  }
  const src = `// Sinh tự động từ design-system/components/${cfg.from}/preview.html — không sửa tay.
// Chạy \`npm run gen-views\` sau khi đổi preview.html hoặc scripts/views.config.mjs.
${imports.join('\n')}

export function ${cfg.name}() {
  return <>${jsx}</>;
}
`;
  const pretty = await prettier.format(src, { parser: 'typescript', singleQuote: true, printWidth: 120 });
  writeFileSync(join(out, `${cfg.name}.tsx`), pretty);
}

mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);
for (const cfg of views) {
  if (only.length && !only.includes(cfg.name)) continue;
  await build(cfg);
}
console.log(`Đã sinh ${only.length || views.length} view -> src/views`);
