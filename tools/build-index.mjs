// Sinh design-system/COMPONENTS.md: bảng component theo nhóm, lấy từ
// marker @dsCard trong preview.html và câu đầu trong README.md.
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const dir = join(root, 'design-system/components');

const items = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => {
    const name = d.name;
    const pv = join(dir, name, 'preview.html');
    const rd = join(dir, name, 'README.md');
    let group = '—';
    let page = false;
    if (existsSync(pv)) {
      const first = readFileSync(pv, 'utf8').split('\n', 1)[0];
      group = /group="([^"]+)"/.exec(first)?.[1] ?? '—';
      page = / page[ -]/.test(first + ' ');
    }
    let summary = '';
    if (existsSync(rd)) {
      // bo dong "# Ten", lay doan van dau tien, cat o dau cau
      const body = readFileSync(rd, 'utf8').replace(/^#[^\n]*\n/, '').trim();
      summary = (body.split('\n\n')[0] || '').replace(/\n/g, ' ').replace(/\*\*|`/g, '');
      if (summary.length > 150) summary = summary.slice(0, 147).trimEnd() + '…';
    }
    return { name, group, page, summary, hasPreview: existsSync(pv), hasReadme: existsSync(rd) };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

const groups = [...new Set(items.map((i) => i.group))].sort((a, b) => a.localeCompare(b, 'vi'));
const out = [
  '# Danh sách component',
  '',
  `${items.length} component, nhóm theo marker \`@dsCard group\` trong \`preview.html\`.`,
  'Sinh bằng `node tools/build-index.mjs` — không sửa tay.',
  '',
  `Trang đầy đủ (\`page\`): ${items.filter((i) => i.page).length} · ` +
    `có preview: ${items.filter((i) => i.hasPreview).length} · ` +
    `có hướng dẫn: ${items.filter((i) => i.hasReadme).length}`,
  '',
];
for (const g of groups) {
  const rows = items.filter((i) => i.group === g);
  out.push(`## ${g} (${rows.length})`, '', '| Component | Mô tả |', '|---|---|');
  for (const i of rows) {
    const link = i.hasPreview
      ? `[${i.name}](components/${i.name}/preview.html)`
      : `**${i.name}**`;
    out.push(`| ${link}${i.page ? ' · *trang*' : ''} | ${i.summary || '—'} |`);
  }
  out.push('');
}
writeFileSync(join(root, 'design-system/COMPONENTS.md'), out.join('\n'));
console.log(`design-system/COMPONENTS.md: ${items.length} component / ${groups.length} nhóm`);
