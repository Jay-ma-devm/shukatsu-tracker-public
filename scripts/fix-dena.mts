import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// Verdant Foodsのnotesを更新
await client.execute(
  `UPDATE Company SET notes='内々定通知受領。同意書署名が5/14中に必要（マイページから）。ビジネス職。ゲーム・エンタメ・ヘルスケア事業。', priority=4 WHERE userId='local-user' AND name='Verdant Foods'`
);
console.log('✅ Verdant Foods ノート更新');

// 古いPivot Studioの書類選考ステージを確認
const plexId = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Pivot Studio'");
if (plexId.rows.length > 0) {
  const stages = await client.execute(`SELECT id, name, "order" FROM Stage WHERE companyId='${plexId.rows[0].id}' ORDER BY "order"`);
  console.log('Pivot Studio stages:');
  stages.rows.forEach(r => console.log(`  ${r.order}: ${r.name} (${r.id})`));
}
