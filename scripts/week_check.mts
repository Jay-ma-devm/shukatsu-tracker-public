import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

console.log('=== 今週（5/14-5/21）の完全タスク・イベント一覧 ===\n');

const tasks = await client.execute(
  `SELECT t.title, t.priority, t.dueAt, c.name as company
   FROM Task t LEFT JOIN Company c ON t.companyId=c.id
   WHERE t.userId='local-user' AND t.status='todo'
   ORDER BY t.dueAt ASC, t.priority DESC`
);
console.log(`📋 全タスク（${tasks.rows.length}件）:`);
tasks.rows.forEach(r => {
  const dueAt = r.dueAt ? new Date(r.dueAt as string) : null;
  const dateStr = dueAt ? `${dueAt.getMonth()+1}/${dueAt.getDate()}` : '期限なし';
  console.log(`  [${dateStr}] p${r.priority} ${r.title} (${r.company ?? '汎用'})`);
});

const events = await client.execute(
  `SELECT e.title, e.type, e.startAt, c.name as company
   FROM Event e LEFT JOIN Company c ON e.companyId=c.id
   WHERE e.completed=0 AND e.startAt > '2026-05-14T00:00:00Z'
   ORDER BY e.startAt ASC`
);
console.log(`\n📅 アクティブイベント（${events.rows.length}件）:`);
events.rows.forEach(r => {
  const d = new Date(r.startAt as string);
  const dateStr = `${d.getMonth()+1}/${d.getDate()}`;
  console.log(`  [${dateStr}] [${r.type}] ${r.title} (${r.company ?? ''})`);
});
