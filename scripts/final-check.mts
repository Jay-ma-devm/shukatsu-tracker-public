/**
 * DB状態の最終確認スクリプト
 */
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

console.log('=== 就活トラッカー DB 最終状態確認 ===\n');

// 企業数
const companyCounts = await client.execute(
  `SELECT status, COUNT(*) as count FROM Company WHERE userId='local-user' GROUP BY status ORDER BY count DESC`
);
console.log('【企業】');
let totalCompanies = 0;
companyCounts.rows.forEach(r => {
  console.log(`  ${r.status}: ${r.count}社`);
  totalCompanies += Number(r.count);
});
console.log(`  合計: ${totalCompanies}社\n`);

// 今週の締切タスク
const weekTasks = await client.execute(
  `SELECT t.title, t.dueAt, t.priority, c.name as company
   FROM Task t LEFT JOIN Company c ON t.companyId=c.id
   WHERE t.userId='local-user' AND t.status='todo' AND t.dueAt IS NOT NULL
   AND t.dueAt >= '2026-05-14T00:00:00Z' AND t.dueAt <= '2026-05-21T23:59:59Z'
   ORDER BY t.dueAt ASC, t.priority DESC`
);
console.log('【今週（5/14-5/21）の締切タスク】');
weekTasks.rows.forEach(r => {
  const d = new Date(r.dueAt as string);
  const dateStr = `${d.getMonth()+1}/${d.getDate()}`;
  console.log(`  🔴 [${dateStr}] p${r.priority} ${r.title} (${r.company ?? 'なし'})`);
});
console.log('');

// 直近イベント
const events = await client.execute(
  `SELECT e.title, e.type, e.startAt, c.name as company
   FROM Event e LEFT JOIN Company c ON e.companyId=c.id
   WHERE e.completed=0 AND e.startAt >= '2026-05-14T00:00:00Z'
   ORDER BY e.startAt ASC LIMIT 10`
);
console.log('【直近イベント（上位10件）】');
events.rows.forEach(r => {
  const d = new Date(r.startAt as string);
  const dateStr = `${d.getMonth()+1}/${d.getDate()}`;
  console.log(`  📅 [${dateStr}] [${r.type}] ${r.title} (${r.company ?? ''})`);
});
console.log('');

// ES進捗
const esProgress = await client.execute(
  `SELECT c.name, e.title, e.status, e.deadline,
   (SELECT COUNT(*) FROM EsQuestion q WHERE q.entrySheetId=e.id) as total,
   (SELECT COUNT(*) FROM EsQuestion q WHERE q.entrySheetId=e.id AND length(q.answer)>0) as answered
   FROM EntrySheet e JOIN Company c ON e.companyId=c.id
   ORDER BY e.deadline ASC`
);
console.log('【ES進捗】');
esProgress.rows.forEach(r => {
  const deadline = r.deadline ? `締切: ${new Date(r.deadline as string).getMonth()+1}/${new Date(r.deadline as string).getDate()}` : '締切なし';
  const progress = `${r.answered}/${r.total}`;
  const bar = Number(r.total) > 0 ? `[${'█'.repeat(Number(r.answered))}${'░'.repeat(Number(r.total)-Number(r.answered))}]` : '[]';
  console.log(`  ${bar} ${progress} ${r.name} - ${r.status} (${deadline})`);
});
console.log('');

// ノート
const notes = await client.execute(
  `SELECT n.title, n.pinned, c.name as company
   FROM Note n LEFT JOIN Company c ON n.companyId=c.id
   WHERE n.userId='local-user'
   ORDER BY n.pinned DESC, n.createdAt DESC`
);
console.log('【ノート】');
notes.rows.forEach(r => console.log(`  ${r.pinned ? '📌' : '📝'} ${r.title} (${r.company ?? '汎用'})`));
console.log('');

// 総カウント
const counts = await Promise.all([
  client.execute("SELECT COUNT(*) as c FROM Task WHERE userId='local-user' AND status='todo'"),
  client.execute("SELECT COUNT(*) as c FROM Event WHERE completed=0 AND startAt > '2026-05-14'"),
  client.execute("SELECT COUNT(*) as c FROM InterviewLog"),
  client.execute("SELECT COUNT(*) as c FROM CaseLog WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM Note WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM CareerEntry WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM EmailTemplate WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM Stage"),
]);
console.log('【集計】');
console.log(`  タスク(todo): ${counts[0].rows[0].c}件`);
console.log(`  イベント(upcoming): ${counts[1].rows[0].c}件`);
console.log(`  面接ログ: ${counts[2].rows[0].c}件`);
console.log(`  ケース練習: ${counts[3].rows[0].c}件`);
console.log(`  ノート: ${counts[4].rows[0].c}件`);
console.log(`  キャリアエントリー: ${counts[5].rows[0].c}件`);
console.log(`  メールテンプレ: ${counts[6].rows[0].c}件`);
console.log(`  選考ステージ: ${counts[7].rows[0].c}件`);
