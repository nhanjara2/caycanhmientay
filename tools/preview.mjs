// Server xem truoc component: node tools/preview.mjs  ->  http://localhost:4321
// Moi preview.html la mot tai lieu HTML roi; server chen tokens.css + components.css
// + font Be Vietnam Pro vao <head> roi tra ve, giong khung xem truoc cua design system.
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const comps = join(root, 'design-system/components');
const list = () =>
  existsSync(comps)
    ? readdirSync(comps, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(comps, d.name, 'preview.html')))
        .map((d) => d.name)
    : [];

const HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components.css">
<style>body{margin:0;background:var(--surface-page);color:var(--ink);font-family:var(--font-sans)}</style>`;

const send = (res, code, type, body) =>
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }).end(body);

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);

  if (p === '/tokens.css' || p === '/components.css')
    return send(res, 200, 'text/css; charset=utf-8', readFileSync(join(root, 'design-system', p.slice(1))));

  // /c/<Ten> -> preview cua component do, da chen CSS
  if (p.startsWith('/c/')) {
    const file = join(comps, p.slice(3), 'preview.html');
    if (!existsSync(file)) return send(res, 404, 'text/plain; charset=utf-8', 'Khong co preview');
    const html = readFileSync(file, 'utf8').replace(/<\/head>/i, `${HEAD}</head>`);
    return send(res, 200, 'text/html; charset=utf-8', html);
  }

  const names = list();
  const rows = names.length
    ? names.map((n) => `<li><a href="/c/${encodeURIComponent(n)}" target="v">${n}</a></li>`).join('')
    : '<li>Chua tai component nao ve</li>';
  send(res, 200, 'text/html; charset=utf-8', `<!doctype html><meta charset="utf-8">
<title>Cây Cảnh Miền Tây — xem truoc</title>${HEAD}
<div style="display:flex;height:100vh">
  <nav style="width:240px;overflow:auto;background:var(--surface);border-right:1px solid var(--border);padding:var(--space-4)">
    <strong>Component (${names.length})</strong>
    <ul style="padding-left:1.1em;line-height:1.9">${rows}</ul>
  </nav>
  <iframe name="v" style="flex:1;border:0" src="${names[0] ? `/c/${encodeURIComponent(names[0])}` : 'about:blank'}"></iframe>
</div>`);
}).listen(4321, () => console.log('Xem truoc: http://localhost:4321'));
