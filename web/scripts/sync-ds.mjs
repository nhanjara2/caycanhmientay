// Chép tokens.css + components.css từ ../design-system vào src/styles/ds,
// và sinh responsive.css: design system chỉ vẽ cho desktop, file này thu lưới/hàng lại trên mobile.
// Bỏ dòng @import Google Fonts vì font đã nạp qua next/font trong app/layout.tsx.
// Đổi cỡ chữ + dòng cao từ px sang rem và mốc @media từ px sang em (1rem = 16px mặc định → hiển thị y hệt khi khách chưa chỉnh gì;
// nhưng khi khách tăng "Cỡ chữ" trong trình duyệt thì chữ và điểm chuyển bố cục co giãn theo). design-system/ giữ nguyên px.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(web, '..', 'design-system');
const out = join(web, 'src/styles/ds');
mkdirSync(out, { recursive: true });

const num = (n) => String(+n.toFixed(4));
/** font-size / line-height: Npx -> N/16 rem; (min|max)-width: Npx trong @media -> N/16 em. */
export function pxToRem(css) {
  return css
    .replace(/(font-size|line-height)(\s*:\s*)(\d*\.?\d+)px/g, (_, p, sep, n) => `${p}${sep}${num(n / 16)}rem`)
    .replace(/\((min|max)-width(\s*:\s*)(\d*\.?\d+)px\)/g, (_, k, sep, n) => `(${k}-width${sep}${num(n / 16)}em)`);
}

const files = {};
for (const file of ['tokens.css', 'components.css']) {
  const css = readFileSync(join(src, file), 'utf8').replace(/^@import url\([^)]*\);\s*/m, '');
  files[file] = css;
  writeFileSync(join(out, file), `/* Chép từ design-system/${file} (cỡ chữ px → rem, @media px → em) — không sửa tay, chạy npm run sync-ds */\n${pxToRem(css)}`);
}

// ---- responsive.css ----------------------------------------------------------------------
// Đọc từng rule cấp ngoài cùng "selectors{decls}" (bỏ qua @media có sẵn).
const css = files['components.css'].replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));
const decl = (body, prop) => body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`))?.[1].trim();

/** "repeat(3,1fr) 240px" -> ["1fr","1fr","1fr","240px"] */
function tracks(v) {
  const out = [];
  const re = /repeat\((\d+),\s*((?:[^()]|\([^()]*\))+)\)|minmax\([^()]*\)|[^\s]+/g;
  for (const m of v.matchAll(re)) {
    if (m[1]) for (let i = 0; i < +m[1]; i++) out.push(...tracks(m[2]));
    else out.push(m[0]);
  }
  return out;
}
const px = (t) => Number(t.match(/^(\d+)px$/)?.[1] ?? t.match(/minmax\((\d+)px/)?.[1] ?? 0);

// Hàng cuộn ngang hoặc thanh cố định: không cho xuống dòng.
// Lớp .m-* / .s-* / .t-* đã vẽ sẵn cho mobile, app nhân viên, tablet; thanh tab và ô tìm giữ nguyên.
const KEEP_ANY = /(^|[\s.>,])(m|s|t)-|tabs?\b|tabbar|__search/;
const KEEP_ROW = /vx-header|vx-search|vx-stepper|vx-toggle|vx-sbar|vx-strip|vx-slots|pl-subs|fb-sort|vx-count|ad-top|au-otp|au-phone|vx-crumb|vx-acc__head|vx-pcard__tags|vx-sect\b|vx-flash__bar|app-/;

const oneCol = [], twoCol = [], shrink = [], wrap = [], frFix = [];
for (const { sel, body } of rules) {
  if (sel.startsWith('@') || /:(hover|focus|active)|::/.test(sel) || KEEP_ANY.test(sel)) continue;
  const g = decl(body, 'grid-template-columns');
  if (g && !g.includes('auto-fill') && !g.includes('auto-fit')) {
    const t = tracks(g);
    // Bề rộng tối thiểu ước lượng: cột px giữ nguyên, cột co giãn cần ~120px nội dung, auto ~60px.
    const minW = t.reduce((w, x) => w + (px(x) || (/fr|minmax/.test(x) ? 120 : 60)), 0);
    const bigFixed = t.some((x) => px(x) >= 160);
    const allFlex = t.every((x) => /fr/.test(x) && !px(x));
    if (t.length >= 2 && bigFixed) oneCol.push(sel);
    else if (t.length === 2 && allFlex) oneCol.push(sel); // bài chính + cột phụ
    else if (minW <= 358) {
      // vừa màn 390px: giữ số cột, nhưng cho cột 1fr co nhỏ hơn nội dung
      if (/(^|\s)[\d.]+fr/.test(g)) frFix.push([sel, g.replace(/(^|\s)([\d.]+fr)/g, '$1minmax(0, $2)')]);
      continue;
    }
    else if (t.length <= 4) (t.length === 2 ? oneCol : twoCol).push(sel);
    else shrink.push([sel, t.length === 6 ? 3 : t.length]);
  }
  const d = decl(body, 'display');
  if (d === 'flex' && !/flex-direction\s*:\s*column/.test(body) && !/flex-wrap/.test(body) && !/overflow/.test(body) && !KEEP_ROW.test(sel)) wrap.push(sel);
}

const block = (sels, decls) => (sels.length ? `  ${sels.join(',\n  ')} { ${decls} }\n` : '');
const responsive = `/* Sinh bởi scripts/sync-ds.mjs từ components.css — không sửa tay.
 * Mobile < 768px: layout có cột cố định -> 1 cột, lưới 3–4 cột -> 2 cột, hàng flex được xuống dòng.
 * Lưới ghi inline trong view dùng biến --cols (class .app-cols). */
.app-cols { grid-template-columns: var(--cols); }

@media (max-width: 47.9375em) {
${frFix.map(([s, v]) => `  ${s} { grid-template-columns: ${v}; }\n`).join('')}${block(oneCol, 'grid-template-columns: minmax(0, 1fr);')}${block(twoCol, 'grid-template-columns: repeat(2, minmax(0, 1fr));')}${shrink.map(([s, n]) => `  ${s} { grid-template-columns: repeat(${n}, minmax(0, 1fr)); }\n`).join('')}${block(wrap, 'flex-wrap: wrap;')}  .app-cols { grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); }
  .vx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }
}
`;
writeFileSync(join(out, 'responsive.css'), responsive);
console.log(`Đã đồng bộ design system -> src/styles/ds (responsive: ${oneCol.length} 1 cột, ${twoCol.length} 2 cột, ${wrap.length} hàng xuống dòng)`);
