import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// 重要なapplied企業のpriorityを更新
const updates: Array<{ name: string; priority: number }> = [
  // コンサル最重要
  { name: 'BCG（ボストン・コンサルティング・グループ）', priority: 5 },
  { name: 'BCG', priority: 5 },
  // コンサル高優先
  { name: 'デロイト トーマツ コンサルティング', priority: 4 },
  { name: 'A.T.カーニー', priority: 4 },
  { name: 'オリバー・ワイマン', priority: 4 },
  { name: 'アクセンチュア（戦略）', priority: 4 },
  { name: 'PwCアドバイザリー（M&A・戦略）', priority: 4 },
  { name: 'PwCコンサルティング（BC）', priority: 4 },
  // 中優先
  { name: 'ソフトバンク', priority: 3 },
  { name: 'マネーフォワード', priority: 3 },
  { name: 'Sansan株式会社', priority: 3 },
  { name: 'ログラス', priority: 3 },
];
for (const u of updates) {
  await client.execute(`UPDATE Company SET priority=${u.priority} WHERE userId='local-user' AND name='${u.name.replace(/'/g, "''")}' AND status='applied'`);
}
console.log('✅ 優先度更新完了');
// 確認
const top = await client.execute(
  `SELECT name, priority, status FROM Company WHERE userId='local-user' AND status='applied' ORDER BY priority DESC, name LIMIT 15`
);
console.log('Applied企業（優先度順）:');
top.rows.forEach(r => console.log(`  p${r.priority} ${r.name}`));
