// tokens.json -> tokens.css
// Quy tac bien dich theo dinh dang design-system cua artifact:
//   :root, [data-theme="<theme dau>"] { --<color>; --<shadow> }
//   :root { --<space>; --<radius>; --<khac>; --font-<key> }
//   .<style> { ... } cho moi type style
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const t = JSON.parse(readFileSync(join(root, 'design-system/tokens.json'), 'utf8'));

const themes = t.color?.themes ?? [{ id: 'light' }];
const first = themes[0].id;
// alias "{ten-token}" -> var(--ten-token)
const resolve = (v) => (/^\{.+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v);
const forTheme = (tok, theme) =>
  typeof tok.value === 'string' ? tok.value : tok.value[theme] ?? tok.value[first];

const decls = (family, theme) =>
  (t[family]?.tokens ?? [])
    .map((tok) => {
      const v = forTheme(tok, theme);
      return v == null ? null : `  --${tok.name}: ${resolve(v)};`;
    })
    .filter(Boolean)
    .join('\n');

const out = [];
out.push('/* Sinh tu design-system/tokens.json — dung `node tools/build-tokens.mjs`, khong sua tay. */\n');
out.push(':root { color-scheme: light; }\n'); // brandbook: chi giao dien sang

// mau + shadow theo theme
out.push(`:root,\n[data-theme="${first}"] {\n${decls('color', first)}\n${decls('shadow', first)}\n}\n`);
for (const th of themes.slice(1)) {
  out.push(`[data-theme="${th.id}"] {\n${decls('color', th.id)}\n${decls('shadow', th.id)}\n}\n`);
}

// cac ho token khong theo theme + font families
const plain = Object.keys(t).filter(
  (k) => !['name', 'version', 'color', 'shadow', 'type'].includes(k) && t[k]?.tokens
);
const fonts = Object.entries(t.type?.families ?? {}).map(([k, v]) => `  --font-${k}: ${v};`);
out.push(`:root {\n${plain.map((k) => decls(k, first)).join('\n')}\n${fonts.join('\n')}\n}\n`);

// type styles -> mot class moi style
const props = {
  fontSize: 'font-size', lineHeight: 'line-height', fontWeight: 'font-weight',
  letterSpacing: 'letter-spacing', fontStyle: 'font-style',
};
for (const g of t.type?.groups ?? []) {
  out.push(`/* ${g.name} */`);
  for (const s of g.styles ?? []) {
    const body = [`  font-family: var(--font-${s.family ?? g.family});`];
    for (const [k, css] of Object.entries(props)) {
      if (s[k] != null) body.push(`  ${css}: ${s[k]};`);
    }
    out.push(`.${s.name} {\n${body.join('\n')}\n}`);
  }
  out.push('');
}

writeFileSync(join(root, 'design-system/tokens.css'), out.join('\n'));
console.log('design-system/tokens.css da duoc sinh');
