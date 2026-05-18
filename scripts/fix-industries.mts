import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// 業界カテゴリーを統一
const updates: Array<{ from: string; to: string }> = [
  { from: 'Consulting', to: 'コンサルティング' },
  { from: 'ITコンサルティング', to: 'コンサルティング' },
  { from: 'IT/コンサルティング', to: 'コンサルティング' },
  { from: '監査/コンサルティング', to: 'コンサルティング' },
  { from: 'HR-tech/SaaS', to: 'HR-tech' },
  { from: 'FinTech/SaaS', to: 'SaaS/B2B' },
  { from: 'SaaS/クラウド会計', to: 'SaaS/B2B' },
  { from: 'AI/Strategy', to: 'AI/データサイエンス' },
  { from: 'AdTech', to: '広告/マーケティング' },
  { from: 'IT/広告', to: '広告/マーケティング' },
  { from: 'メディア/広告', to: '広告/マーケティング' },
  { from: 'IT/Gaming', to: 'IT/エンタメ' },
  { from: 'エンタメ/メディア', to: 'IT/エンタメ' },
  { from: 'Wellness/D2C', to: 'ウェルネス/D2C' },
  { from: 'Marketing/D2C', to: 'ウェルネス/D2C' },
  { from: 'Fashion-tech', to: 'ファッション/アパレル' },
  { from: 'IT/印刷DX', to: 'IT/SaaS' },
  { from: 'B2B SaaS', to: 'SaaS/B2B' },
  { from: 'Industry-tech', to: 'インダストリー/SaaS' },
  { from: 'FinanceVC', to: '金融' },
];
for (const { from, to } of updates) {
  const result = await client.execute(`UPDATE Company SET industry='${to.replace(/'/g, "''")}' WHERE userId='local-user' AND industry='${from.replace(/'/g, "''")}'`);
  if ((result.rowsAffected ?? 0) > 0) {
    console.log(`  ✅ ${from} → ${to}`);
  }
}
// 確認
const result = await client.execute(
  `SELECT industry, COUNT(*) as count FROM Company WHERE userId='local-user' GROUP BY industry ORDER BY count DESC LIMIT 15`
);
console.log('\n業界別（統一後）:');
result.rows.forEach(r => console.log(`  ${r.industry}: ${r.count}社`));
