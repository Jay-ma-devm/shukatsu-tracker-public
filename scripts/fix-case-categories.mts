import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// 英語カテゴリーを日本語に変換
const cats: Record<string, string> = {
  market_sizing: '市場規模推定',
  strategy: '戦略立案',
  growth: '成長戦略',
};
for (const [en, ja] of Object.entries(cats)) {
  await client.execute(`UPDATE CaseLog SET category='${ja}' WHERE userId='local-user' AND category='${en}'`);
}
const cases = await client.execute("SELECT title, category FROM CaseLog WHERE userId='local-user' ORDER BY createdAt");
console.log('Cases:');
cases.rows.forEach(r => console.log(`  [${r.category}] ${r.title}`));
