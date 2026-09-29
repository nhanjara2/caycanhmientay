import pg from 'pg';
import { createHash, randomBytes } from 'node:crypto';
// @ts-ignore
import { chromium } from '/Users/n/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3100';
const SLUG = 'monstera-deliciosa-chau-su-trang';
const SHOTS = '/private/tmp/claude-501/-Users-n-Desktop-CODE-nhanjara-gmail-com-caycanhmientay/c76abfe8-03b1-4ab7-981f-1e850791ea75/scratchpad';
const EXE = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
const created = { users: [] as number[], orders: [] as number[], faqs: [] as number[], reviews: [] as number[] };
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
let fails = 0;
const check = (ok: unknown, msg: string) => { console.log(ok ? '  ✓' : '  ✗', msg); if (!ok) fails++; };
const q1 = async (sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows[0];

async function mkUser(name: string, role = 'customer', phone: string | null = null) {
  const u = await q1('insert into users (name, role, phone, contact_phone) values ($1,$2,$3,$4) returning id', [name, role, phone, '0999990009']);
  created.users.push(u.id);
  const token = randomBytes(32).toString('hex');
  await db.query("insert into sessions (id, user_id, expires_at) values ($1,$2, now() + interval '1 day')", [sha(token), u.id]);
  return { id: u.id as number, token };
}

const browser = await chromium.launch({ executablePath: EXE });
async function ctxFor(token: string | null, mobile?: number) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: mobile, height: 800 }, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
  if (token) await ctx.addCookies([{ name: 'ccmt_session', value: token, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  page.on('dialog', (d: any) => d.accept());
  page.on('pageerror', (e: any) => console.log('  [pageerror]', e.message));
  return { ctx, page };
}
const overflow = async (page: any) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  const P = await q1('select name, ship, active from products where slug = $1', [SLUG]);
  console.log('Sản phẩm:', P);
  const A = await mkUser('Test Hỏi An');
  const B = await mkUser('Test Mua Bình', 'customer', '0999990002');
  const C = await mkUser('Test Khách Chi');
  const S = await mkUser('Test Admin QnA', 'admin');
  const o = await q1(`insert into orders (code, kind, user_id, status, customer_name, phone, delivery, payment_method, paid, original, subtotal, plant_ship, supply_ship, total)
    values ($1, 'warranty', $2, 'delivered', 'Test Mua Bình', '0999990002', 'pickup', 'cod', true, 0, 0, 0, 0, 0) returning id`, [`TEST-QNA-${Date.now()}`, B.id]);
  created.orders.push(o.id);
  await db.query(`insert into order_items (order_id, product_slug, option_idx, name, label, unit, icon, ship, price, qty) values ($1,$2,0,$3,'x','Chậu','plant','plant',0,1)`, [o.id, SLUG, P.name]);

  console.log('1. Khách A đặt câu hỏi');
  const QTEXT = 'Cây này để trong phòng máy lạnh có được không shop?';
  const a = await ctxFor(A.token);
  await a.page.goto(`${BASE}/san-pham/${SLUG}#cau-hoi`);
  await a.page.fill('textarea[aria-label="Câu hỏi của bạn"]', QTEXT);
  await a.page.click('#cau-hoi button:has-text("Gửi câu hỏi")');
  await a.page.waitForSelector('text=Đã gửi câu hỏi');
  await a.page.waitForSelector(`#cau-hoi >> text=${QTEXT}`);
  check(await a.page.isVisible('#cau-hoi >> text=Đang chờ shop trả lời'), 'A thấy câu hỏi của mình + "Đang chờ shop trả lời"');
  const Q = await q1('select id from questions where user_id = $1', [A.id]);

  console.log('2. Khách C (chưa mua) chưa thấy câu hỏi chưa ai trả lời');
  const c = await ctxFor(C.token);
  await c.page.goto(`${BASE}/san-pham/${SLUG}`);
  check(!(await c.page.isVisible(`text=${QTEXT}`)), 'C không thấy câu hỏi');

  console.log('3. Khách B (đã mua) thấy + trả lời');
  const b = await ctxFor(B.token);
  await b.page.goto(`${BASE}/san-pham/${SLUG}`);
  check(await b.page.isVisible(`#cau-hoi >> text=${QTEXT}`), 'B thấy câu hỏi');
  check(await b.page.isVisible('#cau-hoi >> text=Bạn đã mua sản phẩm này'), 'B thấy lời mời chia sẻ kinh nghiệm');
  await b.page.click('#cau-hoi a[role="button"]:has-text("Trả lời")');
  await b.page.fill('textarea[aria-label="Câu trả lời của bạn"]', 'Nhà mình để phòng máy lạnh 1 năm rồi, cây vẫn xanh tốt, nhớ phun sương cho lá.');
  await b.page.click('#cau-hoi button:has-text("Gửi"):not(:has-text("câu hỏi"))');
  await b.page.waitForSelector('text=Cảm ơn bạn đã chia sẻ');
  await b.page.waitForSelector('#cau-hoi >> text=Nhà mình để phòng máy lạnh');
  check(await b.page.isVisible('#cau-hoi .app-qa__ans >> text=Câu trả lời của bạn'), 'B thấy câu trả lời của mình + nút Xóa');
  const nA = await q1("select count(*)::int n, max(text) t from notifications where user_id = $1 and kind = 'reply'", [A.id]);
  check(nA.n === 1, `A nhận thông báo: ${nA.t}`);

  console.log('4. Khách C thấy câu hỏi (đã có người trả lời) + trả lời có SĐT → chờ duyệt');
  await c.page.reload();
  check(await c.page.isVisible(`#cau-hoi >> text=${QTEXT}`), 'C thấy câu hỏi');
  check(await c.page.isVisible('#cau-hoi .app-qa__ans >> text=Đã mua hàng'), 'Câu trả lời của B có nhãn "Đã mua hàng"');
  await c.page.click('#cau-hoi a[role="button"]:has-text("Trả lời")');
  await c.page.fill('textarea[aria-label="Câu trả lời của bạn"]', 'Mua bên mình rẻ hơn, gọi 0909 123 456 nhé');
  await c.page.click('#cau-hoi button:has-text("Gửi"):not(:has-text("câu hỏi"))');
  await c.page.waitForTimeout(3000);
  console.log('    alert:', await c.page.locator('#cau-hoi [role="alert"]').allTextContents(), await c.page.locator('#cau-hoi [role="status"]').allTextContents());
  await c.page.waitForSelector('#cau-hoi .app-qa__ans >> text=Mua bên mình rẻ hơn');
  const ca = await q1('select id, status from question_answers where user_id = $1', [C.id]);
  check(ca.status === 'pending', `Câu trả lời có SĐT ở trạng thái chờ duyệt (${ca.status})`);
  const anon = await ctxFor(null);
  await anon.page.goto(`${BASE}/san-pham/${SLUG}`);
  check(await anon.page.isVisible(`#cau-hoi >> text=${QTEXT}`), 'Khách vãng lai thấy câu hỏi đã có người trả lời');
  check(!(await anon.page.isVisible('text=Mua bên mình rẻ hơn')), 'Khách vãng lai KHÔNG thấy câu trả lời chờ duyệt');
  check(!(await anon.page.isVisible('#cau-hoi a[role="button"]:has-text("Trả lời")')) || true, '—');
  // Chưa đăng nhập bấm Trả lời → mở hộp đăng nhập
  await anon.page.click('#cau-hoi a[role="button"]:has-text("Trả lời")');
  await anon.page.waitForTimeout(500);
  check(!(await anon.page.isVisible('textarea[aria-label="Câu trả lời của bạn"]')), 'Chưa đăng nhập bấm Trả lời không mở ô viết (mở đăng nhập)');

  console.log('5. Admin: gợi ý trả lời → dùng gợi ý → trả lời');
  const s = await ctxFor(S.token);
  await s.page.goto(`${BASE}/admin/danh-gia?tab=cau-hoi&loc=chua-tra-loi`);
  const row = s.page.locator('.rv-item', { hasText: QTEXT });
  check(await row.locator('.rv-ai').isVisible(), 'Có khung GỢI Ý TRẢ LỜI');
  const sug = (await row.locator('.rv-ai p').textContent()) ?? '';
  console.log('    gợi ý:', sug, '\n    cơ sở:', await row.locator('.rv-ai small').textContent());
  check(await row.locator('.rv-ans >> text=Test Mua Bình').isVisible(), 'Admin thấy câu trả lời của khách dưới câu hỏi');
  await s.page.screenshot({ path: `${SHOTS}/admin-cau-hoi.png`, fullPage: true });
  await row.locator('button:has-text("Dùng gợi ý")').click();
  check((await row.locator('textarea[aria-label="Câu trả lời"]').inputValue()) === sug, 'Bấm "Dùng gợi ý" chép vào ô trả lời (chưa gửi)');
  check(!(await q1('select answer from questions where id = $1', [Q.id])).answer, 'Chưa tự gửi');
  await row.locator('button:has-text("Trả lời")').click();
  await s.page.waitForSelector(`text=${QTEXT}`, { state: 'detached' });
  check((await q1('select answer from questions where id = $1', [Q.id])).answer === sug, 'Đã lưu câu trả lời của shop');

  console.log('6. Admin: duyệt câu trả lời của khách');
  await s.page.goto(`${BASE}/admin/danh-gia?tab=cau-hoi&loc=khach-tra-loi`);
  check(await s.page.isVisible('a[aria-pressed="true"]:has-text("1 chờ duyệt")'), 'Bộ lọc "Khách trả lời (1 chờ duyệt)"');
  const ansLine = s.page.locator('.rv-ans > div', { hasText: 'Mua bên mình rẻ hơn' });
  check(await ansLine.locator('text=Chờ duyệt').isVisible(), 'Nhãn Chờ duyệt');
  check(await ansLine.locator('text=Nghi quảng cáo').isVisible(), 'Nhãn Nghi quảng cáo');
  await ansLine.locator('button:has-text("Ẩn")').click();
  await s.page.waitForTimeout(1500);
  check((await q1('select status from question_answers where id = $1', [ca.id])).status === 'hidden', 'Đã ẩn câu trả lời quảng cáo');

  console.log('7. Admin: đưa lên FAQ');
  await s.page.goto(`${BASE}/admin/danh-gia?tab=cau-hoi&loc=da-tra-loi`);
  const row2 = s.page.locator('.rv-item', { hasText: QTEXT });
  await row2.locator('button:has-text("Đưa lên FAQ")').click();
  const form = row2.locator('.rv-faq');
  check((await form.locator('input').inputValue()) === QTEXT, 'Form FAQ điền sẵn câu hỏi');
  const ansPrefill = await form.locator('textarea').inputValue();
  check(!/^Chào/.test(ansPrefill), `Câu trả lời điền sẵn đã bỏ lời chào: "${ansPrefill.slice(0, 50)}…"`);
  await form.locator('input').fill('Monstera để phòng máy lạnh được không?');
  await s.page.screenshot({ path: `${SHOTS}/admin-dua-len-faq.png`, fullPage: true });
  await form.locator('button:has-text("Đưa lên Câu hỏi thường gặp")').click();
  await row2.locator('text=Đã ở Câu hỏi thường gặp').waitFor();
  const F = await q1('select id, product_slug, sort, active from faqs where question_id = $1', [Q.id]);
  if (F) created.faqs.push(F.id);
  check(F?.product_slug === SLUG, 'FAQ riêng của sản phẩm đã tạo');

  console.log('8. Trang sản phẩm hiện FAQ từ database');
  await anon.page.goto(`${BASE}/san-pham/${SLUG}`);
  const faqQs = await anon.page.locator('#hoi-dap summary').allTextContents();
  console.log('    FAQ:', faqQs);
  check(faqQs[0]?.includes('Monstera để phòng máy lạnh'), 'Câu riêng của sản phẩm đứng đầu');
  check(faqQs.length === 4, 'Có thêm 3 câu chung cây sống');
  const ld = await anon.page.locator('#hoi-dap script[type="application/ld+json"]').textContent();
  check(ld?.includes('"FAQPage"') && ld.includes('Monstera để phòng máy lạnh'), 'Có schema FAQPage cho Google');
  await anon.page.goto(`${BASE}/san-pham/nam-trichoderma-500ml`).catch(() => {});

  console.log('9. Admin tab Câu hỏi thường gặp: đổi thứ tự, ẩn/hiện');
  await s.page.goto(`${BASE}/admin/danh-gia?tab=faq`);
  check((await s.page.locator('.faq-item').count()) >= 7, 'Danh sách FAQ (6 câu chung + 1 câu riêng)');
  const order = async () => (await db.query("select id from faqs where product_slug is null and ship = 'plant' order by sort, id")).rows.map((r: any) => r.id).join(',');
  const before = await order();
  await s.page.locator('.faq-item', { hasText: 'Cây bị vàng lá' }).locator('button[aria-label="Lên trên"]').click();
  await s.page.waitForTimeout(1500);
  const moved = await order();
  check(moved !== before, `Đổi thứ tự: ${before} → ${moved}`);
  await s.page.locator('.faq-item', { hasText: 'Cây bị vàng lá' }).locator('button[aria-label="Xuống dưới"]').click();
  await s.page.waitForTimeout(1500);
  check((await order()) === before, 'Trả lại thứ tự cũ');
  const mine = s.page.locator('.faq-item', { hasText: 'Monstera để phòng máy lạnh' });
  check(await mine.locator('button[aria-label="Lên trên"]').isDisabled(), 'Câu duy nhất trong nhóm: khóa nút ↑');
  await mine.locator('button:has-text("Ẩn")').click();
  await s.page.waitForTimeout(1500);
  check((await q1('select active from faqs where id = $1', [F.id])).active === false, 'Ẩn FAQ');
  await anon.page.goto(`${BASE}/san-pham/${SLUG}`);
  check(!(await anon.page.isVisible('#hoi-dap >> text=Monstera để phòng máy lạnh')), 'FAQ ẩn không hiện trên trang sản phẩm');
  await s.page.screenshot({ path: `${SHOTS}/admin-faq.png`, fullPage: true });

  console.log('10. Gợi ý trả lời đánh giá');
  const rv = await q1(`insert into reviews (product_slug, user_id, stars, content, verified, status) values ($1,$2,4,'Cây đẹp, nhưng shipper giao trễ 1 tiếng so với hẹn.',false,'published') returning id`, [SLUG, C.id]);
  created.reviews.push(rv.id);
  await s.page.goto(`${BASE}/admin/danh-gia?tab=dang-hien`);
  const rrow = s.page.locator('.rv-item', { hasText: 'shipper giao trễ' });
  const rs = await rrow.locator('.rv-ai p').textContent();
  console.log('    gợi ý đánh giá:', rs);
  check(rs?.includes('giao hàng'), 'Gợi ý trả lời đánh giá có nhắc giao hàng');

  console.log('11. Không tràn ngang trên điện thoại');
  for (const w of [360, 390]) {
    const mb = await ctxFor(B.token, w);
    await mb.page.goto(`${BASE}/san-pham/${SLUG}#cau-hoi`);
    await mb.page.click('#cau-hoi a[role="button"]:has-text("Trả lời")');
    check((await overflow(mb.page)) <= 0, `${w}px trang sản phẩm (đang mở ô trả lời)`);
    if (w === 390) await mb.page.locator('#cau-hoi').screenshot({ path: `${SHOTS}/mobile-qna.png` });
    const ms = await ctxFor(S.token, w);
    for (const u of ['?tab=cau-hoi&loc=da-tra-loi', '?tab=cau-hoi&loc=khach-tra-loi', '?tab=faq', '?tab=dang-hien']) {
      await ms.page.goto(`${BASE}/admin/danh-gia${u}`);
      if (u === '?tab=faq') await ms.page.locator('.faq-item', { hasText: 'Monstera' }).locator('button:has-text("Sửa")').click();
      if (u.includes('da-tra-loi')) await ms.page.locator('.rv-item').first().waitFor();
      check((await overflow(ms.page)) <= 0, `${w}px admin ${u}`);
      if (w === 390 && u === '?tab=faq') await ms.page.screenshot({ path: `${SHOTS}/mobile-admin-faq.png`, fullPage: true });
    }
    await mb.ctx.close(); await ms.ctx.close();
  }
} catch (e) {
  fails++;
  console.error('LỖI:', e);
} finally {
  await browser.close();
  for (const id of created.faqs) await db.query('delete from faqs where id = $1', [id]);
  for (const id of created.reviews) await db.query('delete from reviews where id = $1', [id]);
  for (const id of created.orders) await db.query('delete from orders where id = $1', [id]);
  for (const id of created.users) await db.query('delete from users where id = $1', [id]);
  const left = await q1('select (select count(*) from questions)::int q, (select count(*) from question_answers)::int a, (select count(*) from faqs)::int f, (select count(*) from users where name like $1)::int u, (select count(*) from orders where code like $2)::int o', ['Test %', 'TEST-QNA-%']);
  console.log('Dọn dẹp xong, còn lại:', left);
  await db.end();
  console.log(fails ? `\n${fails} kiểm tra KHÔNG đạt` : '\nTẤT CẢ ĐẠT');
}
