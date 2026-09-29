import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
console.log((await c.query('select id, ship, product_slug, sort, left(question, 40) q from faqs order by id')).rows);
console.log((await c.query('select count(*) from question_answers')).rows);
console.log((await c.query("select relrowsecurity from pg_class where relname in ('faqs','question_answers')")).rows);
console.log((await c.query("select count(*) q, count(answer) a from questions")).rows, (await c.query("select slug, name, ship, pesticide from products where active order by slug limit 3")).rows);
console.log((await c.query("select id, phone, role, name from users where role <> 'customer' order by id")).rows);
await c.end();
