import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt';
const [c, t, e, n, il, cl, es] = await Promise.all([
  client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${USER_ID}'`),
  client.execute(`SELECT COUNT(*) as c FROM Task WHERE userId='${USER_ID}' AND status='todo'`),
  client.execute(`SELECT COUNT(*) as c FROM Event WHERE completed=0 AND startAt > CURRENT_TIMESTAMP`),
  client.execute(`SELECT COUNT(*) as c FROM Note WHERE userId='${USER_ID}'`),
  client.execute(`SELECT COUNT(*) as c FROM InterviewLog`),
  client.execute(`SELECT COUNT(*) as c FROM CaseLog WHERE userId='${USER_ID}'`),
  client.execute(`SELECT COUNT(*) as c FROM EntrySheet`),
]);
console.log(`企業: ${c.rows[0].c}社 | タスク: ${t.rows[0].c}件 | イベント: ${e.rows[0].c}件`);
console.log(`ノート: ${n.rows[0].c}件 | 面接ログ: ${il.rows[0].c}件 | ケース: ${cl.rows[0].c}件 | ES: ${es.rows[0].c}件`);

const statusCounts = await client.execute(`SELECT status, COUNT(*) as cnt FROM Company WHERE userId='${USER_ID}' GROUP BY status ORDER BY cnt DESC`);
console.log('\nステータス別:');
statusCounts.rows.forEach(r => console.log(`  ${r.status}: ${r.cnt}社`));
