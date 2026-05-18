/**
 * 今週の就活締切サマリーをGmailの下書きとして作成
 */
import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt';

// 今週のタスクを取得
const tasks = await client.execute(
  `SELECT t.title, t.dueAt, c.name as company
   FROM Task t LEFT JOIN Company c ON t.companyId=c.id
   WHERE t.userId='${USER_ID}' AND t.status='todo' AND t.dueAt IS NOT NULL
   AND t.dueAt >= '2026-05-16T00:00:00Z' AND t.dueAt <= '2026-05-23T23:59:59Z'
   ORDER BY t.dueAt ASC, t.priority DESC`
);

const lines = ['# 今週（5/16-5/23）の就活TODOリスト\n'];
let currentDate = '';
for (const t of tasks.rows) {
  const d = new Date(t.dueAt as string);
  const dateStr = `${d.getMonth()+1}/${d.getDate()}（${['日','月','火','水','木','金','土'][d.getDay()]}）`;
  if (dateStr !== currentDate) {
    lines.push(`\n## ${dateStr}`);
    currentDate = dateStr;
  }
  lines.push(`- [ ] ${t.title}${t.company ? ` [${t.company}]` : ''}`);
}

// 重要イベントも追加
const events = await client.execute(
  `SELECT e.title, e.startAt, c.name as company
   FROM Event e LEFT JOIN Company c ON e.companyId=c.id
   WHERE e.completed=0 AND e.startAt >= '2026-05-16T00:00:00Z' AND e.startAt <= '2026-05-25T23:59:59Z'
   ORDER BY e.startAt ASC`
);
if (events.rows.length > 0) {
  lines.push('\n## 📅 直近イベント');
  for (const e of events.rows) {
    const d = new Date(e.startAt as string);
    lines.push(`- ${d.getMonth()+1}/${d.getDate()} ${e.title} (${e.company ?? ''})`);
  }
}

console.log(lines.join('\n'));
