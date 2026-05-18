import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
// 今日 (2026-05-14) のタスク
const today = await client.execute(
  `SELECT title, dueAt FROM Task WHERE userId='local-user' AND status='todo' 
   AND dueAt >= '2026-05-14T00:00:00.000Z' AND dueAt < '2026-05-15T00:00:00.000Z'`
);
console.log('Today (5/14) tasks:', today.rows.length);
today.rows.forEach(r => console.log(`  ${r.title}: ${r.dueAt}`));

// 期限超過タスク（5/14 JST 00:00より前）
// JST = UTC+9 なので 5/14 00:00 JST = 5/13 15:00 UTC
const overdue = await client.execute(
  `SELECT title, dueAt FROM Task WHERE userId='local-user' AND status='todo' 
   AND dueAt < '2026-05-14T00:00:00.000Z'`
);
console.log('\nOverdue tasks:', overdue.rows.length);
overdue.rows.forEach(r => console.log(`  ${r.title}: ${r.dueAt}`));
