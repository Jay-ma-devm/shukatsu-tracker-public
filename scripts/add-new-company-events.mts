/**
 * 新規追加企業のイベント・タスクを追加
 */
import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}
async function getCompanyId(name: string): Promise<string | null> {
  const r = await client.execute(`SELECT id FROM Company WHERE userId='local-user' AND name='${name.replace(/'/g, "''")}'`);
  return r.rows.length > 0 ? r.rows[0].id as string : null;
}

// オリバー・ワイマン、ローランド・ベルガーのES締切（仮）、マネーフォワードのインターン
const eventsToAdd = [
  { companyName: 'マネーフォワード', title: 'マネーフォワード 夏季インターン説明会', type: 'info_session', startAt: new Date('2026-05-25T14:00:00+09:00') },
  { companyName: 'Sansan株式会社', title: 'Sansan インターンシップ エントリー締切', type: 'deadline', startAt: new Date('2026-06-15T23:59:00+09:00') },
  { companyName: 'オリバー・ワイマン', title: 'オリバー・ワイマン サマーインターン ES締切', type: 'deadline', startAt: new Date('2026-06-01T23:59:00+09:00') },
  { companyName: 'ローランド・ベルガー', title: 'ローランド・ベルガー サマーインターン ES締切', type: 'deadline', startAt: new Date('2026-06-10T23:59:00+09:00') },
];

const tasksToAdd = [
  { companyName: 'マネーフォワード', title: 'マネーフォワード インターン情報収集・エントリー', priority: 3, dueAt: new Date('2026-05-25T23:59:00+09:00') },
  { companyName: 'オリバー・ワイマン', title: 'オリバー・ワイマン ES作成（6/1締切）', priority: 4, dueAt: new Date('2026-06-01T23:59:00+09:00') },
  { companyName: 'Sansan株式会社', title: 'Sansan インターンシップ エントリー（6/15締切）', priority: 3, dueAt: new Date('2026-06-15T23:59:00+09:00') },
];

let addedEvents = 0;
for (const ev of eventsToAdd) {
  const companyId = await getCompanyId(ev.companyName);
  if (!companyId) { console.log(`  ⚠️  企業未登録: ${ev.companyName}`); continue; }
  const id = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, createdAt)
     VALUES ('${id}', '${companyId}', '${ev.title.replace(/'/g, "''")}', '${ev.type}', '${ev.startAt.toISOString()}', CURRENT_TIMESTAMP)`
  );
  addedEvents++;
  console.log(`  📅 ${ev.companyName}: ${ev.title}`);
}

let addedTasks = 0;
const existingTasks = await client.execute("SELECT title FROM Task WHERE userId='local-user'");
const existingTaskTitles = new Set(existingTasks.rows.map(r => r.title as string));
for (const task of tasksToAdd) {
  if (existingTaskTitles.has(task.title)) { console.log(`  ⏭️  スキップ: ${task.title}`); continue; }
  const companyId = await getCompanyId(task.companyName);
  if (!companyId) continue;
  const id = await getId();
  await client.execute(
    `INSERT INTO Task (id, userId, companyId, title, status, priority, dueAt, createdAt, updatedAt)
     VALUES ('${id}', 'local-user', '${companyId}', '${task.title.replace(/'/g, "''")}', 'todo', ${task.priority}, '${task.dueAt.toISOString()}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  addedTasks++;
  console.log(`  ✅ タスク: ${task.title}`);
}

console.log(`\n🎉 イベント${addedEvents}件・タスク${addedTasks}件追加完了`);
